import React from "react";
import { ClassGroup } from "../types";
import { Wifi, WifiOff, RefreshCw, Key, Shield, User, PlusCircle, BookOpen, Sparkles } from "lucide-react";

interface HeaderProps {
  classes: ClassGroup[];
  activeClassId: string;
  onSelectClass: (id: string) => void;
  onAddClass: () => void;
  isOnline: boolean;
  onToggleOnline: () => void;
  syncQueueLength: number;
  onSyncNow: () => void;
  encryptionKey: string;
  onSetEncryptionKey: (key: string) => void;
}

export default function Header({
  classes,
  activeClassId,
  onSelectClass,
  onAddClass,
  isOnline,
  onToggleOnline,
  syncQueueLength,
  onSyncNow,
  encryptionKey,
  onSetEncryptionKey,
}: HeaderProps) {
  const activeClass = classes.find((c) => c.id === activeClassId);

  const [tempGeminiKey, setTempGeminiKey] = React.useState(() => {
    return localStorage.getItem("SIGA_SYLLABUS_TEMPORARY_GEMINI_KEY") || "";
  });

  const handleGeminiKeyChange = (val: string) => {
    setTempGeminiKey(val);
    localStorage.setItem("SIGA_SYLLABUS_TEMPORARY_GEMINI_KEY", val);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 no-print shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-4">
          
          {/* Logo & Teacher Info */}
          <div className="flex items-center gap-3">
            <div className="bg-red-600 text-white p-2.5 rounded-xl shadow-md shadow-red-100 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold bg-red-50 text-red-700 px-2 py-0.5 rounded-full uppercase tracking-wider border border-red-100">
                  Ensino Técnico
                </span>
                <span className="text-xs text-slate-400 font-mono">SENAI-RS v3.2</span>
              </div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                Plano de Ensino por Competências
              </h1>
            </div>
          </div>

          {/* Quick Stats & Offline Controls */}
          <div className="flex flex-wrap items-center gap-3 md:gap-4">
            
            {/* Temporary Gemini API Key Input */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-red-600" />
              <span className="text-slate-600 hidden sm:inline">API Gemini:</span>
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-xs">
                <input
                  type="password"
                  value={tempGeminiKey}
                  onChange={(e) => handleGeminiKeyChange(e.target.value)}
                  placeholder="Chave Provisória..."
                  className="w-20 sm:w-28 text-slate-700 focus:outline-hidden font-mono text-[10px]"
                  title="Chave de API do Gemini temporária para rodar geração inteligente (não exposta publicamente)"
                />
              </div>
            </div>

            {/* End-to-End Encryption Controller */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-600 hidden sm:inline">Criptografia E2E:</span>
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-xs">
                <Key className="w-3 text-slate-400" />
                <input
                  type="password"
                  value={encryptionKey}
                  onChange={(e) => onSetEncryptionKey(e.target.value)}
                  placeholder="Chave Institucional"
                  className="w-16 sm:w-24 text-slate-700 focus:outline-hidden font-mono text-[10px]"
                  title="Chave de criptografia ponta a ponta local para proteção de dados sensíveis de alunos"
                />
              </div>
            </div>

            {/* Online / Offline Button */}
            <button
              onClick={onToggleOnline}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs border ${
                isOnline
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 animate-pulse"
              }`}
              title="Clique para alternar o modo de conexão e testar o funcionamento offline"
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 animate-bounce" />
                  <span>Modo Offline</span>
                </>
              )}
            </button>

            {/* Sync Status Button */}
            <button
              onClick={onSyncNow}
              disabled={syncQueueLength === 0 && isOnline}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                syncQueueLength > 0
                  ? "bg-amber-500 hover:bg-amber-600 text-white border-transparent animate-pulse shadow-md"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncQueueLength > 0 ? "animate-spin" : ""}`} />
              <span>
                {syncQueueLength > 0 ? `Nuvem (${syncQueueLength})` : "Sincronizado"}
              </span>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 text-xs">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold uppercase shadow-inner">
                AF
              </div>
              <div className="hidden lg:block text-left">
                <p className="font-semibold text-slate-700 leading-tight">Adriano Freitas</p>
                <p className="text-[10px] text-slate-400 font-mono">SENAI-RS Docente</p>
              </div>
            </div>

          </div>
        </div>

        {/* Course & Class Selection Row */}
        <div className="border-t border-slate-100 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
            <span className="font-semibold text-slate-500">Turma Ativa:</span>
            <div className="relative">
              <select
                value={activeClassId}
                onChange={(e) => onSelectClass(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg font-medium px-3 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-red-500 font-sans cursor-pointer shadow-xs pr-8 appearance-none"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} — {cls.subject}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                ▼
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onAddClass}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 transition-all bg-red-50 hover:bg-red-100 border border-red-100 px-3 py-1.5 rounded-lg shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Nova Turma</span>
            </button>

            {activeClass && (
              <div className="text-xs text-slate-400 font-mono">
                Carga Horária: <strong className="text-slate-600">{activeClass.workload}h</strong>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
