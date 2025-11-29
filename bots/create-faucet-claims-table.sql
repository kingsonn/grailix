-- Create table to track faucet claims
-- Ensures users can only claim once per 24 hours

create table public.faucet_claims (
  id serial not null,
  user_id uuid not null,
  wallet_address text not null,
  claimed_at timestamp with time zone not null default now(),
  amount numeric not null,
  tx_hash text null,
  constraint faucet_claims_pkey primary key (id),
  constraint faucet_claims_user_id_fkey foreign key (user_id) references users (id) on delete cascade
) tablespace pg_default;

-- Index for faster lookups
create index if not exists idx_faucet_claims_user_id on public.faucet_claims using btree (user_id) tablespace pg_default;
create index if not exists idx_faucet_claims_wallet on public.faucet_claims using btree (wallet_address) tablespace pg_default;
create index if not exists idx_faucet_claims_claimed_at on public.faucet_claims using btree (claimed_at desc) tablespace pg_default;

-- Function to check if user can claim (24 hours since last claim)
create or replace function can_claim_faucet(p_wallet_address text)
returns boolean
language plpgsql
as $$
declare
  last_claim_time timestamp with time zone;
begin
  -- Get the most recent claim time for this wallet
  select claimed_at into last_claim_time
  from faucet_claims
  where wallet_address = p_wallet_address
  order by claimed_at desc
  limit 1;
  
  -- If no previous claim, user can claim
  if last_claim_time is null then
    return true;
  end if;
  
  -- Check if 24 hours have passed
  return (now() - last_claim_time) >= interval '24 hours';
end;
$$;

-- Function to get next claim time for a wallet
create or replace function get_next_claim_time(p_wallet_address text)
returns timestamp with time zone
language plpgsql
as $$
declare
  last_claim_time timestamp with time zone;
begin
  -- Get the most recent claim time for this wallet
  select claimed_at into last_claim_time
  from faucet_claims
  where wallet_address = p_wallet_address
  order by claimed_at desc
  limit 1;
  
  -- If no previous claim, can claim now
  if last_claim_time is null then
    return now();
  end if;
  
  -- Return the time when next claim is available (24 hours after last claim)
  return last_claim_time + interval '24 hours';
end;
$$;

-- Verify table creation
select 'Faucet claims table created successfully' as status;
