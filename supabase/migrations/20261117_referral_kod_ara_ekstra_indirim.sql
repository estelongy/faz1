-- Tek-ekran klinik gorunumunde kod karti bu RPC'den besleniyor ve
-- ekstra_indirim HIC donmuyordu: referansorun kendi puanindan verdigi
-- ek indirim personelin ekranina ulasmiyor, tahsile de yansimiyordu.
-- islem_notu donuyordu, ekstra atlanmisti.
--
-- Donus tipi degistigi icin once dusurulur (CREATE OR REPLACE sutun
-- ekleyemez).
drop function if exists public.referral_kod_ara(uuid, text);

create function public.referral_kod_ara(p_owner uuid, p_arama text)
returns table(code_id uuid, kod text, durum text, son_kullanma timestamptz,
              musteri_ad text, musteri_tel text, referansor_ad text,
              referansor_kod text, teklif_baslik text, teklif_ayricalik text,
              geldi boolean, islem_notu text, ekstra_indirim numeric)
language sql
security definer
set search_path to 'public'
as $function$
  select c.id, c.kod, c.durum, c.son_kullanma,
         l.kilitli_ad, l.kilitli_tel,
         case when r.tip = 'kurumsal' then r.kurum_ad else p.name end,
         p.patient_code,
         o.baslik, o.ayricalik,
         v.geldi, l.islem_notu,
         coalesce(l.ekstra_indirim, 0)
    from referral_code c
    join referral_link l on l.id = c.link_id
    join referral_referrer r on r.id = l.referrer_id
    left join internal_patient p on p.id = r.patient_id
    join referral_offer o on o.id = l.offer_id
    left join referral_visit v on v.code_id = c.id
   where c.owner_id = p_owner
     and (upper(replace(c.kod, '-', '')) = upper(replace(trim(p_arama), '-', ''))
          or split_part(c.kod, '-', 2) = upper(trim(p_arama)))
   order by c.created_at desc
$function$;
