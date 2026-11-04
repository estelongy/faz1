-- YEDEK — referral_davet_baslat, DROP öncesi alınan tanım.
-- Alındığı tarih: 2026-11-04. Kaynak: Supabase SQL Editor, pg_get_functiondef.
-- Bu dosya migration DEĞİLDİR; geri dönüş gerekirse tanımı buradan kurtarmak için durur.
--
-- DİKKAT: Aşağıdaki 4 parametreli sürüm, 20261109_referral_davet_baslat_eski_surum_sil.sql
-- ile DÜŞÜRÜLEN sürümdür. Kodun çağırdığı 5 parametreli (p_not'lu) sürüm ayrıca durur.

CREATE OR REPLACE FUNCTION public.referral_davet_baslat(p_onek text, p_offer uuid, p_ad text, p_tel text)
 RETURNS TABLE(token text, son_kullanma timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_ref   referral_referrer%rowtype;
  v_onek  text := upper(regexp_replace(trim(p_onek), '[^A-Za-z0-9]', '', 'g'));
  v_harf  text := regexp_replace(v_onek, '^([A-Z]+)([0-9]).*$', '\1');
  v_rakam smallint := nullif(regexp_replace(v_onek, '^[A-Z]+([0-9]).*$', '\1'), '')::smallint;
  v_tel   text := regexp_replace(p_tel, '\D', '', 'g');
  v_tok   text;
  v_son   timestamptz;
begin
  if length(trim(p_ad)) < 2 then raise exception 'Adı yazın'; end if;
  if length(v_tel) < 10 then raise exception 'Telefon numarası geçersiz'; end if;

  select * into v_ref from referral_referrer r
   where r.kod_harf = v_harf and r.kod_rakam = v_rakam and r.aktif;
  if not found then raise exception 'Referansör bulunamadı'; end if;

  -- Bu numara daha önce KOD KULLANDIYSA yeni davet açılmaz.
  if exists (
    select 1 from referral_link l
     where regexp_replace(coalesce(l.kilitli_tel,''), '\D', '', 'g') = v_tel
       and l.durum = 'kilitlendi'
  ) then
    raise exception 'Bu numara daha önce bir indirim kodu kullanmış';
  end if;

  -- Aynı numaraya AÇIK davet varsa iptal et — yenisi gönderiliyor.
  -- (Eskiden burada hata veriliyordu; OTP süresi dolunca kilitleniyordu.)
  update referral_link
     set durum = 'iptal'
   where referrer_id = v_ref.id
     and regexp_replace(coalesce(aday_tel,''), '\D', '', 'g') = v_tel
     and durum in ('uretildi','acildi');

  select u.token, u.son_kullanma into v_tok, v_son
    from referral_link_uret(v_ref.owner_id, v_ref.id, p_offer) u;

  update referral_link
     set aday_ad = trim(p_ad), aday_tel = p_tel
   where referral_link.token = v_tok;

  return query select v_tok, v_son;
end $function$;

-- ============================================================
-- 5 PARAMETRELİ SÜRÜM — KALAN sürüm (kodun çağırdığı, actions.ts:61).
-- DROP edilmiyor; buraya referans için kaydedildi.
--
-- FARK NOTU (2026-11-04): Bu sürüm 4 parametreli sürümdeki ÜÇ KORUMAYI
-- içermiyor — ad/telefon doğrulama, "bu numara daha önce kod kullanmış"
-- engeli, aynı numaraya açık daveti iptal etme. Ayrıca son_kullanma
-- döndürmüyor (yalnız token). Buna karşılık islem_notu kaydediyor.
-- ============================================================

CREATE OR REPLACE FUNCTION public.referral_davet_baslat(p_onek text, p_offer uuid, p_ad text, p_tel text, p_not text DEFAULT NULL::text)
 RETURNS TABLE(token text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_ref   referral_referrer%rowtype;
  v_harf  text;
  v_rakam smallint;
  v_onek  text := upper(regexp_replace(trim(p_onek), '[^A-Za-z0-9]', '', 'g'));
  v_tok   text;
  v_row   record;
begin
  v_harf  := regexp_replace(v_onek, '^([A-Z]+)([0-9]).*$', '\1');
  v_rakam := nullif(regexp_replace(v_onek, '^[A-Z]+([0-9]).*$', '\1'), '')::smallint;

  select * into v_ref from referral_referrer r
   where r.kod_harf = v_harf and r.kod_rakam = v_rakam and r.aktif;
  if not found then raise exception 'Referansör bulunamadı'; end if;

  select * into v_row from referral_link_uret(v_ref.owner_id, v_ref.id, p_offer);
  v_tok := v_row.token;

  update referral_link l
     set aday_ad  = btrim(p_ad),
         aday_tel = regexp_replace(coalesce(p_tel,''), '[^0-9]', '', 'g'),
         islem_notu = nullif(btrim(coalesce(p_not,'')), '')
   where l.token = v_tok;

  return query select v_tok;
end $function$;
