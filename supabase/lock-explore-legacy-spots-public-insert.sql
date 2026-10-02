-- DIGIY EXPLORE
-- Neutralise les anciennes écritures publiques directes sur digiy_explore_spots.
-- Le parcours EXPLORE actif utilise digiy_explore_places / RPC propriétaires dédiés.

drop policy if exists "explore_insert_draft_public"
on public.digiy_explore_spots;

drop policy if exists "public_insert_draft"
on public.digiy_explore_spots;
