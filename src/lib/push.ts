/**
 * FCM (Firebase Cloud Messaging) push helper'ı.
 *
 * Bir kere kurulur, 5 flavor'a kopyalanır (memory: is_plani_pazara_cikis #3).
 *
 * Send tarafı: Firebase Admin SDK üzerinden HTTP v1.
 * Token kayıt tarafı: /api/push/register endpoint'i (cihaz → DB).
 *
 * ENV gerekli:
 *  - FIREBASE_PROJECT_ID
 *  - FIREBASE_CLIENT_EMAIL
 *  - FIREBASE_PRIVATE_KEY    (newline'lar \n olarak kaçışlı)
 *
 * Yoksa: sendPushToUser sessizce no-op. Vendor bildirimleri mail+SMS
 * üzerinden çalışmaya devam eder.
 */

import { createServiceClient } from '@/lib/supabase/service'
import type { Flavor } from '@/components/native/flavor-detect'

interface PushPayload {
  title: string
  body: string
  /** Click sonrası açılacak path (örn /satici/panel/siparisler) */
  link?: string
  /** İsteğe bağlı extra data — client side okuyabilir. */
  data?: Record<string, string>
}

interface FcmAccessToken {
  token: string
  expiresAt: number
}

let cachedToken: FcmAccessToken | null = null

/** Firebase service account ile OAuth2 access token üret. */
async function getFcmAccessToken(): Promise<string | null> {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  if (!projectId || !clientEmail || !privateKey) return null

  // Cache 50dk
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token
  }

  // JWT oluştur
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const claims = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }

  const enc = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url')
  const unsigned = `${enc(header)}.${enc(claims)}`

  // RS256 imza — node:crypto
  const { createSign } = await import('node:crypto')
  const signer = createSign('RSA-SHA256')
  signer.update(unsigned)
  const signature = signer.sign(privateKey).toString('base64url')
  const jwt = `${unsigned}.${signature}`

  // Token swap
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString(),
  })
  if (!res.ok) {
    console.error('[push] FCM token swap failed:', await res.text())
    return null
  }
  const { access_token, expires_in } = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = { token: access_token, expiresAt: Date.now() + expires_in * 1000 }
  return access_token
}

/** Tek bir FCM token'a mesaj gönder. */
async function sendToToken(
  fcmToken: string,
  payload: PushPayload,
  accessToken: string,
  projectId: string,
): Promise<boolean> {
  const message = {
    message: {
      token: fcmToken,
      notification: { title: payload.title, body: payload.body },
      data: {
        ...(payload.link ? { link: payload.link } : {}),
        ...(payload.data ?? {}),
      },
      android: {
        priority: 'HIGH',
        notification: { sound: 'default', click_action: payload.link ?? 'FLUTTER_NOTIFICATION_CLICK' },
      },
      apns: {
        payload: { aps: { sound: 'default', badge: 1 } },
      },
    },
  }
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    },
  )
  if (!res.ok) {
    console.warn('[push] send failed:', res.status, await res.text())
    return false
  }
  return true
}

/**
 * Bir kullanıcının (opsiyonel flavor filtreli) tüm cihazlarına push gönder.
 * Fire-and-forget — başarısızlık UI'yı bloklamaz, log'a yazılır.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
  flavor?: Flavor,
): Promise<void> {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID
    if (!projectId) return  // FCM yapılandırılmamış — sessiz no-op
    const accessToken = await getFcmAccessToken()
    if (!accessToken) return

    const admin = createServiceClient()
    let query = admin
      .from('device_push_tokens')
      .select('fcm_token')
      .eq('user_id', userId)
    if (flavor) query = query.eq('flavor', flavor)
    const { data: tokens } = await query
    if (!tokens || tokens.length === 0) return

    // Paralel gönder, başarısızları DB'den silme (token expired UNREGISTERED hatası)
    await Promise.all(
      tokens.map(t => sendToToken(t.fcm_token, payload, accessToken, projectId)),
    )
  } catch (e) {
    console.error('[push] sendPushToUser exception:', e)
  }
}

/** Vendor user_id ile push gönderme — vendor bildirimleri için kestirme. */
export async function sendPushToVendor(
  vendorUserId: string,
  payload: PushPayload,
): Promise<void> {
  return sendPushToUser(vendorUserId, payload, 'estestorepro')
}
