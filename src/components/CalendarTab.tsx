import React, { useState } from "react";
import { ClassGroup, AcademicCalendarConfig } from "../types";
import { Calendar, Clock, Plus, Trash2, Check, Landmark, CalendarDays, RefreshCw } from "lucide-react";
import { calculateClassDates } from "../utils";

interface CalendarTabProps {
  activeClass: ClassGroup;
  onUpdateCalendar: (updatedCalendar: AcademicCalendarConfig) => void;
}

export default function CalendarTab({ activeClass, onUpdateCalendar }: CalendarTabProps) {
  const cal = activeClass.calendar;

  const [startDate, setStartDate] = useState(cal.startDate);
  const [weeklyDays, setWeeklyDays] = useState<number[]>(cal.weeklyDays);
  const [newHoliday, setNewHoliday] = useState("");
  const [holidayList, setHolidayList] = useState<string[]>(cal.holidayDates);
  const [sgeSystem, setSgeSystem] = useState(cal.sgeTargetSystem);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Synchronize when class changes
  React.useEffect(() => {
    setStartDate(cal.startDate);
    setWeeklyDays(cal.weeklyDays);
    setHolidayList(cal.holidayDates);
    setSgeSystem(cal.sgeTargetSystem);
  }, [activeClass.id, cal]);

  const toggleDayOfWeek = (dayNum: number) => {
    if (weeklyDays.includes(dayNum)) {
      setWeeklyDays(weeklyDays.filter(d => d !== dayNum));
    } else {
      setWeeklyDays([...weeklyDays, dayNum].sort());
    }
  };

  const handleAddHoliday = () => {
    if (newHoliday && !holidayList.includes(newHoliday)) {
      setHolidayList([...holidayList, newHoliday].sort());
      setNewHoliday("");
    }
  };

  const handleRemoveHoliday = (dateToRemove: string) => {
    setHolidayList(holidayList.filter(d => d !== dateToRemove));
  };

  const handleSaveCalendar = () => {
    const updatedCalendar: AcademicCalendarConfig = {
      startDate,
      weeklyDays,
      holidayDates: holidayList,
      sgeTargetSystem: sgeSystem,
    };
    onUpdateCalendar(updatedCalendar);
  };

  const handleSyncWithSGESystem = () => {
    setIsSyncing(true);
    setSyncSuccess(false);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    }, 1500);
  };

  const weekdaysLabels = [
    { num: 1, label: "Segunda" },
    { num: 2, label: "Terça" },
    { num: 3, label: "Quarta" },
    { num: 4, label: "Quinta" },
    { num: 5, label: "Sexta" },
    { num: 6, label: "Sábado" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* Left Column: Settings */}
      <div className="lg:col-span-6 space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              Parâmetros Acadêmicos da Turma
            </h3>
            <p className="text-xs text-slate-400">Configure as datas letivas de início, frequência e feriados para distribuição didática automática.</p>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Data de Início das Aulas
            </label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Weekly Days Selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Dias de Aula na Semana
            </label>
            <div className="grid grid-cols-3 gap-2">
              {weekdaysLabels.map((day) => {
                const active = weeklyDays.includes(day.num);
                return (
                  <button
                    key={day.num}
                    onClick={() => toggleDayOfWeek(day.num)}
                    className={`px-3 py-2 text-xs rounded-xl border font-medium transition-all text-center cursor-pointer ${
                      active
                        ? "bg-red-50 text-red-700 border-red-200 shadow-xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SGE System Integration target */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Sistema de Gestão Escolar (SGE Target)
            </label>
            <select
              value={sgeSystem}
              onChange={(e) => setSgeSystem(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-4 py-2.5 focus:outline-hidden focus:ring-1 focus:ring-red-500 cursor-pointer shadow-xs"
            >
              <option value="Siga/SENAI">Siga/SENAI-RS (Oficial)</option>
              <option value="Q-Acadêmico">Q-Acadêmico (Institutos Federais)</option>
              <option value="Google Classroom">Google Classroom (LMS Integrador)</option>
              <option value="SGE Institucional">SGE Institucional Corporativo</option>
            </select>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              Define o formato do payload e sincronização eletrônica de frequências e competências integradas.
            </p>
          </div>

          {/* Save & Apply Button */}
          <div className="pt-2">
            <button
              onClick={handleSaveCalendar}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-3 rounded-xl shadow-md shadow-red-950/10 cursor-pointer transition-all active:scale-95"
            >
              Aplicar Calendário & Recalcular Datas
            </button>
          </div>
        </div>

        {/* Integration Sync Panel */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-slate-600" />
            <div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Integração Direta com SGE</h4>
              <p className="text-[11px] text-slate-500">Conexão criptografada ponta a ponta com a instituição escolar.</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed text-justify">
            A sincronização automática permite que as frequências lançadas no diário de competências deste aplicativo alimentem instantaneamente a folha eletrônica do <strong>{sgeSystem}</strong> de forma contínua e segura.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSyncWithSGESystem}
              disabled={isSyncing}
              className="grow bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:bg-slate-400"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Conectando APIs...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sincronizar com {sgeSystem}</span>
                </>
              )}
            </button>

            {syncSuccess && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl animate-bounce">
                <Check className="w-3.5 h-3.5" />
                Sincronizado!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Holidays */}
      <div className="lg:col-span-6 space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-slate-500" />
              Bloqueio de Dias Letivos (Feriados / Recessos)
            </h3>
            <p className="text-xs text-slate-400">Adicione feriados nacionais, municipais ou escolares para que o cronograma não os agende como aula.</p>
          </div>

          {/* Holiday Adder */}
          <div className="flex gap-2 items-center">
            <div className="grow">
              <input
                type="date"
                value={newHoliday}
                onChange={(e) => setNewHoliday(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-red-500"
              />
            </div>
            <button
              onClick={handleAddHoliday}
              className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs p-3 rounded-xl flex items-center justify-center cursor-pointer transition-all active:scale-95"
              title="Adicionar Feriado"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Holiday List Grid */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">
              Feriados Ativos ({holidayList.length})
            </label>
            {holidayList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {holidayList.map((holidayDate) => {
                  // Format to Brazilian notation for visual comfort
                  const parts = holidayDate.split("-");
                  const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : holidayDate;
                  
                  return (
                    <div
                      key={holidayDate}
                      className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
                    >
                      <span className="font-mono text-red-600">{formattedDate}</span>
                      <button
                        onClick={() => handleRemoveHoliday(holidayDate)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-all hover:bg-red-50"
                        title="Remover Feriado"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl text-xs text-slate-400 italic">
                Nenhum recesso cadastrado. Aulas serão agendadas continuamente.
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Class Date Simulation preview */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            Projeção Estatística da Agenda
          </h4>

          {activeClass.plan?.cronograma && activeClass.plan.cronograma.length > 0 ? (
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between border-b border-slate-50 pb-1.5">
                <span>Total de Aulas Planejadas:</span>
                <strong className="text-slate-800 font-mono">{activeClass.plan.cronograma.length} sessões</strong>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-1.5">
                <span>Data do Primeiro Encontro:</span>
                <strong className="text-red-600 font-mono">
                  {activeClass.plan.cronograma[0].data || "A definir"}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Data Estimada de Término:</span>
                <strong className="text-red-600 font-mono">
                  {activeClass.plan.cronograma[activeClass.plan.cronograma.length - 1].data || "A definir"}
                </strong>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Aguardando elaboração do plano de ensino para projetar o calendário de encerramento da unidade.
            </p>
          )}
        </div>

      </div>

    </div>
  );
}
