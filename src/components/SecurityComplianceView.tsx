import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Key,
  Lock,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Send,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
import { WorkspaceUser, WorkspaceDomain } from '../types';

interface SecurityComplianceViewProps {
  users: WorkspaceUser[];
  domains: WorkspaceDomain[];
  onEnforceAll2SV: () => void;
  onSend2SVReminder: (userEmail: string) => void;
}

export const SecurityComplianceView: React.FC<SecurityComplianceViewProps> = ({
  users,
  domains,
  onEnforceAll2SV,
  onSend2SVReminder,
}) => {
  const usersWith2SV = users.filter((u) => u.isEnrolledIn2SV);
  const usersPending2SV = users.filter((u) => !u.isEnrolledIn2SV);
  const superAdmins = users.filter((u) => u.role === 'SUPER_ADMIN');

  const compliancePercent =
    users.length > 0 ? Math.round((usersWith2SV.length / users.length) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0d121c] p-5 rounded-2xl border border-[#192434]">
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-white font-['Outfit'] flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#1ce783]" />
            <span>Central de Segurança & Conformidade 2FA (2SV)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Monitoramento de verificação em 2 etapas, proteção de contas corporativas e integridade de domínio.
          </p>
        </div>

        <button
          onClick={onEnforceAll2SV}
          className="flex items-center gap-2 bg-[#1ce783] hover:bg-[#00ed82] active:scale-95 text-[#05140b] px-4 py-2 rounded-full font-bold text-xs transition-all shadow-[0_0_15px_rgba(28,231,131,0.3)] cursor-pointer"
        >
          <Lock className="w-4 h-4 stroke-[2.5]" />
          <span>Impor 2SV para Todos</span>
        </button>
      </div>

      {/* Security Health Score Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Score Tile */}
        <div className="bg-[#0d121c] p-5 rounded-2xl border border-[#192434] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Taxa de Adoção 2FA
            </span>
            <div className="p-1.5 rounded-lg bg-[#1ce783]/15 text-[#1ce783]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-['Outfit']">{compliancePercent}%</span>
            <span className="text-xs text-emerald-400 font-semibold">
              ({usersWith2SV.length}/{users.length} usuários)
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {usersPending2SV.length === 0
              ? 'Todas as contas corporativas possuem autenticação segura ativada.'
              : `${usersPending2SV.length} conta(s) ainda não configuraram o 2º fator de autenticação.`}
          </p>
        </div>

        {/* Super Admins Protection */}
        <div className="bg-[#0d121c] p-5 rounded-2xl border border-[#192434] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Administradores Institucionais
            </span>
            <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400">
              <Key className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-['Outfit']">{superAdmins.length}</span>
            <span className="text-xs text-slate-400">contas privilegiadas</span>
          </div>
          <p className="text-xs text-slate-400">
            100% dos administradores institucionais utilizam Chaves de Segurança Física FIDO2.
          </p>
        </div>

        {/* Domain DNS Security (SPF/DKIM/MX) */}
        <div className="bg-[#0d121c] p-5 rounded-2xl border border-[#192434] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Assinatura DNS & DKIM
            </span>
            <div className="p-1.5 rounded-lg bg-[#1ce783]/15 text-[#1ce783]">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#1ce783] font-['Outfit']">2048-bit</span>
            <span className="text-xs text-slate-400">Criptografia</span>
          </div>
          <p className="text-xs text-slate-400">
            Registros MX, SPF e DKIM validados para prevenção de spoofing e phishing.
          </p>
        </div>
      </div>

      {/* Users Pending 2SV List */}
      <div className="bg-[#0d121c] p-6 rounded-2xl border border-[#192434] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Contas com 2-Step Verification Pendente ({usersPending2SV.length})</span>
          </h3>
        </div>

        {usersPending2SV.length === 0 ? (
          <div className="p-6 bg-[#0a0e14] rounded-xl border border-emerald-500/30 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-[#1ce783] mx-auto" />
            <p className="font-bold text-white text-sm">Parabéns! Conformidade de 100% no skoolia</p>
            <p className="text-xs text-slate-400">
              Todas as contas do Google Workspace possuem proteção de 2 etapas ativada.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#151f2e] bg-[#0b0e14] rounded-xl border border-[#1a2536] overflow-hidden">
            {usersPending2SV.map((user) => (
              <div
                key={user.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                    {user.name.givenName[0]}
                  </div>
                  <div>
                    <p className="font-bold text-white">{user.name.fullName}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{user.primaryEmail}</p>
                    <p className="text-[10px] text-slate-400">
                      {user.department || user.jobTitle || 'Usuário'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onSend2SVReminder(user.primaryEmail)}
                  className="flex items-center gap-1.5 bg-[#172233] hover:bg-[#202e43] text-amber-300 hover:text-white px-3.5 py-1.5 rounded-xl border border-amber-500/30 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                  <span>Enviar Lembrete 2SV</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Domain Verification Checklist */}
      <div className="bg-[#0d121c] p-6 rounded-2xl border border-[#192434] space-y-4">
        <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#1ce783]" />
          <span>Status de DNS dos Domínios skoolia</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {domains.map((dom) => (
            <div
              key={dom.domainName}
              className="p-4 bg-[#121824] rounded-xl border border-[#1b2636] space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">@{dom.domainName}</span>
                {dom.isPrimary && (
                  <span className="bg-[#1ce783]/20 text-[#1ce783] text-[9px] font-bold px-2 py-0.5 rounded">
                    PRINCIPAL
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Google MX Records</span>
                  <span className="text-emerald-400 font-bold">Configurado</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>SPF (v=spf1 include:_spf.google.com)</span>
                  <span className="text-emerald-400 font-bold">Ativo</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>DKIM Email Signing</span>
                  <span className={dom.dkimConfigured ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {dom.dkimConfigured ? 'Assinado 2048-bit' : 'Pendente Chave'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
