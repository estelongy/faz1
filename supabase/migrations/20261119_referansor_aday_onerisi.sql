-- REFERANSÖR ADAY ÖNERİSİ — link paylaşımı yerine değerlendirmeli başvuru.
--
-- ÖNCEKİ DURUM: Referansör panelinden "Başvuru linkini kopyala" çıkıyordu.
-- Link sabitti (?ref=ÖNEK), sınırsızdı; WhatsApp grubuna atılsa 200 kişi
-- başvurabilirdi. Kimin kimi davet ettiği de belli olmuyordu.
--
-- YENİ DURUM: Referansör adayın bilgilerini girer ve ADAYI TANITIR; link
-- almaz. Klinik tanıtımı okur, karar verir. Onaylanırsa adaya SMS gider
-- (klinik WhatsApp numarası + kendi panel bağlantısı).
--
-- Kurucu kararı, 13 Kas 2026.

-- ── 1) Başvuruya tip ve tanıtım ───────────────────────────────────────
-- not_metni duruyor (eski başvuruların izi); tanitim ayrı sütun, çünkü
-- bu artık isteğe bağlı bir not değil, kararın dayanağı olan zorunlu metin.
alter table public.referral_basvuru
  add column if not exists tip text
    check (tip in ('bireysel','isletme')),
  add column if not exists tanitim text;

comment on column public.referral_basvuru.tip is
  'Aday bireysel mi işletme mi — referansörün beyanı.';
comment on column public.referral_basvuru.tanitim is
  'Referansörün adayı tanıtan metni (100-2000 karakter). Klinik kararını buna dayandırır.';

-- ── 2) Klinik WhatsApp numarası ───────────────────────────────────────
-- Onay SMS'inde adaya gidiyor. Ayarda duruyor ki panelden değişebilsin;
-- koda sabit yazılmaz.
alter table public.referral_settings
  add column if not exists whatsapp_tel text;

comment on column public.referral_settings.whatsapp_tel is
  'Kliniğin WhatsApp iletişim numarası. Referansör onay SMS''inde adaya gönderilir.';

-- ── 3) Aday önerisi — referansörün çağırdığı RPC ──────────────────────
-- Eski referral_basvuru_birak adayın KENDİ doldurduğu formdu; dışarıdan
-- başvuru kapandığı için artık o yol kullanılmıyor. Bu yeni fonksiyon
-- REFERANSÖRÜN önerisini alır: çağıran taraf öneği bilir, aday bilmez.
create or replace function public.referral_aday_oner(
  p_onek text,
  p_ad text,
  p_tel text,
  p_tip text,
  p_tanitim text
) returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_ref record;
  v_tel text;
  v_tanitim text;
begin
  -- Öneren referansör geçerli mi? Önek, kod_harf+kod_rakam+isletme_kodu.
  select r.id, r.owner_id into v_ref
    from referral_referrer r
    join referral_settings s on s.owner_id = r.owner_id
   where upper(r.kod_harf || r.kod_rakam::text || s.isletme_kodu) = upper(trim(p_onek))
     and r.aktif = true
   limit 1;
  if v_ref.id is null then
    raise exception 'Referansör bulunamadı veya pasif';
  end if;

  if coalesce(trim(p_ad), '') = '' then
    raise exception 'Ad soyad gerekli';
  end if;

  -- Telefonu sadeleştir: yalnız rakam, baştaki 0/90 atılır → 5xxxxxxxxx
  v_tel := regexp_replace(coalesce(p_tel, ''), '\D', '', 'g');
  v_tel := regexp_replace(v_tel, '^(90|0)', '');
  if length(v_tel) <> 10 then
    raise exception 'Telefon numarası geçersiz';
  end if;

  if p_tip is null or p_tip not in ('bireysel','isletme') then
    raise exception 'Aday tipi seçilmeli';
  end if;

  -- Tanıtım kararın dayanağı: boş ya da üstünkörü olamaz.
  v_tanitim := trim(coalesce(p_tanitim, ''));
  if length(v_tanitim) < 100 then
    raise exception 'Tanıtım en az 100 karakter olmalı';
  end if;
  if length(v_tanitim) > 2000 then
    raise exception 'Tanıtım en fazla 2000 karakter olabilir';
  end if;

  -- Aynı numara zaten referansörse tekrar önerilmesin.
  if exists (
    select 1 from referral_referrer rr
    left join internal_patient ip on ip.id = rr.patient_id
     where rr.owner_id = v_ref.owner_id
       and rr.aktif = true
       and regexp_replace(coalesce(ip.phone, rr.kurum_tel, ''), '\D', '', 'g') like '%' || v_tel
  ) then
    raise exception 'Bu numara zaten referansör';
  end if;

  -- Bekleyen başvuru varsa ikincisi yazılmaz.
  if exists (
    select 1 from referral_basvuru b
     where b.owner_id = v_ref.owner_id
       and b.durum = 'bekliyor'
       and regexp_replace(b.tel, '\D', '', 'g') like '%' || v_tel
  ) then
    raise exception 'Bu numara için bekleyen bir başvuru zaten var';
  end if;

  insert into referral_basvuru(owner_id, davet_eden, ad, tel, tip, tanitim, durum)
  values (v_ref.owner_id, v_ref.id, trim(p_ad), v_tel, p_tip, v_tanitim, 'bekliyor');
end $function$;

revoke all on function public.referral_aday_oner(text, text, text, text, text) from public;
grant execute on function public.referral_aday_oner(text, text, text, text, text) to anon, authenticated;

comment on function public.referral_aday_oner is
  'Referansörün aday önerisi. Link üretmez: başvuru klinik onayına düşer.';
