import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendInfoSms } from '@/lib/netgsm'
import { duzgunAd, smsHatirlatma } from '@/app/klinik/panel/muhasebe/sms-metinleri'

/**
 * Klinik randevu hatırlatma SMS cron — SAAT BAŞI çalışır.
 *
 * Her klinik kendi ayarladığı saatte ve kaç gün önce istiyorsa o gün
 * için gönderir (internal_sms_settings; varsayılan 18:00, 1 gün önce).
 * (Randevu günü sabahı ayrıca WhatsApp'tan hatırlatılır — o kanal
 * çift yönlü olduğu için hasta "geç kalacağım" diye yazabilir.)
 * Gönderilenler reminder_sms_sent_at ile işaretlenir; cron iki kez çalışsa
 * bile aynı hastaya ikinci SMS gitmez.
 *
 * Kredi: "Giden SMS" paketinden düşer (OTP paketine DOKUNMAZ — o girişin
 * yakıtı). Aynı hastanın aynı gün birden çok randevusu varsa TEK SMS gider.
 *
 * Cron secret: Vercel 'Authorization: Bearer', manuel 'x-cron-secret'.
 */

export const dynamic = 'force-dynamic'

interface ApptRow {
  id: string
  patient_id: string
  start_at: string
  treatment_type: string | null
  appointment_type: string | null
  owner_id: string
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const customHeader = req.headers.get('x-cron-secret')
  const expected = process.env.CRON_SECRET
  if (expected) {
    const bearerOk = authHeader === `Bearer ${expected}`
    const customOk = customHeader === expected
    if (!bearerOk && !customOk) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const admin = createServiceClient()

  // Cron saatte bir çalışır; her klinik KENDİ ayarladığı saatte gönderir.
  const trNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }))
  const suAnkiSaat = trNow.getHours()

  try {
    // Klinik SMS ayarları — satırı olmayan klinik varsayılanı kullanır (18:00, 1 gün önce)
    const { data: ayarlar } = await admin
      .from('internal_sms_settings')
      .select('owner_id, klinik_adi, iletisim_link, sablon_hatirlatma, hatirlatma_saati, hatirlatma_gun_once, hatirlatma_aktif')
    const ayarById = new Map((ayarlar ?? []).map(a => [a.owner_id, a]))

    // Bu saatte gönderim yapacak kliniklerin hedef günleri
    const VARSAYILAN_SAAT = 18
    const VARSAYILAN_GUN = 1
    const hedefler = new Map<string, { bas: string; bit: string }>()
    const ownerIds = new Set<string>()

    const { data: tumOwners } = await admin
      .from('internal_appointment')
      .select('owner_id')
      .eq('status', 'scheduled')
      .is('reminder_sms_sent_at', null)
      .gte('start_at', new Date().toISOString())
    for (const r of tumOwners ?? []) ownerIds.add(r.owner_id)

    for (const oid of Array.from(ownerIds)) {
      const ayar = ayarById.get(oid)
      if (ayar?.hatirlatma_aktif === false) continue
      const saat = ayar?.hatirlatma_saati ?? VARSAYILAN_SAAT
      if (saat !== suAnkiSaat) continue
      const gunOnce = ayar?.hatirlatma_gun_once ?? VARSAYILAN_GUN
      const hedef = new Date(trNow)
      hedef.setDate(hedef.getDate() + gunOnce)
      const y = hedef.getFullYear()
      const m = String(hedef.getMonth() + 1).padStart(2, '0')
      const d = String(hedef.getDate()).padStart(2, '0')
      hedefler.set(oid, {
        bas: new Date(`${y}-${m}-${d}T00:00:00+03:00`).toISOString(),
        bit: new Date(`${y}-${m}-${d}T23:59:59+03:00`).toISOString(),
      })
    }

    if (hedefler.size === 0) {
      return NextResponse.json({ ok: true, sent: 0, note: `Saat ${suAnkiSaat}:00 — gönderim zamanı gelen klinik yok` })
    }

    // Hedef günü olan kliniklerin randevuları
    const parcalar = await Promise.all(
      Array.from(hedefler.entries()).map(([oid, g]) =>
        admin
          .from('internal_appointment')
          .select('id, patient_id, start_at, treatment_type, appointment_type, owner_id')
          .eq('owner_id', oid)
          .eq('status', 'scheduled')
          .is('reminder_sms_sent_at', null)
          .gte('start_at', g.bas)
          .lte('start_at', g.bit)
          .order('start_at', { ascending: true })
          .limit(200)),
    )
    const appts = parcalar.flatMap(r => r.data ?? [])
    const error = parcalar.find(r => r.error)?.error ?? null

    if (error) {
      console.error('[randevu-hatirlatma] sorgu hatasi:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!appts || appts.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, note: 'Hatırlatılacak randevu yok' })
    }

    // Hasta bilgileri (telefon + ad)
    const patientIds = Array.from(new Set(appts.map(a => a.patient_id)))
    const { data: patients } = await admin
      .from('internal_patient')
      .select('id, name, phone')
      .in('id', patientIds)
    const pById = new Map((patients ?? []).map(p => [p.id, p]))

    // Aynı hasta + aynı saat = tek ziyaret → tek SMS
    const ziyaretler = new Map<string, ApptRow[]>()
    for (const a of appts) {
      const k = `${a.patient_id}|${a.start_at}`
      ziyaretler.set(k, [...(ziyaretler.get(k) ?? []), a])
    }

    let sent = 0
    let skipped = 0
    const failures: { patient: string; error: string }[] = []

    for (const grup of Array.from(ziyaretler.values())) {
      const first = grup[0]
      const p = pById.get(first.patient_id)
      if (!p?.phone) { skipped++; continue }

      const saat = new Date(first.start_at)
        .toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })
      const mesaj = smsHatirlatma(duzgunAd(p.name), saat, ayarById.get(first.owner_id))

      const res = await sendInfoSms(p.phone, mesaj)
      if (res.success) {
        sent++
        await admin
          .from('internal_appointment')
          .update({ reminder_sms_sent_at: new Date().toISOString() })
          .in('id', grup.map((a: ApptRow) => a.id))
      } else {
        failures.push({ patient: p.name ?? first.patient_id, error: res.error ?? 'bilinmeyen' })
        console.error('[randevu-hatirlatma] gonderilemedi:', p.name, res.error)
      }
    }

    return NextResponse.json({
      ok: true,
      sent,
      skipped,          // telefonu olmayan hastalar
      failed: failures.length,
      failures: failures.slice(0, 10),
    })
  } catch (err) {
    console.error('[randevu-hatirlatma] beklenmeyen hata:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Beklenmeyen hata' }, { status: 500 })
  }
}
