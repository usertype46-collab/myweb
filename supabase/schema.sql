-- 1. 啟用必要的擴充功能
create extension if not exists "uuid-ossp";

-- 2. 建立 使用者 Profile 表 (與 auth.users 連動)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 啟用 Profiles 的 RLS
alter table public.profiles enable row level security;

create policy "允許使用者讀取所有 Profile" on public.profiles
  for select using (true);

create policy "允許使用者更新自己的 Profile" on public.profiles
  for update using (auth.uid() = id);

-- 新增新使用者時自動觸發建立 Profile 的 Trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 3. 建立 待辦事項 (Todos) 表 (展示 CRUD 與 RLS)
create table if not exists public.todos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  is_completed boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 啟用 Todos 的 RLS
alter table public.todos enable row level security;

create policy "使用者僅能檢視自己的 Todos" on public.todos
  for select using (auth.uid() = user_id);

create policy "使用者僅能建立自己的 Todos" on public.todos
  for insert with check (auth.uid() = user_id);

create policy "使用者僅能更新自己的 Todos" on public.todos
  for update using (auth.uid() = user_id);

create policy "使用者僅能刪除自己的 Todos" on public.todos
  for delete using (auth.uid() = user_id);


-- 4. 建立 Realtime 廣播訊息紀錄表
create table if not exists public.live_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.live_messages enable row level security;
create policy "任何人皆可檢視即時訊息" on public.live_messages for select using (true);
create policy "驗證使用者可發送即時訊息" on public.live_messages for insert with check (auth.role() = 'authenticated');

-- 將 live_messages 加入 Supabase Realtime 發佈 publication
alter publication supabase_realtime add table public.live_messages;


-- 5. 建立 RPC 函數示例：統計當前使用者的任務狀況
create or replace function get_user_todo_stats()
returns table (
  total_count bigint,
  completed_count bigint,
  pending_count bigint
) 
language plpgsql
security definer
as $$
begin
  return query
  select 
    count(*)::bigint as total_count,
    count(*) filter (where is_completed = true)::bigint as completed_count,
    count(*) filter (where is_completed = false)::bigint as pending_count
  from public.todos
  where user_id = auth.uid();
end;
$$;


-- 6. 配置 Storage 儲存桶
insert into storage.buckets (id, name, public)
values ('user_assets', 'user_assets', true)
on conflict (id) do nothing;

create policy "公開讀取 user_assets 檔案" on storage.objects
  for select using (bucket_id = 'user_assets');

create policy "登入使用者可上傳檔案至 user_assets" on storage.objects
  for insert with check (
    bucket_id = 'user_assets' 
    and auth.role() = 'authenticated'
  );

create policy "使用者可刪除自己在 user_assets 的檔案" on storage.objects
  for delete using (
    bucket_id = 'user_assets' 
    and auth.uid() = owner
  );
