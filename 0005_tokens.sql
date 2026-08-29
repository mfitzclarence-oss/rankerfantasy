-- Vote-to-unlock token economy.
-- Earning: 1 token per vote already cast (derived from the existing `votes`
-- table by session_id — no separate "earn" ledger needed).
-- Spending: unlocking Rankings + Trades together costs UNLOCK_COST tokens,
-- logged here so a session's unlock status survives a page refresh / new tab
-- (it's keyed by the same anonymous session_id already used for votes).

create table token_spends (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  amount integer not null,
  reason text not null default 'unlock',
  spent_at timestamptz not null default now()
);

create index idx_token_spends_session on token_spends (session_id);

alter table token_spends enable row level security;

-- Public read (so a session can check its own spend history / balance
-- client-side), write only via the SECURITY DEFINER RPC below.
create policy "token spends are publicly readable"
  on token_spends for select
  using (true);

create or replace function get_token_status(p_session_id uuid)
returns table (earned integer, spent integer, balance integer, unlocked boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_earned integer;
  v_spent integer;
begin
  select count(*) into v_earned from votes where session_id = p_session_id;
  select coalesce(sum(amount), 0) into v_spent from token_spends where session_id = p_session_id;

  return query select
    v_earned,
    v_spent,
    v_earned - v_spent,
    v_spent > 0; -- once a session has ever spent, it stays unlocked (see app copy for why)
end;
$$;

grant execute on function get_token_status(uuid) to anon, authenticated;

create or replace function unlock_site(p_session_id uuid)
returns table (earned integer, spent integer, balance integer, unlocked boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_unlock_cost constant integer := 20;
  v_earned integer;
  v_already_spent integer;
  v_balance integer;
begin
  select count(*) into v_earned from votes where session_id = p_session_id;
  select coalesce(sum(amount), 0) into v_already_spent from token_spends where session_id = p_session_id;
  v_balance := v_earned - v_already_spent;

  if v_already_spent > 0 then
    -- Already unlocked previously — no-op, just return current status.
    return query select v_earned, v_already_spent, v_balance, true;
    return;
  end if;

  if v_balance < v_unlock_cost then
    raise exception 'insufficient tokens: have %, need %', v_balance, v_unlock_cost;
  end if;

  insert into token_spends (session_id, amount, reason) values (p_session_id, v_unlock_cost, 'unlock');

  return query select v_earned, v_already_spent + v_unlock_cost, v_balance - v_unlock_cost, true;
end;
$$;

grant execute on function unlock_site(uuid) to anon, authenticated;
