-- Referansör ekonomisi — kurucu kararı (5-6 Kas 2026).
-- Karar kaydı ve gerekçeler: docs/referansor-ekonomi.md
-- (Supabase'de uygulandı: 2026-11-06)
--
-- TEK KURAL: referanslı her işlemde %10 indirim. Referansör ilk 10.000 TL'ye
-- %20, üstüne %10 puan kazanır. Kayıt bonusu 4.000, kayıt anında.
--
-- Kaldırılanlar:
--  * Kademe sistemi (ciroya göre yükselen oran) — bireysel referansör ömrü
--    boyunca 2-3 kişi getiriyor, kademe çoğunluk için hiç işlemiyordu.
--  * Müşteri indirim aralığı (%10-20 seçim) — mahremiyet sorunu: referansör
--    telefonu gösterse "bana neden %10 tanımladın" tartışması çıkar.

-- ── 1) Kademe tablosu tek satır: müşteri %10, puan %20 ──────────────
delete from referral_kademe where esik > 0;

update referral_kademe
   set musteri_min = 10.00, musteri_max = 10.00, puan_oran = 20.00
 where esik = 0;

-- ── 2) Oran bulma sadeleşti ─────────────────────────────────────────
create or replace function public.referral_oran_bul(p_referrer uuid)
returns table(tip text, havuz numeric, musteri_min numeric, musteri_max numeric,
              puan_oran numeric, ciro numeric)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_tip   text;
  v_owner uuid;
  v_havuz numeric;
  v_ciro  numeric;
begin
  select r.tip, r.owner_id, r.havuz_oran
    into v_tip, v_owner, v_havuz
  from referral_referrer r where r.id = p_referrer;
  if not found then raise exception 'Referansor bulunamadi'; end if;

  -- Ciro artık kademe belirlemiyor; panelde "ne kadar iş getirdim" olarak
  -- gösteriliyor.
  select coalesce(sum(v.hesap_tutar), 0) into v_ciro
  from referral_visit v
  join referral_code c on c.id = v.code_id
  join referral_link l on l.id = c.link_id
  where l.referrer_id = p_referrer and v.geldi is true;

  -- Kurumsal da şimdilik bireyselle aynı; havuz_oran alanı duruyor, gerçek
  -- bir kurumsal anlaşma yapılınca oradan ayarlanacak.
  return query
    select v_tip,
           k.musteri_min + k.puan_oran,
           k.musteri_min, k.musteri_max, k.puan_oran, v_ciro
      from referral_kademe k
     where k.owner_id = v_owner
     order by k.esik limit 1;
end $function$;

-- ── 3) Kademeli puan: ilk 10.000'e tam oran, üstüne yarısı ──────────
-- Ek işlem satışında (botoks için gelen hastaya 50.000'lik paket) düz %20
-- orantısız kaçıyordu. Tavan yerine kademe seçildi: tavanda "kesildim"
-- hissi olur, kademede sadece azalan pay var.
--
-- DİKKAT: kademe YALNIZ REFERANSÖR PAYINA uygulanır. Müşteri indirimi her
-- zaman tam oranla (%10) verilir — hastanın hakkı kademeden etkilenmez.
drop function if exists public.referral_puan_hesapla(numeric, numeric, numeric);

create or replace function public.referral_puan_hesapla(
  p_satis numeric, p_puan_oran numeric
) returns numeric
language sql
immutable
as $$
  select greatest(
    least(p_satis, 10000) * p_puan_oran / 100
      + greatest(p_satis - 10000, 0) * (p_puan_oran / 2) / 100,
    0)
$$;

comment on function public.referral_puan_hesapla(numeric, numeric) is
  'Referansör puanı: ilk 10.000 TL''ye tam oran (%20), üstüne yarısı (%10). '
  'Müşteri indirimi buraya girmez — o ayrı ve her zaman tam oranla verilir.';

-- ── 4) İşaretleme: kademeli puan, bonus buradan çıktı ───────────────
create or replace function public.referral_isaretle(
  p_owner uuid, p_code uuid, p_geldi boolean,
  p_patient uuid default null, p_treatment uuid default null,
  p_hesap numeric default null, p_indirim numeric default null)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_kod   referral_code%rowtype;
  v_ref   uuid;
  v_odul  numeric(12,2);
  v_bas   text;
  v_oran  record;
  v_satis numeric;
  v_puan  numeric;
begin
  select * into v_kod from referral_code c
   where c.id = p_code and c.owner_id = p_owner for update;
  if not found then raise exception 'Kod bulunamadı'; end if;
  if v_kod.durum = 'kullanildi' then
    raise exception 'Bu kod zaten kullanılmış';
  end if;

  select l.referrer_id, o.odul_tutar, o.baslik
    into v_ref, v_odul, v_bas
    from referral_link l
    join referral_offer o on o.id = l.offer_id
   where l.id = v_kod.link_id;

  v_puan := null;
  if p_geldi and p_hesap is not null then
    select * into v_oran from referral_oran_bul(v_ref);
    v_satis := p_hesap + coalesce(p_indirim, 0);
    v_puan  := referral_puan_hesapla(v_satis, v_oran.puan_oran);
  end if;

  update referral_visit
     set geldi = p_geldi, isaretlendi_at = now(),
         patient_id = p_patient, treatment_id = p_treatment,
         hesap_tutar = p_hesap, indirim_tutar = p_indirim,
         puan = v_puan,
         havuz_oran = case when v_oran is not null then v_oran.havuz end
   where code_id = p_code;

  if p_geldi then
    update referral_code set durum = 'kullanildi' where id = p_code;

    if coalesce(v_puan, 0) > 0 then
      insert into referral_ledger(owner_id, referrer_id, code_id, tur, tutar, aciklama)
      values (p_owner, v_ref, p_code, 'puan_hakedis', v_puan, v_bas)
      on conflict do nothing;
    end if;

    -- Nakit hakediş modeli (sabit ödül) bozulmadan korunuyor.
    if v_odul > 0 then
      insert into referral_ledger(owner_id, referrer_id, code_id, tur, tutar, aciklama)
      values (p_owner, v_ref, p_code, 'hakedis', v_odul, v_bas)
      on conflict do nothing;
    end if;
  end if;
end $function$;

-- ── 5) Kayıt bonusu: kayıt anında, 4.000 ────────────────────────────
-- Bonus 4.000 + iki işlem puanı (2×1.500) = 7.000 → iki hasta getiren
-- referansör bedava işlem hakkına ulaşır. Hedef bilinçli: ulaşılabilir,
-- anlatılabilir, motive edici.
create or replace function public.referral_referansor_ekle(p_owner uuid, p_patient uuid)
returns table(referrer_id uuid, kod_onek text)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_ad text; v_harf text; v_rakam smallint; v_id uuid; v_uye timestamptz;
  v_tip text; v_bonus numeric;
begin
  select name, uyelik_onay_at into v_ad, v_uye
    from internal_patient
   where id = p_patient and owner_id = p_owner;
  if not found then raise exception 'Hasta bulunamadı'; end if;
  if v_uye is null then
    raise exception 'Önce hastayı üye yapın — referansör olmak üyelik gerektirir';
  end if;

  select id into v_id from referral_referrer
   where owner_id = p_owner and patient_id = p_patient;
  if found then
    return query
      select r.id, r.kod_harf || r.kod_rakam from referral_referrer r where r.id = v_id;
    return;
  end if;

  v_harf := referral_bas_harf(v_ad);

  select g into v_rakam from generate_series(0, 9) g
   where not exists (
     select 1 from referral_referrer
      where owner_id = p_owner and kod_harf = v_harf and kod_rakam = g)
   order by random() limit 1;
  if v_rakam is null then
    raise exception 'Bu baş harf için 10 referansör dolu: %', v_harf;
  end if;

  insert into referral_referrer(owner_id, patient_id, kod_harf, kod_rakam)
  values (p_owner, p_patient, v_harf, v_rakam)
  returning id into v_id;

  select tip into v_tip from referral_referrer where id = v_id;
  select case when v_tip = 'kurumsal' then bonus_kurumsal else bonus_uye end
    into v_bonus
    from referral_settings where owner_id = p_owner;

  if coalesce(v_bonus, 0) > 0 then
    insert into referral_ledger(owner_id, referrer_id, tur, tutar, aciklama)
    values (p_owner, v_id, 'puan_bonus', v_bonus, 'Kayıt bonusu');
    update referral_referrer set bonus_verildi = true where id = v_id;
  end if;

  return query select v_id, v_harf || v_rakam;
end $function$;

update referral_settings set bonus_uye = 4000;
