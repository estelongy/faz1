-- KURAL: bir telefon numarasına bir aktif referansör.
-- (Supabase'de uygulandı: 2026-11-05)
--
-- Neden DB'de: referansör dört ayrı yoldan açılıyor (hasta kartı, üyelikle
-- birlikte, kendi başvurusu, kurumsal davet). Her birine ayrı kontrol yazmak
-- eksik kalırdı — biri unutulur, kural delinir.
--
-- Gerçekte oldu: Semra Demirlenk hem üye (SD8) hem kurumsal (SE9) referansör
-- olarak açıldı, ikisi de aynı numaraya bağlı. Elle pasife alınarak çözüldü.
-- Asıl sorun giriş tarafında: referral_giris_onek telefondan önek bulurken
-- "limit 1" diyor; iki aktif kayıt varsa hangi panele girileceği belirsiz.
--
-- Numara son 10 haneden karşılaştırılır: kayıtlarda format tutarsız
-- ("5538693433", "05418404465", "+90...").
--
-- Pasif kayıt kuralı bozmaz: arşivleme / askıya alma serbest kalmalı.

create or replace function public.referral_tek_telefon_kontrol()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tel  text;
  v_cakisan text;
begin
  if not new.aktif then return new; end if;

  select right(regexp_replace(
           coalesce((select phone from internal_patient where id = new.patient_id),
                    new.kurum_tel, ''), '[^0-9]', '', 'g'), 10)
    into v_tel;

  if v_tel is null or length(v_tel) < 10 then return new; end if;

  select r.kod_harf || r.kod_rakam into v_cakisan
    from referral_referrer r
    left join internal_patient p on p.id = r.patient_id
   where r.owner_id = new.owner_id
     and r.aktif
     and r.id <> new.id
     and right(regexp_replace(coalesce(p.phone, r.kurum_tel, ''), '[^0-9]', '', 'g'), 10) = v_tel
   limit 1;

  if v_cakisan is not null then
    raise exception
      'Bu telefon numarasi zaten % referansorune bagli. Bir telefona bir aktif referansor.',
      v_cakisan;
  end if;

  return new;
end $$;

drop trigger if exists trg_referral_tek_telefon on public.referral_referrer;
create trigger trg_referral_tek_telefon
  before insert or update of aktif, patient_id, kurum_tel
  on public.referral_referrer
  for each row execute function public.referral_tek_telefon_kontrol();
