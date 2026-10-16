import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, Server, ArrowRight, ExternalLink } from 'lucide-react';
import type { ServiceAccountStatus } from '../types';

interface ServiceAccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: ServiceAccountStatus | null;
  onRefreshStatus: () => void;
}

export const ServiceAccountSettingsModal: React.FC<ServiceAccountSettingsModalProps> = ({
  isOpen,
  onClose,
  status,
  onRefreshStatus,
}) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; domains?: string[] } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/workspace/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setTestResult(data);
      onRefreshStatus();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Falha na requisição ao servidor.',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E0F0C]/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-[#E2E6DF] overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-[#163300] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#9FE870] flex items-center justify-center text-[#163300]">
              <Key className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-black font-['Outfit'] text-white">Conexão Google Workspace</h2>
              <p className="text-xs text-[#CBD3C5]">
                Integração central com Service Account &amp; Delegação em Todo o Domínio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#CBD3C5] hover:text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-6">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
              status?.isConfigured
                ? 'bg-[#E8F7DC] border-[#9FE870]/60 text-[#163300]'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {status?.isConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-[#163300] shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <h4 className="text-sm font-black font-['Outfit']">
                {status?.isConfigured
                  ? 'Service Account Configurada no Servidor'
                  : 'Modo Sandbox Ativo (Aguardando Credenciais)'}
              </h4>
              <p className="text-xs leading-relaxed opacity-90">
                {status?.isConfigured
                  ? `O servidor está pronto para personificar o Administrador (${status.adminEmail}) e gerenciar contas e licenças.`
                  : 'As variáveis de ambiente da Service Account podem ser preenchidas no arquivo .env ou no painel de Secrets da plataforma para conexão ao vivo.'}
              </p>
            </div>
          </div>

          {/* Configuration Parameters */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#868685] font-['Outfit']">Parâmetros de Integração</h4>
            <div className="bg-[#F4F5F0] p-4 rounded-2xl border border-[#E2E6DF] space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-[#E2E6DF]">
                <span className="text-[#5E605D] font-medium">E-mail do Administrador (Subject):</span>
                <span className="font-mono font-bold text-[#0E0F0C]">
                  {status?.adminEmail || 'Não definido (GOOGLE_WORKSPACE_ADMIN_EMAIL)'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#E2E6DF]">
                <span className="text-[#5E605D] font-medium">E-mail da Service Account:</span>
                <span className="font-mono font-bold text-[#0E0F0C] truncate max-w-[280px]">
                  {status?.clientEmail || 'Não definido (GOOGLE_WORKSPACE_SERVICE_ACCOUNT_EMAIL)'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#E2E6DF]">
                <span className="text-[#5E605D] font-medium">Chave Privada (RSA PEM):</span>
                <span className="font-mono font-bold text-[#0E0F0C]">
                  {status?.hasPrivateKey ? '✓ Carregada no Servidor' : '✗ Ausente'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[#5E605D] font-medium">Escopos Habilitados:</span>
                <span className="font-mono text-[#0E0F0C]">directory.user, domain, orgunit, group, licensing</span>
              </div>
            </div>
          </div>

          {/* Test Connection Output */}
          {testResult && (
            <div
              className={`p-4 rounded-2xl border text-xs space-y-2 ${
                testResult.success
                  ? 'bg-[#E8F7DC] border-[#9FE870]/60 text-[#163300]'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2 font-black">
                {testResult.success ? <CheckCircle2 className="w-4 h-4 text-[#163300]" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                <span>{testResult.success ? 'Conexão Bem-Sucedida!' : 'Falha na Conexão'}</span>
              </div>
              <p className="leading-relaxed">{testResult.message}</p>
              {testResult.domains && testResult.domains.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[#9FE870]/40">
                  <span className="font-bold">Domínios encontrados no ambiente Workspace:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {testResult.domains.map((d) => (
                      <span key={d} className="bg-[#163300] text-[#9FE870] px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Guide for Domain-Wide Delegation */}
          <div className="p-5 bg-[#163300] text-[#CBD3C5] rounded-2xl space-y-2.5 text-xs">
            <h5 className="font-bold text-white flex items-center gap-1.5">
              <Server className="w-4 h-4 text-[#9FE870]" />
              Como habilitar a Delegação no painel Google Workspace:
            </h5>
            <ol className="list-decimal list-inside space-y-1 text-[#CBD3C5]">
              <li>Acesse <code className="text-[#9FE870]">admin.google.com</code> com sua conta de Administrador.</li>
              <li>Vá em <strong>Segurança &gt; Controle de acesso e dados &gt; Controles de Integração</strong>.</li>
              <li>Clique em <strong>Gerenciar delegação em todo o domínio</strong> &gt; <strong>Adicionar nova</strong>.</li>
              <li>Insira o Client ID da sua Service Account e os escopos listados acima.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F4F5F0] border-t border-[#E2E6DF] flex items-center justify-between">
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#00c868] hover:bg-[#00b05b] text-white text-xs font-black transition-all cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Testando Conexão...' : 'Testar Conexão em Tempo Real'}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-[#E2E6DF] hover:bg-[#D4DACF] text-[#0E0F0C] text-xs font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
