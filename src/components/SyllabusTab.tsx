import React, { useState } from "react";
import { ClassGroup, SyllabusPlan } from "../types";
import { Sparkles, FileText, Printer, Save, CheckCircle, HelpCircle, Loader2 } from "lucide-react";

interface SyllabusTabProps {
  activeClass: ClassGroup;
  onUpdatePlan: (updatedPlan: SyllabusPlan) => void;
  isOnline: boolean;
}

export default function SyllabusTab({ activeClass, onUpdatePlan, isOnline }: SyllabusTabProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationFocus, setGenerationFocus] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const plan = activeClass.plan || {
    objetivoGeral: "",
    competencias: [],
    habilidades: [],
    basesTecnologicas: [],
    cronograma: [],
    criteriosAvaliacao: [],
  };

  // State to support quick inline edits
  const [objetivo, setObjetivo] = useState(plan.objetivoGeral);
  const [compsText, setCompsText] = useState(plan.competencias.join("\n"));
  const [habsText, setHabsText] = useState(plan.habilidades.join("\n"));
  const [basesText, setBasesText] = useState(plan.basesTecnologicas.join("\n"));
  const [criteriosText, setCriteriosText] = useState(plan.criteriosAvaliacao.join("\n"));

  // Sync state if activeClass changes
  React.useEffect(() => {
    if (activeClass.plan) {
      setObjetivo(activeClass.plan.objetivoGeral);
      setCompsText(activeClass.plan.competencias.join("\n"));
      setHabsText(activeClass.plan.habilidades.join("\n"));
      setBasesText(activeClass.plan.basesTecnologicas.join("\n"));
      setCriteriosText(activeClass.plan.criteriosAvaliacao.join("\n"));
    }
  }, [activeClass.id, activeClass.plan]);

  const handleSaveLocalEdits = () => {
    const updatedPlan: SyllabusPlan = {
      ...plan,
      objetivoGeral: objetivo,
      competencias: compsText.split("\n").filter(line => line.trim() !== ""),
      habilidades: habsText.split("\n").filter(line => line.trim() !== ""),
      basesTecnologicas: basesText.split("\n").filter(line => line.trim() !== ""),
      criteriosAvaliacao: criteriosText.split("\n").filter(line => line.trim() !== ""),
    };
    onUpdatePlan(updatedPlan);
    setSuccessMsg("Plano de ensino salvo localmente.");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleGenerateWithAI = async () => {
    if (!isOnline) {
      setErrorMsg("Você está offline. Conecte-se para utilizar a Inteligência Artificial do Gemini.");
      setTimeout(() => setErrorMsg(""), 4000);
      return;
    }

    setIsGenerating(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course: activeClass.course,
          subject: activeClass.subject,
          workload: activeClass.workload,
          focus: generationFocus,
          calendarInfo: `Schedules: ${activeClass.calendar.weeklyDays.join(", ")}. Starts: ${activeClass.calendar.startDate}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro de requisição.");
      }

      const generatedPlan: SyllabusPlan = await response.json();
      
      // Update local inputs
      setObjetivo(generatedPlan.objetivoGeral);
      setCompsText(generatedPlan.competencias.join("\n"));
      setHabsText(generatedPlan.habilidades.join("\n"));
      setBasesText(generatedPlan.basesTecnologicas.join("\n"));
      setCriteriosText(generatedPlan.criteriosAvaliacao.join("\n"));

      onUpdatePlan(generatedPlan);
      setSuccessMsg("Plano de Ensino personalizado gerado com sucesso pelo Gemini AI!");
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Erro de conexão com o servidor de IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  const triggerPrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* AI Controls Panel */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 no-print relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide">
                Gemini AI 2.5
              </span>
              <span className="text-slate-400 text-xs">Assistente Pedagógico Técnico</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Elaborar Plano por Competências via Inteligência Artificial
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Gere de forma automática e personalizada as competências, habilidades técnicas, bases tecnológicas e cronograma didático ajustado para o Catálogo Nacional de Cursos Técnicos.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch w-full lg:w-auto">
            <div className="grow">
              <input
                type="text"
                value={generationFocus}
                onChange={(e) => setGenerationFocus(e.target.value)}
                placeholder="Foco (Ex: foco em APIs, infra de redes, etc...)"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-4 py-3 placeholder:text-slate-500 focus:outline-hidden focus:ring-1 focus:ring-red-500"
              />
            </div>
            <button
              onClick={handleGenerateWithAI}
              disabled={isGenerating}
              className="bg-red-600 hover:bg-red-500 text-white font-semibold text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-red-950/20 active:scale-95 disabled:bg-slate-800 disabled:text-slate-500"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Gerando Syllabus...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>Elaborar Plano Personalizado</span>
                </>
              )}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 bg-red-900/30 border border-red-800/40 text-red-300 text-xs px-4 py-2.5 rounded-lg">
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mt-4 bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Main Form & PDF Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Editor (Column 1) */}
        <div className="lg:col-span-5 space-y-4 no-print">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-500" />
                Editar Estrutura de Ensino
              </h3>
              <button
                onClick={handleSaveLocalEdits}
                className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md hover:bg-emerald-100 flex items-center gap-1 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                Salvar Alterações
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                  Objetivo Geral da Disciplina
                </label>
                <textarea
                  value={objetivo}
                  onChange={(e) => setObjetivo(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-red-500 leading-relaxed"
                  placeholder="Descreva o propósito principal da disciplina técnica..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center justify-between">
                  <span>Competências Técnicas (uma por linha)</span>
                  <span className="text-[10px] text-slate-400 lowercase font-normal">Pressione Enter</span>
                </label>
                <textarea
                  value={compsText}
                  onChange={(e) => setCompsText(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-red-500 font-sans"
                  placeholder="Competência 1...&#10;Competência 2..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center justify-between">
                  <span>Habilidades Correspondentes (uma por linha)</span>
                </label>
                <textarea
                  value={habsText}
                  onChange={(e) => setHabsText(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-red-500 font-sans"
                  placeholder="Habilidade 1...&#10;Habilidade 2..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                  Bases Tecnológicas / Conteúdos (uma por linha)
                </label>
                <textarea
                  value={basesText}
                  onChange={(e) => setBasesText(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-red-500 font-sans"
                  placeholder="Fundamentos de...&#10;Modelagem de..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                  Critérios de Avaliação (um por linha)
                </label>
                <textarea
                  value={criteriosText}
                  onChange={(e) => setCriteriosText(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-red-500 font-sans"
                  placeholder="Critério 1...&#10;Critério 2..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Presentation Sheet (Column 2) - This handles both Screen Preview and Print rendering */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="flex items-center justify-between no-print">
            <h3 className="font-bold text-slate-500 text-xs uppercase tracking-wider">
              Visualização de Documento Oficial
            </h3>
            <button
              onClick={triggerPrintPDF}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg shadow-sm cursor-pointer transition-all active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Exportar PDF / Imprimir</span>
            </button>
          </div>

          {/* Paper Document Container */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-md print-area text-slate-800 max-w-4xl mx-auto space-y-6">
            
            {/* Document Header block */}
            <div className="border-b-4 border-red-600 pb-4 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-mono text-slate-400 tracking-wider">INSTITUIÇÃO DE ENSINO TÉCNICO</h4>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
                  Plano de Curso & Cronograma Didático
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Em conformidade com as diretrizes do Catálogo Nacional de Cursos Técnicos
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-sm">
                  SENAI-RS
                </span>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">Página 1 de 1</p>
              </div>
            </div>

            {/* Class Details Block */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-mono">
              <div>
                <span className="text-slate-400 block uppercase text-[9px] font-bold">Curso</span>
                <strong className="text-slate-800">{activeClass.course}</strong>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[9px] font-bold">Unidade Curricular</span>
                <strong className="text-slate-800">{activeClass.subject}</strong>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[9px] font-bold">Carga Horária</span>
                <strong className="text-slate-800">{activeClass.workload} horas</strong>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[9px] font-bold">Docente Responsável</span>
                <strong className="text-slate-800">Prof. Adriano Freitas</strong>
              </div>
            </div>

            {/* Document Objective */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm border-l-2 border-red-600 pl-2">
                1. OBJETIVO GERAL
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed text-justify">
                {objetivo || "Nenhum objetivo geral cadastrado para esta disciplina. Utilize o gerador de plano por IA acima para criar automaticamente."}
              </p>
            </div>

            {/* Competencies / Skills / Bases Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Competencies */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-1">
                  2. COMPETÊNCIAS
                </h3>
                <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-1.5 pl-1 leading-relaxed">
                  {plan.competencias.length > 0 ? (
                    plan.competencias.map((c, idx) => <li key={idx}>{c}</li>)
                  ) : (
                    <span className="text-slate-400 italic">Pendente de elaboração</span>
                  )}
                </ul>
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-1">
                  3. HABILIDADES
                </h3>
                <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-1.5 pl-1 leading-relaxed">
                  {plan.habilidades.length > 0 ? (
                    plan.habilidades.map((h, idx) => <li key={idx}>{h}</li>)
                  ) : (
                    <span className="text-slate-400 italic">Pendente de elaboração</span>
                  )}
                </ul>
              </div>

              {/* Bases Tecnológicas */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-1">
                  4. BASES TECNOLÓGICAS
                </h3>
                <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-1.5 pl-1 leading-relaxed">
                  {plan.basesTecnologicas.length > 0 ? (
                    plan.basesTecnologicas.map((b, idx) => <li key={idx}>{b}</li>)
                  ) : (
                    <span className="text-slate-400 italic">Pendente de elaboração</span>
                  )}
                </ul>
              </div>

            </div>

            {/* Evaluation Criteria */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm border-l-2 border-red-600 pl-2">
                5. CRITÉRIOS DE AVALIAÇÃO DE COMPETÊNCIA
              </h3>
              <ul className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 pl-2 leading-relaxed">
                {plan.criteriosAvaliacao.length > 0 ? (
                  plan.criteriosAvaliacao.map((crit, idx) => <li key={idx}>{crit}</li>)
                ) : (
                  <span className="text-slate-400 italic">Nenhum critério definido</span>
                )}
              </ul>
            </div>

            {/* Schedule (Chronogram) */}
            <div className="space-y-2 pt-4 page-break">
              <h3 className="font-bold text-slate-900 text-sm border-l-2 border-red-600 pl-2">
                6. DISTRIBUIÇÃO CRONOLÓGICA DAS AULAS (AGENDA DIDÁTICA)
              </h3>
              
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 font-mono text-[10px] text-slate-500 uppercase">
                      <th className="py-2.5 px-3 w-16 text-center">Aula</th>
                      <th className="py-2.5 px-3 w-28">Data Prevista</th>
                      <th className="py-2.5 px-4">Conteúdo Programático Didático</th>
                      <th className="py-2.5 px-4">Estratégia Metodológica</th>
                      <th className="py-2.5 px-3 w-16 text-center">H / Aula</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {plan.cronograma && plan.cronograma.length > 0 ? (
                      plan.cronograma.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 text-center font-bold text-slate-900 font-mono">
                            {item.aula}
                          </td>
                          <td className="py-3 px-3 font-semibold text-red-600 font-mono">
                            {item.data || "A definir"}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-medium text-slate-900">{item.conteudo}</p>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {item.competenciaRelacionada}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px]">
                            {item.metodologia}
                          </td>
                          <td className="py-3 px-3 text-center font-semibold font-mono text-slate-500">
                            {item.duracaoHoras}h
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                          Cronograma vazio. Configure o Calendário Acadêmico na aba ao lado para vincular as datas dinamicamente!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signature Area */}
            <div className="grid grid-cols-2 gap-12 pt-16 text-center text-[10px] text-slate-500 font-mono uppercase">
              <div className="space-y-1">
                <div className="border-t border-slate-300 w-full mx-auto" />
                <p className="font-bold text-slate-700">Prof. Adriano Freitas</p>
                <p>Docente Responsável - SENAI-RS</p>
              </div>
              <div className="space-y-1">
                <div className="border-t border-slate-300 w-full mx-auto" />
                <p className="font-bold text-slate-700">Coordenação Pedagógica</p>
                <p>SGE Institucional - SENAI-RS</p>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
