-- DIGIY EXPLORE — première activation propriétaire par magic-link
-- L'email propriétaire n'est pas stocké en clair dans la fiche publique.

alter table public.digiy_explore_places
  add column if not exists owner_email_sha256 text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'digiy_explore_places_owner_email_sha256_chk'
      and conrelid = 'public.digiy_explore_places'::regclass
  ) then
    alter table public.digiy_explore_places
      add constraint digiy_explore_places_owner_email_sha256_chk
      check (
        owner_email_sha256 is null
        or owner_email_sha256 ~ '^[0-9a-f]{64}$'
      );
  end if;
end $$;

revoke select (owner_email_sha256)
on table public.digiy_explore_places
from anon;

revoke update (owner_email_sha256)
on table public.digiy_explore_places
from anon, authenticated;

grant update (auth_user_id)
on table public.digiy_explore_places
to authenticated;

drop policy if exists "EXPLORE owner claims invited place"
on public.digiy_explore_places;

create policy "EXPLORE owner claims invited place"
on public.digiy_explore_places
for update
to authenticated
using (
  auth_user_id is null
  and owner_email_sha256 is not null
  and owner_email_sha256 =
    encode(
      extensions.digest(
        lower(coalesce(auth.jwt()->>'email','')),
        'sha256'
      ),
      'hex'
    )
)
with check (
  auth_user_id = (select auth.uid())
  and owner_email_sha256 =
    encode(
      extensions.digest(
        lower(coalesce(auth.jwt()->>'email','')),
        'sha256'
      ),
      'hex'
    )
);
