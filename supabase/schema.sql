-- AI-Groeikompas: persoonlijke dossiers per ingelogde Google-gebruiker.
-- Uitvoeren in de SQL Editor van het gekozen Supabase-project.
-- De browser gebruikt ALLEEN een publishable/anon key. NOOIT een secret/service_role key.

create table if not exists public.groeikompas_dossiers (
  owner_id uuid not null references auth.users(id) on delete cascade,
  id text not null check (char_length(id) between 1 and 120),
  name text not null check (char_length(btrim(name)) between 1 and 90),
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, id)
);

alter table public.groeikompas_dossiers enable row level security;
revoke all on public.groeikompas_dossiers from anon, authenticated;
grant select, insert, update, delete on public.groeikompas_dossiers to authenticated;

drop policy if exists "groeikompas_select_own" on public.groeikompas_dossiers;
create policy "groeikompas_select_own"
on public.groeikompas_dossiers for select to authenticated
using (owner_id = (select auth.uid()));

drop policy if exists "groeikompas_insert_own" on public.groeikompas_dossiers;
create policy "groeikompas_insert_own"
on public.groeikompas_dossiers for insert to authenticated
with check (owner_id = (select auth.uid()));

drop policy if exists "groeikompas_update_own" on public.groeikompas_dossiers;
create policy "groeikompas_update_own"
on public.groeikompas_dossiers for update to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

drop policy if exists "groeikompas_delete_own" on public.groeikompas_dossiers;
create policy "groeikompas_delete_own"
on public.groeikompas_dossiers for delete to authenticated
using (owner_id = (select auth.uid()));

-- Snel opvragen van de laatst bewerkte dossiers van de actieve gebruiker.
create index if not exists groeikompas_dossiers_owner_updated_idx
  on public.groeikompas_dossiers(owner_id, updated_at desc);
