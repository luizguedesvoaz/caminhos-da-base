-- ============================================================================
-- Caminhos da Base — Dados iniciais
-- ============================================================================
-- Rodar UMA vez, depois das migrations, no SQL Editor do Supabase.
-- As competições abaixo são o catálogo inicial de São Paulo. O consultor
-- edita e amplia pelo painel admin, sem deploy.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Competições — step_level define qual degrau a disputa comprova
-- ---------------------------------------------------------------------------

insert into competitions (name, state, step_level) values
  -- Degrau 2: competições intermediárias
  ('Paulista Cup',                'SP', 2),
  ('Copa Buh',                    'SP', 2),
  ('União Cup',                   'SP', 2),
  ('Interior Cup',                'SP', 2),
  ('Copa Ouro',                   'SP', 2),
  ('Copa São Paulo de Base',      'SP', 2),
  ('Taça Cidade',                 'SP', 2),
  -- Degrau 3: alto rendimento
  ('Campeonato Paulista Sub-11',  'SP', 3),
  ('Campeonato Paulista Sub-13',  'SP', 3),
  ('Campeonato Paulista Sub-15',  'SP', 3),
  ('Campeonato Paulista Sub-17',  'SP', 3),
  ('Campeonato Paulista Sub-20',  'SP', 3),
  ('Copa do Brasil Sub-17',       null, 3),
  ('Copa São Paulo de Futebol Júnior', 'SP', 3)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Regras da pirâmide — configuráveis pelo consultor, sem deploy
-- ---------------------------------------------------------------------------

insert into pyramid_rules (step, state, criteria, label) values
  (1, null,
   '{"requires_enrollment": true, "requires_competition_level": 0}'::jsonb,
   'Iniciação — matriculado em escolinha ou projeto social, sem competições regulares'),
  (2, null,
   '{"requires_competition_level": 2}'::jsonb,
   'Competições Intermediárias — disputa competições regionais organizadas'),
  (3, null,
   '{"requires_competition_level": 3, "requires_formador_club": true, "match": "any"}'::jsonb,
   'Alto Rendimento — disputa estadual de base e/ou clube com Certificado de Clube Formador')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Recompensas — moeda NÃO é comprável com dinheiro real (decisão registrada
-- na especificação: evita caracterizar crédito pré-pago).
-- ---------------------------------------------------------------------------

insert into rewards (title, description, cost_coins, kind, monthly_limit) values
  ('Cupom de desconto em material esportivo',
   'Desconto em loja parceira para chuteira, meião e equipamento de treino.',
   500, 'cupom_parceiro', null),
  ('Desconto na mensalidade do app',
   'Abate parte da assinatura do mês seguinte.',
   800, 'desconto_assinatura', null),
  ('Avaliação de carreira com o consultor',
   'Sessão individual de análise do momento do atleta.',
   2000, 'sessao_consultoria', 4)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Códigos de convite iniciais
-- ---------------------------------------------------------------------------
-- Cadastro é fechado: só cria conta quem tem código. Gere mais pelo painel.

insert into invite_codes (code, note) values
  ('BASE-2026-001', 'lote inicial'),
  ('BASE-2026-002', 'lote inicial'),
  ('BASE-2026-003', 'lote inicial'),
  ('BASE-2026-004', 'lote inicial'),
  ('BASE-2026-005', 'lote inicial'),
  ('BASE-2026-006', 'lote inicial'),
  ('BASE-2026-007', 'lote inicial'),
  ('BASE-2026-008', 'lote inicial'),
  ('BASE-2026-009', 'lote inicial'),
  ('BASE-2026-010', 'lote inicial')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Para se tornar consultor: cadastre-se pelo app e rode, trocando o e-mail:
--
--   update profiles set role = 'consultor'
--    where id = (select id from auth.users where email = 'seu@email.com');
-- ---------------------------------------------------------------------------
