create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  company_name text,
  business_id text,
  business_id_normalized text,
  vat_id text,
  selected_plan text check (selected_plan in ('basic', 'pro', 'premium')),
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  subscription_status text,
  stripe_customer_id text,
  payment_method_ready boolean not null default false,
  stripe_payment_method_id text,
  payment_method_added_at timestamptz,
  stripe_subscription_id text,
  current_period_end timestamptz,
  receipts_used integer not null default 0,
  usage_period_start date not null default date_trunc('month', now())::date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists company_name text;
alter table public.profiles add column if not exists business_id text;
alter table public.profiles add column if not exists business_id_normalized text;
alter table public.profiles add column if not exists vat_id text;
alter table public.profiles add column if not exists payment_method_ready boolean not null default false;
alter table public.profiles add column if not exists stripe_payment_method_id text;
alter table public.profiles add column if not exists payment_method_added_at timestamptz;

create unique index if not exists profiles_stripe_customer_id_unique
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

create index if not exists profiles_business_id_normalized_idx
  on public.profiles (business_id_normalized)
  where business_id_normalized is not null;

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

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
  vat_id text,
  email text not null,
  plan text check (plan in ('basic', 'pro', 'premium')),
  note text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.company_invoice_requests add column if not exists vat_id text;

alter table public.company_invoice_requests enable row level security;
