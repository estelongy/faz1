-- Geri alma ziyaret satirini sifirlarken puan ve havuz_oran kaliyordu:
-- "geldi: null, hesap_tutar: null, puan: 3500" gibi tutarsiz satir uretiyor.
-- Defter dogru oldugu icin bakiyeyi bozmuyor, ama rapor/ekran bu sutunu
-- okursa geri alinmis islemi kazanilmis gibi gosterir.
create or replace function public.referral_geri_al(p_owner uuid, p_code uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_kod referral_code%rowtype;
  v_hak numeric(12,2);
  v_ref uuid;
begin
  select * into v_kod from referral_code c
   where c.id = p_code and c.owner_id = p_owner for update;
  if not found then raise exception 'Kod bulunamadı'; end if;
  if v_kod.durum <> 'kullanildi' then
    raise exception 'Bu kod kullanılmamış, geri alınacak bir şey yok';
  end if;

  select coalesce(sum(tutar), 0) into v_hak
    from referral_ledger where code_id = p_code;
  select referrer_id into v_ref
    from referral_ledger where code_id = p_code limit 1;

  -- Ledger "yalnızca eklenir": satır silinmez, negatif düzeltme yazılır.
  if v_hak <> 0 and v_ref is not null then
    insert into referral_ledger(owner_id, referrer_id, code_id, tur, tutar, aciklama)
    values (p_owner, v_ref, p_code, 'duzeltme', -v_hak, 'Kod uygulaması geri alındı');
  end if;

  update referral_visit
     set geldi = null, isaretlendi_at = null,
         hesap_tutar = null, indirim_tutar = null,
         patient_id = null, treatment_id = null,
         puan = null, havuz_oran = null
   where code_id = p_code;

  update referral_code set durum = 'aktif' where id = p_code;
end $function$;

-- Geride kalan tutarsiz satirlari temizle.
update referral_visit
   set puan = null, havuz_oran = null
 where geldi is null and hesap_tutar is null and puan is not null;
