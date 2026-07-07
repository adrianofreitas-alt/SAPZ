import React from "react";
import { ClassGroup, StudentAssessment } from "../types";
import { Award, AlertTriangle, CheckCircle, Users, Percent, HelpCircle, TrendingUp } from "lucide-react";
import { getStudentStatus } from "../utils";

interface MetricsTabProps {
  activeClass: ClassGroup;
}

export default function MetricsTab({ activeClass }: MetricsTabProps) {
  const students = activeClass.students || [];
  const plan = activeClass.plan;
  const competencies = plan?.competencias || ["Competência 1", "Competência 2"];
  const totalStudents = students.length;

  if (totalStudents === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 italic">
        Sem dados de alunos para gerar relatórios de desempenho. Cadastre alunos no diário para visualizar as métricas!
      </div>
    );
  }

  // 1. Calculate General Metrics
  const avgAttendance = parseFloat(
    (students.reduce((acc, curr) => acc + curr.attendance, 0) / totalStudents).toFixed(1)
  );

  let approvedCount = 0;
  let recoveryCount = 0;
  let retidoCount = 0;

  students.forEach((s) => {
    const outcome = getStudentStatus(s, competencies.length);
    if (outcome === "Aprovado") approvedCount++;
    else if (outcome === "Em Recuperação") recoveryCount++;
    else retidoCount++;
  });

  const approvedPercent = Math.round((approvedCount / totalStudents) * 100);
  const recoveryPercent = Math.round((recoveryCount / totalStudents) * 100);
  const retidoPercent = Math.round((retidoCount / totalStudents) * 100);

  // 2. Competency breakdown stats
  const compStats = competencies.map((comp, cIdx) => {
    let countA = 0;
    let countD = 0;
    let countN = 0;
    let countEmpty = 0;

    students.forEach((s) => {
      const g = s.grades[cIdx] || "";
      if (g === "A") countA++;
      else if (g === "D") countD++;
      else if (g === "N") countN++;
      else countEmpty++;
    });

    return {
      name: `C${cIdx + 1}`,
      fullName: comp,
      A: Math.round((countA / totalStudents) * 100),
      D: Math.round((countD / totalStudents) * 100),
      N: Math.round((countN / totalStudents) * 100),
      empty: Math.round((countEmpty / totalStudents) * 100),
    };
  });

  // 3. Students under risk list
  const riskStudents = students.filter((s) => {
    const status = getStudentStatus(s, competencies.length);
    return status.startsWith("Retido") || status === "Em Recuperação";
  });

  return (
    <div className="space-y-6">
      
      {/* Metrics Banner Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Alunos Ativos</span>
            <h4 className="text-2xl font-bold text-slate-800">{totalStudents}</h4>
            <p className="text-[10px] text-slate-500 font-mono">Cadastrados no SGE</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
          <div className={`p-3 rounded-xl ${avgAttendance >= 75 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Frequência Média</span>
            <h4 className="text-2xl font-bold text-slate-800">{avgAttendance}%</h4>
            <p className="text-[10px] text-slate-500 font-mono">
              Meta SENAI: <strong className={avgAttendance >= 75 ? "text-emerald-600" : "text-red-500"}>&gt;= 75%</strong>
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Proficiência Direta</span>
            <h4 className="text-2xl font-bold text-slate-800">{approvedPercent}%</h4>
            <p className="text-[10px] text-slate-500 font-mono">{approvedCount} de {totalStudents} aprovados</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
          <div className={`p-3 rounded-xl ${retidoCount > 0 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Alunos Críticos</span>
            <h4 className="text-2xl font-bold text-slate-800">{retidoCount}</h4>
            <p className="text-[10px] text-slate-500 font-mono">Retidos ou sem frequência</p>
          </div>
        </div>

      </div>

      {/* Charts Grid Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chart 1: Visual Pie Chart / Distribution bar of Class Outcomes */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-slate-500" />
              Distribuição do Aproveitamento da Turma
            </h3>
            <p className="text-xs text-slate-400">Classificação estatística dos estudantes baseada nas notas das competências.</p>
          </div>

          {/* Custom SVG Pie/Ring Chart representation */}
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4 grow">
            
            {/* Pie SVG Container */}
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 36 36" className="w-full h-full rotate-270">
                {/* Background circle */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                
                {/* Circle Segment 1: Approved (Green) */}
                <circle
                  cx="18" cy="18" r="15.915"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.2"
                  strokeDasharray={`${approvedPercent} ${100 - approvedPercent}`}
                  strokeDashoffset="0"
                />

                {/* Circle Segment 2: Recovery (Yellow) */}
                <circle
                  cx="18" cy="18" r="15.915"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3.2"
                  strokeDasharray={`${recoveryPercent} ${100 - recoveryPercent}`}
                  strokeDashoffset={-approvedPercent}
                />

                {/* Circle Segment 3: Retained (Red) */}
                <circle
                  cx="18" cy="18" r="15.915"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3.2"
                  strokeDasharray={`${retidoPercent} ${100 - retidoPercent}`}
                  strokeDashoffset={-(approvedPercent + recoveryPercent)}
                />
              </svg>
              
              {/* Central text indicator */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-800 font-mono">{approvedPercent}%</span>
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Aprovados</span>
              </div>
            </div>

            {/* Custom Legend layout */}
            <div className="space-y-3 grow max-w-xs text-xs">
              <div className="flex items-center justify-between bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-emerald-500 rounded-full" />
                  <span className="font-medium text-slate-700">Aprovados</span>
                </div>
                <span className="font-bold font-mono text-slate-900">{approvedCount} ({approvedPercent}%)</span>
              </div>

              <div className="flex items-center justify-between bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-amber-400 rounded-full" />
                  <span className="font-medium text-slate-700">Em Recuperação</span>
                </div>
                <span className="font-bold font-mono text-slate-900">{recoveryCount} ({recoveryPercent}%)</span>
              </div>

              <div className="flex items-center justify-between bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="font-medium text-slate-700">Retidos / Críticos</span>
                </div>
                <span className="font-bold font-mono text-slate-900">{retidoCount} ({retidoPercent}%)</span>
              </div>
            </div>

          </div>
        </div>

        {/* Chart 2: Competency Breakdown Bars */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Award className="w-4 h-4 text-slate-500" />
              Taxa de Sucesso por Competências Técnicas
            </h3>
            <p className="text-xs text-slate-400">Percentual de alunos que atingiram plenamente cada competência.</p>
          </div>

          <div className="space-y-4 py-2">
            {compStats.map((stat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-end text-xs">
                  <div>
                    <strong className="text-slate-800 font-mono">{stat.name}</strong>
                    <span className="text-[10px] text-slate-400 font-normal ml-2 truncate max-w-44 inline-block align-bottom">
                      ({stat.fullName})
                    </span>
                  </div>
                  <span className="font-bold font-mono text-emerald-600">{stat.A}% Atendidos</span>
                </div>

                {/* Stacked bar indicator */}
                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                  {/* Atendido (Green) */}
                  <div 
                    style={{ width: `${stat.A}%` }} 
                    className="bg-emerald-500 h-full transition-all duration-500" 
                    title={`Atendido: ${stat.A}%`}
                  />
                  {/* Desenvolvendo (Yellow) */}
                  <div 
                    style={{ width: `${stat.D}%` }} 
                    className="bg-amber-400 h-full transition-all duration-500" 
                    title={`Em Desenvolvimento: ${stat.D}%`}
                  />
                  {/* Não Atendido (Red) */}
                  <div 
                    style={{ width: `${stat.N}%` }} 
                    className="bg-red-500 h-full transition-all duration-500" 
                    title={`Não Atendido: ${stat.N}%`}
                  />
                  {/* Empty/Pendente (Gray) */}
                  <div 
                    style={{ width: `${stat.empty}%` }} 
                    className="bg-slate-200 h-full transition-all duration-500" 
                    title={`Não Avaliado: ${stat.empty}%`}
                  />
                </div>
              </div>
            ))}

            {/* Micro color legend */}
            <div className="flex gap-4 pt-3 justify-center text-[10px] font-semibold text-slate-400">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" />
                <span>Atendido</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-amber-400 rounded-sm" />
                <span>Em Des.</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-sm" />
                <span>Não Atendido</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-slate-200 rounded-sm" />
                <span>Pendente</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Bottom Block: Risk list & Pedagogical Alerts */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Alunos sob Risco de Retenção ou Recuperação
            </h3>
            <p className="text-xs text-slate-400">Docentes devem intervir pedagogicamente nestes casos prioritários.</p>
          </div>
          <span className="bg-amber-50 text-amber-700 text-xs font-bold font-mono px-3 py-1 rounded-full border border-amber-100">
            {riskStudents.length} Alerta(s) Ativo(s)
          </span>
        </div>

        {riskStudents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {riskStudents.map((s) => {
              const status = getStudentStatus(s, competencies.length);
              const isFreqRisk = s.attendance < 75;
              
              return (
                <div 
                  key={s.id} 
                  className="flex items-start justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <div className="space-y-1 max-w-xs">
                    <p className="font-bold text-slate-800 text-xs">{s.name}</p>
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className={`font-semibold px-2 py-0.5 rounded-full ${
                        isFreqRisk ? "bg-red-50 text-red-700 border border-red-100" : "bg-slate-100 text-slate-600"
                      }`}>
                        Frequência: {s.attendance}%
                      </span>
                      <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full font-semibold">
                        {status}
                      </span>
                    </div>
                    {s.observations && (
                      <p className="text-[11px] text-slate-400 italic">
                        Obs: {s.observations}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-red-600 font-bold bg-red-50 px-2.5 py-1 rounded-md border border-red-100">
                      Intervenção Requerida
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-400 italic bg-emerald-50/20 border-2 border-dashed border-emerald-100 rounded-xl">
            🎉 Parabéns! Todos os alunos desta turma estão atualmente aprovados e acima das metas institucionais de frequência.
          </div>
        )}
      </div>

    </div>
  );
}
