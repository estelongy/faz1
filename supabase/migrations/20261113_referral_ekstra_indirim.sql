-- EKSTRA İNDİRİM: referansör kendi puanından müşterisine fazladan indirim.
-- Karar kaydı: docs/referansor-ekonomi.md
-- (Supabase'de uygulandı: 2026-11-06)
--
-- Klinik indirimi SABİT %10, hiçbir yerde seçilmiyor. Referansöre sunulan tek
-- şey ek indirim tutarı. Böylece "biz işlemde indirim vermiyoruz" söylemi
-- korunur — üstü referansörün kendi puanından.
--
-- NEDEN YÜZDE DEĞİL TUTAR: davet gönderilirken işlem tutarı henüz belli değil
-- (botoks mu dolgu mu, 7.500 mü 50.000 mi). Yüzde seçilirse bakiye kontrolü
-- yapılamaz; klinikte "puanı yetmiyor" sürprizi hasta karşısında patlar.
-- Tutar seçilince bakiye anında kontrol edilir ve davete kilitlenir.

alter table referral_link
  add column if not exists ekstra_indirim numeric(12,2) not null default 0;

comment on column referral_link.ekstra_indirim is
  'Referansörün kendi puanından verdiği ek indirim (TL). Klinik %10''un üstü.';

-- ── Kullanılabilir puan ─────────────────────────────────────────────
-- Açık davetlerde kilitli ekstra indirimler düşülür: aynı puan iki davete
-- verilemesin.
create or replace function public.referral_puan_bakiye(p_referrer uuid)
returns numeric
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_omur integer;
  v_puan numeric;
begin
  select s.puan_omru_gun into v_omur
    from referral_settings s
    join referral_referrer r on r.owner_id = s.owner_id
   where r.id = p_referrer;

  select coalesce(sum(l.tutar), 0) into v_puan
    from referral_ledger l
   where l.referrer_id = p_referrer
     and l.tur in ('puan_hakedis','puan_bonus','puan_harcama','puan_iptal')
     and (l.tur in ('puan_harcama','puan_iptal')
          or v_omur is null
          or l.created_at > now() - make_interval(days => v_omur));

  return greatest(v_puan, 0) - coalesce((
    select sum(l.ekstra_indirim) from referral_link l
     where l.referrer_id = p_referrer
       and l.durum in ('uretildi','acildi','kilitlendi')
       and l.son_kullanma > now()
       and not exists (select 1 from referral_code c
                        join referral_visit v on v.code_id = c.id
                       where c.link_id = l.id and v.geldi is true)
  ), 0);
end $$;

comment on function public.referral_puan_bakiye is
  'Kullanılabilir puan: kazanılan − harcanan − açık davetlerde kilitli ekstra indirim.';

-- ── Davet: ekstra indirim + bakiye kontrolü ─────────────────────────
create or replace function public.referral_davet_baslat(
  p_onek text, p_offer uuid, p_ad text, p_tel text,
  p_not text default null, p_ekstra numeric default 0)
returns table(token text)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_ref     referral_referrer%rowtype;
  v_harf    text;
  v_rakam   smallint;
  v_onek    text := upper(regexp_replace(trim(p_onek), '[^A-Za-z0-9]', '', 'g'));
  v_tok     text;
  v_row     record;
  v_ekstra  numeric := greatest(coalesce(p_ekstra, 0), 0);
  v_bakiye  numeric;
begin
  v_harf  := regexp_replace(v_onek, '^([A-Z]+)([0-9]).*$', '\1');
  v_rakam := nullif(regexp_replace(v_onek, '^[A-Z]+([0-9]).*$', '\1'), '')::smallint;

  select * into v_ref from referral_referrer r
   where r.kod_harf = v_harf and r.kod_rakam = v_rakam and r.aktif;
  if not found then raise exception 'Referansör bulunamadı'; end if;

  if v_ekstra > 0 then
    v_bakiye := referral_puan_bakiye(v_ref.id);
    if v_ekstra > v_bakiye then
      raise exception 'Puanınız yetmiyor. Kullanılabilir: % puan', round(v_bakiye);
    end if;
  end if;

  select * into v_row from referral_link_uret(v_ref.owner_id, v_ref.id, p_offer);
  v_tok := v_row.token;

  update referral_link l
     set aday_ad  = btrim(p_ad),
         aday_tel = regexp_replace(coalesce(p_tel,''), '[^0-9]', '', 'g'),
         islem_notu = nullif(btrim(coalesce(p_not,'')), ''),
         ekstra_indirim = v_ekstra
   where l.token = v_tok;

  return query select v_tok;
end $function$;

-- ── İşaretleme: ekstra indirim puandan düşer, o işlemde puan yok ────
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
  v_kod    referral_code%rowtype;
  v_ref    uuid;
  v_odul   numeric(12,2);
  v_bas    text;
  v_oran   record;
  v_satis  numeric;
  v_puan   numeric;
  v_ekstra numeric;
begin
  select * into v_kod from referral_code c
   where c.id = p_code and c.owner_id = p_owner for update;
  if not found then raise exception 'Kod bulunamadı'; end if;
  if v_kod.durum = 'kullanildi' then
    raise exception 'Bu kod zaten kullanılmış';
  end if;

  select l.referrer_id, o.odul_tutar, o.baslik, l.ekstra_indirim
    into v_ref, v_odul, v_bas, v_ekstra
    from referral_link l
    join referral_offer o on o.id = l.offer_id
   where l.id = v_kod.link_id;

  v_ekstra := coalesce(v_ekstra, 0);

  v_puan := null;
  if p_geldi and p_hesap is not null then
    -- Ekstra indirim varsa o işlemde puan kazanılmaz: referansör puanını
    -- harcayarak indirim yaptı, üstüne puan da kazanamaz (sistem kendi
    -- kuyruğunu yemesin).
    if v_ekstra > 0 then
      v_puan := 0;
    else
      select * into v_oran from referral_oran_bul(v_ref);
      v_satis := p_hesap + coalesce(p_indirim, 0);
      v_puan  := referral_puan_hesapla(v_satis, v_oran.puan_oran);
    end if;
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

    if v_ekstra > 0 then
      insert into referral_ledger(owner_id, referrer_id, code_id, tur, tutar, aciklama)
      values (p_owner, v_ref, p_code, 'puan_harcama', -v_ekstra,
              'Müşteriye ek indirim')
      on conflict do nothing;
    end if;

    if v_odul > 0 then
      insert into referral_ledger(owner_id, referrer_id, code_id, tur, tutar, aciklama)
      values (p_owner, v_ref, p_code, 'hakedis', v_odul, v_bas)
      on conflict do nothing;
    end if;
  end if;
end $function$;
