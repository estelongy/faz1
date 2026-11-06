-- Kayıt bonusu iki yerde kayboluyordu. Semra'nın iki kaydında da bonus
-- yoktu; sebebi tek değil, iki ayrı eksikti.
--
-- 1) uyelik_baslat İKİ SÜRÜM. 4 parametreli eski sürüm referansörlük
--    açmıyor, dolayısıyla bonusu da yazmıyor. PostgREST hangi sürümü
--    seçeceğini bilemediği için PGRST203 riski de taşıyordu. Eski sürüm
--    silinir; yeni sürümün p_referansor varsayılanı false, yani eski
--    4 argümanlı çağrılar aynı davranışla çalışmaya devam eder.
--
-- 2) KURUMSAL YOLDA BONUS HİÇ YOKTU. referral_referansor_ekle hasta
--    istiyor, kurum ise hasta değil (patient_id boş) — o yüzden kurum
--    kabul ettiğinde bonus yazan hiçbir kod çalışmıyordu.
--    referral_settings.bonus_kurumsal duruyordu, kimse okumuyordu.

-- ── 1) Eski uyelik_baslat sürümünü sil ───────────────────────────────
drop function if exists public.uyelik_baslat(uuid, uuid, text, text);

-- ── 2) Kurum kabul edince bonusu işle ────────────────────────────────
-- Bonus kabul anında yazılır, davet anında değil: davet edilen kurum
-- kabul etmezse puan doğmaz. bonus_verildi bayrağı çifte yazımı engeller
-- (token tek kullanımlık ama bayrak ucuz bir emniyet).
create or replace function public.referral_kurum_kabul(p_token text)
returns table(id uuid, kurum_ad text, havuz_oran numeric)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_id uuid; v_owner uuid; v_bonus numeric; v_verildi boolean;
begin
  select r.id, r.owner_id, r.bonus_verildi
    into v_id, v_owner, v_verildi
    from referral_referrer r
   where r.davet_token = p_token and r.davet_durum = 'davet';
  if v_id is null then
    raise exception 'Davet bulunamadı veya zaten yanıtlanmış';
  end if;

  update referral_referrer
     set davet_durum = 'aktif', aktif = true, kabul_at = now()
   where referral_referrer.id = v_id;

  if not coalesce(v_verildi, false) then
    select bonus_kurumsal into v_bonus
      from referral_settings where owner_id = v_owner;

    if coalesce(v_bonus, 0) > 0 then
      insert into referral_ledger(owner_id, referrer_id, tur, tutar, aciklama)
      values (v_owner, v_id, 'puan_bonus', v_bonus, 'Kayıt bonusu');
      update referral_referrer set bonus_verildi = true
       where referral_referrer.id = v_id;
    end if;
  end if;

  return query select r.id, r.kurum_ad, r.havuz_oran
    from referral_referrer r where r.id = v_id;
end $function$;

-- Kurumsal bonus bireyselle hizalandı (kurucu kararı, 6 Kasım 2026):
-- bireysel 4.000'e çıkarılırken kurumsal 2.000'de kalmıştı.
update referral_settings set bonus_kurumsal = 4000;
