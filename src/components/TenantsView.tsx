import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  Globe,
  Shield,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  X,
  Ban,
  ShieldAlert,
  ShieldCheck,
  Send,
  Trash2,
  Users,
  Settings,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import type { Tenant, WorkspaceDomain, WorkspaceUser } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { TenantAdminModal } from './TenantAdminModal';

interface TenantsViewProps {
  tenants: Tenant[];
  currentTenantId: string;
  isSuperAdmin?: boolean;
  users?: WorkspaceUser[];
  domains?: WorkspaceDomain[];
  onSelectTenant: (tenantId: string) => void;
  onCreateTenant: (tenant: Partial<Tenant>) => void;
  onDeleteTenant?: (tenantId: string) => Promise<void>;
  onUpdateTenant?: (
    tenantId: string,
    updates: Partial<Tenant>,
    customToast?: { title: string; message: string } | null
  ) => Promise<void>;
  onAddDomain?: (tenantId: string, domainName: string, isPrimary?: boolean) => Promise<void>;
  onDeleteDomain?: (domainName: string, tenantId?: string) => Promise<void>;
  onUpdateDomain?: (domainName: string, updates: Partial<WorkspaceDomain>) => Promise<void>;
  onOpenServiceAccountModal: () => void;
  onToggleTenantStatus?: (tenantId: string, status: 'ACTIVE' | 'SUSPENDED', reason?: string) => Promise<void>;
  onPreviewBlockingModal?: (tenant: Tenant) => void;
  onToggleUserStatus?: (user: WorkspaceUser) => void;
  onResetUserPassword?: (user: WorkspaceUser) => void;
  onDeleteUser?: (user: WorkspaceUser) => void;
  onExportCsv?: (selectedUsers?: WorkspaceUser[]) => void;
}

export const TenantsView: React.FC<TenantsViewProps> = ({
  tenants,
  currentTenantId,
  isSuperAdmin = false,
  users = [],
  domains = [],
  onSelectTenant,
  onCreateTenant,
  onDeleteTenant,
  onUpdateTenant,
  onAddDomain,
  onDeleteDomain,
  onUpdateDomain,
  onOpenServiceAccountModal,
  onToggleTenantStatus,
  onPreviewBlockingModal,
  onToggleUserStatus,
  onResetUserPassword,
  onDeleteUser,
  onExportCsv,
}) => {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INCOMPLETE' | 'SUSPENDED'>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Tenant Admin Modal (Full Management for SuperAdmin)
  const [selectedAdminTenant, setSelectedAdminTenant] = useState<Tenant | null>(null);

  // Delete Organization Confirmation Modal State
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [isDeletingTenant, setIsDeletingTenant] = useState(false);

  // Form state for creating a new tenant
  const [name, setName] = useState('');
  const [primaryContactEmail, setPrimaryContactEmail] = useState('');
  const [financialContactEmail, setFinancialContactEmail] = useState('');
  const [domain, setDomain] = useState('');
  const [monthlyBudgetUsd, setMonthlyBudgetUsd] = useState('1200');
  const [enterpriseSeats, setEnterpriseSeats] = useState('50');
  const [businessSeats, setBusinessSeats] = useState('100');

  // Helper to accurately calculate domains for each tenant
  const getTenantDomains = (tenant: Tenant): WorkspaceDomain[] => {
    const allowed = new Set((tenant.allowedDomains || []).map((d) => d.toLowerCase()));
    const contactDomain = tenant.primaryContactEmail?.split('@')[1]?.toLowerCase();
    const isGeneric = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'].includes(contactDomain || '');

    const matched = domains.filter((d) => {
      const dName = d.domainName.toLowerCase();
      const matchesId = d.tenantId === tenant.id || d.tenantId === tenant.id.replace(/^tenant-/, '');
      const inAllowed = allowed.has(dName);
      const matchesContact = !isGeneric && contactDomain && dName === contactDomain;
      return matchesId || inAllowed || matchesContact;
    });

    const existing = new Set(matched.map((m) => m.domainName.toLowerCase()));
    (tenant.allowedDomains || []).forEach((ad) => {
      if (!existing.has(ad.toLowerCase())) {
        matched.push({
          domainName: ad,
          tenantId: tenant.id,
          isPrimary: matched.length === 0,
          verified: true,
          mxConfigured: true,
          spfConfigured: true,
          dkimConfigured: true,
        });
      }
    });

    return matched;
  };

  // Helper to accurately calculate users for each tenant
  const getTenantUsers = (tenant: Tenant): WorkspaceUser[] => {
    const tDomains = getTenantDomains(tenant).map((d) => d.domainName.toLowerCase());
    const allowedSet = new Set([...(tenant.allowedDomains || []).map((d) => d.toLowerCase()), ...tDomains]);
    const contactDomain = tenant.primaryContactEmail?.split('@')[1]?.toLowerCase();
    const isGeneric = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'].includes(contactDomain || '');

    return users.filter((u) => {
      const uDomain = u.primaryEmail?.split('@')[1]?.toLowerCase();
      if (!uDomain) return false;
      return allowedSet.has(uDomain) || (!isGeneric && contactDomain && uDomain === contactDomain);
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || (!primaryContactEmail.trim() && !financialContactEmail.trim())) return;

    const effectivePrimary = (primaryContactEmail.trim() || financialContactEmail.trim()).toLowerCase();
    const effectiveFinancial = (financialContactEmail.trim() || primaryContactEmail.trim()).toLowerCase();

    onCreateTenant({
      name: name.trim(),
      primaryContactEmail: effectivePrimary,
      financialContactEmail: effectiveFinancial,
      allowedDomains: domain.trim() ? [domain.trim().toLowerCase()] : [],
      monthlyBudgetUsd: parseFloat(monthlyBudgetUsd) || 1000,
      contractedSeats: [
        { sku: 'Google Workspace Enterprise Plus', allocatedSeats: parseInt(enterpriseSeats) || 50 },
        { sku: 'Google Workspace Business Standard', allocatedSeats: parseInt(businessSeats) || 100 },
      ],
      status: 'TRIAL',
      createdBySuperAdmin: true,
      skipWelcomeEmail: true,
    } as any);

    setName('');
    setPrimaryContactEmail('');
    setFinancialContactEmail('');
    setDomain('');
    setIsCreateModalOpen(false);
  };

  const handleConfirmDeleteTenant = async () => {
    if (!tenantToDelete) return;
    setIsDeletingTenant(true);
    try {
      if (onDeleteTenant) {
        await onDeleteTenant(tenantToDelete.id);
      } else {
        await fetch(`/api/tenants/${tenantToDelete.id}`, { method: 'DELETE' });
      }
      setTenantToDelete(null);
    } catch (err: any) {
      alert(`Falha ao excluir organização: ${err?.message || 'Erro inesperado'}`);
    } finally {
      setIsDeletingTenant(false);
    }
  };

  const filteredTenants = tenants.filter((tenant) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      tenant.name.toLowerCase().includes(q) ||
      tenant.primaryContactEmail.toLowerCase().includes(q) ||
      tenant.rootOrgUnitPath.toLowerCase().includes(q) ||
      tenant.allowedDomains?.some((d) => d.toLowerCase().includes(q));

    let matchesStatus = true;
    if (statusFilter === 'ACTIVE') {
      matchesStatus = tenant.status !== 'SUSPENDED' && tenant.isProfileComplete !== false;
    }
    if (statusFilter === 'INCOMPLETE') {
      matchesStatus = tenant.isProfileComplete === false;
    }
    if (statusFilter === 'SUSPENDED') {
      matchesStatus = tenant.status === 'SUSPENDED';
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#E2E6DF] shadow-xs space-y-4 sm:space-y-5">
        {/* Row 1: Title & Main Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E8F7DC] text-[#163300] flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 sm:gap-2.5">
                <h1 className="text-lg sm:text-2xl font-black text-[#0E0F0C] font-['Outfit'] tracking-tight">
                  {t('tenants.title')}
                </h1>
                <span className="bg-[#E8F7DC] text-[#163300] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#9FE870]/40">
                  {tenants.length} {t('common.accounts')}
                </span>
              </div>
              <p className="text-xs text-[#5E605D] mt-0.5 font-medium">
                {isSuperAdmin
                  ? t('tenants.superAdminSubtitle')
                  : t('tenants.tenantSubtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-stretch sm:self-auto">
            <button
              type="button"
              onClick={onOpenServiceAccountModal}
              id="btn-service-account-settings"
              className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-full border border-[#E2E6DF] hover:border-[#163300] bg-white text-[#0E0F0C] hover:text-[#163300] font-bold text-xs sm:text-sm transition-all inline-flex items-center justify-center gap-2 shadow-2xs cursor-pointer active:scale-[0.98]"
            >
              <Shield className="w-4 h-4 text-[#5E605D]" />
              <span>{t('tenants.serviceAccountSettings')}</span>
            </button>

            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                id="btn-create-tenant"
                className="h-9 sm:h-10 px-4 sm:px-5 rounded-full bg-[#9FE870] hover:bg-[#8EE05B] text-[#163300] text-xs sm:text-sm font-black transition-all inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-[0.98]"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span className="whitespace-nowrap">{t('tenants.createOrganization')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Search Bar & Quick Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-3.5 border-t border-[#F4F5F0]">
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 text-[#868685] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="input-tenants-search"
              placeholder={t('tenants.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 sm:h-10 bg-[#F4F5F0] border border-[#E2E6DF] pl-10 pr-10 rounded-full text-xs sm:text-sm text-[#0E0F0C] placeholder-[#868685] focus:outline-none focus:border-[#163300] focus:bg-white transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#868685] hover:text-[#0E0F0C] cursor-pointer"
              >
                {t('common.clear')}
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: `${t('tenants.tabAll')} (${tenants.length})` },
              {
                id: 'ACTIVE',
                label: `${t('tenants.tabActive')} (${tenants.filter((tenant) => tenant.status !== 'SUSPENDED' && tenant.isProfileComplete !== false).length})`,
              },
              {
                id: 'INCOMPLETE',
                label: `${t('tenants.tabIncomplete') || 'Formulário Pendente'} (${tenants.filter((tenant) => tenant.isProfileComplete === false).length})`,
                hasBadge: tenants.some((tenant) => tenant.isProfileComplete === false),
              },
              {
                id: 'SUSPENDED',
                label: `${t('tenants.tabSuspended')} (${tenants.filter((tenant) => tenant.status === 'SUSPENDED').length})`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
                className={`h-8 sm:h-9 px-3.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-[#163300] text-[#9FE870] shadow-xs'
                    : tab.id === 'INCOMPLETE' && (tab as any).hasBadge
                    ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                    : 'bg-[#F4F5F0] text-[#5E605D] hover:text-[#0E0F0C] hover:bg-[#E2E6DF]'
                }`}
              >
                {tab.id === 'INCOMPLETE' && (tab as any).hasBadge && statusFilter !== 'INCOMPLETE' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                )}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Organizations List / Table Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E2E6DF] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#F8F9F5] border-b border-[#E2E6DF] text-[#5E605D] font-bold uppercase text-[11px] tracking-wider font-['Outfit']">
                <th className="py-3.5 px-5">{t('tenants.tableHeaders.organization')}</th>
                <th className="py-3.5 px-4">{t('tenants.tableHeaders.domains')}</th>
                <th className="py-3.5 px-4">{t('tenants.tableHeaders.licensesInUse')}</th>
                <th className="py-3.5 px-4">{t('tenants.tableHeaders.status')}</th>
                <th className="py-3.5 px-5 text-right">{t('tenants.tableHeaders.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E6DF]">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 space-y-2">
                    <Building2 className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-semibold text-slate-600">{t('tenants.noTenantsFound')}</p>
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => {
                  const isSelected = tenant.id === currentTenantId;

                  // Real accurate domain calculation
                  const tenantDomainsList = getTenantDomains(tenant);
                  const domainCount = Math.max(tenantDomainsList.length, tenant.allowedDomains?.length || 0);
                  const primaryDomain =
                    tenantDomainsList.find((d) => d.isPrimary)?.domainName ||
                    tenantDomainsList[0]?.domainName ||
                    tenant.allowedDomains?.[0];

                  // Accurate user and license calculation: count licenses in use by tenant
                  const tenantUsersList = getTenantUsers(tenant);
                  const inUseLicenses = tenantUsersList.length;

                  return (
                    <tr
                      key={tenant.id}
                      onClick={() => {
                        if (isSuperAdmin) {
                          setSelectedAdminTenant(tenant);
                        }
                      }}
                      className={`transition-colors ${
                        isSuperAdmin ? 'cursor-pointer hover:bg-slate-50' : 'hover:bg-slate-50/60'
                      } ${isSelected ? 'bg-emerald-50/30' : ''}`}
                    >
                      {/* Organização */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 truncate">
                                {tenant.name}
                              </span>
                              {tenant.isProfileComplete === false && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                  <span>⚠️</span>
                                  <span>Incompleto</span>
                                </span>
                              )}
                              {isSuperAdmin && (
                                <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                                  {tenant.slug || tenant.id}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 font-mono truncate">
                              {tenant.primaryContactEmail}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Coluna com Número de Domínios */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${
                                domainCount > 0
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}
                            >
                              <Globe className="w-3 h-3 text-emerald-600" />
                              <span>{domainCount} {domainCount === 1 ? t('tenants.domainCountSingle') : t('tenants.domainCountPlural')}</span>
                            </span>
                          </div>
                          {primaryDomain ? (
                            <span className="font-mono text-[11px] text-slate-600 truncate max-w-[180px]">
                              {primaryDomain}
                              {domainCount > 1 && (
                                <span className="ml-1 text-[10px] text-slate-400 font-semibold">
                                  (+{domainCount - 1})
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">{t('tenants.noneRegistered')}</span>
                          )}
                        </div>
                      </td>

                      {/* Licenças em Uso */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                            <CreditCard className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                            <span className="text-slate-900 font-extrabold">{inUseLicenses}</span>
                            <span className="text-slate-600 font-medium">
                              {inUseLicenses === 1 ? t('tenants.licenseCountSingle') : t('tenants.licenseCountPlural')}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {tenant.status === 'SUSPENDED' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            {t('tenants.suspendedTag')}
                          </span>
                        ) : tenant.isProfileComplete === false ? (
                          <div className="flex flex-col gap-0.5">
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs whitespace-nowrap"
                              title={t('tenants.incompleteDesc') || 'Conta cadastrada, formulário de endereço e telefone pendentes'}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                              <span>{t('tenants.incompleteTag') || 'Formulário Pendente'}</span>
                            </span>
                            <span className="text-[10px] text-amber-700 font-medium">
                              {tenant.status === 'TRIAL' ? 'Trial · Dados pendentes' : 'Dados pendentes'}
                            </span>
                          </div>
                        ) : tenant.status === 'TRIAL' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            {t('tenants.trialTag')} (30d)
                          </span>
                        ) : isSelected ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {t('tenants.activeTag')} ({t('tenants.inUse')})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {t('tenants.activeTag')}
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* SuperAdmin Action: Open Admin Modal */}
                          {isSuperAdmin ? (
                            <button
                              type="button"
                              onClick={() => setSelectedAdminTenant(tenant)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                              title={t('tenants.switchTenant')}
                            >
                              <Settings className="w-3.5 h-3.5" />
                              <span>{t('tenants.manage')}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onSelectTenant(tenant.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                            >
                              <span>{t('tenants.select')}</span>
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                            </button>
                          )}

                          {/* SuperAdmin Action: Delete Tenant with Modal */}
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => setTenantToDelete(tenant)}
                              title={t('tenants.deleteOrganization')}
                              className="p-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Summary Counter */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>
            {t('tenants.showingOrganizations', {
              count: filteredTenants.length.toString(),
              total: tenants.length.toString(),
            })}
          </span>
          {isSuperAdmin && (
            <span className="text-slate-400 text-[11px]">
              {t('tenants.rowClickHint')}
            </span>
          )}
        </div>
      </div>

      {/* MODAL: ADMINISTRAÇÃO DO TENANT (SUPERADMIN ONLY) */}
      {selectedAdminTenant && isSuperAdmin && (
        <TenantAdminModal
          tenant={selectedAdminTenant}
          isOpen={Boolean(selectedAdminTenant)}
          onClose={() => setSelectedAdminTenant(null)}
          isSuperAdmin={isSuperAdmin}
          allUsers={users}
          allDomains={domains}
          onPreviewBlockingModal={onPreviewBlockingModal}
          onUpdateTenant={async (tenantId, updates, customToast) => {
            if (onUpdateTenant) {
              await onUpdateTenant(tenantId, updates, customToast);
            }
            setSelectedAdminTenant((prev) => (prev && prev.id === tenantId ? { ...prev, ...updates } : prev));
          }}
          onDeleteTenant={async (tenantId) => {
            if (onDeleteTenant) {
              await onDeleteTenant(tenantId);
            }
            setSelectedAdminTenant(null);
          }}
          onAddDomain={async (tenantId, domainName, isPrimary) => {
            if (onAddDomain) {
              await onAddDomain(tenantId, domainName, isPrimary);
            }
          }}
          onDeleteDomain={async (domainName, tenantId) => {
            if (onDeleteDomain) {
              await onDeleteDomain(domainName, tenantId);
            }
          }}
          onUpdateDomain={async (domainName, updates) => {
            if (onUpdateDomain) {
              await onUpdateDomain(domainName, updates);
            }
          }}
          onToggleUserStatus={onToggleUserStatus}
          onResetUserPassword={onResetUserPassword}
          onDeleteUser={onDeleteUser}
          onExportCsv={onExportCsv}
        />
      )}

      {/* MODAL: CONFIRMAR EXCLUSÃO DA ORGANIZAÇÃO */}
      {tenantToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-rose-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 font-['Outfit']">
                  {t('tenants.deleteConfirmModal.title')}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {t('tenants.deleteConfirmModal.description', { name: tenantToDelete.name })}
                </p>
              </div>

              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-left text-xs text-rose-800 space-y-1 font-mono">
                <div>ID: {tenantToDelete.id}</div>
                <div>{t('tenants.deleteConfirmModal.contact')}: {tenantToDelete.primaryContactEmail}</div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isDeletingTenant}
                  onClick={() => setTenantToDelete(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  {t('tenants.deleteConfirmModal.cancel')}
                </button>
                <button
                  type="button"
                  disabled={isDeletingTenant}
                  onClick={handleConfirmDeleteTenant}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2"
                >
                  {isDeletingTenant ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('tenants.deleteConfirmModal.deleting')}</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('tenants.deleteConfirmModal.confirm')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Creating New Organization */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/50 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-['Outfit']">
                    {t('tenants.createModal.title') || 'Nova Organização'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('tenants.createModal.subtitle') || 'Cadastre uma nova instituição educacional no sistema.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t('tenants.createModal.nameLabel') || 'Nome da Organização / Instituição'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Colégio Bandeirantes"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00c868]/30 focus:border-[#00c868]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('tenants.createModal.contactEmailLabel') || 'E-mail do Administrador (Login)'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={primaryContactEmail}
                    onChange={(e) => setPrimaryContactEmail(e.target.value)}
                    placeholder="admin@colegio.edu.br"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00c868]/30 focus:border-[#00c868]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('tenants.createModal.financialEmailLabel') || 'E-mail do Responsável Financeiro'}
                  </label>
                  <input
                    type="email"
                    value={financialContactEmail}
                    onChange={(e) => setFinancialContactEmail(e.target.value)}
                    placeholder="financeiro@colegio.edu.br"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00c868]/30 focus:border-[#00c868]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t('tenants.createModal.allowedDomainLabel') || 'Domínio Principal do Google Workspace'}
                </label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="colegio.edu.br"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#00c868]/30 focus:border-[#00c868]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  {t('common.cancel') || 'Cancelar'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#00c868] hover:bg-[#00b05b] text-white font-bold cursor-pointer transition-all shadow-xs"
                >
                  {t('tenants.createModal.submitBtn') || 'Criar Organização'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
