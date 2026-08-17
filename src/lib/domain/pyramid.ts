/**
 * A Pirâmide da Formação — regra de negócio central do produto.
 *
 * O CÁLCULO OFICIAL roda no banco de dados (função `evaluate_pyramid`), lendo
 * a tabela configurável `pyramid_rules`. Este arquivo carrega apenas os tipos
 * e os textos de interface. Nunca duplicar a lógica de decisão aqui: se o
 * cálculo rodasse no navegador, seria burlável pelo usuário.
 */

export type Step = 1 | 2 | 3;

export const STEPS: Record<
  Step,
  { name: string; short: string; meaning: string }
> = {
  1: {
    name: "Iniciação",
    short: "Degrau 1",
    meaning:
      "Seu atleta está aprendendo o jogo. Nesta fase, o que importa é ele gostar de jogar, criar constância e desenvolver coordenação. Resultado não é o objetivo — permanência é.",
  },
  2: {
    name: "Competições Intermediárias",
    short: "Degrau 2",
    meaning:
      "Seu atleta já disputa competições organizadas. Aqui ele aprende a lidar com pressão, rotina de jogos e a conviver com o erro. É o degrau onde a formação começa a exigir organização da família.",
  },
  3: {
    name: "Alto Rendimento",
    short: "Degrau 3",
    meaning:
      "Seu atleta disputa competições de nível estadual e/ou está em clube formador. As decisões agora têm peso de carreira: vínculo, documentação e escola precisam de atenção real.",
  },
};

export type PyramidResult = {
  step: Step;
  reason: string;
  source: "automatic" | "manual";
  evaluatedAt: string;
  note: string | null;
};

/** Requisitos exibidos na tela "o que falta para o próximo degrau". */
export const NEXT_STEP_CHECKLIST: Record<Step, string[]> = {
  1: [
    "Manter frequência regular nos treinos por pelo menos uma temporada",
    "Fazer uma avaliação física inicial",
    "Reunir a documentação básica: certidão de nascimento, CPF e RG",
    "Manter o desempenho escolar em dia — é pré-requisito em clube formador",
    "Buscar um clube ou projeto que dispute competições organizadas",
  ],
  2: [
    "Disputar uma temporada completa em competições intermediárias",
    "Registrar minutos em campo com constância, não apenas participações pontuais",
    "Manter exame médico e atestado dentro da validade",
    "Acompanhar a inscrição federativa e os prazos de janela de transferência",
    "Avaliar clubes com Certificado de Clube Formador na sua região",
  ],
  3: [
    "Manter a regularidade da documentação federativa a cada temporada",
    "Acompanhar de perto vínculo contratual e direitos de formação",
    "Garantir a rotina escolar — obrigação legal do clube formador",
    "Manter registro de minutagem e desempenho por temporada",
    "Cuidar de descanso e prevenção de lesão como parte do plano",
  ],
};

export function stepColor(step: Step): string {
  return step === 3 ? "#FFC72C" : step === 2 ? "#4A5899" : "#1E2761";
}
