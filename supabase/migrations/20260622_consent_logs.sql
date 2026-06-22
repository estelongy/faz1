-- KVKK / GDPR consent ledger.
-- Versioned, immutable log of explicit user consents.
-- Each scope (e.g. 'selfie_ai_analiz') has a string version ('v1', 'v2', ...);
-- when scope policy changes, bump version → user re-prompted.
--
-- Rows are ADD-only (no UPDATE, no DELETE per RLS); revocation = new row with revoked=true.

CREATE TABLE IF NOT EXISTS public.consent_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope       TEXT NOT NULL,
  version     TEXT NOT NULL,
  granted     BOOLEAN NOT NULL DEFAULT true,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Latest consent per (user, scope) lookup
CREATE INDEX IF NOT EXISTS idx_consent_user_scope_created
  ON public.consent_logs(user_id, scope, created_at DESC);

-- RLS: kullanıcı kendi kayıtlarını okur; insert yalnız service_role
ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consent_logs_select_own" ON public.consent_logs;
CREATE POLICY "consent_logs_select_own"
  ON public.consent_logs FOR SELECT
  USING (auth.uid() = user_id);

-- No insert/update/delete policy → only service_role can write
-- (server actions use service client → already bypasses RLS)

-- Latest-granted-consent helper
CREATE OR REPLACE FUNCTION public.has_active_consent(
  p_user_id UUID,
  p_scope TEXT,
  p_version TEXT
) RETURNS BOOLEAN
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    (SELECT granted
       FROM public.consent_logs
      WHERE user_id = p_user_id
        AND scope   = p_scope
        AND version = p_version
      ORDER BY created_at DESC
      LIMIT 1),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_active_consent TO authenticated, service_role;
