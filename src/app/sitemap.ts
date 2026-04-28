import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const BASE_URL = 'https://estelongy.com'

export const revalidate = 3600 // 1 saat — Google'ın crawl bütçesi için makul

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // ── Statik sayfalar ─────────────────────────────────────────────────────
  const staticUrls: MetadataRoute.Sitemap = [
    { url: BASE_URL,                                       lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },

    // Rehber (SEO öncelikli)
    { url: `${BASE_URL}/rehber`,                           lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE_URL}/rehber/longevity-nedir`,           lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE_URL}/rehber/genclik-skoru-nasil-hesaplanir`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE_URL}/rehber/estetik-uygulamalar`,       lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE_URL}/rehber/estetik-cerrahi`,           lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE_URL}/rehber/cihaz-tedavileri`,          lastModified: now, changeFrequency: 'monthly', priority: 0.85 },

    // Platform
    { url: `${BASE_URL}/randevu`,                          lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/magaza`,                           lastModified: now, changeFrequency: 'daily',   priority: 0.8 },

    // İş ortakları
    { url: `${BASE_URL}/klinik/basvur`,                    lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/satici/basvur`,                    lastModified: now, changeFrequency: 'monthly', priority: 0.6 },

    // Yasal / Kurumsal
    { url: `${BASE_URL}/hakkinda/sss`,                     lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/hakkinda/iletisim`,                lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/hakkinda/sozlesme`,                lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/hakkinda/aydinlatma`,              lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/hakkinda/cerez`,                   lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ]

  // ── Dinamik: aktif & onaylı ürünler ─────────────────────────────────────
  let productUrls: MetadataRoute.Sitemap = []
  try {
    const supabase = await createClient()
    const { data: products } = await supabase
      .from('products')
      .select('slug, id, updated_at')
      .eq('is_active', true)
      .eq('approval_status', 'approved')
      .order('updated_at', { ascending: false })
      .limit(5000)

    if (products) {
      productUrls = products.map(p => ({
        url: `${BASE_URL}/magaza/${p.slug ?? p.id}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : now,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    }
  } catch (err) {
    // Sitemap build asla DB hatası yüzünden kırılmasın
    console.error('Sitemap product fetch failed:', err)
  }

  // ── Dinamik: aktif klinikler (varsa public profile) ─────────────────────
  // İleride /klinik/[slug] sayfası açılırsa burada eklenecek

  return [...staticUrls, ...productUrls]
}
