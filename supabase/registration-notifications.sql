-- Private registration queue for hourly ChatGPT notifications.
-- Only insert after Supabase has confirmed a user's email address.
-- Do not expose private schema to Data API roles.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.groeikompas_registration_alerts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  registered_at timestamptz not null default now(),
  alerted_at timestamptz
);
revoke all on private.groeikompas_registration_alerts from public, anon, authenticated;

create or replace function private.groeikompas_queue_registration_alert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email_confirmed_at is not null
     and new.email is not null and length(new.email)>0
     and (tg_op = 'INSERT' or old.email_confirmed_at is null) then
    insert into private.groeikompas_registration_alerts(user_id,email,registered_at)
    values(new.id,new.email,coalesce(new.email_confirmed_at,now()))
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function private.groeikompas_queue_registration_alert() from public, anon, authenticated;

drop trigger if exists groeikompas_new_registration_alert on auth.users;
create trigger groeikompas_new_registration_alert
after insert or update of email_confirmed_at on auth.users
for each row execute function private.groeikompas_queue_registration_alert();

-- Existing confirmed accounts get queued once.
insert into private.groeikompas_registration_alerts (user_id,email,registered_at)
select id,email,coalesce(email_confirmed_at,created_at,now())
from auth.users
where email is not null and email_confirmed_at is not null
on conflict (user_id) do nothing;

-- Read-only diagnostic:
-- select count(*) from private.groeikompas_registration_alerts where alerted_at is null;
