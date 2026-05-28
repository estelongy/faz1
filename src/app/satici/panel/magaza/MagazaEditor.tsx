'use client'

import { useState, useTransition } from 'react'
import VendorAssetUploader from '@/components/VendorAssetUploader'
import { saveVendorBrandingAction } from './actions'

interface InitialBranding {
  logo_url: string | null
  banner_url: string | null
  tagline: string
  about_text: string
  social_links: Record<string, string>
}

interface Props {
  vendorId: string
  companyName: string
  initial: InitialBranding
}

export default function MagazaEditor({ vendorId, companyName, initial }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [logoUrl, setLogoUrl] = useState<string | null>(initial.logo_url)
  const [bannerUrl, setBannerUrl] = useState<string | null>(initial.banner_url)
  const [tagline, setTagline] = useState(initial.tagline)
  const [aboutText, setAboutText] = useState(initial.about_text)
  const [instagram, setInstagram] = useState(initial.social_links?.instagram ?? '')
  const [website, setWebsite]     = useState(initial.social_links?.website ?? '')
  const [youtube, setYoutube]     = useState(initial.social_links?.youtube ?? '')
  const [twitter, setTwitter]     = useState(initial.social_links?.twitter ?? '')
  const [tiktok, setTiktok]       = useState(initial.social_links?.tiktok ?? '')

  function submit() {
    setError(null); setSuccess(false)
    startTransition(async () => {
      const res = await saveVendorBrandingAction({
        logo_url:   logoUrl,
        banner_url: bannerUrl,
        tagline,
        about_text: aboutText,
        social_links: { instagram, website, youtube, twitter, tiktok },
      })
      if (!res.ok) { setError(res.error); return }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3500)
    })
  }

  const label = "block text-slate-300 text-sm font-semibold mb-1"
  const input = "w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-base focus:outline-none focus:border-[#C9A961] placeholder-slate-500"

  return (
    <div className="space-y-5">
      {/* Banner */}
      <div className="p-5 bg-slate-800/50 border border-slate-700 rounded-2xl space-y-3">
        <h2 className="text-white font-bold text-base">🖼 Banner</h2>
        <p className="text-slate-400 text-sm">Mağaza sayfasının üst kısmında görünecek görsel. Önerilen: 1600×400px.</p>
        <VendorAssetUploader vendorId={vendorId} kind="banner" initialUrl={bannerUrl} onChange={setBannerUrl} />
      </div>

      {/* Logo + Kimlik */}
      <div className="p-5 bg-slate-800/50 border border-slate-700 rounded-2xl space-y-4">
        <h2 className="text-white font-bold text-base">🏷 Marka Kimliği</h2>
        <div className="flex items-start gap-4 flex-wrap">
          <VendorAssetUploader vendorId={vendorId} kind="logo" initialUrl={logoUrl} onChange={setLogoUrl} />
          <div className="flex-1 min-w-[260px] space-y-3">
            <div>
              <label className={label}>Marka Adı</label>
              <input className={input + ' opacity-70 cursor-not-allowed'} value={companyName} disabled />
              <p className="text-slate-500 text-sm mt-1">Marka adını değiştirmek için destek ile iletişime geç.</p>
            </div>
            <div>
              <label className={label}>Slogan / Tagline</label>
              <input className={input} value={tagline} onChange={e => setTagline(e.target.value)}
                placeholder="Örn: Bilim destekli longevity kozmetiği"
                maxLength={120} />
              <p className="text-slate-500 text-sm mt-1">{tagline.length}/120</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hakkımızda */}
      <div className="p-5 bg-slate-800/50 border border-slate-700 rounded-2xl space-y-3">
        <h2 className="text-white font-bold text-base">📝 Hakkımızda</h2>
        <textarea
          className={input + ' resize-none'}
          rows={6}
          value={aboutText}
          onChange={e => setAboutText(e.target.value)}
          maxLength={2000}
          placeholder="Markan hakkında müşterilere anlatmak istediklerin. Hikayen, değerlerin, uzmanlık alanların..."
        />
        <p className="text-slate-500 text-sm">{aboutText.length}/2000 karakter</p>
      </div>

      {/* Sosyal Linkler */}
      <div className="p-5 bg-slate-800/50 border border-slate-700 rounded-2xl space-y-3">
        <h2 className="text-white font-bold text-base">🔗 Sosyal Medya & Web</h2>
        <p className="text-slate-400 text-sm">Sadece kullanıcı adı veya tam URL — fark etmez, otomatik düzeltiriz.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SocialInput icon="🌐" label="Web Sitesi" value={website} onChange={setWebsite} placeholder="www.markamiz.com" />
          <SocialInput icon="📷" label="Instagram"   value={instagram} onChange={setInstagram} placeholder="instagram.com/markamiz" />
          <SocialInput icon="▶️" label="YouTube"     value={youtube} onChange={setYoutube} placeholder="youtube.com/@markamiz" />
          <SocialInput icon="𝕏 " label="Twitter / X" value={twitter} onChange={setTwitter} placeholder="x.com/markamiz" />
          <SocialInput icon="🎵" label="TikTok"      value={tiktok} onChange={setTiktok} placeholder="tiktok.com/@markamiz" />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-semibold">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-semibold">
          ✓ Vitrin güncellendi. Önizle ↗
        </div>
      )}

      <button onClick={submit} disabled={pending}
        className="w-full py-3 bg-gradient-to-r from-[#C9A961] to-[#B8964F] hover:from-[#D4B872] hover:to-[#C9A961] disabled:opacity-50 text-white font-bold rounded-xl text-base transition-all">
        {pending ? 'Kaydediliyor…' : 'Vitrini Kaydet'}
      </button>
    </div>
  )
}

function SocialInput({ icon, label, value, onChange, placeholder }: {
  icon: string; label: string; value: string; onChange: (v: string) => void; placeholder: string
}) {
  return (
    <div>
      <label className="block text-slate-300 text-sm font-semibold mb-1">{icon} {label}</label>
      <input
        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A961] placeholder-slate-500"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}
