import React from 'react';
import {
  Users,
  Globe,
  UserX,
  CreditCard,
  HardDrive,
  CheckCircle2,
  Building2,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import { WorkspaceUser, WorkspaceDomain, LicenseInventory, Tenant } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface DashboardViewProps {
  users: WorkspaceUser[];
  selectedDomain: string;
  domains?: WorkspaceDomain[];
  licenses?: LicenseInventory[];
  isSuperAdmin?: boolean;
  tenants?: Tenant[];
  currentTenantId?: string;
  onSelectTenant?: (tenantId: string) => void;
  onNavigateToTenants?: () => void;
  onOpenCreateUser?: () => void;
  onOpenBatchImport?: () => void;
  onSelectUserForEdit?: (user: WorkspaceUser) => void;
  onToggleUserStatus?: (user: WorkspaceUser) => void;
  onResetUserPassword?: (user: WorkspaceUser) => void;
  onDeleteUser?: (user: WorkspaceUser) => void;
  onExportCsv?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  users,
  domains = [],
  isSuperAdmin = false,
  tenants = [],
  currentTenantId,
  onSelectTenant,
  onNavigateToTenants,
}) => {
  const { t } = useLanguage();

  // 1. Qtd de usuários
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'ACTIVE').length;

  // 2. Quantidade de domínios
  const totalDomains = domains.length;
  const activeDomainsCount = domains.filter((d) => d.verified).length;

  // 3. Contas suspensas
  const suspendedUsers = users.filter((u) => u.status === 'SUSPENDED').length;

  // 5. Valor do Plano (cálculo mensal somado de edições Workspace)
  const planMonthlyCost = users.reduce((acc, user) => {
    let cost = 0;
    if (user.licenses.includes('Google Workspace Enterprise Plus')) cost += 36;
    else if (user.licenses.includes('Google Workspace Business Standard')) cost += 14.4;
    else if (user.licenses.includes('Google Workspace Business Starter')) cost += 7.2;
    return acc + cost;
  }, 0);

  // 6. Armazenamento usado no Google Drive
  const totalStorageUsedGb = users.reduce((acc, user) => acc + (user.storageUsageGb || 0), 0);
  const formattedStorageUsed =
    totalStorageUsedGb >= 1000
      ? `${(totalStorageUsedGb / 1000).toFixed(2)} TB`
      : `${totalStorageUsedGb.toFixed(1)} GB`;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Quick Actions Bar - Wise Style */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#E2E6DF] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-[#E8F7DC] text-[#163300] text-xs font-black uppercase tracking-wider mb-2 border border-[#9FE870]/40">
            {t('dashboard.tagGeneral')}
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-[#0E0F0C] font-['Outfit'] tracking-tight">
            {t('dashboard.overviewTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-[#5E605D] mt-0.5 font-medium">
            {t('dashboard.overviewSubtitle')}
          </p>
        </div>
      </div>

      {/* 6 Metric Boxes - Wise Card Architecture */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
        {/* Box 1: Qtd de Usuários */}
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-[#E2E6DF] shadow-xs flex items-center justify-between gap-3 card-interactive group cursor-default">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-[11px] font-black text-[#868685] uppercase tracking-wider font-['Outfit'] truncate">
              {t('dashboard.totalUsers')}
            </p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0E0F0C] font-['Outfit'] tracking-tight mt-1 tabular-nums">
              {totalUsers}
            </p>
            <p className="text-xs font-semibold text-[#5E605D] mt-1 truncate tabular-nums">
              {totalUsers > 0
                ? t('dashboard.percentActive', {
                    active: activeUsers,
                    percent: ((activeUsers / totalUsers) * 100).toFixed(0),
                  })
                : t('dashboard.noUsersRegistered')}
            </p>
          </div>
          <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#E8F7DC] text-[#163300] flex items-center justify-center shrink-0 shadow-2xs transition-transform duration-200 group-hover:scale-110">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
          </div>
        </div>

        {/* Box 2: Quantidade de Domínios */}
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-[#E2E6DF] shadow-xs flex items-center justify-between gap-3 card-interactive group cursor-default">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-[11px] font-black text-[#868685] uppercase tracking-wider font-['Outfit'] truncate">
              {t('dashboard.configuredDomains')}
            </p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0E0F0C] font-['Outfit'] tracking-tight mt-1 tabular-nums">
              {totalDomains}
            </p>
            <p className="text-xs font-semibold text-[#5E605D] mt-1 flex items-center gap-1 truncate">
              {totalDomains > 0 ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#163300] shrink-0" />
                  <span className="text-[#163300] font-bold truncate">{t('dashboard.allVerified')}</span>
                </>
              ) : (
                <span className="truncate">{t('dashboard.noDomains')}</span>
              )}
            </p>
          </div>
          <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#F4F5F0] text-[#0E0F0C] flex items-center justify-center shrink-0 border border-[#E2E6DF] transition-transform duration-200 group-hover:scale-110">
            <Globe className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
          </div>
        </div>

        {/* Box 3: Contas Suspensas */}
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-[#E2E6DF] shadow-xs flex items-center justify-between gap-3 card-interactive group cursor-default">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-[11px] font-black text-[#868685] uppercase tracking-wider font-['Outfit'] truncate">
              {t('dashboard.suspendedUsers')}
            </p>
            <p
              className={`text-2xl sm:text-3xl lg:text-4xl font-black font-['Outfit'] tracking-tight mt-1 tabular-nums ${
                suspendedUsers > 0 ? 'text-amber-600' : 'text-[#0E0F0C]'
              }`}
            >
              {suspendedUsers}
            </p>
            <p className="text-xs font-semibold text-[#5E605D] mt-1 truncate tabular-nums">
              {suspendedUsers === 0
                ? t('dashboard.noSuspended')
                : t('dashboard.requiresAttention', { count: suspendedUsers })}
            </p>
          </div>
          <div
            className={`w-11 h-11 sm:w-13 sm:h-13 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 ${
              suspendedUsers > 0
                ? 'bg-amber-100 text-amber-800'
                : 'bg-[#F4F5F0] text-[#0E0F0C] border border-[#E2E6DF]'
            }`}
          >
            <UserX className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
          </div>
        </div>

        {/* Box 4: Domínios Ativos */}
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-[#E2E6DF] shadow-xs flex items-center justify-between gap-3 card-interactive group cursor-default">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-[11px] font-black text-[#868685] uppercase tracking-wider font-['Outfit'] truncate">
              {t('dashboard.activeDomains')}
            </p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0E0F0C] font-['Outfit'] tracking-tight mt-1 tabular-nums">
              {activeDomainsCount}
            </p>
            <p className="text-xs font-semibold text-[#5E605D] mt-1 flex items-center gap-1 truncate">
              {activeDomainsCount > 0 ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#163300] shrink-0" />
                  <span className="text-[#163300] font-bold truncate">{t('dashboard.operationalActive')}</span>
                </>
              ) : (
                <span className="truncate">{t('dashboard.noActiveDomains')}</span>
              )}
            </p>
          </div>
          <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#E8F7DC] text-[#163300] flex items-center justify-center shrink-0 shadow-2xs transition-transform duration-200 group-hover:scale-110">
            <Globe className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
          </div>
        </div>

        {/* Box 5: Valor do Plano */}
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-[#E2E6DF] shadow-xs flex items-center justify-between gap-3 card-interactive group cursor-default">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-[11px] font-black text-[#868685] uppercase tracking-wider font-['Outfit'] truncate">
              {t('dashboard.planValue')}
            </p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0E0F0C] font-['Outfit'] tracking-tight mt-1 tabular-nums">
              ${planMonthlyCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs font-semibold text-[#5E605D] mt-1 truncate">
              {t('dashboard.estimatedMonthlyCost')}
            </p>
          </div>
          <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#F4F5F0] text-[#0E0F0C] flex items-center justify-center shrink-0 border border-[#E2E6DF] transition-transform duration-200 group-hover:scale-110">
            <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
          </div>
        </div>

        {/* Box 6: Armazenamento Usado no Drive */}
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-[#E2E6DF] shadow-xs flex items-center justify-between gap-3 card-interactive group cursor-default">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-[11px] font-black text-[#868685] uppercase tracking-wider font-['Outfit'] truncate">
              {t('dashboard.driveStorage')}
            </p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0E0F0C] font-['Outfit'] tracking-tight mt-1 tabular-nums">
              {formattedStorageUsed}
            </p>
          </div>
          <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#E8F7DC] text-[#163300] flex items-center justify-center shrink-0 shadow-2xs transition-transform duration-200 group-hover:scale-110">
            <HardDrive className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* SuperAdmin Tenants Directory Section */}
      {isSuperAdmin && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#E2E6DF] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E6DF] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E8F7DC] text-[#163300] flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-[#0E0F0C] font-['Outfit'] tracking-tight">
                    Escolas e Organizações Cadastradas
                  </h2>
                  <span className="bg-[#E8F7DC] text-[#163300] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#9FE870]/40">
                    {tenants.length} {tenants.length === 1 ? 'escola' : 'escolas'}
                  </span>
                </div>
                <p className="text-xs text-[#5E605D] mt-0.5 font-medium">
                  Visão consolidada: {tenants.filter((t) => t.isProfileComplete !== false).length} ativas/completas · {tenants.filter((t) => t.isProfileComplete === false).length} com formulário pendente
                </p>
              </div>
            </div>

            {onNavigateToTenants && (
              <button
                type="button"
                onClick={onNavigateToTenants}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#E2E6DF] hover:border-[#163300] bg-[#F4F5F0] hover:bg-white text-[#0E0F0C] text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0 active:scale-[0.98]"
              >
                <span>Ver Diretório Completo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {tenants.length === 0 ? (
            <div className="py-10 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-[#F4F5F0] border border-[#E2E6DF] flex items-center justify-center mx-auto mb-2.5 text-[#868685]">
                <Building2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-[#0E0F0C]">Nenhuma instituição cadastrada ainda</p>
              <p className="text-xs text-[#868685] mt-1 max-w-md mx-auto">
                Quando uma escola fizer login pelo Google ou criar conta, ela será listada automaticamente aqui em tempo real.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E2E6DF] text-[#868685] font-black uppercase text-[10px] tracking-wider font-['Outfit']">
                    <th className="py-2.5 px-3">Instituição / Escola</th>
                    <th className="py-2.5 px-3">Responsável & Contato</th>
                    <th className="py-2.5 px-3">Domínio Principal</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4F5F0]">
                  {tenants.map((t) => {
                    const isSelected = t.id === currentTenantId;
                    const primaryDomain = t.allowedDomains?.[0] || 'Domínio pendente';
                    return (
                      <tr key={t.id} className="hover:bg-[#F8F9F6] transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#E8F7DC] text-[#163300] font-black text-xs flex items-center justify-center shrink-0">
                              {t.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-bold text-[#0E0F0C] text-xs">{t.name}</p>
                                {t.isProfileComplete === false && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded-full whitespace-nowrap">
                                    <span>⚠️</span>
                                    <span>Incompleto</span>
                                  </span>
                                )}
                              </div>
                              {t.createdAt && (
                                <p className="text-[10px] text-[#868685]">
                                  Registrado em {new Date(t.createdAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-medium text-[#0E0F0C]">{t.primaryContactEmail || '-'}</p>
                          {t.financialContactEmail && t.financialContactEmail !== t.primaryContactEmail && (
                            <p className="text-[10px] text-[#868685]">Financeiro: {t.financialContactEmail}</p>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`font-mono text-xs ${t.allowedDomains?.length ? 'text-[#0E0F0C]' : 'text-[#868685] italic'}`}>
                            {primaryDomain}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              t.status === 'SUSPENDED'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : t.isProfileComplete === false
                                ? 'bg-amber-50 text-amber-800 border border-amber-300'
                                : t.status === 'TRIAL'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-[#E8F7DC] text-[#163300] border border-[#9FE870]/50'
                            }`}
                          >
                            {t.status === 'SUSPENDED'
                              ? 'Bloqueado'
                              : t.isProfileComplete === false
                              ? '⚠️ Formulário Pendente'
                              : t.status === 'TRIAL'
                              ? 'Degustação (30d)'
                              : 'Ativo'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-2 justify-end">
                            {isSelected ? (
                              <span className="px-2.5 py-1 rounded-full bg-[#163300] text-[#9FE870] font-bold text-[11px]">
                                Selecionada
                              </span>
                            ) : (
                              onSelectTenant && (
                                <button
                                  type="button"
                                  onClick={() => onSelectTenant(t.id)}
                                  className="px-2.5 py-1 rounded-full border border-[#CBD3C5] hover:border-[#163300] bg-white hover:bg-[#E8F7DC] text-[#163300] font-bold text-[11px] transition-all cursor-pointer shadow-2xs"
                                >
                                  Selecionar
                                </button>
                              )
                            )}
                            {onNavigateToTenants && (
                              <button
                                type="button"
                                onClick={onNavigateToTenants}
                                className="px-2.5 py-1 rounded-full border border-transparent hover:border-[#E2E6DF] text-[#5E605D] hover:text-[#0E0F0C] font-semibold text-[11px] transition-all cursor-pointer"
                              >
                                Administrar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
