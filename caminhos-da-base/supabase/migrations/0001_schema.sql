-- ============================================================================
-- Caminhos da Base — Schema inicial
-- ============================================================================
-- Convenções obrigatórias do projeto:
--   * Dinheiro SEMPRE em centavos, tipo integer. Nunca ponto flutuante.
--   * Datas em UTC (timestamptz). Exibição em America/Sao_Paulo no frontend.
--   * Soft delete via deleted_at. Temporadas passadas nunca desaparecem.
--   * RLS habilitado em TODAS as tabelas, sem exceção — o produto trata
--     dados de menores de idade.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- TIPOS
-- ============================================================================

create type user_role as enum ('responsavel', 'atleta', 'consultor');
create type task_category as enum (
  'treino', 'escola', 'saude', 'documentacao', 'desenvolvimento', 'jogo'
);
create type expense_category as enum (
  'mensalidade', 'federacao', 'competicao', 'equipamento',
  'transporte', 'avaliacao', 'app', 'outros'
);
create type evaluation_source as enum ('automatic', 'manual');
create type club_kind as enum ('escolinha', 'projeto_social', 'clube', 'clube_formador');
create type coin_reason as enum (
  'tarefa_concluida', 'meta_constancia', 'bonus_assinatura',
  'indicacao', 'resgate', 'ajuste_manual'
);

-- ============================================================================
-- PERFIS E CONVITES
-- ============================================================================

create table invite_codes (
  code          text primary key,
  created_by    uuid references auth.users(id) on delete set null,
  used_by       uuid references auth.users(id) on delete set null,
  used_at       timestamptz,
  note          text,
  created_at    timestamptz not null default now()
);
comment on table invite_codes is 'Cadastro é fechado: só cria conta quem tem código válido.';

create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  role          user_role not null default 'responsavel',
  phone         text,
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

-- Aceites de LGPD. Dado de menor exige consentimento registrado e versionado.
create table consents (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  version       text not null,
  accepted_at   timestamptz not null default now(),
  ip            text
);

-- ============================================================================
-- CATÁLOGOS (leitura pública para usuários autenticados)
-- ============================================================================

create table clubs (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  kind              club_kind not null default 'escolinha',
  state             text,
  city              text,
  -- Certificado de Clube Formador: critério direto do degrau 3.
  is_formador       boolean not null default false,
  created_at        timestamptz not null default now()
);

create table competitions (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  state             text,
  -- Degrau que a disputa desta competição comprova (2 ou 3).
  step_level        smallint not null check (step_level between 1 and 3),
  created_at        timestamptz not null default now()
);

-- ============================================================================
-- ATLETAS
-- ============================================================================

create table athletes (
  id                uuid primary key default gen_random_uuid(),
  full_name         text not null,
  -- Ano de nascimento é o campo que define a categoria. Ver src/lib/domain/category.ts
  birth_year        smallint not null check (birth_year between 1990 and 2030),
  birth_date        date,
  position          text,
  dominant_foot     text check (dominant_foot in ('direito', 'esquerdo', 'ambos')),
  current_club_id   uuid references clubs(id) on delete set null,
  current_club_name text,
  created_by        uuid not null references auth.users(id) on delete cascade,
  created_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

-- Relação N:N: pai, mãe e avó podem acompanhar o mesmo atleta.
create table guardianships (
  id            uuid primary key default gen_random_uuid(),
  athlete_id    uuid not null references athletes(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  relationship  text,
  is_primary    boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (athlete_id, user_id)
);

-- Login próprio do atleta a partir dos 13 anos.
create table athlete_logins (
  athlete_id    uuid primary key references athletes(id) on delete cascade,
  user_id       uuid not null unique references auth.users(id) on delete cascade,
  created_at    timestamptz not null default now()
);

create table athlete_history (
  id            uuid primary key default gen_random_uuid(),
  athlete_id    uuid not null references athletes(id) on delete cascade,
  club_name     text not null,
  club_id       uuid references clubs(id) on delete set null,
  category      smallint,
  started_on    date not null,
  ended_on      date,
  created_at    timestamptz not null default now()
);

create table seasons (
  id            uuid primary key default gen_random_uuid(),
  athlete_id    uuid not null references athletes(id) on delete cascade,
  year          smallint not null,
  category      smallint,
  club_name     text,
  created_at    timestamptz not null default now(),
  unique (athlete_id, year)
);

-- Competições que o atleta disputou — entrada direta da engine da pirâmide.
create table athlete_competitions (
  id                uuid primary key default gen_random_uuid(),
  athlete_id        uuid not null references athletes(id) on delete cascade,
  competition_id    uuid references competitions(id) on delete set null,
  competition_name  text not null,
  season_year       smallint not null,
  created_at        timestamptz not null default now()
);

-- ============================================================================
-- ENGINE DA PIRÂMIDE
-- ============================================================================

-- Critérios configuráveis pelo consultor, sem deploy de código.
create table pyramid_rules (
  id            uuid primary key default gen_random_uuid(),
  step          smallint not null check (step between 1 and 3),
  state         text,                -- null = regra nacional/padrão
  version       integer not null default 1,
  is_active     boolean not null default true,
  criteria      jsonb not null,
  label         text not null,
  updated_by    uuid references auth.users(id) on delete set null,
  updated_at    timestamptz not null default now()
);
comment on column pyramid_rules.criteria is
  'JSON com as condições do degrau. Chaves suportadas: requires_competition_level, requires_formador_club, requires_enrollment.';

create table pyramid_evaluations (
  id            uuid primary key default gen_random_uuid(),
  athlete_id    uuid not null references athletes(id) on delete cascade,
  step          smallint not null check (step between 1 and 3),
  reason        text not null,
  source        evaluation_source not null default 'automatic',
  note          text,
  evaluated_by  uuid references auth.users(id) on delete set null,
  evaluated_at  timestamptz not null default now()
);
create index on pyramid_evaluations (athlete_id, evaluated_at desc);

-- ============================================================================
-- TAREFAS, FINANCEIRO, DOCUMENTOS, JOGOS
-- ============================================================================

create table tasks (
  id            uuid primary key default gen_random_uuid(),
  athlete_id    uuid not null references athletes(id) on delete cascade,
  title         text not null,
  category      task_category not null,
  due_date      date,
  is_done       boolean not null default false,
  completed_by  uuid references auth.users(id) on delete set null,
  completed_at  timestamptz,
  recurrence    text,                -- regra RRULE, opcional
  notes         text,
  created_by    uuid not null references auth.users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index on tasks (athlete_id, due_date);

create table expenses (
  id            uuid primary key default gen_random_uuid(),
  athlete_id    uuid not null references athletes(id) on delete cascade,
  -- CENTAVOS. 1999 = R$ 19,99. Jamais usar float para dinheiro.
  amount_cents  integer not null check (amount_cents >= 0),
  category      expense_category not null,
  spent_on      date not null,
  season_year   smallint not null,
  note          text,
  created_by    uuid not null references auth.users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index on expenses (athlete_id, spent_on desc);

create table matches (
  id                uuid primary key default gen_random_uuid(),
  athlete_id        uuid not null references athletes(id) on delete cascade,
  season_year       smallint not null,
  played_on         date not null,
  opponent          text,
  competition_name  text,
  -- Minutagem é a métrica-título do produto, acima de gols.
  minutes_played    smallint check (minutes_played between 0 and 120),
  goals             smallint not null default 0 check (goals >= 0),
  assists           smallint not null default 0 check (assists >= 0),
  video_url         text,
  notes             text,
  created_at        timestamptz not null default now(),
  deleted_at        timestamptz
);
create index on matches (athlete_id, played_on desc);

create table documents (
  id            uuid primary key default gen_random_uuid(),
  athlete_id    uuid not null references athletes(id) on delete cascade,
  title         text not null,
  storage_path  text,
  expires_on    date,               -- alimenta os alertas de vencimento
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

-- O vínculo federativo: dor invisível que gera um dos alertas mais valiosos.
create table federation_registrations (
  id                uuid primary key default gen_random_uuid(),
  athlete_id        uuid not null references athletes(id) on delete cascade,
  federation        text not null,
  club_name         text not null,
  season_year       smallint not null,
  registered_on     date,
  transfer_window_ends_on date,
  created_at        timestamptz not null default now()
);

-- ============================================================================
-- ASSINATURA E MOEDAS (estrutura pronta desde a v1, sem tela)
-- ============================================================================

create table subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  plan          text not null default 'gratuito',
  status        text not null default 'ativa',
  started_at    timestamptz not null default now(),
  renews_at     timestamptz,
  created_at    timestamptz not null default now()
);

-- Extrato auditável. O saldo é sempre reconstruível pela soma do ledger.
create table coin_ledger (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  athlete_id    uuid references athletes(id) on delete set null,
  amount        integer not null,    -- positivo = ganho, negativo = resgate
  reason        coin_reason not null,
  description   text,
  created_at    timestamptz not null default now()
);
create index on coin_ledger (user_id, created_at desc);

create table rewards (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  cost_coins    integer not null check (cost_coins > 0),
  kind          text not null,       -- cupom_parceiro | desconto_assinatura | sessao_consultoria
  monthly_limit integer,             -- trava de agenda para sessões de consultoria
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create table redemptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  reward_id     uuid not null references rewards(id) on delete restrict,
  code          text,
  status        text not null default 'solicitado',
  created_at    timestamptz not null default now()
);

create table referrals (
  id            uuid primary key default gen_random_uuid(),
  referrer_id   uuid not null references auth.users(id) on delete cascade,
  invite_code   text references invite_codes(code) on delete set null,
  referred_id   uuid references auth.users(id) on delete set null,
  rewarded_at   timestamptz,
  created_at    timestamptz not null default now()
);

create table consultant_athletes (
  id            uuid primary key default gen_random_uuid(),
  consultant_id uuid not null references auth.users(id) on delete cascade,
  athlete_id    uuid not null references athletes(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (consultant_id, athlete_id)
);

-- ============================================================================
-- FUNÇÕES DE APOIO
-- ============================================================================

create or replace function is_consultant(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = uid and role = 'consultor');
$$;

-- Um usuário enxerga um atleta se for responsável, o próprio atleta, ou o consultor dele.
create or replace function can_access_athlete(uid uuid, aid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    exists (select 1 from guardianships g where g.athlete_id = aid and g.user_id = uid)
    or exists (select 1 from athlete_logins al where al.athlete_id = aid and al.user_id = uid)
    or exists (select 1 from consultant_athletes c where c.athlete_id = aid and c.consultant_id = uid);
$$;

-- Cria perfil e assinatura automaticamente quando um usuário se cadastra.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Sem nome'),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'responsavel')
  );
  insert into subscriptions (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table invite_codes            enable row level security;
alter table profiles                enable row level security;
alter table consents                enable row level security;
alter table clubs                   enable row level security;
alter table competitions            enable row level security;
alter table athletes                enable row level security;
alter table guardianships           enable row level security;
alter table athlete_logins          enable row level security;
alter table athlete_history         enable row level security;
alter table seasons                 enable row level security;
alter table athlete_competitions    enable row level security;
alter table pyramid_rules           enable row level security;
alter table pyramid_evaluations     enable row level security;
alter table tasks                   enable row level security;
alter table expenses                enable row level security;
alter table matches                 enable row level security;
alter table documents               enable row level security;
alter table federation_registrations enable row level security;
alter table subscriptions           enable row level security;
alter table coin_ledger             enable row level security;
alter table rewards                 enable row level security;
alter table redemptions             enable row level security;
alter table referrals               enable row level security;
alter table consultant_athletes     enable row level security;

-- Perfis: cada um vê e edita o seu. Consultor vê todos.
create policy profiles_select on profiles for select using (
  id = auth.uid() or is_consultant(auth.uid())
);
create policy profiles_update on profiles for update using (id = auth.uid());

create policy consents_own on consents for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Catálogos: leitura para autenticados, escrita só do consultor.
create policy clubs_read on clubs for select using (auth.uid() is not null);
create policy clubs_write on clubs for all using (is_consultant(auth.uid()))
  with check (is_consultant(auth.uid()));
create policy competitions_read on competitions for select using (auth.uid() is not null);
create policy competitions_write on competitions for all using (is_consultant(auth.uid()))
  with check (is_consultant(auth.uid()));

-- Atletas: nenhum usuário vê o atleta de outro. Sem rede social, sem comparação.
create policy athletes_select on athletes for select using (
  can_access_athlete(auth.uid(), id)
);
create policy athletes_insert on athletes for insert with check (created_by = auth.uid());
create policy athletes_update on athletes for update using (
  can_access_athlete(auth.uid(), id)
);

create policy guardianships_select on guardianships for select using (
  user_id = auth.uid() or can_access_athlete(auth.uid(), athlete_id)
);
create policy guardianships_insert on guardianships for insert with check (
  user_id = auth.uid()
  or exists (select 1 from athletes a where a.id = athlete_id and a.created_by = auth.uid())
);

create policy athlete_logins_select on athlete_logins for select using (
  user_id = auth.uid() or can_access_athlete(auth.uid(), athlete_id)
);

-- Tabelas filhas do atleta: mesma regra de acesso, aplicada no banco.
create policy athlete_history_all on athlete_history for all
  using (can_access_athlete(auth.uid(), athlete_id))
  with check (can_access_athlete(auth.uid(), athlete_id));

create policy seasons_all on seasons for all
  using (can_access_athlete(auth.uid(), athlete_id))
  with check (can_access_athlete(auth.uid(), athlete_id));

create policy athlete_competitions_all on athlete_competitions for all
  using (can_access_athlete(auth.uid(), athlete_id))
  with check (can_access_athlete(auth.uid(), athlete_id));

create policy tasks_all on tasks for all
  using (can_access_athlete(auth.uid(), athlete_id))
  with check (can_access_athlete(auth.uid(), athlete_id));

create policy matches_all on matches for all
  using (can_access_athlete(auth.uid(), athlete_id))
  with check (can_access_athlete(auth.uid(), athlete_id));

create policy documents_all on documents for all
  using (can_access_athlete(auth.uid(), athlete_id))
  with check (can_access_athlete(auth.uid(), athlete_id));

create policy federation_all on federation_registrations for all
  using (can_access_athlete(auth.uid(), athlete_id))
  with check (can_access_athlete(auth.uid(), athlete_id));

-- Financeiro: o atleta adolescente NÃO vê os gastos por padrão.
create policy expenses_all on expenses for all
  using (
    exists (select 1 from guardianships g where g.athlete_id = expenses.athlete_id and g.user_id = auth.uid())
    or exists (select 1 from consultant_athletes c where c.athlete_id = expenses.athlete_id and c.consultant_id = auth.uid())
  )
  with check (
    exists (select 1 from guardianships g where g.athlete_id = expenses.athlete_id and g.user_id = auth.uid())
  );

-- Pirâmide: regras são lidas por todos, editadas só pelo consultor.
create policy pyramid_rules_read on pyramid_rules for select using (auth.uid() is not null);
create policy pyramid_rules_write on pyramid_rules for all using (is_consultant(auth.uid()))
  with check (is_consultant(auth.uid()));

create policy pyramid_evaluations_read on pyramid_evaluations for select
  using (can_access_athlete(auth.uid(), athlete_id));
-- Ajuste manual de degrau é exclusivo do consultor.
create policy pyramid_evaluations_manual on pyramid_evaluations for insert
  with check (is_consultant(auth.uid()) and evaluated_by = auth.uid());

create policy subscriptions_own on subscriptions for select using (user_id = auth.uid());
create policy coin_ledger_own on coin_ledger for select using (user_id = auth.uid());
create policy rewards_read on rewards for select using (auth.uid() is not null);
create policy redemptions_own on redemptions for all using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy referrals_own on referrals for select using (referrer_id = auth.uid());

create policy consultant_athletes_own on consultant_athletes for all
  using (consultant_id = auth.uid()) with check (is_consultant(auth.uid()));

-- Convites: validação e consumo passam por função SECURITY DEFINER,
-- então nenhum acesso direto de leitura é concedido ao cliente.
create policy invite_codes_consultant on invite_codes for all
  using (is_consultant(auth.uid())) with check (is_consultant(auth.uid()));
