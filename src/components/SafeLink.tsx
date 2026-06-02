'use client'

import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStatus } from './AuthStatusProvider'
import type { ComponentProps } from 'react'

/* ============================================================
   SafeLink — auth-gated route'lar için galaksi-bilinçli Link

   Niyet:
   - "Hemen Al", "Skor", "Panelim", "Siparişlerim" gibi linkler
     login gerektirir. Logout kullanıcı tıkladığında /giris'e
     yönlendirilir AMA hangi galaksiden geldiyse o renge düşer.
   - Aksi takdirde kullanıcı BiyoAGE galaksisinden çıkıp Estelongy
     çatıya (mor) tek tıkla atılır — UX kırılması.

   Kullanım:
     <SafeLink href="/skor">Skorlama</SafeLink>
     <SafeLink href="/panel/siparislerim">Siparişlerim</SafeLink>

   Mantık:
     1. AUTH_GATED_ROUTES → bu route login gerektiriyor mu?
     2. useAuthStatus → kullanıcı login mi?
     3. Login değilse → /giris?g=<kaynak galaksi>&next=<hedef>
     4. Kaynak galaksi: AUTH_GATED_ROUTES sabitiyse oradan,
        değilse mevcut pathname'den çıkarılır.
   ============================================================ */

/**
 * Auth-gated route → varsayılan galaksi
 * - string: o route HER ZAMAN şu galaksiyle stamplenir
 * - null:    bu route multi-galaksi (örn. /panel) → kaynak sayfadan oku
 */
const AUTH_GATED_ROUTES: Record<string, string | null> = {
  // BiyoAGE flow
  '/analiz': 'biyoage',
  '/skor': 'biyoage',
  '/panel/analizlerim': 'biyoage',

  // EsteKlinik flow
  '/panel/kurslarim': 'esteklinik',
  '/panel/degerlendir': 'esteklinik',

  // EsteStore flow
  '/odeme': 'estestore',
  '/panel/siparislerim': 'estestore',
  '/panel/iadelerim': 'estestore',
  '/panel/yorumlarim': 'estestore',

  // Multi-galaksi (kaynak sayfadan al)
  '/panel': null,
  '/panel/hesabim': null,
  '/panel/adreslerim': null,
  '/panel/leaderboard': null,
  '/panel/referral': null,
}

function sourceGalaxyFromPath(pathname: string): string | null {
  if (pathname.startsWith('/estestore') || pathname.startsWith('/sepet')) return 'estestore'
  if (pathname.startsWith('/esteklinik') || pathname.startsWith('/randevu')) return 'esteklinik'
  if (pathname.startsWith('/biyoage') || pathname.startsWith('/analiz') || pathname.startsWith('/skor')) return 'biyoage'
  return null
}

/** href bir auth-gated kayda denk geliyor mu? Dinamik segment'leri yakalar (örn. /siparis/[orderNumber]) */
function lookupGate(href: string): { matched: boolean; galaxy: string | null } {
  // Tam eşleşme önce
  if (href in AUTH_GATED_ROUTES) {
    return { matched: true, galaxy: AUTH_GATED_ROUTES[href] }
  }
  // Prefix eşleşmesi: /panel/siparislerim/* → /panel/siparislerim
  for (const [route, galaxy] of Object.entries(AUTH_GATED_ROUTES)) {
    if (href.startsWith(route + '/')) {
      return { matched: true, galaxy }
    }
  }
  // /siparis/[orderNumber] her zaman estestore
  if (href.startsWith('/siparis/')) {
    return { matched: true, galaxy: 'estestore' }
  }
  return { matched: false, galaxy: null }
}

type SafeLinkProps = ComponentProps<typeof NextLink>

export default function SafeLink(props: SafeLinkProps) {
  const { isLoggedIn } = useAuthStatus()
  const pathname = usePathname()

  const targetHref = typeof props.href === 'string' ? props.href : null

  let finalHref = props.href

  if (targetHref) {
    // Case A: Hedef auth-gated bir route → logout ise /giris'e galaksi stamp ile yolla
    if (isLoggedIn === false) {
      const gate = lookupGate(targetHref)
      if (gate.matched) {
        const galaxy = gate.galaxy ?? sourceGalaxyFromPath(pathname)
        const galaxyParam = galaxy ? `g=${galaxy}&` : ''
        finalHref = `/giris?${galaxyParam}next=${encodeURIComponent(targetHref)}`
      }
    }

    // Case B: Hedef zaten /giris veya /kayit → kaynak galaksiden stamp ekle (yoksa)
    if (
      (targetHref === '/giris' || targetHref.startsWith('/giris?') ||
       targetHref === '/kayit' || targetHref.startsWith('/kayit?'))
      && !/[?&]g=/.test(targetHref)
    ) {
      const galaxy = sourceGalaxyFromPath(pathname)
      if (galaxy) {
        const sep = targetHref.includes('?') ? '&' : '?'
        finalHref = `${targetHref}${sep}g=${galaxy}`
      }
    }
  }

  return <NextLink {...props} href={finalHref} />
}
