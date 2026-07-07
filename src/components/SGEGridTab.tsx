import React, { useState } from "react";
import { ClassGroup, StudentAssessment, SyllabusPlan, CompetencyGrade } from "../types";
import { 
  Download, FileSpreadsheet, Upload, UserPlus, Trash2, 
  Check, Lock, Unlock, HelpCircle, Sparkles, AlertTriangle, Loader2 
} from "lucide-react";
import { exportAssessmentToCSV, getStudentStatus } from "../utils";

interface SGEGridTabProps {
  activeClass: ClassGroup;
  onUpdateStudents: (updatedStudents: StudentAssessment[]) => void;
  isOnline: boolean;
}

export default function SGEGridTab({ activeClass, onUpdateStudents, isOnline }: SGEGridTabProps) {
  const [rawText, setRawText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [extractSuccess, setExtractSuccess] = useState("");
  const [showAIModal, setShowAIModal] = useState(false);

  const plan = activeClass.plan;
  const competencies = plan?.competencias || [
    "Competência 1 (Não definida)", 
    "Competência 2 (Não definida)"
  ];
  
  const students = activeClass.students || [];

  // Handle individual cell grading update
  const handleGradeChange = (studentId: string, competencyIndex: number, value: CompetencyGrade) => {
    const updated = students.map((s) => {
      if (s.id === studentId) {
        return {
          ...s,
          grades: {
            ...s.grades,
            [competencyIndex]: value,
          },
        };
      }
      return s;
    });
    onUpdateStudents(updated);
  };

  // Handle attendance change
  const handleAttendanceChange = (studentId: string, value: number) => {
    // clamp between 0 and 100
    const clamped = Math.max(0, Math.min(100, isNaN(value) ? 0 : value));
    const updated = students.map((s) => {
      if (s.id === studentId) {
        return { ...s, attendance: clamped };
      }
      return s;
    });
    onUpdateStudents(updated);
  };

  // Handle name update
  const handleNameChange = (studentId: string, value: string) => {
    const updated = students.map((s) => {
      if (s.id === studentId) {
        return { ...s, name: value };
      }
      return s;
    });
    onUpdateStudents(updated);
  };

  // Handle observations update
  const handleObservationChange = (studentId: string, value: string) => {
    const updated = students.map((s) => {
      if (s.id === studentId) {
        return { ...s, observations: value };
      }
      return s;
    });
    onUpdateStudents(updated);
  };

  // Add empty student
  const handleAddStudent = () => {
    const newStudent: StudentAssessment = {
      id: "student-" + Date.now(),
      name: "Novo Aluno Técnico",
      grades: {},
      attendance: 100,
      observations: "",
    };
    onUpdateStudents([...students, newStudent]);
  };

  // Delete student
  const handleDeleteStudent = (studentId: string) => {
    if (confirm("Deseja realmente remover este estudante?")) {
      onUpdateStudents(students.filter((s) => s.id !== studentId));
    }
  };

  // Parse list with AI
  const handleAIExtract = async () => {
    if (!rawText.trim()) {
      setExtractError("Por favor, cole o texto com os nomes no campo abaixo.");
      return;
    }
    if (!isOnline) {
      setExtractError("Você precisa estar online para usar a extração inteligente.");
      return;
    }

    setIsExtracting(true);
    setExtractError("");
    setExtractSuccess("");

    try {
      const response = await fetch("/api/extract-students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": localStorage.getItem("SIGA_SYLLABUS_TEMPORARY_GEMINI_KEY") || "",
        },
        body: JSON.stringify({
          rawText,
          fileName: "documento_pasted.txt",
        }),
      });

      if (!response.ok) {
        throw new Error("Erro do servidor de IA ao extrair alunos.");
      }

      const data = await response.json();
      if (data.students && data.students.length > 0) {
        const extracted: StudentAssessment[] = data.students.map((st: { name: string }, idx: number) => ({
          id: `s-extracted-${Date.now()}-${idx}`,
          name: st.name,
          grades: {},
          attendance: 100,
          observations: "",
        }));

        // Replace or append? Ask user or do a clean reload
        onUpdateStudents(extracted);
        setExtractSuccess(`Extraídos ${extracted.length} alunos com sucesso! A planilha foi atualizada.`);
        setRawText("");
        setTimeout(() => {
          setShowAIModal(false);
          setExtractSuccess("");
        }, 2500);
      } else {
        setExtractError("Nenhum nome de estudante foi isolado no texto. Revise a formatação.");
      }
    } catch (err: any) {
      setExtractError(err.message || "Erro desconhecido na extração de texto.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleExportCSV = () => {
    exportAssessmentToCSV(activeClass, competencies);
  };

  return (
    <div className="space-y-6">
      
      {/* Excel template and AI uploader quick action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-white border border-slate-200 rounded-2xl p-5 shadow-xs gap-4 no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="p-1 bg-emerald-50 text-emerald-700 rounded-lg">
              <FileSpreadsheet className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-slate-800 text-sm">
              Diário de Competências & Avaliações
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Gerencie o desempenho individual das competências técnicas. Exportável no formato Excel (.csv).
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setShowAIModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Extrair Alunos de Diário (Documento)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-md shadow-emerald-950/10"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Planilha Editável (.csv)</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet Matrix Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase">
                <th className="py-3 px-4 w-12 text-center">🔐</th>
                <th className="py-3 px-4 w-36">Matrícula</th>
                <th className="py-3 px-4 min-w-56">Nome Completo do Aluno</th>
                
                {/* Competency Headers */}
                {competencies.map((comp, idx) => (
                  <th 
                    key={idx} 
                    className="py-3 px-4 w-40 text-center border-l border-slate-200"
                    title={comp}
                  >
                    C{idx + 1}
                    <span className="block text-[8px] font-normal lowercase truncate text-slate-400 max-w-28 mx-auto mt-0.5">
                      {comp}
                    </span>
                  </th>
                ))}
                
                <th className="py-3 px-4 w-28 text-center border-l border-slate-200">Freq. %</th>
                <th className="py-3 px-4 w-40 text-center border-l border-slate-200">Situação Final</th>
                <th className="py-3 px-4 min-w-44 border-l border-slate-200">Observações Didáticas</th>
                <th className="py-3 px-4 w-12 text-center border-l border-slate-200 no-print">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {students.length > 0 ? (
                students.map((student, sIdx) => {
                  const outcome = getStudentStatus(student, competencies.length);
                  let badgeClass = "bg-slate-100 text-slate-700";
                  if (outcome === "Aprovado") badgeClass = "bg-emerald-50 text-emerald-700 border border-emerald-100";
                  if (outcome === "Em Recuperação") badgeClass = "bg-amber-50 text-amber-700 border border-amber-100";
                  if (outcome.startsWith("Retido")) badgeClass = "bg-red-50 text-red-700 border border-red-100 animate-pulse";

                  const matricula = `TEC-${activeClass.id.substring(0, 3)}-${String(sIdx + 1).padStart(3, "0")}`.toUpperCase();

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/40 transition-colors">
                      {/* E2E Crypted Icon */}
                      <td className="py-2.5 px-4 text-center">
                        <Lock className="w-3.5 h-3.5 text-slate-300" title="Dados protegidos com criptografia simétrica ponta a ponta na nuvem" />
                      </td>
                      
                      {/* Registration code */}
                      <td className="py-2.5 px-4 font-mono font-semibold text-slate-400 text-[11px]">
                        {matricula}
                      </td>

                      {/* Student Name (Editable) */}
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          value={student.name}
                          onChange={(e) => handleNameChange(student.id, e.target.value)}
                          className="w-full bg-transparent font-medium text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-red-500 focus:outline-hidden py-1 px-1.5 rounded"
                        />
                      </td>

                      {/* Competencies Dropdowns */}
                      {competencies.map((_, cIdx) => {
                        const grade = student.grades[cIdx] || "";
                        let colorClass = "bg-slate-50 text-slate-400 border-slate-200";
                        if (grade === "A") colorClass = "bg-emerald-500 text-white border-transparent font-bold";
                        if (grade === "D") colorClass = "bg-amber-400 text-slate-900 border-transparent font-bold";
                        if (grade === "N") colorClass = "bg-red-500 text-white border-transparent font-bold";

                        return (
                          <td key={cIdx} className="py-2.5 px-4 border-l border-slate-100 text-center">
                            <select
                              value={grade}
                              onChange={(e) => handleGradeChange(student.id, cIdx, e.target.value as CompetencyGrade)}
                              className={`text-center font-mono text-[11px] rounded-lg px-2.5 py-1 focus:outline-hidden shadow-2xs border ${colorClass} cursor-pointer w-full max-w-[90px] mx-auto appearance-none`}
                            >
                              <option value="" className="bg-white text-slate-600 font-mono">Pendente</option>
                              <option value="A" className="bg-emerald-500 text-white font-mono font-bold">A - Atendido</option>
                              <option value="D" className="bg-amber-400 text-slate-900 font-mono font-bold">D - Em Des.</option>
                              <option value="N" className="bg-red-500 text-white font-mono font-bold">N - Ñ Atend.</option>
                            </select>
                          </td>
                        );
                      })}

                      {/* Attendance input */}
                      <td className="py-2.5 px-4 border-l border-slate-100 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            value={student.attendance}
                            onChange={(e) => handleAttendanceChange(student.id, parseInt(e.target.value))}
                            className={`w-14 text-center font-mono font-semibold text-xs border-b pb-0.5 focus:outline-hidden ${
                              student.attendance < 75 
                                ? "text-red-600 border-red-500 font-bold" 
                                : "text-slate-700 border-slate-200"
                            }`}
                            min={0}
                            max={100}
                          />
                          <span className="text-[10px] text-slate-400 font-mono">%</span>
                        </div>
                      </td>

                      {/* Computed final status */}
                      <td className="py-2.5 px-4 border-l border-slate-100 text-center">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${badgeClass}`}>
                          {outcome}
                        </span>
                      </td>

                      {/* Observation notes */}
                      <td className="py-2.5 px-4 border-l border-slate-100">
                        <input
                          type="text"
                          value={student.observations}
                          onChange={(e) => handleObservationChange(student.id, e.target.value)}
                          placeholder="Ex: Aluno em monitoria"
                          className="w-full bg-transparent text-xs text-slate-500 border-b border-transparent hover:border-slate-200 focus:border-red-400 focus:outline-hidden py-1 px-1.5"
                        />
                      </td>

                      {/* Row Actions */}
                      <td className="py-2.5 px-4 border-l border-slate-100 text-center no-print">
                        <button
                          onClick={() => handleDeleteStudent(student.id)}
                          className="text-slate-300 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors"
                          title="Excluir Aluno"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6 + competencies.length} className="py-12 text-center text-slate-400 italic">
                    Nenhum aluno nesta turma. Adicione alunos manualmente ou use o extrator automático de nomes acima!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Spreadsheet Footer add operations */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 flex items-center justify-between no-print">
          <button
            onClick={handleAddStudent}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 px-3.5 py-2 rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-slate-500" />
            <span>Adicionar Aluno Manualmente</span>
          </button>
          
          <div className="text-[10px] text-slate-400 font-mono">
            Total matriculados: <strong className="text-slate-600">{students.length} alunos</strong>
          </div>
        </div>
      </div>

      {/* AI Extraction Modal / Panel */}
      {showAIModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="bg-slate-900 text-white p-6 relative">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                <h3 className="font-bold text-base">Extrator de Alunos por Inteligência Artificial</h3>
              </div>
              <p className="text-slate-300 text-xs mt-1.5 leading-relaxed">
                Cole abaixo o conteúdo bruto de qualquer documento (lista de chamada, PDF, planilha exportada, ata de matrícula). O Gemini AI lerá o arquivo, organizará os nomes completos e gerará a lista final em ordem alfabética.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Cole o Texto Bruto do Documento
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={8}
                  placeholder="Ex:&#10;1. ADRIANO DE FREITAS PEREIRA - MATRICULA 2314&#10;Coordenação: 2. BEATRIZ SOUZA OLIVEIRA (Eletro)&#10;Matrícula ativa de Carlos Eduardo Santos no sistema..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-800 leading-relaxed"
                />
              </div>

              {extractError && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-xs px-4 py-2.5 rounded-xl">
                  ⚠️ {extractError}
                </div>
              )}

              {extractSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>{extractSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowAIModal(false)}
                  className="text-slate-500 hover:text-slate-800 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAIExtract}
                  disabled={isExtracting}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all disabled:bg-slate-300"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Processando com Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Extrair Nomes dos Alunos</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
