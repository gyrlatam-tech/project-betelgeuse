import React, { useState } from 'react';
import { Building2, Plus, Check, ShieldCheck, Globe, Users } from 'lucide-react';
import type { Tenant } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface TenantSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenants: Tenant[];
  currentTenantId: string;
  onSelectTenant: (tenantId: string) => void;
  onCreateTenant: (tenant: Partial<Tenant>) => void;
}

export const TenantSelectorModal: React.FC<TenantSelectorModalProps> = ({
  isOpen,
  onClose,
  tenants,
  currentTenantId,
  onSelectTenant,
  onCreateTenant,
}) => {
  const { t, language } = useLanguage();
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [primaryContactEmail, setPrimaryContactEmail] = useState('');
  const [domain, setDomain] = useState('');
  const [monthlyBudgetUsd, setMonthlyBudgetUsd] = useState('1500');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !primaryContactEmail) return;

    onCreateTenant({
      name,
      primaryContactEmail,
      allowedDomains: domain ? [domain.trim().toLowerCase()] : [],
      monthlyBudgetUsd: parseFloat(monthlyBudgetUsd) || 1000,
      createdBySuperAdmin: true,
      skipWelcomeEmail: true,
    } as any);

    setName('');
    setPrimaryContactEmail('');
    setDomain('');
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E0F0C]/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-[#E2E6DF] overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-[#163300] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#9FE870] flex items-center justify-center text-[#163300]">
              <Building2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-black font-['Outfit'] text-white">Gestão de Organizações</h2>
              <p className="text-xs text-[#CBD3C5]">
                Alterne entre organizações isoladas dentro do painel educacional
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
        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
          {!isCreating ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-[#868685] uppercase tracking-wider font-['Outfit']">
                  Organizações Cadastradas ({tenants.length})
                </span>
                <button
                  onClick={() => setIsCreating(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#163300] hover:text-[#0E0F0C] bg-[#E8F7DC] px-3 py-1.5 rounded-full border border-[#9FE870]/40 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Novo Tenant
                </button>
              </div>

              <div className="space-y-3">
                {tenants.map((tenant) => {
                  const isSelected = tenant.id === currentTenantId;
                  return (
                    <div
                      key={tenant.id}
                      onClick={() => {
                        onSelectTenant(tenant.id);
                        onClose();
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-[#163300] bg-[#E8F7DC]/40 ring-2 ring-[#9FE870]/40'
                          : 'border-[#E2E6DF] hover:border-[#D4DACF] hover:bg-[#F4F5F0]'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#0E0F0C]">{tenant.name}</span>
                          {tenant.isProfileComplete === false && (
                            <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              ⚠️ Formulário Pendente
                            </span>
                          )}
                          {isSelected && (
                            <span className="bg-[#163300] text-[#9FE870] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                              Ativo
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-[#5E605D] flex-wrap">
                          {tenant.primaryContactEmail && (
                            <span className="font-mono text-[11px] text-slate-500">
                              {tenant.primaryContactEmail}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5" />
                            {tenant.allowedDomains?.length
                              ? tenant.allowedDomains.join(', ')
                              : 'Sem domínio restrito'}
                          </span>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-8 h-8 rounded-full bg-[#163300] text-[#9FE870] flex items-center justify-center font-bold">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      ) : (
                        <button className="px-3.5 py-1.5 rounded-full text-xs font-bold text-[#0E0F0C] bg-[#F4F5F0] hover:bg-[#E2E6DF] transition-colors">
                          Acessar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="p-3.5 bg-[#E8F7DC] border border-[#9FE870]/60 rounded-2xl text-[#163300] text-xs flex items-center gap-2 font-medium">
                <ShieldCheck className="w-4 h-4 text-[#163300] shrink-0" />
                <span>
                  A nova organização terá gerenciamento de usuários e domínios com limite de licenças definido.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E0F0C] mb-1.5">
                  {language === 'en' ? 'Organization / Tenant Name *' : language === 'es' ? 'Nombre de la Organización / Tenant *' : 'Nome da Organização / Tenant *'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={language === 'en' ? 'e.g. Anglo Central Academy' : language === 'es' ? 'Ej: Colegio Anglo Central' : 'Ex: Colégio Anglo Central'}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E6DF] bg-[#F4F5F0] text-sm text-[#0E0F0C] focus:outline-none focus:border-[#163300]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E0F0C] mb-1.5">
                  {language === 'en' ? 'Tenant Admin Email *' : language === 'es' ? 'Email del Administrador del Tenant *' : 'E-mail do Administrador do Tenant *'}
                </label>
                <input
                  type="email"
                  required
                  value={primaryContactEmail}
                  onChange={(e) => setPrimaryContactEmail(e.target.value)}
                  placeholder={language === 'en' ? 'admin@academy.edu' : 'admin@escolaanglo.edu.br'}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E6DF] bg-[#F4F5F0] text-sm text-[#0E0F0C] focus:outline-none focus:border-[#163300]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E0F0C] mb-1.5">
                  {language === 'en' ? 'Custom Tenant Domain' : language === 'es' ? 'Dominio Propio del Tenant' : 'Domínio Próprio do Tenant'}
                </label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder={language === 'en' ? 'academy.edu' : 'escolaanglo.edu.br'}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E6DF] bg-[#F4F5F0] text-sm text-[#0E0F0C] focus:outline-none focus:border-[#163300]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-3 rounded-full border border-[#D4DACF] text-xs font-bold text-[#0E0F0C] hover:bg-[#F4F5F0] transition-colors cursor-pointer"
                >
                  {language === 'en' ? 'Back' : language === 'es' ? 'Volver' : 'Voltar'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-full bg-[#00c868] hover:bg-[#00b05b] text-white text-xs font-black transition-colors cursor-pointer shadow-xs"
                >
                  {language === 'en' ? 'Create and Activate Tenant' : language === 'es' ? 'Crear y Activar Tenant' : 'Criar e Ativar Tenant'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F4F5F0] border-t border-[#E2E6DF] flex items-center justify-between text-xs text-[#5E605D]">
          <span>
            {language === 'en' ? 'Institutional Administrator Mode Active' : language === 'es' ? 'Modo Administrador Institucional Activo' : 'Modo Administrador Institucional Ativo'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-[#E2E6DF] hover:bg-[#D4DACF] text-[#0E0F0C] font-bold transition-colors cursor-pointer"
          >
            {t('common.close') || (language === 'en' ? 'Close' : language === 'es' ? 'Cerrar' : 'Fechar')}
          </button>
        </div>
      </div>
    </div>
  );
};
