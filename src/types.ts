export interface SyllabusPlan {
  objetivoGeral: string;
  competencias: string[];
  habilidades: string[];
  basesTecnologicas: string[];
  cronograma: Array<{
    aula: number;
    competenciaRelacionada: string;
    conteudo: string;
    metodologia: string;
    duracaoHoras: number;
    data?: string; // Calculated dynamically based on academic calendar
  }>;
  criteriosAvaliacao: string[];
}

export type CompetencyGrade = "A" | "D" | "N" | ""; // Atendido, Desenvolvendo, Não Atendido, Sem Nota

export interface StudentAssessment {
  id: string;
  name: string;
  grades: { [competencyIndex: number]: CompetencyGrade }; // Index maps to competencies array
  attendance: number; // 0-100%
  observations: string;
}

export interface AcademicCalendarConfig {
  startDate: string;
  weeklyDays: number[]; // 0 for Sunday, 1 for Monday, etc.
  holidayDates: string[]; // List of YYYY-MM-DD
  sgeTargetSystem: string; // "Siga/SENAI", "Q-Acadêmico", "Google Classroom", "SGE Institucional"
}

export interface ClassGroup {
  id: string;
  name: string; // e.g. "Turma A - 2026/2"
  course: string; // e.g. "Técnico em Informática"
  subject: string; // e.g. "Desenvolvimento Web II"
  workload: number; // e.g. 80
  plan: SyllabusPlan | null;
  students: StudentAssessment[];
  calendar: AcademicCalendarConfig;
  isSynced: boolean;
  lastUpdated: string;
}

export interface LocalSyncQueue {
  action: "create" | "update" | "delete";
  classId: string;
  timestamp: string;
}
