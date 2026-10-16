import React from 'react';
import {
  UserPlus,
  Users,
  ShieldCheck,
  Sparkles,
  HardDrive,
  ArrowUpRight,
  FileSpreadsheet,
  AlertTriangle,
  Lock,
  ChevronRight,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { WorkspaceUser, LicenseInventory, AuditLogEntry } from '../types';

interface OverviewHeroProps {
  users: WorkspaceUser[];
  licenses: LicenseInventory[];
  auditLogs: AuditLogEntry[];
  onOpenCreateUser: () => void;
  onOpenBatchImport: () => void;
  onNavigateTab: (tab: string) => void;
}

export const OverviewHero: React.FC<OverviewHeroProps> = ({
  users,
  licenses,
  auditLogs,
  onOpenCreateUser,
  onOpenBatchImport,
  onNavigateTab,
}) => {
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'ACTIVE').length;
  const suspendedUsers = users.filter((u) => u.status === 'SUSPENDED').length;
  const usersWith2SV = users.filter((u) => u.isEnrolledIn2SV).length;
  const twoSVPercentage = totalUsers > 0 ? Math.round((usersWith2SV / totalUsers) * 100) : 100;
  
  const totalStorageGb = users.reduce((acc, u) => acc + u.storageUsageGb, 0);
  const geminiUsers = users.filter((u) => u.licenses.includes('Gemini for Google Workspace')).length;
  const superAdmins = users.filter((u) => u.role === 'SUPER_ADMIN').length;

  return (
    <div className="space-y-6">
      {/* skoolia Style Cinematic Showcase Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d1522] via-[#0e1b26] to-[#0a111a] border border-[#1d2b3e] p-6 lg:p-8 shadow-2xl">
        {/* Glow & Backdrop Accents */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[#1ce783]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-[#00d166]/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-[#1ce783] text-[#05140b] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                Google Workspace Enterprise
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Edição skoolia Global &bull; Domínio Principal @skoolia.com
              </span>
            </div>

            <h1 className="text-2xl lg:text-4xl font-extrabold text-white tracking-tight font-['Outfit']">
              Gestão de Contas & Identidades <span className="text-[#1ce783]">Workspace</span>
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              Crie, gerencie, provisione acessos em lote e atribua licenças de IA Gemini para colaboradores, produtoras parceiras e equipes de engenharia em tempo real.
            </p>

            {/* skoolia Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onOpenCreateUser}
                className="flex items-center gap-2 bg-[#1ce783] hover:bg-[#00ed82] active:scale-95 text-[#05140b] px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-[0_0_20px_rgba(28,231,131,0.35)] cursor-pointer whitespace-nowrap shrink-0"
              >
                <UserPlus className="w-4 h-4 stroke-[2.5]" />
                <span>Criar Novo Usuário</span>
              </button>

              <button
                onClick={onOpenBatchImport}
                className="flex items-center gap-2 bg-[#141d2a] hover:bg-[#1d293b] text-white px-5 py-2.5 rounded-full font-semibold text-sm border border-[#27384e] transition-all hover:border-[#1ce783]/50 cursor-pointer whitespace-nowrap shrink-0"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#1ce783]" />
                <span>Importar Lista CSV</span>
              </button>

              <button
                onClick={() => onNavigateTab('licenses')}
                className="flex items-center gap-2 bg-transparent hover:bg-[#141d2a] text-slate-300 hover:text-white px-4 py-2.5 rounded-full font-medium text-sm transition-colors whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-4 h-4 text-[#1ce783]" />
                <span>Gerenciar Licenças & IA</span>
              </button>
            </div>
          </div>

          {/* Quick Stat Pill Widget */}
          <div className="w-full lg:w-auto bg-[#090d14]/80 backdrop-blur-md p-4 lg:p-5 rounded-2xl border border-[#212f45] min-w-[280px]">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>Painel Rápido</span>
              <span className="text-[#1ce783] text-[11px] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1ce783]"></span> 100% Sincronizado
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#182333]">
                <span className="text-slate-400">Total de Contas</span>
                <span className="font-bold text-white text-sm">{totalUsers}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#182333]">
                <span className="text-slate-400">Conformidade 2FA</span>
                <span className="font-bold text-[#1ce783]">{twoSVPercentage}% ({usersWith2SV}/{totalUsers})</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#182333]">
                <span className="text-slate-400">Assentos Gemini IA</span>
                <span className="font-bold text-emerald-400">{geminiUsers} Ativos</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Administradores Institucionais</span>
                <span className="font-bold text-slate-200">{superAdmins} Contas</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 skoolia Metric Showcase Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Accounts */}
        <div 
          onClick={() => onNavigateTab('users')}
          className="group bg-[#0d121c] hover:bg-[#121824] p-5 rounded-2xl border border-[#192434] hover:border-[#1ce783]/40 transition-all cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(28,231,131,0.1)] relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-['Outfit']">
              Contas de Usuários
            </span>
            <div className="p-2 rounded-xl bg-[#141e2c] text-[#1ce783] group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-['Outfit'] tracking-tight">
              {totalUsers}
            </span>
            <span className="text-xs text-slate-400">contas</span>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-[#17202e]">
            <span className="text-emerald-400 font-medium">{activeUsers} ativos</span>
            {suspendedUsers > 0 && (
              <span className="text-amber-400 font-medium">{suspendedUsers} suspensos</span>
            )}
          </div>
        </div>

        {/* Card 2: Gemini for Workspace */}
        <div 
          onClick={() => onNavigateTab('licenses')}
          className="group bg-[#0d121c] hover:bg-[#121824] p-5 rounded-2xl border border-[#192434] hover:border-[#1ce783]/40 transition-all cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(28,231,131,0.1)] relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-['Outfit']">
              Gemini for Workspace
            </span>
            <div className="p-2 rounded-xl bg-[#1ce783]/15 text-[#1ce783] group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#1ce783] font-['Outfit'] tracking-tight">
              {geminiUsers}
            </span>
            <span className="text-xs text-slate-400">/ 40 licenças</span>
          </div>

          <div className="mt-3 text-xs text-slate-400 pt-2 border-t border-[#17202e] flex items-center justify-between">
            <span>IA Generativa Docs/Meet</span>
            <span className="text-[#1ce783] font-semibold">{Math.round((geminiUsers / 40) * 100)}% alocado</span>
          </div>
        </div>

        {/* Card 3: 2-Step Verification & Security */}
        <div 
          onClick={() => onNavigateTab('security')}
          className="group bg-[#0d121c] hover:bg-[#121824] p-5 rounded-2xl border border-[#192434] hover:border-[#1ce783]/40 transition-all cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(28,231,131,0.1)] relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-['Outfit']">
              Segurança & 2FA (2SV)
            </span>
            <div className="p-2 rounded-xl bg-[#141e2c] text-emerald-400 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-['Outfit'] tracking-tight">
              {twoSVPercentage}%
            </span>
            <span className="text-xs text-emerald-400 font-semibold">Protegidos</span>
          </div>

          <div className="mt-3 text-xs text-slate-400 pt-2 border-t border-[#17202e] flex items-center justify-between">
            <span>{usersWith2SV} de {totalUsers} com 2SV</span>
            <span className="text-xs text-[#1ce783] flex items-center">
              Auditar <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Card 4: Cloud Storage Usage */}
        <div 
          onClick={() => onNavigateTab('licenses')}
          className="group bg-[#0d121c] hover:bg-[#121824] p-5 rounded-2xl border border-[#192434] hover:border-[#1ce783]/40 transition-all cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(28,231,131,0.1)] relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-['Outfit']">
              Armazenamento Drive
            </span>
            <div className="p-2 rounded-xl bg-[#141e2c] text-[#1ce783] group-hover:scale-110 transition-transform">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-['Outfit'] tracking-tight">
              {(totalStorageGb / 1000).toFixed(2)}
            </span>
            <span className="text-xs text-slate-400">TB Utilizados</span>
          </div>

          <div className="mt-3 text-xs text-slate-400 pt-2 border-t border-[#17202e] flex items-center justify-between">
            <span>Pool Enterprise skoolia</span>
            <span className="text-emerald-400 font-semibold">Ilimitado</span>
          </div>
        </div>
      </div>

      {/* skoolia Quick Action Tiles */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base lg:text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
            <span>Ações Rápidas de Administração</span>
            <span className="text-xs bg-[#1ce783]/15 text-[#1ce783] font-bold px-2 py-0.5 rounded-full">
              Atalhos
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={onOpenCreateUser}
            className="group bg-[#0f1520] hover:bg-[#141d2a] p-4 rounded-2xl border border-[#1b2636] hover:border-[#1ce783]/50 transition-all cursor-pointer flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#1ce783]/10 text-[#1ce783] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-[#1ce783] transition-colors">
                Novo Colaborador
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Crie conta com email institucional, gere senha temporária e atribua licenças.
              </p>
            </div>
          </div>

          <div
            onClick={onOpenBatchImport}
            className="group bg-[#0f1520] hover:bg-[#141d2a] p-4 rounded-2xl border border-[#1b2636] hover:border-[#1ce783]/50 transition-all cursor-pointer flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#1ce783]/10 text-[#1ce783] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-[#1ce783] transition-colors">
                Provisionamento em Lote CSV
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Importe planilhas de usuários para criar dezenas de contas de uma só vez.
              </p>
            </div>
          </div>

          <div
            onClick={() => onNavigateTab('groups')}
            className="group bg-[#0f1520] hover:bg-[#141d2a] p-4 rounded-2xl border border-[#1b2636] hover:border-[#1ce783]/50 transition-all cursor-pointer flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#1ce783]/10 text-[#1ce783] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-[#1ce783] transition-colors">
                Grupos & Listas de E-mail
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure listas de distribuição (ex: eng@skoolia.com) e permissões de envio corporativo.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & Security Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Admin Audit Activity */}
        <div className="lg:col-span-2 bg-[#0d121c] p-5 rounded-2xl border border-[#192434]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#1ce783]"></span>
              Atividades Recentes de Administração
            </h3>
            <button
              onClick={() => onNavigateTab('audit')}
              className="text-xs text-[#1ce783] hover:underline font-semibold flex items-center gap-1"
            >
              Ver todos os logs <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {auditLogs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between gap-3 p-3 rounded-xl bg-[#121824] border border-[#1a2536] text-xs hover:border-[#26374f] transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.action === 'USER_CREATED' ? 'bg-[#1ce783]/20 text-[#1ce783]' :
                      log.action === 'USER_SUSPENDED' ? 'bg-amber-500/20 text-amber-300' :
                      log.action === 'POLICY_UPDATED' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-slate-700/50 text-slate-300'
                    }`}>
                      {log.action}
                    </span>
                    <span className="font-bold text-slate-200">{log.targetResource}</span>
                  </div>
                  <p className="text-slate-400">{log.details}</p>
                </div>
                <div className="text-right text-[10px] text-slate-400 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security & OU Summary Box */}
        <div className="bg-[#0d121c] p-5 rounded-2xl border border-[#192434] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="w-4 h-4 text-[#1ce783]" />
              <h3 className="text-sm font-bold text-white font-['Outfit']">
                Políticas de Segurança skoolia
              </h3>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              O domínio <strong className="text-white">@skoolia.com</strong> exige autenticação em 2 etapas obrigatória (2SV) e bloqueio de compartilhamento externo de arquivos confidenciais.
            </p>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 bg-[#121824] rounded-xl border border-[#1b2636] text-xs">
                <span className="text-slate-300">2SV Obrigatório (FIDO2/App)</span>
                <span className="text-[#1ce783] font-bold">Ativo</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-[#121824] rounded-xl border border-[#1b2636] text-xs">
                <span className="text-slate-300">DLP (Prevenção de Vazamento)</span>
                <span className="text-[#1ce783] font-bold">Ativo</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-[#121824] rounded-xl border border-[#1b2636] text-xs">
                <span className="text-slate-300">Tempo de Sessão Google</span>
                <span className="text-slate-300 font-semibold">12 horas</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#182333]">
            <button
              onClick={() => onNavigateTab('security')}
              className="w-full bg-[#17202e] hover:bg-[#1f2c3f] text-slate-200 hover:text-white py-2 rounded-xl text-xs font-semibold transition-all border border-[#24334a]"
            >
              Auditar Configurações de Segurança
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
