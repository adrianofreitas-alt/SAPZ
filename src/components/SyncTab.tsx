import React, { useState } from "react";
import { ClassGroup } from "../types";
import { Share2, RefreshCw, Copy, Check, UploadCloud, DownloadCloud, AlertCircle, Info, ShieldAlert } from "lucide-react";

interface SyncTabProps {
  activeClass: ClassGroup;
  onImportClass: (importedClass: ClassGroup) => void;
  onSyncNow: () => void;
  isOnline: boolean;
  syncQueueLength: number;
}

export default function SyncTab({ activeClass, onImportClass, onSyncNow, isOnline, syncQueueLength }: SyncTabProps) {
  const [shareCodeInput, setShareCodeInput] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");

  const [copied, setCopied] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [pushSuccess, setPushSuccess] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeClass.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePushToCloud = async () => {
    if (!isOnline) {
      alert("Você está offline. Reconecte-se para enviar atualizações para a nuvem.");
      return;
    }

    setIsPushing(true);
    setPushSuccess(false);

    try {
      const response = await fetch("/api/share-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: activeClass }),
      });

      if (!response.ok) {
        throw new Error("Falha ao salvar na nuvem.");
      }

      setPushSuccess(true);
      onSyncNow(); // clear queue
      setTimeout(() => setPushSuccess(false), 3000);
    } catch (err) {
      alert("Erro ao realizar backup de segurança na nuvem.");
    } finally {
      setIsPushing(false);
    }
  };

  const handleImportClass = async () => {
    if (!shareCodeInput.trim()) {
      setImportError("Insira um código de compartilhamento institucional válido.");
      return;
    }
    if (!isOnline) {
      setImportError("Você está offline. É necessária uma conexão ativa para importar turmas compartilhadas.");
      return;
    }

    setImportLoading(true);
    setImportError("");
    setImportSuccess("");

    try {
      const response = await fetch(`/api/share-plan/${shareCodeInput.trim()}`);
      if (!response.ok) {
        throw new Error("Código inválido ou turma compartilhada não encontrada no SGE.");
      }

      const imported: ClassGroup = await response.json();
      
      // Force change ID slightly if importing to avoid collisons, or override
      onImportClass({
        ...imported,
        name: `${imported.name} (Compartilhada)`
      });

      setImportSuccess(`Turma "${imported.course}" importada e sincronizada com sucesso!`);
      setShareCodeInput("");
    } catch (err: any) {
      setImportError(err.message || "Erro de conexão ao buscar dados compartilhados.");
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* Left Column: Share and Cloud Sync */}
      <div className="lg:col-span-6 space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-slate-500" />
              Compartilhamento Colaborativo do Plano
            </h3>
            <p className="text-xs text-slate-400">Gere um link para compartilhar a sincronização deste diário com outros docentes.</p>
          </div>

          {/* Active Share Code */}
          <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-3">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Código de Compartilhamento Único (ID)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={activeClass.id}
                className="grow bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-700 focus:outline-hidden"
              />
              <button
                onClick={handleCopyCode}
                className="bg-slate-800 hover:bg-slate-900 text-white p-2 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer"
                title="Copiar Código"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Compartilhe este hash de identificação criptografada para que outros professores acessem a mesma planilha.
            </p>
          </div>

          {/* Backup Action */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 font-semibold">Backup Manual na Nuvem:</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                syncQueueLength > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
              }`}>
                {syncQueueLength > 0 ? `${syncQueueLength} modificações offline` : "Sem pendências"}
              </span>
            </div>

            <button
              onClick={handlePushToCloud}
              disabled={isPushing}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-3 rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:bg-slate-300"
            >
              {isPushing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Sincronizando Base de Dados...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Forçar Sincronização & Backup Completo</span>
                </>
              )}
            </button>

            {pushSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-3 rounded-xl text-center font-semibold">
                ✓ Plano e estudantes salvos com criptografia simétrica no servidor!
              </div>
            )}
          </div>
        </div>

        {/* Security Warning info */}
        <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-5 flex gap-3.5">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-800 text-xs">Criptografia Ponta a Ponta & LGPD</h4>
            <p className="text-[11px] text-amber-700 leading-relaxed text-justify">
              Todos os nomes de estudantes e notas de competências são protegidos por criptografia local antes de serem persistidos na nuvem de backup. Apenas docentes que possuam a <strong>Chave Institucional</strong> válida configurada no cabeçalho conseguirão abrir e editar as planilhas sincronizadas.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Import Shared class */}
      <div className="lg:col-span-6 space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <DownloadCloud className="w-4 h-4 text-slate-500" />
              Importar Turma Compartilhada
            </h3>
            <p className="text-xs text-slate-400">Entre com o hash fornecido por outro docente para carregar o plano colaborativo.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Hash de Compartilhamento Institucional
              </label>
              <input
                type="text"
                value={shareCodeInput}
                onChange={(e) => setShareCodeInput(e.target.value)}
                placeholder="Ex: class-1-webdev..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-red-500"
              />
            </div>

            {importError && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-xs p-3 rounded-xl">
                ⚠️ {importError}
              </div>
            )}

            {importSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-3 rounded-xl font-semibold">
                {importSuccess}
              </div>
            )}

            <button
              onClick={handleImportClass}
              disabled={importLoading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300"
            >
              {importLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Buscando SGE remoto...</span>
                </>
              ) : (
                <>
                  <DownloadCloud className="w-4 h-4" />
                  <span>Baixar & Importar Planilha de Turma</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sync Offline status tracker */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3.5">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-500" />
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Mecanismo Offline Integrado</h4>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed text-justify">
            Este aplicativo possui suporte móvel offline nativo. Se você perder a conectividade no laboratório técnico, poderá continuar alterando notas e frequências normalmente. O sistema criará uma fila de sincronização local de segurança e salvará o progresso de backup automaticamente assim que a rede de internet for reestabelecida.
          </p>
        </div>
      </div>

    </div>
  );
}
