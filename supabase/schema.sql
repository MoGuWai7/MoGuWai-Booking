-- ============================================================
-- MoGuWai Booking — Database Schema
-- Run this in Supabase SQL Editor
--
-- 격리 원칙(중요):
-- - 모든 애플리케이션 데이터 테이블은 mbk_ prefix를 사용합니다.
-- - 본 Supabase 프로젝트의 auth.users 는 다른 앱과 공유될 수 있으므로,
--   "이 앱의 사용자"임을 식별하기 위해 mbk_users 라는 앱 전용 사용자 테이블을 둡니다.
-- - mbk_users 에 row 가 없는 auth.users 는 이 앱에서 어떤 RLS 정책에도 통과하지 않습니다.
-- - app 코드에서는 회원가입 시 mbk_users 에 INSERT, 로그인 시 mbk_users 존재 여부를 확인합니다.
-- ============================================================

-- ============================================================
-- mbk_users — 본 앱(MoGuWai Booking) 전용 사용자 프로필
-- - id 는 auth.users(id) 와 동일 (1:1 매핑)
-- - 다른 앱(같은 Supabase 인스턴스에서 운영)의 사용자는 이 테이블에 없으므로
--   본 앱의 어떤 데이터에도 접근할 수 없음
-- ============================================================
create table if not exists mbk_users (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  display_name text,
  created_at   timestamptz default now()
);

alter table mbk_users enable row level security;

-- 본인 row 만 SELECT/UPDATE 가능. INSERT 는 service_role 또는 본인 가입 직후 cookie 기반 클라이언트가 수행.
drop policy if exists "self only" on mbk_users;
create policy "self only" on mbk_users
  using (id = auth.uid())
  with check (id = auth.uid());

-- 헬퍼: 현재 요청자가 mbk_users 테이블에 등록되어 있는지 (= 이 앱의 사용자인지)
create or replace function is_mbk_user() returns boolean
language sql stable
as $$
  select exists (select 1 from mbk_users where id = auth.uid())
$$;

-- mbk_businesses
create table if not exists mbk_businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references mbk_users(id) on delete cascade,
  name text not null,
  slug text unique not null,
  category text not null,
  description text,
  phone text,
  address text,
  open_time time not null default '09:00',
  close_time time not null default '18:00',
  slot_duration int not null default 60,
  created_at timestamptz default now()
);

-- mbk_staff
create table if not exists mbk_staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references mbk_businesses(id) on delete cascade,
  name text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- mbk_blocked_dates
create table if not exists mbk_blocked_dates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references mbk_businesses(id) on delete cascade,
  blocked_date date not null,
  reason text,
  created_at timestamptz default now(),
  unique(business_id, blocked_date)
);

-- mbk_reservations
create table if not exists mbk_reservations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references mbk_businesses(id) on delete cascade,
  staff_id uuid references mbk_staff(id),
  reservation_number text unique not null,
  customer_name text not null,
  customer_phone text not null,
  reserved_at timestamptz not null,
  status text not null default 'pending',
  created_at timestamptz default now()
);

-- mbk_customers
create table if not exists mbk_customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references mbk_businesses(id) on delete cascade,
  name text not null,
  phone text not null,
  visit_count int default 1,
  last_visited_at timestamptz,
  created_at timestamptz default now(),
  unique(business_id, phone)
);

-- ============================================================
-- RLS Policies
--   모든 owner 정책은 is_mbk_user() AND owner_id = auth.uid() 형태로 강화.
--   다른 앱 사용자는 mbk_users 에 row 가 없으므로 is_mbk_user() = false → 차단.
-- ============================================================

alter table mbk_businesses enable row level security;
drop policy if exists "owner only" on mbk_businesses;
create policy "owner only" on mbk_businesses
  using (is_mbk_user() and owner_id = auth.uid())
  with check (is_mbk_user() and owner_id = auth.uid());

-- 손님(anon) 도 가게 정보를 슬러그로 조회할 수 있어야 하므로 SELECT 별도 정책 추가.
drop policy if exists "public read by slug" on mbk_businesses;
create policy "public read by slug" on mbk_businesses
  for select
  using (true);

alter table mbk_staff enable row level security;
drop policy if exists "business owner only" on mbk_staff;
create policy "business owner only" on mbk_staff
  using (
    business_id in (select id from mbk_businesses where is_mbk_user() and owner_id = auth.uid())
  )
  with check (
    business_id in (select id from mbk_businesses where is_mbk_user() and owner_id = auth.uid())
  );
-- 손님 페이지에서 담당자 목록을 조회해야 함
drop policy if exists "public read staff" on mbk_staff;
create policy "public read staff" on mbk_staff
  for select using (true);

alter table mbk_blocked_dates enable row level security;
drop policy if exists "business owner only" on mbk_blocked_dates;
create policy "business owner only" on mbk_blocked_dates
  using (
    business_id in (select id from mbk_businesses where is_mbk_user() and owner_id = auth.uid())
  )
  with check (
    business_id in (select id from mbk_businesses where is_mbk_user() and owner_id = auth.uid())
  );
drop policy if exists "public read blocked" on mbk_blocked_dates;
create policy "public read blocked" on mbk_blocked_dates
  for select using (true);

alter table mbk_reservations enable row level security;
drop policy if exists "owner read write" on mbk_reservations;
create policy "owner read write" on mbk_reservations
  using (
    (is_mbk_user() and business_id in (select id from mbk_businesses where owner_id = auth.uid()))
    or auth.role() = 'anon'
  )
  with check (
    (is_mbk_user() and business_id in (select id from mbk_businesses where owner_id = auth.uid()))
    or auth.role() = 'anon'
  );

alter table mbk_customers enable row level security;
drop policy if exists "business owner only" on mbk_customers;
create policy "business owner only" on mbk_customers
  using (
    business_id in (select id from mbk_businesses where is_mbk_user() and owner_id = auth.uid())
  )
  with check (
    business_id in (select id from mbk_businesses where is_mbk_user() and owner_id = auth.uid())
  );

-- ============================================================
-- RPC: create_reservation (atomic, conflict-safe)
-- ============================================================

create or replace function create_reservation(
  p_business_id uuid,
  p_staff_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_reserved_at timestamptz
) returns mbk_reservations as $$
declare
  v_reservation mbk_reservations;
  v_conflict_count int;
  v_reservation_number text;
begin
  select count(*) into v_conflict_count
  from mbk_reservations
  where business_id = p_business_id
    and staff_id = p_staff_id
    and reserved_at = p_reserved_at
    and status not in ('cancelled');

  if v_conflict_count > 0 then
    raise exception '이미 예약된 시간입니다. 다른 시간을 선택해주세요.';
  end if;

  v_reservation_number := 'RES-' || upper(substring(gen_random_uuid()::text, 1, 8));

  insert into mbk_reservations (business_id, staff_id, reservation_number, customer_name, customer_phone, reserved_at)
  values (p_business_id, p_staff_id, v_reservation_number, p_customer_name, p_customer_phone, p_reserved_at)
  returning * into v_reservation;

  insert into mbk_customers (business_id, name, phone, visit_count, last_visited_at)
  values (p_business_id, p_customer_name, p_customer_phone, 1, now())
  on conflict (business_id, phone)
  do update set
    visit_count = mbk_customers.visit_count + 1,
    last_visited_at = now();

  return v_reservation;
end;
$$ language plpgsql security definer;

-- ============================================================
-- mbk_visitor_logs — 사이트 방문자(페이지뷰) 로그
-- - proxy(미들웨어)에서 service_role 키로 INSERT
-- - 조회는 /visitor-log 페이지에서 동일하게 service_role 키로 SELECT
-- - 일반 anon/owner 는 RLS 로 전부 차단 (정책 없음 = 막힘)
-- - 자세한 내용: docs/handover/13-visitor-logs.md
-- ============================================================

create table if not exists mbk_visitor_logs (
  id            uuid primary key default gen_random_uuid(),
  visited_at    timestamptz default now(),

  path          text,
  slug          text,

  country       text,
  country_code  text,
  region        text,
  city          text,

  device_type   text,
  os            text,
  browser       text,

  ip            text,
  referrer      text
);

create index if not exists mbk_visitor_logs_visited_at_idx on mbk_visitor_logs(visited_at desc);
create index if not exists mbk_visitor_logs_slug_idx       on mbk_visitor_logs(slug);
create index if not exists mbk_visitor_logs_path_idx       on mbk_visitor_logs(path);

alter table mbk_visitor_logs enable row level security;

-- ============================================================
-- 마이그레이션 (기존 환경에서 한 번만 실행)
-- ------------------------------------------------------------
-- 기존에 auth.users 를 직접 참조하던 owner_id 를 mbk_users 로 백필합니다.
-- 이미 가게를 가진 사용자가 mbk_users 에 누락되어 로그인 차단되는 사고를 방지합니다.
-- ============================================================

insert into mbk_users (id, email)
select u.id, u.email
from auth.users u
where exists (select 1 from mbk_businesses b where b.owner_id = u.id)
on conflict (id) do nothing;

-- ============================================================
-- 기존 환경 마이그레이션: mbk_businesses.owner_id FK 전환
--   auth.users(id) → mbk_users(id)
-- 위 backfill 이 끝난 직후에만 안전하게 실행 가능합니다.
-- 새 DB 또는 이미 mbk_users(id) 를 참조하는 환경에서는 자동으로 no-op.
-- ============================================================

do $$
declare
  v_old_fk text;
begin
  select conname into v_old_fk
  from pg_constraint
  where conrelid = 'public.mbk_businesses'::regclass
    and contype  = 'f'
    and confrelid = 'auth.users'::regclass
    and conkey = (
      select array_agg(attnum order by attnum)
      from pg_attribute
      where attrelid = 'public.mbk_businesses'::regclass
        and attname = 'owner_id'
    );

  if v_old_fk is not null then
    execute format('alter table public.mbk_businesses drop constraint %I', v_old_fk);
    alter table public.mbk_businesses
      add constraint mbk_businesses_owner_id_fkey
      foreign key (owner_id) references mbk_users(id) on delete cascade;
  end if;
end $$;
