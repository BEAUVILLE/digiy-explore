-- MASTER MAÎTRE DIGIY EXPLORE — V2
-- Autonomie propriétaire légère : horaires, tarif indicatif, disponibilité, note.

alter table public.digiy_explore_places enable row level security;

-- Lecture publique minimale pour le MASTER V2.
grant select (
  slug,
  public_name,
  category_code,
  subcategory,
  short_description,
  city,
  zone,
  address_text,
  phone,
  whatsapp,
  cover_url,
  photo_urls,
  tags,
  price_hint,
  hours,
  availability_status,
  availability_note,
  is_published,
  status,
  is_active
)
on table public.digiy_explore_places
to anon;

-- Lecture propriétaire.
grant select on table public.digiy_explore_places to authenticated;

-- Nettoie les anciens droits opérationnels plus larges.
revoke update (opening_hours, price_text, updated_at)
on table public.digiy_explore_places
from authenticated;

-- Le propriétaire ne modifie que les informations terrain qui changent souvent.
grant update (
  hours,
  price_hint,
  availability_status,
  availability_note,
  availability_updated_at
)
on table public.digiy_explore_places
to authenticated;

-- Policies propriétaire : recréées explicitement pour documenter le MASTER V2.
drop policy if exists "EXPLORE owner reads own place" on public.digiy_explore_places;
create policy "EXPLORE owner reads own place"
on public.digiy_explore_places
for select
to authenticated
using ((select auth.uid()) = auth_user_id);

drop policy if exists "EXPLORE owner updates operational fields" on public.digiy_explore_places;
create policy "EXPLORE owner updates operational fields"
on public.digiy_explore_places
for update
to authenticated
using ((select auth.uid()) = auth_user_id)
with check ((select auth.uid()) = auth_user_id);
