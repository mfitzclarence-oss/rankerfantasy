-- Guide every fresh browser visit through three votes at each active
-- position. Kicker and D/ST stay in the schema and historical vote log, but
-- no longer count toward unlocking the active product experience.

create or replace function public.get_unlock_progress(p_session_id uuid)
returns table (
  overall_votes integer,
  qb_votes integer,
  rb_votes integer,
  wr_votes integer,
  te_votes integer,
  k_votes integer,
  dst_votes integer,
  qualified_votes integer,
  unlocked boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  with vote_counts as (
    select
      count(*) filter (where category = 'overall')::integer as overall_votes,
      count(*) filter (where category = 'qb')::integer as qb_votes,
      count(*) filter (where category = 'rb')::integer as rb_votes,
      count(*) filter (where category = 'wr')::integer as wr_votes,
      count(*) filter (where category = 'te')::integer as te_votes,
      count(*) filter (where category = 'k')::integer as k_votes,
      count(*) filter (where category = 'dst')::integer as dst_votes
    from public.votes
    where session_id = p_session_id
  )
  select
    c.overall_votes,
    c.qb_votes,
    c.rb_votes,
    c.wr_votes,
    c.te_votes,
    c.k_votes,
    c.dst_votes,
    least(c.qb_votes, 3)
      + least(c.rb_votes, 3)
      + least(c.wr_votes, 3)
      + least(c.te_votes, 3) as qualified_votes,
    exists(select 1 from public.token_spends s where s.session_id = p_session_id)
      or (
        c.qb_votes >= 3
        and c.rb_votes >= 3
        and c.wr_votes >= 3
        and c.te_votes >= 3
      ) as unlocked
  from vote_counts c;
$$;

revoke execute on function public.get_unlock_progress(uuid) from public;
grant execute on function public.get_unlock_progress(uuid) to anon, authenticated;

-- Retain the legacy RPC for cached clients, but enforce the same active plan.
create or replace function public.unlock_site(p_session_id uuid)
returns table (earned integer, spent integer, balance integer, unlocked boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_unlock_cost constant integer := 12;
  v_earned integer;
  v_already_spent integer;
  v_qb integer;
  v_rb integer;
  v_wr integer;
  v_te integer;
begin
  select
    count(*)::integer,
    count(*) filter (where category = 'qb')::integer,
    count(*) filter (where category = 'rb')::integer,
    count(*) filter (where category = 'wr')::integer,
    count(*) filter (where category = 'te')::integer
  into v_earned, v_qb, v_rb, v_wr, v_te
  from public.votes
  where session_id = p_session_id;

  select coalesce(sum(amount), 0)::integer
  into v_already_spent
  from public.token_spends
  where session_id = p_session_id;

  if v_already_spent > 0 then
    return query select v_earned, v_already_spent, v_earned - v_already_spent, true;
    return;
  end if;

  if v_qb < 3 or v_rb < 3 or v_wr < 3 or v_te < 3 then
    raise exception 'complete three QB, RB, WR and TE votes before unlocking';
  end if;

  insert into public.token_spends (session_id, amount, reason)
  values (p_session_id, v_unlock_cost, 'unlock');

  return query select v_earned, v_unlock_cost, v_earned - v_unlock_cost, true;
end;
$$;

revoke execute on function public.unlock_site(uuid) from public;
grant execute on function public.unlock_site(uuid) to anon, authenticated;
