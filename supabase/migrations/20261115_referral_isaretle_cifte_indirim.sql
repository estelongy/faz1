-- Puan her işlemde şişiyordu: 25.000'lik işlemde 3.750 yazıldı, 3.500 olmalı.
--
-- İndirim İKİ KEZ sayılıyordu. Ekran (ReferansPanel.tsx) "Hesap tutarı"
-- olarak LİSTE FİYATINI alır ve indirimi ondan hesaplar:
--     indirim = hesap × oran/100   → 25.000 × %10 = 2.500, hasta 22.500 öder
-- Bu fonksiyon ise girileni "hastanın ödediği" sanıp indirimi geri
-- ekliyordu:
--     v_satis := p_hesap + p_indirim  → 27.500 → %15'e denk puan
--
-- İki katman aynı şeyi ters yönde varsaymış. Doğrusu: p_hesap zaten liste
-- fiyatı, puan doğrudan onun üzerinden hesaplanır.
create or replace function public.referral_isaretle(p_owner uuid, p_code uuid, p_geldi boolean, p_patient uuid DEFAULT NULL::uuid, p_treatment uuid DEFAULT NULL::uuid, p_hesap numeric DEFAULT NULL::numeric, p_indirim numeric DEFAULT NULL::numeric)
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
    -- harcayarak indirim yaptı, üstüne puan da kazanamaz.
    if v_ekstra > 0 then
      v_puan := 0;
    else
      select * into v_oran from referral_oran_bul(v_ref);
      -- p_hesap = liste fiyatı. İndirim buradan düşülüyor, tekrar
      -- EKLENMEZ — eskiden eklendiği için puan şişiyordu.
      v_puan := referral_puan_hesapla(p_hesap, v_oran.puan_oran);
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

    -- Ekstra indirim puandan düşer — negatif satır, append-only defter.
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
