import { headers } from 'next/headers'
import { detectFlavorFromUA, type Flavor } from '@/components/native/flavor-detect'

/**
 * Server component'te aktif app flavor'ı — request UA'sındaki
 * `EstelongyApp/<galaxy>` etiketinden. Capacitor WebView her isteğe bu etiketi
 * ekler. Web/tarayıcı veya etiketsiz → 'biyoage'. force-dynamic sayfalarda
 * kullan (her istekte render → doğru UA).
 */
export async function getServerFlavor(): Promise<Flavor> {
  try {
    const ua = (await headers()).get('user-agent') ?? ''
    return detectFlavorFromUA(ua)
  } catch {
    return 'biyoage'
  }
}
