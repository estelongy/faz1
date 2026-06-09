import { redirect } from 'next/navigation'

/**
 * Eski /randevular route'u — şimdi /takvim ana sayfasıyla birleştirildi.
 * Query string varsa (örn. ?status=pending) takvime taşı; takvim filtreyi
 * okuyup ona göre filtreleyebilir. Şimdilik filtre takvimde yok ama URL
 * korunarak ileride filtre eklendiğinde geri-uyumlu olur.
 */
export default async function RandevularPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === 'string') qs.set(k, v)
    else if (Array.isArray(v)) v.forEach(x => qs.append(k, x))
  }
  const q = qs.toString()
  redirect(q ? `/klinik/panel/takvim?${q}` : '/klinik/panel/takvim')
}
