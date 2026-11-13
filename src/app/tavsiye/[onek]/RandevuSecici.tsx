'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  generateSlotsForDay, parseTime, DAY_SHORT_TR,
  type AvailabilityWeek, type DayAvailability,
} from '@/app/klinik/panel/muhasebe/randevu/slot-utils'

/**
 * Referansörün randevu seçtiği alan — bir haftalık, sade.
 *
 * Düzen: üstte yatay gün şeridi (bugünden 7 gün), altında o günün
 * saatleri. Kurucu tarifi: "1 haftalık, verimli ve sade olsun.
 * gün şeridi, altına da saatler."
 *
 * Takvim bileşeni (RandevuTakvim) klinik paneli için yazılmış: ay
 * görünümü, hasta adları, işlem türleri. Referansör bunları görmemeli
 * ve telefonda ay takvimi zaten kullanışsız — bu yüzden ayrı, dar bir
 * bileşen. Slot üretimi ise ortak (slot-utils), yeniden yazılmadı.
 *
 * Dolu saatler kapalı görünür; kim/ne için dolu YAZMAZ (RPC de dönmez).
 */

export interface MusaitlikVerisi {
  hafta: AvailabilityWeek
  dolu: { start_at: string; duration_minutes: number }[]
  bugun: string
}

const GUN_SAYISI = 7

/** '2026-11-14' → Date (yerel gece yarısı; saat dilimi kaymasın diye elle) */
function tariheCevir(iso: string): Date {
  const [y, a, g] = iso.split('-').map(Number)
  return new Date(y, (a ?? 1) - 1, g ?? 1)
}

function isoYaz(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export default function RandevuSecici({
  musaitlik, secili, onSec,
}: {
  musaitlik: MusaitlikVerisi | null
  /** 'YYYY-MM-DDTHH:MM' — seçili slot, yoksa null */
  secili: string | null
  onSec: (deger: string | null) => void
}) {
  const [gun, setGun] = useState<string | null>(null)

  // Günler: bugünden başlayarak 7 gün.
  const gunler = useMemo(() => {
    if (!musaitlik) return []
    const bas = tariheCevir(musaitlik.bugun)
    return Array.from({ length: GUN_SAYISI }, (_, i) => {
      const d = new Date(bas)
      d.setDate(bas.getDate() + i)
      const ayar = musaitlik.hafta.find(h => h.day_of_week === d.getDay()) ?? null
      return { iso: isoYaz(d), tarih: d, ayar, acik: Boolean(ayar && !ayar.is_closed) }
    })
  }, [musaitlik])

  // İlk açık günü seç — referansör boş ekrana bakmasın.
  useEffect(() => {
    if (gun || gunler.length === 0) return
    setGun((gunler.find(g => g.acik) ?? gunler[0]).iso)
  }, [gunler, gun])

  // Dolu slotların başlangıçları: 'YYYY-MM-DDTHH:MM' kümesi.
  // Süre slot adımından uzunsa (60 dk randevu, 30 dk slot) araya düşen
  // slotlar da kapanmalı — yoksa çakışan randevu yazılır.
  const doluKume = useMemo(() => {
    const k = new Set<string>()
    if (!musaitlik) return k
    for (const d of musaitlik.dolu) {
      const [tarih, saat] = d.start_at.split('T')
      if (!tarih || !saat) continue
      const bas = parseTime(saat)
      const sure = Math.max(d.duration_minutes || 30, 1)
      // 5'er dakika tara: hangi slot başlangıcına denk gelirse kapat.
      for (let m = bas; m < bas + sure; m += 5) {
        const hh = String(Math.floor(m / 60)).padStart(2, '0')
        const mm = String(m % 60).padStart(2, '0')
        k.add(`${tarih}T${hh}:${mm}`)
      }
    }
    return k
  }, [musaitlik])

  const seciliGun = gunler.find(g => g.iso === gun) ?? null
  const slotlar = useMemo(
    () => generateSlotsForDay(seciliGun?.ayar as DayAvailability | null),
    [seciliGun],
  )

  // Bugünse geçmiş saatleri gösterme.
  const simdi = new Date()
  const bugunMu = seciliGun?.iso === musaitlik?.bugun
  const suAnDk = simdi.getHours() * 60 + simdi.getMinutes()

  if (!musaitlik) {
    return (
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-3">
        <p className="text-xs text-slate-500">Takvim yükleniyor…</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 p-3 space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-bold text-slate-400">Randevu saati</p>
        {secili && (
          <button type="button" onClick={() => onSec(null)}
            className="text-[11px] text-slate-500 hover:text-slate-300 underline underline-offset-2">
            Seçimi kaldır
          </button>
        )}
      </div>

      {/* ── Gün şeridi ── */}
      <div className="flex gap-1.5 overflow-x-auto -mx-0.5 px-0.5 pb-0.5">
        {gunler.map(g => {
          const aktif = g.iso === gun
          return (
            <button key={g.iso} type="button"
              disabled={!g.acik}
              onClick={() => { setGun(g.iso); onSec(null) }}
              className={`shrink-0 w-[46px] py-1.5 rounded-lg text-center transition-colors ${
                aktif
                  ? 'bg-violet-600 text-white'
                  : g.acik
                    ? 'bg-slate-950 text-slate-300 hover:bg-slate-800'
                    : 'bg-slate-950/50 text-slate-700'
              }`}>
              <span className="block text-[10px] font-semibold leading-none">
                {DAY_SHORT_TR[g.tarih.getDay()]}
              </span>
              <span className="block text-base font-black leading-tight mt-0.5 tabular-nums">
                {g.tarih.getDate()}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Saatler ── */}
      {!seciliGun?.acik ? (
        <p className="text-xs text-slate-500 py-2 text-center">Bu gün klinik kapalı.</p>
      ) : slotlar.length === 0 ? (
        <p className="text-xs text-slate-500 py-2 text-center">Bu gün için saat tanımlı değil.</p>
      ) : (
        <div className="grid grid-cols-4 gap-1.5">
          {slotlar.map(s => {
            const deger = `${seciliGun.iso}T${s.time}`
            const dolu = doluKume.has(deger)
            const gecmis = bugunMu && parseTime(s.time) <= suAnDk
            const kapali = dolu || gecmis
            const aktif = secili === deger
            return (
              <button key={s.time} type="button"
                disabled={kapali}
                onClick={() => onSec(aktif ? null : deger)}
                className={`py-2 rounded-lg text-xs font-bold tabular-nums transition-colors ${
                  aktif
                    ? 'bg-violet-600 text-white ring-1 ring-violet-400'
                    : kapali
                      ? 'bg-slate-950/40 text-slate-700 line-through'
                      : 'bg-slate-950 text-slate-200 hover:bg-slate-800'
                }`}>
                {s.time}
              </button>
            )
          })}
        </div>
      )}

      {secili && (
        <p className="text-[11px] text-violet-300 font-semibold">
          Seçilen: {tariheCevir(secili.split('T')[0]).toLocaleDateString('tr-TR', {
            day: 'numeric', month: 'long', weekday: 'long',
          })} · {secili.split('T')[1]}
        </p>
      )}
    </div>
  )
}
