-- referral_davet_baslat'ın iki sürümü vardı; PostgreSQL hangisini
-- çağıracağını seçemeyip "Could not choose the best candidate function"
-- hatası veriyordu. Kod yalnızca p_not'lu beş parametreli sürümü
-- çağırıyor (src/app/tavsiye/[onek]/actions.ts), eski dört parametreli
-- sürüm fazlalık.

DROP FUNCTION IF EXISTS public.referral_davet_baslat(
  p_onek text,
  p_offer uuid,
  p_ad   text,
  p_tel  text
);
