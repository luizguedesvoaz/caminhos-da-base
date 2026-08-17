# Caminhos da Base

App de gestão de carreira para jovens atletas de futebol (6 a 20 anos) e suas famílias, construído sobre a metodologia da **Pirâmide da Formação**.

**Onda 1 entregue:** projeto, banco com RLS, engine da pirâmide, autenticação por convite e onboarding com revelação do degrau.

---

## Stack

- **Next.js 16** (App Router, TypeScript) + **Tailwind CSS 4**
- **Supabase** — Postgres, Auth, Storage, Row Level Security
- **Vercel** — deploy contínuo
- PWA instalável, mobile-first

---

## Como colocar no ar

### 1. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) (plano gratuito atende as 200 famílias previstas).
2. No **SQL Editor**, rode os arquivos **nesta ordem**:
   - `supabase/migrations/0001_schema.sql`
   - `supabase/migrations/0002_pyramid_engine.sql`
   - `supabase/seed.sql`
3. Em **Authentication → Providers**, mantenha *Email* habilitado.
   Para testar sem caixa de entrada, desligue *Confirm email* em **Authentication → Sign In / Providers**.
4. Em **Project Settings → API**, copie a **Project URL** e a chave **anon public**.

### 2. Rodar local

```bash
npm install
cp .env.example .env.local   # preencha com a URL e a chave anônima
npm run dev
```

Abra `http://localhost:3000` e cadastre-se com um dos códigos do seed: `BASE-2026-001`.

### 3. Vercel

1. Suba o repositório no GitHub.
2. Em [vercel.com](https://vercel.com), importe o repositório.
3. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.

### 4. Virar consultor

Cadastre-se pelo app e rode no SQL Editor, trocando o e-mail:

```sql
update profiles set role = 'consultor'
 where id = (select id from auth.users where email = 'seu@email.com');
```

---

## Decisões de arquitetura que não devem ser revertidas

**Categoria é calculada pelo ANO DE NASCIMENTO, nunca pela idade.**
Um atleta nascido em 2013 joga o sub-13 durante toda a temporada 2026, mesmo completando 14 anos em março. Calcular por idade erra **23% dos casos** — especificamente todo atleta cujo aniversário ainda não ocorreu na temporada, que é jogado uma categoria inteira para baixo. Ver `src/lib/domain/category.ts`.

**A engine da pirâmide roda no banco, não no navegador.**
Se rodasse no cliente seria burlável. Ver `supabase/migrations/0002_pyramid_engine.sql`. As regras vivem na tabela `pyramid_rules` e são editáveis pelo consultor sem deploy.

**Dinheiro em centavos, tipo inteiro.**
`1999` = R$ 19,99. Ponto flutuante em dinheiro produz divergência de centavos justamente no número mais importante do produto — o total investido.

**RLS habilitado em todas as tabelas.**
O produto trata dados de menores de idade. A separação entre famílias acontece no banco, não no código da aplicação — um bug de frontend não consegue vazar dados de outro atleta.

**O atleta adolescente não vê o módulo financeiro.**
Política deliberada em `expenses`: só responsáveis e consultor.

**Sem ranking entre atletas.**
A gamificação premia processo (constância, escola, descanso, documentação), nunca desempenho comparado. Comparação pública entre crianças em futebol de base é risco reputacional direto.

---

## Estrutura

```
src/
  app/
    page.tsx                    landing
    entrar/                     login
    cadastro/                   cadastro com código de convite + aceite LGPD
    onboarding/                 3 passos + revelação do degrau
    inicio/                     dashboard
  components/
    Pyramid.tsx                 a pirâmide de 3 níveis
    ui.tsx                      botões, campos, cards
  lib/
    config.ts                   marca centralizada (troca barata de nome)
    domain/category.ts          regra de categoria e ano na categoria
    domain/pyramid.ts           tipos e textos dos degraus
    supabase/                   clientes browser e server
  proxy.ts                      sessão e proteção de rotas
supabase/
  migrations/0001_schema.sql    tabelas, tipos, RLS
  migrations/0002_pyramid_engine.sql   engine, convites, categoria
  seed.sql                      competições, regras, recompensas, convites
```

---

## Próximas ondas

| Onda | Conteúdo |
|---|---|
| 2 | Tarefas com recorrência, módulo financeiro, dashboard completo |
| 3 | Temporada, jogos com vídeo, documentos, alertas, vínculo federativo |
| 4 | Gamificação, moedas, recompensas, indicação |
| 5 | Painel do consultor e editor de regras da pirâmide |

---

## Onda 2 — tarefas, financeiro e dashboard

**Novas telas:** Tarefas, Financeiro e Perfil, com barra de navegação inferior.

**Tarefas.** Seis categorias fixas com cor e ícone, agrupadas por dia, conclusão
em um toque. Recorrência semanal gera as ocorrências das próximas 8 semanas como
linhas reais no banco — cada dia vira uma tarefa independente, o que mantém
consulta e conclusão simples. Quando não há nenhuma tarefa, o app sugere uma
checklist inicial baseada no degrau do atleta.

**Financeiro.** Total investido como número-herói, gráfico por categoria, evolução
mensal e lançamento em poucos toques. O campo de valor aceita `150`, `150,50`,
`1.250,90` e `R$ 89,90`; entradas ambíguas são recusadas em vez de adivinhadas.

**Cores das categorias.** Vêm da paleta categórica validada para daltonismo
(protanopia e deuteranopia, ΔE mínimo 9.1). A cor nunca identifica sozinha —
sempre acompanha rótulo em texto.

**Gráficos.** Matiz única, não uma cor por categoria: as categorias são nominais
e a identidade já vem do rótulo, então colorir cada barra gastaria o canal de cor
recodificando o que o comprimento já mostra. Valores rotulados diretamente, já que
celular não tem hover.

**Mensagens de erro.** O motivo real do banco agora chega à tela, traduzido quando
possível. Na onda 1, um "Não foi possível salvar" genérico escondeu um bug de RLS
e custou uma investigação inteira.

---

## Onda 3 — temporada, documentos e vínculo federativo

**Antes de subir o código, rode `supabase/migrations/0004_storage_documentos.sql`**
no SQL Editor. Ele cria o espaço de armazenamento dos documentos e suas políticas.

**Temporada.** Registro de jogos com minutos, gols, assistências e link de vídeo.
Links do YouTube (incluindo `youtu.be` e Shorts) tocam dentro do app, em modo
sem cookies. Seletor de temporada dá acesso aos anos anteriores.

**Minutagem é o número-título**, acima de gols. Olheiro de base avalia minutos em
campo e constância; pai olha gol. A hierarquia visual da tela ensina isso.

**Documentos.** Anexo de foto ou PDF (até 10 MB), data de validade e aviso 30 dias
antes. O bucket é privado: os arquivos ficam em pastas com o id do atleta, e a
política do Storage reusa `can_access_athlete` — a mesma regra do resto do app.
A visualização usa link assinado com validade de 10 minutos, nunca URL pública.

**Vínculo federativo.** Registro da inscrição e da janela de transferência, com
alerta quando o prazo se aproxima. É a dor invisível da base: a inscrição prende
o atleta ao clube durante a temporada, e a maioria das famílias descobre isso
tarde demais.

**Alertas no dashboard.** Tarefas atrasadas, documentos vencidos ou vencendo, e
janela de transferência fechando — em ordem de urgência, sempre com ícone e texto,
nunca só com cor.
