-- ═══════════════════════════════════════════════════════════════════════
-- ESTELONGY — KRİTİK POSTGRES FONKSİYON & TRIGGER YEDEKLERİ
-- ═══════════════════════════════════════════════════════════════════════
--
-- Bu dosya, Supabase Cloud'da bulunan kritik iş kurallarının yedeği.
-- Cloud kayıp olursa (extremely unlikely — Supabase otomatik backup yapar)
-- veya yeni bir Supabase projesine taşıma gerektiğinde bu SQL'i çalıştır.
--
-- NOT: Bu sadece function/trigger yedeği. Tablo şemaları + RLS policy'ler
-- için Supabase Dashboard → Database → Migrations ya da
-- supabase/migrations.txt'deki migration listesini takip edin.
--
-- Production durum: 2026-05-08
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. set_user_role ─────────────────────────────────────────────────
-- app_metadata.role tek kaynak — profiles.role senkron tutar.
-- Sadece admin veya service_role çağırabilir.
CREATE OR REPLACE FUNCTION public.set_user_role(target_user_id uuid, new_role text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'auth', 'public'
AS $function$
DECLARE
  caller_role text;
BEGIN
  -- Service role (auth.uid() null) veya admin kullanıcıya izin ver
  IF auth.uid() IS NOT NULL THEN
    SELECT raw_app_meta_data->>'role' INTO caller_role
    FROM auth.users WHERE id = auth.uid();
    IF caller_role IS DISTINCT FROM 'admin' THEN
      RAISE EXCEPTION 'Yetkisiz erişim';
    END IF;
  END IF;

  -- Tek kaynak: app_metadata.role
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', new_role)
  WHERE id = target_user_id;

  -- Legacy: profiles.role da senkronda kalsın
  UPDATE public.profiles
  SET role = new_role
  WHERE id = target_user_id;
END;
$function$;

-- ── 2. consume_jeton ─────────────────────────────────────────────────
-- Klinik kredi tüketimi: önce ücretsiz haktan, sonra jeton bakiyesinden.
CREATE OR REPLACE FUNCTION public.consume_jeton(p_clinic_id uuid, p_appointment_id uuid, p_description text DEFAULT 'Hasta kabulü'::text)
 RETURNS TABLE(ok boolean, new_balance integer, err text, free_remaining integer, used_source text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_free int;
  v_balance int;
BEGIN
  SELECT free_appointments_remaining, jeton_balance
    INTO v_free, v_balance
    FROM public.clinics WHERE id = p_clinic_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 'Klinik bulunamadı'::text, 0, ''::text;
    RETURN;
  END IF;

  IF v_free > 0 THEN
    UPDATE public.clinics
       SET free_appointments_remaining = free_appointments_remaining - 1
     WHERE id = p_clinic_id;
    INSERT INTO public.jeton_transactions(clinic_id, appointment_id, type, amount, description)
      VALUES (p_clinic_id, p_appointment_id, 'usage', 0,
              COALESCE(p_description, 'Hasta kabulü') || ' (ücretsiz hak)');
    RETURN QUERY SELECT true, v_balance, NULL::text, v_free - 1, 'free'::text;
    RETURN;
  END IF;

  IF v_balance > 0 THEN
    UPDATE public.clinics
       SET jeton_balance = jeton_balance - 1,
           paid_appointments_this_month = paid_appointments_this_month + 1
     WHERE id = p_clinic_id;
    INSERT INTO public.jeton_transactions(clinic_id, appointment_id, type, amount, description)
      VALUES (p_clinic_id, p_appointment_id, 'usage', -1, p_description);
    RETURN QUERY SELECT true, v_balance - 1, NULL::text, 0, 'paid'::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT false, 0, 'Yetersiz kredi. Lütfen kredi yükleyin.'::text, 0, ''::text;
END;
$function$;

-- ── 3. add_jeton ─────────────────────────────────────────────────────
-- Stripe checkout sonrası jeton yükleme (webhook tarafından çağrılır).
CREATE OR REPLACE FUNCTION public.add_jeton(p_clinic_id uuid, p_amount integer, p_description text, p_stripe_session text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE clinics
  SET jeton_balance = jeton_balance + p_amount
  WHERE id = p_clinic_id;

  INSERT INTO jeton_transactions(clinic_id, amount, type, description)
  VALUES (p_clinic_id, p_amount, 'purchase', p_description);
END;
$function$;

-- ── 4. adjust_points ─────────────────────────────────────────────────
-- Kullanıcı puanlarını atomik olarak değiştir (ledger + bakiye).
CREATE OR REPLACE FUNCTION public.adjust_points(p_user_id uuid, p_amount integer, p_type text, p_reference_type text DEFAULT NULL::text, p_reference_id uuid DEFAULT NULL::uuid, p_description text DEFAULT NULL::text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_new_balance int;
BEGIN
  UPDATE public.profiles
     SET points_balance = points_balance + p_amount
   WHERE id = p_user_id
   RETURNING points_balance INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RAISE EXCEPTION 'Profile not found: %', p_user_id;
  END IF;

  -- Bakiye negatife düşmesin (admin_adjust hariç)
  IF v_new_balance < 0 AND p_type <> 'admin_adjust' THEN
    RAISE EXCEPTION 'Insufficient points balance';
  END IF;

  INSERT INTO public.point_transactions(user_id, amount, type, reference_type, reference_id, description)
    VALUES (p_user_id, p_amount, p_type, p_reference_type, p_reference_id, p_description);

  RETURN v_new_balance;
END;
$function$;

-- ── 5. decrement_product_stock ───────────────────────────────────────
-- Sipariş onayı sırasında atomik stok düşüm.
CREATE OR REPLACE FUNCTION public.decrement_product_stock(p_product_id uuid, p_amount integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  cur_stock INT;
BEGIN
  SELECT stock INTO cur_stock FROM products WHERE id = p_product_id FOR UPDATE;
  IF cur_stock IS NULL THEN
    RETURN TRUE;
  END IF;
  IF cur_stock < p_amount THEN
    RETURN FALSE;
  END IF;
  UPDATE products SET stock = cur_stock - p_amount WHERE id = p_product_id;
  RETURN TRUE;
END;
$function$;

-- ── 6. generate_referral_code ────────────────────────────────────────
-- Kullanıcıya 8 karakter alfanümerik benzersiz referral kodu üret.
CREATE OR REPLACE FUNCTION public.generate_referral_code(p_user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  SELECT code INTO v_code FROM referral_codes WHERE user_id = p_user_id;
  IF FOUND THEN RETURN v_code; END IF;

  LOOP
    v_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || p_user_id::TEXT) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;

  INSERT INTO referral_codes (user_id, code) VALUES (p_user_id, v_code);
  RETURN v_code;
END;
$function$;

-- ── 7. enforce_vendor_kyc_before_approval (TRIGGER) ──────────────────
-- KYC onayı olmadan vendor approval_status='approved' yapılamaz.
CREATE OR REPLACE FUNCTION public.enforce_vendor_kyc_before_approval()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.approval_status = 'approved' AND (OLD.approval_status IS DISTINCT FROM 'approved') THEN
    IF NEW.kyc_status IS DISTINCT FROM 'approved' THEN
      RAISE EXCEPTION 'KYC onayı tamamlanmadan satıcı onaylanamaz (kyc_status=%, gereken approved)', NEW.kyc_status;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS enforce_vendor_kyc_trigger ON public.vendors;
CREATE TRIGGER enforce_vendor_kyc_trigger
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_vendor_kyc_before_approval();

-- ── 8. app_delete_account_cascade (KVKK/GDPR) ────────────────────────
-- Hesap silme cascade — kişisel veri hard delete + mali anonimize.
-- Sadece service_role çağırabilir.
CREATE OR REPLACE FUNCTION public.app_delete_account_cascade(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_role           text;
  v_has_clinic     boolean := false;
  v_has_vendor     boolean := false;
  v_active_orders  int     := 0;
BEGIN
  -- 0) Var mı?
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'profile_not_found');
  END IF;

  SELECT role::text INTO v_role FROM public.profiles WHERE id = p_user_id;
  SELECT EXISTS(SELECT 1 FROM public.clinics WHERE user_id = p_user_id) INTO v_has_clinic;
  SELECT EXISTS(SELECT 1 FROM public.vendors WHERE user_id = p_user_id) INTO v_has_vendor;

  -- Aktif sipariş kontrolü
  SELECT COUNT(*) INTO v_active_orders
  FROM public.orders
  WHERE user_id = p_user_id
    AND status NOT IN ('completed','cancelled','refunded');
  IF v_active_orders > 0 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'active_orders_exist',
      'count', v_active_orders
    );
  END IF;

  -- HARD DELETE: kişisel kayıt
  DELETE FROM public.addresses              WHERE user_id = p_user_id;
  DELETE FROM public.analyses               WHERE user_id = p_user_id;
  DELETE FROM public.appointments           WHERE user_id = p_user_id;
  DELETE FROM public.carts                  WHERE user_id = p_user_id;
  DELETE FROM public.journeys               WHERE user_id = p_user_id;
  DELETE FROM public.longevity_surveys      WHERE user_id = p_user_id;
  DELETE FROM public.user_activity_streaks  WHERE user_id = p_user_id;
  DELETE FROM public.user_badges            WHERE user_id = p_user_id;
  DELETE FROM public.referral_codes         WHERE user_id = p_user_id;

  -- ANONIMIZE: mali kayıt
  UPDATE public.orders
  SET user_id = NULL,
      address_snapshot = jsonb_build_object('redacted_at', now(), 'reason', 'gdpr_kvkk_account_deletion')
  WHERE user_id = p_user_id;

  UPDATE public.course_purchases SET user_id = NULL WHERE user_id = p_user_id;
  UPDATE public.returns SET user_id = NULL WHERE user_id = p_user_id;

  -- ANONIMIZE: public içerik
  UPDATE public.clinic_reviews SET user_id = NULL WHERE user_id = p_user_id;
  UPDATE public.course_reviews SET user_id = NULL WHERE user_id = p_user_id;
  UPDATE public.reviews        SET user_id = NULL WHERE user_id = p_user_id;
  UPDATE public.shared_cases   SET user_id = NULL WHERE user_id = p_user_id;
  UPDATE public.editorial_posts SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE public.coupons         SET created_by = NULL WHERE created_by = p_user_id;

  -- Vendor / clinic askıya al
  IF v_has_vendor THEN
    UPDATE public.vendors
    SET is_active = false, approval_status = 'rejected', phone = NULL, user_id = NULL
    WHERE user_id = p_user_id;
  END IF;

  IF v_has_clinic THEN
    UPDATE public.clinics
    SET is_active = false, approval_status = 'rejected', phone = NULL, user_id = NULL
    WHERE user_id = p_user_id;
  END IF;

  -- Audit log
  INSERT INTO public.audit_logs (user_id, table_name, record_id, action, new_data, ip_address)
  VALUES (NULL, 'profiles', p_user_id, 'gdpr_kvkk_delete',
    jsonb_build_object('role', v_role, 'had_clinic', v_has_clinic, 'had_vendor', v_has_vendor), NULL);

  -- Profile sil (CASCADE ile scores, point_transactions, vs. düşer)
  DELETE FROM public.profiles WHERE id = p_user_id;

  RETURN jsonb_build_object('ok', true, 'role', v_role, 'had_clinic', v_has_clinic, 'had_vendor', v_has_vendor);
END;
$function$;

REVOKE ALL ON FUNCTION public.app_delete_account_cascade(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.app_delete_account_cascade(uuid) TO service_role;
