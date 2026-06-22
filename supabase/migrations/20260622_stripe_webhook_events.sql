-- Stripe webhook event idempotency ledger.
-- Stripe aynı event.id'yi tekrar gönderebilir (retry / partial failure).
-- Bu tablo işlenmiş event'leri tutar; tekrar gelirse no-op.

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id     TEXT PRIMARY KEY,
  event_type   TEXT NOT NULL,
  livemode     BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_type_time
  ON public.stripe_webhook_events(event_type, processed_at DESC);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Dispute / chargeback bildirim için orders üzerinde flag
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS dispute_status TEXT,
  ADD COLUMN IF NOT EXISTS dispute_reason TEXT,
  ADD COLUMN IF NOT EXISTS dispute_opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dispute_resolved_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_dispute_open
  ON public.orders(dispute_opened_at)
  WHERE dispute_status IS NOT NULL AND dispute_resolved_at IS NULL;
