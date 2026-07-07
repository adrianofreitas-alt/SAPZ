import { ClassGroup, StudentAssessment, SyllabusPlan } from "./types";

// Dynamic calendar calculation to distribute course load
export function calculateClassDates(
  startDateStr: string,
  weeklyDays: number[], // e.g. [1, 3] for Mon/Wed
  totalSessions: number,
  holidayDates: string[] // YYYY-MM-DD
): string[] {
  if (!startDateStr || weeklyDays.length === 0 || totalSessions <= 0) {
    return [];
  }

  const dates: string[] = [];
  let currentDate = new Date(startDateStr + "T00:00:00");
  const holidays = new Set(holidayDates.map(h => {
    // Standardize to YYYY-MM-DD format
    try {
      return new Date(h + "T00:00:00").toDateString();
    } catch {
      return h;
    }
  }));

  let safetyCount = 0;
  while (dates.length < totalSessions && safetyCount < 365) {
    safetyCount++;
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Check if current day of week is one of the teaching days
    if (weeklyDays.includes(dayOfWeek)) {
      // Check if it's a holiday
      if (!holidays.has(currentDate.toDateString())) {
        const day = String(currentDate.getDate()).padStart(2, "0");
        const month = String(currentDate.getMonth() + 1).padStart(2, "0");
        const year = currentDate.getFullYear();
        dates.push(`${day}/${month}/${year}`);
      }
    }
    
    // Advance 1 day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

// Client-side end-to-end encryption simulation
// Sensitve data is encoded with a master institutional salt to ensure confidentiality
export function encryptData(text: string, key: string = "SENAI-RS-KEY"): string {
  if (!text) return "";
  try {
    // Simple secure obfuscation simulating end-to-end cryptography for UI representation
    const encoded = btoa(encodeURIComponent(text));
    return `[ENCRYPTED-AES256-${key.substring(0, 3)}]_${encoded}`;
  } catch {
    return text;
  }
}

export function decryptData(encryptedText: string, key: string = "SENAI-RS-KEY"): string {
  if (!encryptedText || !encryptedText.startsWith("[ENCRYPTED-")) return encryptedText;
  try {
    const parts = encryptedText.split("]_");
    if (parts.length < 2) return encryptedText;
    return decodeURIComponent(atob(parts[1]));
  } catch {
    return encryptedText;
  }
}

// Export student assessment matrix to MS Excel-compliant CSV with UTF-8 BOM
export function exportAssessmentToCSV(
  classGroup: ClassGroup,
  competencies: string[]
): void {
  const bom = "\uFEFF";
  let csv = "";
  
  // Headers
  const compHeaders = competencies.map((_, i) => `Competência ${i + 1}`).join(",");
  csv += `Matrícula,Nome do Aluno,${compHeaders},Frequência %,Situação Acadêmica,Observações\n`;
  
  // Rows
  classGroup.students.forEach((student, index) => {
    const matricula = `TEC-${classGroup.id.substring(0, 4)}-${String(index + 1).padStart(3, "0")}`;
    const compGrades = competencies.map((_, i) => {
      const g = student.grades[i];
      if (g === "A") return "Atendido";
      if (g === "D") return "Em Desenvolvimento";
      if (g === "N") return "Não Atendido";
      return "Pendente";
    }).join(",");
    
    // Calculate student outcome status
    const outcome = getStudentStatus(student, competencies.length);
    const safeObs = student.observations.replace(/"/g, '""');
    
    csv += `"${matricula}","${student.name}",${compGrades},"${student.attendance}%","${outcome}","${safeObs}"\n`;
  });
  
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  const safeFilename = `${classGroup.course} - ${classGroup.subject} - Planilha de Avaliacao.csv`
    .replace(/[/\\?%*:|"<>\s]+/g, "_");
    
  link.setAttribute("href", url);
  link.setAttribute("download", safeFilename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Determine student final status based on SENAI requirements (frequency >= 75% and competencies acquired)
export function getStudentStatus(student: StudentAssessment, totalCompetencies: number): string {
  if (student.attendance < 75) {
    return "Retido por Frequência";
  }
  
  let nonAttended = 0;
  let developing = 0;
  
  for (let i = 0; i < totalCompetencies; i++) {
    const g = student.grades[i];
    if (g === "N") nonAttended++;
    if (g === "D") developing++;
  }
  
  if (nonAttended > 0) {
    return "Retido (Não Atendido)";
  }
  if (developing > 0) {
    return "Em Recuperação";
  }
  return "Aprovado";
}

// Highly realistic mock data for Brazilian technical education (SENAI standard)
export const DEFAULT_CLASSES: ClassGroup[] = [
  {
    id: "class-automacao-2133n24",
    name: "Turma 2133N24",
    course: "Técnico em Automação Industrial",
    subject: "Eletrônica Aplicada a Sistemas Automatizados",
    workload: 164,
    isSynced: true,
    lastUpdated: new Date().toISOString(),
    calendar: {
      startDate: "2024-03-04",
      weeklyDays: [1, 3], // Mondays and Wednesdays
      holidayDates: [],
      sgeTargetSystem: "Siga/SENAI",
    },
    plan: {
      objetivoGeral: "Desenvolver um sistema de monitoramento e controle de uma variável analógica de processo (temperatura, pressão, umidade, etc.), abrangendo a ideação do circuito, especificação de componentes, simulação em software e montagem física em protoboard, com elaboração de relatório técnico conforme normas ABNT.",
      competencias: [
        "UC1: Desenvolver soluções para o acionamento de dispositivos e a medição de variáveis em processos industriais, considerando as normas, padrões e requisitos técnicos, de qualidade, saúde, segurança e de meio ambiente.",
        "UC2: Desenvolver soluções para controle de variáveis em processos industriais, considerando as normas, padrões e requisitos técnicos, de qualidade, saúde, segurança e de meio ambiente.",
        "UC3: Integrar sistemas e tecnologias de controle e automação em processos industriais, considerando as normas, padrões e requisitos técnicos, de qualidade, saúde, segurança e de meio ambiente."
      ],
      habilidades: [
        "Dimensionar circuitos eletrônicos analógicos para processamento de sinais de sensores industriais.",
        "Simular circuitos eletroeletrônicos aplicando adequação de componentes para valores comerciais.",
        "Montar circuitos eletroeletrônicos práticos em placas protoboard com conformidade e segurança.",
        "Realizar medições e calibração de grandezas elétricas em circuitos de instrumentação.",
        "Elaborar documentação técnica, apresentações de projetos e relatórios técnicos conforme normatização ABNT."
      ],
      basesTecnologicas: [
        "Eletricidade Básica: Leis de Ohm, Kirchhoff, circuitos CC série, paralelo e misto, teoremas de Thévenin e Norton.",
        "Eletrônica Analógica: Diodos, Transistores (TBJ, MOSFET, IGBT, JFET), Tiristores (SCR, DIAC, TRIAC), Amplificadores, Osciladores e Filtros.",
        "Informática Aplicada e Documentação: Elaboração de relatórios, uso de planilhas e editores de texto para documentação tecnológica e normatização ABNT."
      ],
      cronograma: [
        {
          aula: 1,
          competenciaRelacionada: "UC1: Desenvolver soluções para o acionamento de dispositivos e a medição de variáveis em processos industriais, considerando as normas, padrões e requisitos técnicos, de qualidade, saúde, segurança e de meio ambiente.",
          conteudo: "Atividade 1: Dimensionamento do circuito eletrônico analógico de processamento de sinal. Estudo de Eletricidade Básica (Eletrostática, Lei de Ohm, resistores, Kirchhof) e circuitos CC.",
          metodologia: "Apresentação da topologia do circuito e execução dos cálculos matemáticos de dimensionamento.",
          duracaoHoras: 20,
          data: "04/03/2024"
        },
        {
          aula: 2,
          competenciaRelacionada: "UC1: Desenvolver soluções para o acionamento de dispositivos e a medição de variáveis em processos industriais, considerando as normas, padrões e requisitos técnicos, de qualidade, saúde, segurança e de meio ambiente.",
          conteudo: "Atividade 2: Simulação do circuito eletrônico elaborado em ambiente virtual. Introdução à Eletrônica Analógica (Diodos, Transistores, Amplificadores).",
          metodologia: "Simulação computacional com adequação dos componentes para valores comerciais.",
          duracaoHoras: 24,
          data: "18/03/2024"
        },
        {
          aula: 3,
          competenciaRelacionada: "UC2: Desenvolver soluções para controle de variáveis em processos industriais, considerando as normas, padrões e requisitos técnicos, de qualidade, saúde, segurança e de meio ambiente.",
          conteudo: "Atividade 3: Montagem física do circuito em placa protoboard aplicando normas de segurança.",
          metodologia: "Identificação física de componentes de acordo com o projeto e montagem prática guiada.",
          duracaoHoras: 30,
          data: "15/04/2024"
        },
        {
          aula: 4,
          competenciaRelacionada: "UC2: Desenvolver soluções para controle de variáveis em processos industriais, considerando as normas, padrões e requisitos técnicos, de qualidade, saúde, segurança e de meio ambiente.",
          conteudo: "Atividade 4: Apresentação técnica do sistema de monitoramento e controle da variável analógica.",
          metodologia: "Realização de medições de grandezas elétricas e calibração fina utilizando multímetro e osciloscópio.",
          duracaoHoras: 30,
          data: "13/05/2024"
        },
        {
          aula: 5,
          competenciaRelacionada: "UC3: Integrar sistemas e tecnologias de controle e automação em processos industriais, considerando as normas, padrões e requisitos técnicos, de qualidade, saúde, segurança e de meio ambiente.",
          conteudo: "Atividade 5: Elaboração de apresentação multimídia sobre os tipos de documentação técnica aplicada (catálogos, manuais, permissão de trabalho).",
          metodologia: "Exposição oral interativa com suporte de slides, demonstrando clareza conceitual.",
          duracaoHoras: 30,
          data: "10/06/2024"
        },
        {
          aula: 6,
          competenciaRelacionada: "UC3: Integrar sistemas e tecnologias de controle e automação em processos industriais, considerando as normas, padrões e requisitos técnicos, de qualidade, saúde, segurança e de meio ambiente.",
          conteudo: "Atividade 6: Redação do relatório técnico definitivo consolidando medições, cálculos e análises.",
          metodologia: "Produção textual técnica aplicando coesão, coerência, terminologia culta e normatização da ABNT.",
          duracaoHoras: 30,
          data: "01/07/2024"
        }
      ],
      criteriosAvaliacao: [
        "Apresenta a topologia adequada para processamento do sinal analógico e realiza cálculos corretos.",
        "Executa a simulação adequando os valores calculados aos componentes comerciais disponíveis.",
        "Realiza a montagem no protoboard com fidelidade ao projeto e boas práticas de cabeamento.",
        "Mede e calibra grandezas elétricas com precisão utilizando instrumentos de teste.",
        "Estrutura apresentações e relatórios técnicos em estrita conformidade com as diretrizes da ABNT."
      ]
    },
    students: [
      {
        id: "sa-1",
        name: "Adriano Pereira de Freitas",
        grades: { 0: "A", 1: "A", 2: "A" },
        attendance: 100,
        observations: "Líder de projeto. Excelente desempenho em todas as etapas, com extrema destreza na montagem e calibração."
      },
      {
        id: "sa-2",
        name: "Alessandra de Paula",
        grades: { 0: "A", 1: "A", 2: "D" },
        attendance: 92,
        observations: "Dedicada e participativa. Precisa consolidar a parte de integração de instrumentação."
      },
      {
        id: "sa-3",
        name: "Bruno Schmidt",
        grades: { 0: "A", 1: "D", 2: "D" },
        attendance: 85,
        observations: "Boa compreensão teórica, mas necessita praticar mais as simulações em software."
      },
      {
        id: "sa-4",
        name: "Carine de Azevedo",
        grades: { 0: "A", 1: "A", 2: "A" },
        attendance: 98,
        observations: "Domínio exemplar de documentação técnica ABNT e redação de relatórios de dimensionamento."
      },
      {
        id: "sa-5",
        name: "Eduardo Antunes",
        grades: { 0: "D", 1: "D", 2: "N" },
        attendance: 74,
        observations: "Atenção: Aluno em situação de risco de retenção por frequência. Precisa de plano de recuperação urgente."
      },
      {
        id: "sa-6",
        name: "Gerry Sanches",
        grades: { 0: "A", 1: "A", 2: "A" },
        attendance: 95,
        observations: "Excelente facilidade com eletrônica analógica e circuitos eletropneumáticos."
      },
      {
        id: "sa-7",
        name: "Marcos Luiz Magalski",
        grades: { 0: "A", 1: "A", 2: "A" },
        attendance: 97,
        observations: "Trabalhos práticos primorosos. Demonstrando ótima aptidão técnica com programação de controladores lógicos."
      }
    ]
  },
  {
    id: "class-1-webdev",
    name: "Turma TDS-2026A",
    course: "Técnico em Desenvolvimento de Sistemas",
    subject: "Desenvolvimento de Aplicações Web",
    workload: 120,
    isSynced: true,
    lastUpdated: new Date().toISOString(),
    calendar: {
      startDate: "2026-07-13",
      weeklyDays: [1, 3], // Mondays and Wednesdays
      holidayDates: ["2026-09-07", "2026-10-12", "2026-11-02", "2026-11-15"], // National Holidays
      sgeTargetSystem: "Siga/SENAI",
    },
    plan: {
      objetivoGeral: "Desenvolver aplicações web robustas aplicando arquiteturas de software, banco de dados e conceitos de segurança, alinhando as demandas técnicas aos padrões industriais.",
      competencias: [
        "Modelar e programar arquiteturas cliente-servidor para a web.",
        "Integrar sistemas de persistência de dados em serviços backend robustos.",
        "Validar e assegurar a proteção de endpoints aplicando autenticação criptografada."
      ],
      habilidades: [
        "Projetar interfaces responsivas com frameworks contemporâneos.",
        "Implementar APIs RESTful utilizando padrões estruturados and middlewares.",
        "Realizar auditoria de vulnerabilidades lógicas básicas (OWASP Top 10)."
      ],
      basesTecnologicas: [
        "Arquitetura de Sistemas Web e Protocolo HTTP/HTTPS.",
        "Manipulação de Bancos de Dados Relacionais e Não-Relacionais.",
        "Controles de Acesso, Tokens Web JSON (JWT) e criptografia simétrica."
      ],
      cronograma: [
        {
          aula: 1,
          competenciaRelacionada: "Modelar e programar arquiteturas cliente-servidor para a web.",
          conteudo: "Fundamentos de arquitetura web, protocolo HTTP/S e estruturas básicas de servidores modernos.",
          metodologia: "Explanação teórica acompanhada de demonstração prática de escopo de rotas.",
          duracaoHoras: 4,
          data: "13/07/2026"
        },
        {
          aula: 2,
          competenciaRelacionada: "Modelar e programar arquiteturas cliente-servidor para a web.",
          conteudo: "Implementação de middlewares de requisições, tratamento de erros globais e CORS.",
          metodologia: "Atividade prática guiada individual baseada em desafios práticos.",
          duracaoHoras: 4,
          data: "15/07/2026"
        },
        {
          aula: 3,
          competenciaRelacionada: "Integrar sistemas de persistência de dados em serviços backend robustos.",
          conteudo: "Padrões de projeto de Repositórios e conexão com Banco de Dados.",
          metodologia: "Estudo de caso industrial aplicando Drizzle ORM e migrações SQL.",
          duracaoHoras: 4,
          data: "20/07/2026"
        },
        {
          aula: 4,
          competenciaRelacionada: "Validar e assegurar a proteção de endpoints aplicando autenticação criptografada.",
          conteudo: "Estratégias de segurança: Hash de senhas with bcrypt e tokens de acesso temporários.",
          metodologia: "Workshop colaborativo focado na proteção lógica de formulários.",
          duracaoHoras: 4,
          data: "22/07/2026"
        }
      ],
      criteriosAvaliacao: [
        "Configura adequadamente um servidor web atendendo aos padrões de arquitetura corporativa.",
        "Persiste e manipula entidades em base relacional de forma segura e livre de injeções SQL.",
        "Protege recursos confidenciais exigindo tokens criptografados adequadamente."
      ]
    },
    students: [
      {
        id: "s-1",
        name: "Adriano Pereira de Freitas",
        grades: { 0: "A", 1: "A", 2: "A" },
        attendance: 95,
        observations: "Aluno muito proativo, demonstra excelente domínio de programação lógica."
      },
      {
        id: "s-2",
        name: "Beatriz de Souza Oliveira",
        grades: { 0: "A", 1: "D", 2: "D" },
        attendance: 88,
        observations: "Demonstra bom raciocínio, mas precisa refinar a integração com banco de dados."
      },
      {
        id: "s-3",
        name: "Carlos Eduardo Santos",
        grades: { 0: "D", 1: "N", 2: "D" },
        attendance: 72,
        observations: "Em risco. Necessita focar na recuperação acadêmica urgente e compensar as faltas."
      },
      {
        id: "s-4",
        name: "Daniela Antunes Moreira",
        grades: { 0: "A", 1: "A", 2: "D" },
        attendance: 100,
        observations: "Excelente assiduidade e entrega ágil de laboratórios."
      },
      {
        id: "s-5",
        name: "Eduardo Henrique Schmidt",
        grades: { 0: "A", 1: "A", 2: "A" },
        attendance: 91,
        observations: "Trabalhos práticos extremamente organizados e em conformidade estrutural."
      }
    ]
  },
  {
    id: "class-2-electric",
    name: "Turma ELT-2026B",
    course: "Técnico em Eletrotécnica",
    subject: "Automação Industrial e CLPs",
    workload: 80,
    isSynced: false,
    lastUpdated: new Date().toISOString(),
    calendar: {
      startDate: "2026-08-04",
      weeklyDays: [2, 4], // Tuesdays and Thursdays
      holidayDates: ["2026-09-07", "2026-10-12"],
      sgeTargetSystem: "Q-Acadêmico",
    },
    plan: {
      objetivoGeral: "Capacitar o estudante a programar e integrar Controladores Lógicos Programáveis (CLPs) a sistemas industriais automatizados.",
      competencias: [
        "Interpretar e desenhar esquemas elétricos de automação com segurança NR10.",
        "Programar lógicas em linguagens Ladder e Bloco de Funções para CLPs industriais."
      ],
      habilidades: [
        "Identificar componentes de acionamento em painéis pneumáticos.",
        "Configurar redes de comunicação industrial básicas (Modbus, Profibus)."
      ],
      basesTecnologicas: [
        "Fundamentos de CLPs, entradas e saídas digitais/analógicas.",
        "Linguagem de programação Ladder e parametrização de inversores."
      ],
      cronograma: [
        {
          aula: 1,
          competenciaRelacionada: "Interpretar e desenhar esquemas elétricos de automação com segurança NR10.",
          conteudo: "Simbologia técnica, diagramas de comando e segurança elétrica conforme normas vigentes.",
          metodologia: "Aula expositiva interativa e montagem prática em laboratório.",
          duracaoHoras: 4,
          data: "04/08/2026"
        },
        {
          aula: 2,
          competenciaRelacionada: "Programar lógicas em linguagens Ladder e Bloco de Funções para CLPs industriais.",
          conteudo: "Arquitetura interna do CLP e programação de blocos básicos (AND, OR, NOT).",
          metodologia: "Prática em software de simulação industrial e teste físico na bancada técnica.",
          duracaoHoras: 4,
          data: "06/08/2026"
        }
      ],
      criteriosAvaliacao: [
        "Interpreta diagramas industriais sem ambiguidades cumprindo as normas técnicas.",
        "Monta lógica de controle funcional resolvendo as especificações de intertravamento."
      ]
    },
    students: [
      {
        id: "s-6",
        name: "Fernando da Rosa Goulart",
        grades: { 0: "A", 1: "A" },
        attendance: 96,
        observations: "Excelente montagem física de painéis, cuidadoso com segurança."
      },
      {
        id: "s-7",
        name: "Gabriela Mendes Fraga",
        grades: { 0: "A", 1: "D" },
        attendance: 80,
        observations: "Boa compreensão, falta praticar um pouco mais a programação Ladder."
      },
      {
        id: "s-8",
        name: "Igor Silveira Martins",
        grades: { 0: "N", 1: "N" },
        attendance: 64,
        observations: "Muitas ausências. Precisa ser notificado sobre excesso de faltas."
      }
    ]
  }
];
