-- YEDEK — 20261114 migrasyonunda silinen eski sürüm.
-- Çalıştırmak için değil, geri dönmek gerekirse elde dursun diye.
-- Neden silindi: referansörlük açmıyor, dolayısıyla kayıt bonusunu
-- yazmıyordu; ayrıca 5 parametreli sürümle birlikte PGRST203 riski
-- yaratıyordu.
CREATE OR REPLACE FUNCTION public.uyelik_baslat(p_owner uuid, p_patient uuid, p_tel text, p_metin_sur text DEFAULT 'uyelik-v1'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_var boolean;
begin
  select uyelik_onay_at is not null into v_var
    from internal_patient
   where id = p_patient and owner_id = p_owner;

  if not found then raise exception 'Hasta bulunamadı'; end if;
  if v_var then raise exception 'Bu hasta zaten üye'; end if;

  update internal_patient
     set uyelik_onay_at = now(),
         uyelik_metin_sur = p_metin_sur,
         uyelik_onay_tel = p_tel
   where id = p_patient and owner_id = p_owner;
end $function$;
