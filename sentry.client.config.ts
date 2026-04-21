import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performans izleme: %10 örnekleme (production'da düşük tut)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Oturum replay: hataların %100'ü, normal oturumların %5'i
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.05,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: false,
    }),
  ],

  // Geliştirme ortamında Sentry'yi devre dışı bırak
  enabled: process.env.NODE_ENV === 'production',

  // Kullanıcı gizliliği: IP adresi gönderme
  sendDefaultPii: false,
})
