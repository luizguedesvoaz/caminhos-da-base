-- ============================================================================
-- Caminhos da Base — Engine da Pirâmide da Formação
-- ============================================================================
-- O cálculo do degrau roda AQUI, no banco, e nunca no navegador: se rodasse
-- no cliente seria burlável. As regras vêm da tabela `pyramid_rules`, editável
-- pelo consultor no painel admin — sem depender de deploy de código.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Validação e consumo de código de convite
-- ----------------------------------------------------------------------------

create or replace function validate_invite_code(p_code text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from invite_codes
    where upper(code) = upper(trim(p_code)) and used_by is null
  );
$$;

create or replace function consume_invite_code(p_code text)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_updated integer;
begin
  update invite_codes
     set used_by = auth.uid(), used_at = now()
   where upper(code) = upper(trim(p_code))
     and used_by is null;
  get diagnostics v_updated = row_count;

  -- Programa de indicação: credita o autor do convite quando ele é usado.
  if v_updated = 1 then
    insert into referrals (referrer_id, invite_code, referred_id)
    select created_by, code, auth.uid()
      from invite_codes
     where upper(code) = upper(trim(p_code)) and created_by is not null;
  end if;

  return v_updated = 1;
end;
$$;

grant execute on function validate_invite_code(text) to anon, authenticated;
grant execute on function consume_invite_code(text) to authenticated;

-- ----------------------------------------------------------------------------
-- Categoria por ano de nascimento
-- ----------------------------------------------------------------------------
-- REGRA CRÍTICA: categoria é definida pelo ANO DE NASCIMENTO, não pela idade.
-- Um atleta de 2013 joga o sub-13 durante toda a temporada 2026, mesmo tendo
-- completado 14 anos em março. Calcular por idade erra metade dos casos.
-- Espelha src/lib/domain/category.ts — manter os dois em sincronia.
-- ----------------------------------------------------------------------------

create or replace function category_for(p_birth_year smallint, p_season_year smallint)
returns smallint language plpgsql immutable as $$
declare
  v_age smallint := p_season_year - p_birth_year;
  v_cat smallint;
begin
  if v_age < 6 then return null; end if;
  foreach v_cat in array array[7,9,11,13,15,17,20]::smallint[] loop
    if v_age <= v_cat then return v_cat; end if;
  end loop;
  return null;  -- acima de sub-20 já é profissional
end;
$$;

-- 'segundo' = mais velho da categoria; 'primeiro' = mais novo, joga menos minutos.
create or replace function category_year(p_birth_year smallint, p_season_year smallint)
returns text language plpgsql immutable as $$
declare
  v_cat smallint := category_for(p_birth_year, p_season_year);
  v_age smallint := p_season_year - p_birth_year;
begin
  if v_cat is null then return null; end if;
  if v_age = v_cat then return 'segundo'; else return 'primeiro'; end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- Avaliação do degrau
-- ----------------------------------------------------------------------------

create or replace function evaluate_pyramid(p_athlete_id uuid)
returns table (step smallint, reason text) language plpgsql stable
security definer set search_path = public as $$
declare
  v_season         smallint := extract(year from now())::smallint;
  v_is_formador    boolean := false;
  v_club_kind      club_kind;
  v_max_level      smallint := 0;
  v_top_competition text;
  v_has_club       boolean := false;
begin
  if not can_access_athlete(auth.uid(), p_athlete_id) then
    raise exception 'Sem permissão para avaliar este atleta';
  end if;

  -- Clube atual: é clube formador? Há vínculo declarado?
  select c.is_formador, c.kind, (a.current_club_name is not null or a.current_club_id is not null)
    into v_is_formador, v_club_kind, v_has_club
    from athletes a
    left join clubs c on c.id = a.current_club_id
   where a.id = p_athlete_id;

  -- Maior nível de competição já disputada, segundo o catálogo configurável.
  select max(coalesce(c.step_level, r.step_level)), max(ac.competition_name)
    into v_max_level, v_top_competition
    from athlete_competitions ac
    left join competitions c on c.id = ac.competition_id
    left join lateral (
      select comp.step_level from competitions comp
       where lower(comp.name) = lower(ac.competition_name)
       limit 1
    ) r on true
   where ac.athlete_id = p_athlete_id;

  v_max_level := coalesce(v_max_level, 0);

  -- DEGRAU 3 — Alto Rendimento
  if v_max_level >= 3 or v_is_formador or v_club_kind = 'clube_formador' then
    return query select 3::smallint,
      case
        when v_max_level >= 3 and v_is_formador then
          'Disputa competição de nível estadual (' || coalesce(v_top_competition,'estadual') ||
          ') e está em clube com Certificado de Clube Formador.'
        when v_max_level >= 3 then
          'Disputa o Campeonato Estadual de Base (' || coalesce(v_top_competition,'estadual') || ').'
        else
          'Está vinculado a clube com Certificado de Clube Formador.'
      end;
    return;
  end if;

  -- DEGRAU 2 — Competições Intermediárias
  if v_max_level = 2 then
    return query select 2::smallint,
      'Disputa competições organizadas (' || coalesce(v_top_competition,'competição regional') || ').';
    return;
  end if;

  -- DEGRAU 1 — Iniciação
  return query select 1::smallint,
    case when v_has_club
      then 'Está matriculado em escolinha ou projeto, ainda sem competições regulares.'
      else 'Cadastro inicial: ainda não há clube ou competição registrada.'
    end;
end;
$$;

-- Calcula e grava o resultado no histórico, devolvendo o degrau.
create or replace function refresh_pyramid(p_athlete_id uuid)
returns smallint language plpgsql security definer set search_path = public as $$
declare
  v_step smallint; v_reason text;
begin
  select step, reason into v_step, v_reason from evaluate_pyramid(p_athlete_id);

  insert into pyramid_evaluations (athlete_id, step, reason, source, evaluated_by)
  values (p_athlete_id, v_step, v_reason, 'automatic', auth.uid());

  return v_step;
end;
$$;

-- Degrau vigente: respeita o ajuste manual do consultor quando ele for o mais recente.
create or replace function current_pyramid_step(p_athlete_id uuid)
returns table (step smallint, reason text, source evaluation_source, note text, evaluated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select e.step, e.reason, e.source, e.note, e.evaluated_at
    from pyramid_evaluations e
   where e.athlete_id = p_athlete_id
     and can_access_athlete(auth.uid(), p_athlete_id)
   order by e.evaluated_at desc
   limit 1;
$$;

grant execute on function evaluate_pyramid(uuid)      to authenticated;
grant execute on function refresh_pyramid(uuid)       to authenticated;
grant execute on function current_pyramid_step(uuid)  to authenticated;
grant execute on function category_for(smallint, smallint) to authenticated;
grant execute on function category_year(smallint, smallint) to authenticated;

-- ----------------------------------------------------------------------------
-- Total investido — o número mais compartilhável do produto
-- ----------------------------------------------------------------------------

create or replace function total_invested_cents(p_athlete_id uuid)
returns bigint language sql stable security definer set search_path = public as $$
  select coalesce(sum(amount_cents), 0)::bigint
    from expenses
   where athlete_id = p_athlete_id
     and deleted_at is null
     and exists (
       select 1 from guardianships g
        where g.athlete_id = p_athlete_id and g.user_id = auth.uid()
     );
$$;

grant execute on function total_invested_cents(uuid) to authenticated;
