-- Referansör girişi — telefondan önek bulma.
--
-- Referansör panel adresini (/tavsiye/DH6GOK) unutabilir; telefonunu unutmaz.
-- Bu fonksiyon telefon numarasından referansörün öneğini döndürür.
--
-- SECURITY DEFINER: anonim istemci referral_referrer tablosunu göremez,
-- yalnızca bu fonksiyon üzerinden tek bir önek öğrenebilir.
--
-- NUMARA EŞLEŞTİRME: kayıtlarda format tutarsız ("5538693433", "05418404465").
-- Her iki taraf da yalnız rakama indirilip SON 10 HANE karşılaştırılır —
-- böylece 0'lı, +90'lı ve çıplak yazımlar aynı numaraya denk gelir.
--
-- Üye referansörde telefon hasta kartında (internal_patient.phone),
-- kurumsal referansörde kendi alanında (kurum_tel).

create or replace function public.referral_giris_onek(p_tel text)
returns text
language sql
security definer
set search_path to 'public'
as $$
  select r.kod_harf || r.kod_rakam || s.isletme_kodu
    from referral_referrer r
    join referral_settings s on s.owner_id = r.owner_id
    left join internal_patient p on p.id = r.patient_id
   where r.aktif
     and right(regexp_replace(
           coalesce(p.phone, r.kurum_tel, ''), '\D', '', 'g'), 10)
       = right(regexp_replace(coalesce(p_tel, ''), '\D', '', 'g'), 10)
     and length(regexp_replace(coalesce(p_tel, ''), '\D', '', 'g')) >= 10
   limit 1
$$;

revoke all on function public.referral_giris_onek(text) from public;
grant execute on function public.referral_giris_onek(text) to anon, authenticated;
