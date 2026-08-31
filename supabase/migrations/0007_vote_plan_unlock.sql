-- Require a balanced set of position votes before Rankings and Trade Vote
-- unlock. Existing sessions that already unlocked remain unlocked.

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
    least(c.overall_votes, 2)
      + least(c.qb_votes, 2)
      + least(c.rb_votes, 2)
      + least(c.wr_votes, 2)
      + least(c.te_votes, 1)
      + least(c.k_votes, 1)
      + least(c.dst_votes, 1) as qualified_votes,
    exists(select 1 from public.token_spends s where s.session_id = p_session_id)
      or (
        c.overall_votes >= 2
        and c.qb_votes >= 2
        and c.rb_votes >= 2
        and c.wr_votes >= 2
        and c.te_votes >= 1
        and c.k_votes >= 1
        and c.dst_votes >= 1
      ) as unlocked
  from vote_counts c;
$$;

revoke execute on function public.get_unlock_progress(uuid) from public;
grant execute on function public.get_unlock_progress(uuid) to anon, authenticated;

-- Keep the legacy RPC safe for any cached clients: it now enforces the same
-- category plan instead of accepting twenty votes from one category.
create or replace function public.unlock_site(p_session_id uuid)
returns table (earned integer, spent integer, balance integer, unlocked boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_unlock_cost constant integer := 11;
  v_earned integer;
  v_already_spent integer;
  v_balance integer;
  v_overall integer;
  v_qb integer;
  v_rb integer;
  v_wr integer;
  v_te integer;
  v_k integer;
  v_dst integer;
begin
  select
    count(*)::integer,
    count(*) filter (where category = 'overall')::integer,
    count(*) filter (where category = 'qb')::integer,
    count(*) filter (where category = 'rb')::integer,
    count(*) filter (where category = 'wr')::integer,
    count(*) filter (where category = 'te')::integer,
    count(*) filter (where category = 'k')::integer,
    count(*) filter (where category = 'dst')::integer
  into v_earned, v_overall, v_qb, v_rb, v_wr, v_te, v_k, v_dst
  from public.votes
  where session_id = p_session_id;

  select coalesce(sum(amount), 0)::integer
  into v_already_spent
  from public.token_spends
  where session_id = p_session_id;

  v_balance := v_earned - v_already_spent;

  if v_already_spent > 0 then
    return query select v_earned, v_already_spent, v_balance, true;
    return;
  end if;

  if v_overall < 2 or v_qb < 2 or v_rb < 2 or v_wr < 2 or v_te < 1 or v_k < 1 or v_dst < 1 then
    raise exception 'complete the required position voting plan before unlocking';
  end if;

  insert into public.token_spends (session_id, amount, reason)
  values (p_session_id, v_unlock_cost, 'unlock');

  return query select v_earned, v_unlock_cost, v_earned - v_unlock_cost, true;
end;
$$;

revoke execute on function public.unlock_site(uuid) from public;
grant execute on function public.unlock_site(uuid) to anon, authenticated;
