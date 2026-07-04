create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  selected_plan text check (selected_plan in ('basic', 'pro', 'premium')),
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  subscription_status text,
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  receipts_used integer not null default 0,
  usage_period_start date not null default date_trunc('month', now())::date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create table if not exists public.company_invoice_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  company_name text not null,
  business_id text,
  email text not null,
  plan text check (plan in ('basic', 'pro', 'premium')),
  note text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.company_invoice_requests enable row level security;
