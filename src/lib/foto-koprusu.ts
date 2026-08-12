/**
 * Yerel Foto Köprüsü istemcisi
 * ----------------------------
 * Klinik bilgisayarında çalışan KlinikFoto programına bağlanır.
 * Köprü ulaşılabilirse hasta fotoğrafları buluta değil o bilgisayara yazılır.
 *
 * Adres sırası:
 *   1) localStorage'a kaydedilmiş adres (telefonda elle girilen)
 *   2) localhost (aynı bilgisayarda çalışıyorsa)
 */

const PORT = 47821
const LS_KEY = 'klinik_foto_koprusu'

export type BridgePhoto = {
  name: string
  path: string
  size: number
  modified: string
}

export function getBridgeHost(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(LS_KEY)
}

export function setBridgeHost(host: string | null) {
  if (typeof window === 'undefined') return
  if (host) localStorage.setItem(LS_KEY, host.trim())
  else localStorage.removeItem(LS_KEY)
}

function urlFor(host: string, path: string): string {
  const h = host.includes(':') ? host : `${host}:${PORT}`
  return `http://${h}${path}`
}

/** Köprü ayakta mı? Bulursa adresini döner. */
export async function findBridge(timeoutMs = 1200): Promise<string | null> {
  const candidates = [getBridgeHost(), `127.0.0.1:${PORT}`].filter(Boolean) as string[]
  for (const host of candidates) {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), timeoutMs)
      const res = await fetch(urlFor(host, '/ping'), { signal: ctrl.signal })
      clearTimeout(timer)
      if (res.ok) {
        const data = await res.json()
        if (data?.ok) return host
      }
    } catch {
      // sıradakini dene
    }
  }
  return null
}

export async function bridgeUpload(
  host: string,
  file: File,
  patient: string,
  stage: string,
  note: string,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  try {
    const fd = new FormData()
    fd.set('file', file)
    fd.set('patient', patient)
    fd.set('stage', stage)
    fd.set('note', note)
    const res = await fetch(urlFor(host, '/upload'), { method: 'POST', body: fd })
    const data = await res.json()
    return data?.ok ? { ok: true, path: data.path } : { ok: false, error: data?.error ?? 'Yükleme hatası' }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Köprüye ulaşılamadı' }
  }
}

export async function bridgeList(host: string, patient: string): Promise<BridgePhoto[]> {
  try {
    const res = await fetch(urlFor(host, `/list?patient=${encodeURIComponent(patient)}`))
    const data = await res.json()
    return data?.ok ? (data.photos as BridgePhoto[]) : []
  } catch {
    return []
  }
}

export async function bridgeDelete(host: string, path: string): Promise<boolean> {
  try {
    const res = await fetch(urlFor(host, '/delete'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    })
    const data = await res.json()
    return !!data?.ok
  } catch {
    return false
  }
}

export function bridgeFileUrl(host: string, path: string): string {
  return urlFor(host, `/file?path=${encodeURIComponent(path)}`)
}
