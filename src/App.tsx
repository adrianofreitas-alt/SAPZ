import React, { useState, useEffect } from "react";
import { ClassGroup, SyllabusPlan, AcademicCalendarConfig, StudentAssessment } from "./types";
import { DEFAULT_CLASSES, calculateClassDates } from "./utils";
import Header from "./components/Header";
import SyllabusTab from "./components/SyllabusTab";
import CalendarTab from "./components/CalendarTab";
import SGEGridTab from "./components/SGEGridTab";
import MetricsTab from "./components/MetricsTab";
import SyncTab from "./components/SyncTab";
import { ClipboardList, CalendarDays, TableProperties, LineChart, RadioReceiver, ShieldAlert } from "lucide-react";

export default function App() {
  // Master State
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [activeClassId, setActiveClassId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"syllabus" | "calendar" | "grid" | "metrics" | "sync">("syllabus");
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [syncQueueLength, setSyncQueueLength] = useState<number>(0);
  const [encryptionKey, setEncryptionKey] = useState<string>("SENAI-RS-E2E");

  // Load from LocalStorage or seed with premium Brazilian defaults
  useEffect(() => {
    const cachedClasses = localStorage.getItem("SIGA_SYLLABUS_CLASSES");
    const cachedOnline = localStorage.getItem("SIGA_SYLLABUS_ONLINE");
    const cachedQueue = localStorage.getItem("SIGA_SYLLABUS_QUEUE");
    const cachedKey = localStorage.getItem("SIGA_SYLLABUS_KEY");

    if (cachedClasses) {
      try {
        const parsed = JSON.parse(cachedClasses);
        setClasses(parsed);
        if (parsed.length > 0) {
          setActiveClassId(parsed[0].id);
        }
      } catch {
        setClasses(DEFAULT_CLASSES);
        setActiveClassId(DEFAULT_CLASSES[0].id);
      }
    } else {
      setClasses(DEFAULT_CLASSES);
      setActiveClassId(DEFAULT_CLASSES[0].id);
    }

    if (cachedOnline !== null) {
      setIsOnline(cachedOnline === "true");
    } else {
      setIsOnline(navigator.onLine);
    }

    if (cachedQueue) {
      setSyncQueueLength(parseInt(cachedQueue) || 0);
    }

    if (cachedKey) {
      setEncryptionKey(cachedKey);
    }
  }, []);

  // Save changes to localStorage whenever classes, queue or keys change
  useEffect(() => {
    if (classes.length > 0) {
      localStorage.setItem("SIGA_SYLLABUS_CLASSES", JSON.stringify(classes));
    }
  }, [classes]);

  useEffect(() => {
    localStorage.setItem("SIGA_SYLLABUS_ONLINE", String(isOnline));
  }, [isOnline]);

  useEffect(() => {
    localStorage.setItem("SIGA_SYLLABUS_QUEUE", String(syncQueueLength));
  }, [syncQueueLength]);

  useEffect(() => {
    localStorage.setItem("SIGA_SYLLABUS_KEY", encryptionKey);
  }, [encryptionKey]);

  // Handle browser online/offline events automatically
  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOnline(true);
      // Auto-trigger sync simulation
      setSyncQueueLength(0);
    };
    const handleOfflineStatus = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOfflineStatus);

    return () => {
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOfflineStatus);
    };
  }, []);

  const activeClass = classes.find((c) => c.id === activeClassId);

  // Core Actions

  // Update Syllabus (Plan) details
  const handleUpdatePlan = (updatedPlan: SyllabusPlan) => {
    if (!activeClass) return;

    // Recalculate scheduled dates for the cronograma based on existing calendar config
    const dates = calculateClassDates(
      activeClass.calendar.startDate,
      activeClass.calendar.weeklyDays,
      updatedPlan.cronograma.length,
      activeClass.calendar.holidayDates
    );

    const updatedCronograma = updatedPlan.cronograma.map((item, idx) => ({
      ...item,
      data: dates[idx] || "A definir",
    }));

    const completePlan = {
      ...updatedPlan,
      cronograma: updatedCronograma,
    };

    const updatedClasses = classes.map((c) => {
      if (c.id === activeClassId) {
        return {
          ...c,
          plan: completePlan,
          isSynced: isOnline,
          lastUpdated: new Date().toISOString(),
        };
      }
      return c;
    });

    setClasses(updatedClasses);
    if (!isOnline) {
      setSyncQueueLength((prev) => prev + 1);
    }
  };

  // Update Calendar parameters and shift syllabus dates dynamically
  const handleUpdateCalendar = (updatedCalendar: AcademicCalendarConfig) => {
    if (!activeClass) return;

    const totalSessions = activeClass.plan?.cronograma?.length || 15;
    const dates = calculateClassDates(
      updatedCalendar.startDate,
      updatedCalendar.weeklyDays,
      totalSessions,
      updatedCalendar.holidayDates
    );

    // Update cronograma dates if plan exists
    let updatedPlan = activeClass.plan;
    if (activeClass.plan) {
      const updatedCronograma = activeClass.plan.cronograma.map((item, idx) => ({
        ...item,
        data: dates[idx] || "A definir",
      }));
      updatedPlan = {
        ...activeClass.plan,
        cronograma: updatedCronograma,
      };
    }

    const updatedClasses = classes.map((c) => {
      if (c.id === activeClassId) {
        return {
          ...c,
          calendar: updatedCalendar,
          plan: updatedPlan,
          isSynced: isOnline,
          lastUpdated: new Date().toISOString(),
        };
      }
      return c;
    });

    setClasses(updatedClasses);
    if (!isOnline) {
      setSyncQueueLength((prev) => prev + 1);
    }
  };

  // Update students roster (marks, grades, observations)
  const handleUpdateStudents = (updatedStudents: StudentAssessment[]) => {
    if (!activeClass) return;

    const updatedClasses = classes.map((c) => {
      if (c.id === activeClassId) {
        return {
          ...c,
          students: updatedStudents,
          isSynced: isOnline,
          lastUpdated: new Date().toISOString(),
        };
      }
      return c;
    });

    setClasses(updatedClasses);
    if (!isOnline) {
      setSyncQueueLength((prev) => prev + 1);
    }
  };

  // Import another teacher's shared course
  const handleImportClass = (imported: ClassGroup) => {
    // Avoid duplicating ID
    const uniqueId = `class-${Date.now()}`;
    const newClass: ClassGroup = {
      ...imported,
      id: uniqueId,
      isSynced: true,
      lastUpdated: new Date().toISOString(),
    };

    const updated = [newClass, ...classes];
    setClasses(updated);
    setActiveClassId(uniqueId);
    setActiveTab("syllabus");
  };

  // Quick manual class builder
  const handleAddClass = () => {
    const newId = `class-${Date.now()}`;
    const newClass: ClassGroup = {
      id: newId,
      name: "Nova Turma Técnica " + (classes.length + 1),
      course: "Técnico em Eletrotécnica / Informática",
      subject: "Unidade Curricular Exemplo",
      workload: 80,
      isSynced: true,
      lastUpdated: new Date().toISOString(),
      calendar: {
        startDate: new Date().toISOString().split("T")[0],
        weeklyDays: [2, 4], // Tu / Th
        holidayDates: [],
        sgeTargetSystem: "Siga/SENAI",
      },
      plan: {
        objetivoGeral: "Capacitar os alunos em competências técnico-profissionais.",
        competencias: ["Competência Técnica de Exemplo 1."],
        habilidades: ["Habilidade Prática de Exemplo 1."],
        basesTecnologicas: ["Fundamentos Técnicos Essenciais."],
        cronograma: [
          {
            aula: 1,
            competenciaRelacionada: "Competência Técnica de Exemplo 1.",
            conteudo: "Introdução e ambientação laboratorial.",
            metodologia: "Aula explicativa com prática instrumental.",
            duracaoHoras: 4,
          },
        ],
        criteriosAvaliacao: ["Executa lógicas funcionais atendendo normas de segurança."],
      },
      students: [],
    };

    setClasses([newClass, ...classes]);
    setActiveClassId(newId);
    setActiveTab("syllabus");
  };

  const handleSyncNow = () => {
    if (!isOnline) {
      alert("Não é possível sincronizar offline. Verifique sua conexão.");
      return;
    }
    // Simulate push synchronization
    setSyncQueueLength(0);
  };

  const handleToggleOnline = () => {
    const nextStatus = !isOnline;
    setIsOnline(nextStatus);
    if (nextStatus) {
      // simulate auto flush
      setSyncQueueLength(0);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Header section */}
      <Header
        classes={classes}
        activeClassId={activeClassId}
        onSelectClass={setActiveClassId}
        onAddClass={handleAddClass}
        isOnline={isOnline}
        onToggleOnline={handleToggleOnline}
        syncQueueLength={syncQueueLength}
        onSyncNow={handleSyncNow}
        encryptionKey={encryptionKey}
        onSetEncryptionKey={setEncryptionKey}
      />

      {/* Main tab control and central content area */}
      {activeClass ? (
        <main className="grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-6">
            
            {/* Visual tab switcher (desktop sidebars or horizontal pill layout) */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-200/60 border border-slate-300/40 p-1 rounded-xl w-fit no-print">
              
              <button
                onClick={() => setActiveTab("syllabus")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === "syllabus"
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                id="tab-syllabus"
              >
                <ClipboardList className="w-4 h-4 text-slate-500" />
                <span>📋 Plano de Ensino</span>
              </button>

              <button
                onClick={() => setActiveTab("calendar")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === "calendar"
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                id="tab-calendar"
              >
                <CalendarDays className="w-4 h-4 text-slate-500" />
                <span>📅 Calendário Acadêmico</span>
              </button>

              <button
                onClick={() => setActiveTab("grid")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === "grid"
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                id="tab-grid"
              >
                <TableProperties className="w-4 h-4 text-slate-500" />
                <span>📊 Diário & Competências</span>
              </button>

              <button
                onClick={() => setActiveTab("metrics")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === "metrics"
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                id="tab-metrics"
              >
                <LineChart className="w-4 h-4 text-slate-500" />
                <span>📈 Relatórios & Métricas</span>
              </button>

              <button
                onClick={() => setActiveTab("sync")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === "sync"
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                id="tab-sync"
              >
                <RadioReceiver className="w-4 h-4 text-slate-500" />
                <span>🔗 Compartilhamento</span>
              </button>

            </div>

            {/* Offline warning banner when active and queue is growing */}
            {!isOnline && syncQueueLength > 0 && (
              <div className="bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 no-print animate-pulse">
                <ShieldAlert className="w-4 h-4 animate-bounce" />
                <span>Modo de Trabalho Offline Ativo: Você possui {syncQueueLength} alteração(ões) pendente(s) de backup na nuvem.</span>
              </div>
            )}

            {/* Tab view rendering */}
            <div className="transition-all duration-300">
              {activeTab === "syllabus" && (
                <SyllabusTab
                  activeClass={activeClass}
                  onUpdatePlan={handleUpdatePlan}
                  isOnline={isOnline}
                />
              )}

              {activeTab === "calendar" && (
                <CalendarTab
                  activeClass={activeClass}
                  onUpdateCalendar={handleUpdateCalendar}
                />
              )}

              {activeTab === "grid" && (
                <SGEGridTab
                  activeClass={activeClass}
                  onUpdateStudents={handleUpdateStudents}
                  isOnline={isOnline}
                />
              )}

              {activeTab === "metrics" && (
                <MetricsTab
                  activeClass={activeClass}
                />
              )}

              {activeTab === "sync" && (
                <SyncTab
                  activeClass={activeClass}
                  onImportClass={handleImportClass}
                  onSyncNow={handleSyncNow}
                  isOnline={isOnline}
                  syncQueueLength={syncQueueLength}
                />
              )}
            </div>

          </div>
        </main>
      ) : (
        <div className="grow flex items-center justify-center py-20 bg-slate-50">
          <p className="text-slate-400 italic">Carregando dados das turmas...</p>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-400 font-mono no-print">
        <p>Sistema de Gestão de Aprendizagem Técnica — SigaSyllabus © 2026</p>
        <p className="mt-1 text-[10px] text-slate-300">Conexão Segura AES-256 SSL Ativa</p>
      </footer>

    </div>
  );
}
