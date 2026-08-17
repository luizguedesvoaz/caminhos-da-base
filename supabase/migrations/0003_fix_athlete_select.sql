-- ============================================================================
-- Correção: quem cria o atleta precisa poder vê-lo imediatamente
-- ============================================================================
-- BUG: a política de SELECT em `athletes` dependia apenas de can_access_athlete(),
-- que exige um vínculo em `guardianships`. No cadastro, o vínculo só é criado
-- DEPOIS do atleta. Resultado: o INSERT ... RETURNING era barrado pela política
-- de leitura e o app recebia erro, mesmo com o atleta tendo sido gravado.
--
-- CORREÇÃO: o criador do registro sempre enxerga o atleta que criou.
-- Isso não afrouxa a separação entre famílias — created_by é sempre o próprio
-- usuário autenticado, garantido pela política de INSERT.
-- ============================================================================

drop policy if exists athletes_select on athletes;

create policy athletes_select on athletes for select using (
  created_by = auth.uid()
  or can_access_athlete(auth.uid(), id)
);

-- Mesma correção na atualização, pelo mesmo motivo.
drop policy if exists athletes_update on athletes;

create policy athletes_update on athletes for update using (
  created_by = auth.uid()
  or can_access_athlete(auth.uid(), id)
);
