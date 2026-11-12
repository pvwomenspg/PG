-- Run once in your Supabase project's SQL Editor before accepting visit requests.
begin;

create table if not exists public.visit_bookings (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    full_name text not null check (char_length(btrim(full_name)) between 1 and 100),
    phone text not null check (phone ~ '^\+91[6-9][0-9]{9}$'),
    email text not null check (char_length(email) between 3 and 254),
    occupation text not null check (occupation in ('Student', 'Working Professional', 'Other')),
    room_type text not null check (room_type in ('Twin Sharing', 'Three Sharing', 'General Enquiry')),
    visit_date date not null,
    visit_time time without time zone not null,
    message text not null default '' check (char_length(message) <= 1000),
    status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
    created_at timestamptz not null default now(),
    constraint visit_bookings_future_visit check (
        visit_date + visit_time > timezone('Asia/Kolkata', now())
    )
);

comment on column public.visit_bookings.visit_time is 'Preferred local visit time in Asia/Kolkata (IST).';
create index if not exists visit_bookings_user_id_idx on public.visit_bookings (user_id);
alter table public.visit_bookings enable row level security;

revoke all on public.visit_bookings from anon, authenticated;
grant select on public.visit_bookings to authenticated;
grant insert (
    id, user_id, full_name, phone, email, occupation,
    room_type, visit_date, visit_time, message
) on public.visit_bookings to authenticated;

drop policy if exists "Users insert their own visit requests" on public.visit_bookings;
create policy "Users insert their own visit requests"
    on public.visit_bookings for insert to authenticated
    with check (
        (select auth.uid()) = user_id
        and email = (select auth.jwt() ->> 'email')
    );

drop policy if exists "Users read their own visit requests" on public.visit_bookings;
create policy "Users read their own visit requests"
    on public.visit_bookings for select to authenticated
    using ((select auth.uid()) = user_id);

commit;
