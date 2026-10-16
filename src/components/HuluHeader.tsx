import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  LogOut,
  Bell,
  Globe,
  User,
  Settings,
  LayoutDashboard,
  CreditCard,
  UserPlus,
  FileSpreadsheet,
  Layers,
  Receipt,
  LifeBuoy,
  Building2,
  ShieldCheck,
  Mail,
  Key,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  FileText,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import type { Tenant, ServiceAccountStatus, InstitutionProfile, WorkspaceDomain, WorkspaceUser } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

interface SkooliaHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedDomain?: string;
  onDomainChange?: (domain: string) => void;
  domains?: WorkspaceDomain[];
  users?: WorkspaceUser[];
  onOpenCreateUser?: () => void;
  onOpenBatchImport?: () => void;
  onOpenAddDomain?: () => void;
  onSelectUser?: (user: WorkspaceUser) => void;
  onSelectDomain?: (domainName: string) => void;
  activeTab?: string;
  setActiveTab: (tab: string) => void;
  currentTenant?: Tenant;
  onOpenTenantSelector?: () => void;
  serviceAccountStatus?: ServiceAccountStatus | null;
  onOpenServiceAccountModal?: () => void;
  onSyncWorkspace?: () => void;
  isSyncing?: boolean;
  institution?: InstitutionProfile | null;
  pendingTicketsCount?: number;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

interface SearchResultItem {
  id: string;
  type: 'domain' | 'user' | 'function';
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: 'green' | 'amber' | 'neutral';
  icon: React.ElementType;
  action: () => void;
}

export const SkooliaHeader: React.FC<SkooliaHeaderProps> = ({
  searchQuery,
  onSearchChange,
  selectedDomain,
  domains = [],
  users = [],
  onOpenCreateUser,
  onOpenBatchImport,
  onOpenAddDomain,
  onSelectUser,
  onSelectDomain,
  setActiveTab,
  currentTenant,
  onOpenTenantSelector,
  serviceAccountStatus,
  onOpenServiceAccountModal,
  onSyncWorkspace,
  isSyncing,
  institution: propInstitution,
  pendingTicketsCount = 0,
  isMobileMenuOpen = false,
  onToggleMobileMenu,
}) => {
  const { user, institution: authInstitution, logout, isSuperAdmin } = useAuth();
  const { t } = useLanguage();
  const activeInstitution = propInstitution || authInstitution;

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // System functions catalogue
  const systemFunctions = useMemo(() => {
    const list: SearchResultItem[] = [
      {
        id: 'func-dashboard',
        type: 'function',
        title: t('sidebar.dashboard') || 'Dashboard',
        subtitle: 'Visão geral, métricas e atalhos da instituição',
        icon: LayoutDashboard,
        action: () => setActiveTab('dashboard'),
      },
      {
        id: 'func-licenses',
        type: 'function',
        title: t('sidebar.licenses') || 'Licenças e Armazenamento',
        subtitle: 'Gerenciar contas, licenças for Education e cotas',
        icon: CreditCard,
        action: () => setActiveTab('licenses'),
      },
      {
        id: 'func-create-user',
        type: 'function',
        title: t('modals.createUser.title') || 'Criar Novo Usuário',
        subtitle: 'Cadastrar nova conta individual no Google Workspace',
        icon: UserPlus,
        action: () => {
          if (onOpenCreateUser) onOpenCreateUser();
          else setActiveTab('licenses');
        },
      },
      {
        id: 'func-batch-import',
        type: 'function',
        title: t('modals.batchImport.title') || 'Importação em Lote (Planilha)',
        subtitle: 'Provisionar dezenas de usuários via planilha XLSX ou CSV',
        icon: FileSpreadsheet,
        action: () => {
          if (onOpenBatchImport) onOpenBatchImport();
          else setActiveTab('licenses');
        },
      },
      {
        id: 'func-domains',
        type: 'function',
        title: t('sidebar.domains') || 'Gerenciamento de Domínios',
        subtitle: 'Registros DNS, verificação MX/TXT e domínios ativos',
        icon: Globe,
        action: () => setActiveTab('domains'),
      },
      {
        id: 'func-services',
        type: 'function',
        title: t('sidebar.additionalServices') || 'Serviços Adicionais',
        subtitle: 'Gemini Education, Google Classroom, Meet e Drive',
        icon: Layers,
        action: () => setActiveTab('services'),
      },
      {
        id: 'func-billing',
        type: 'function',
        title: t('sidebar.billing') || 'Faturamento e Assinaturas',
        subtitle: 'Consultar histórico de faturas, recibos e planos',
        icon: Receipt,
        action: () => setActiveTab('billing'),
      },
      {
        id: 'func-contracts',
        type: 'function',
        title: t('sidebar.contracts') || 'Contratos e Termos Legais',
        subtitle: 'Termos de Serviço Universal, Política de Privacidade e SLA',
        icon: FileText,
        action: () => {
          if (window.location.pathname !== '/contracts') {
            window.history.pushState({ contractSlug: null }, '', '/contracts');
          }
          setActiveTab('contracts');
        },
      },
      {
        id: 'func-settings',
        type: 'function',
        title: t('sidebar.settings') || 'Configurações do Sistema',
        subtitle: 'Políticas da instituição, segurança 2SV e dados cadastrais',
        icon: Settings,
        action: () => setActiveTab('settings'),
      },
      {
        id: 'func-support',
        type: 'function',
        title: t('sidebar.support') || 'Suporte e Chamados',
        subtitle: 'Atendimento técnico com a equipe de especialistas',
        icon: LifeBuoy,
        action: () => setActiveTab('support'),
      },
    ];

    if (onSyncWorkspace) {
      list.push({
        id: 'func-sync',
        type: 'function',
        title: t('header.syncWorkspace') || 'Sincronizar com Google Workspace',
        subtitle: 'Atualizar usuários e domínios em tempo real com o Google',
        icon: RefreshCw,
        action: () => onSyncWorkspace(),
      });
    }

    if (isSuperAdmin) {
      list.push(
        {
          id: 'func-tenants',
          type: 'function',
          title: t('sidebar.tenants') || 'Gestão de Tenants / Instituições',
          subtitle: 'Painel global de instituições educacionais atendidas',
          icon: Building2,
          action: () => setActiveTab('tenants'),
        },
        {
          id: 'func-approvals',
          type: 'function',
          title: t('sidebar.approvals') || 'Aprovação de Domínios',
          subtitle: 'Validar novos domínios pendentes de aprovação técnica',
          icon: ShieldCheck,
          action: () => setActiveTab('approvals'),
        },
        {
          id: 'func-emails',
          type: 'function',
          title: t('sidebar.emailTemplates') || 'Modelos de E-mail',
          subtitle: 'Configurar notificações e mensagens automáticas aos usuários',
          icon: Mail,
          action: () => setActiveTab('emails'),
        }
      );

      if (onOpenServiceAccountModal) {
        list.push({
          id: 'func-service-account',
          type: 'function',
          title: 'Credenciais Google Workspace (DWD)',
          subtitle: 'Gerenciar Conta de Serviço e Chave Privada JSON',
          icon: Key,
          action: () => onOpenServiceAccountModal(),
        });
      }

      if (onOpenTenantSelector) {
        list.push({
          id: 'func-tenant-selector',
          type: 'function',
          title: 'Alternar Instituição Ativa',
          subtitle: 'Trocar o tenant selecionado no painel administrativo',
          icon: Building2,
          action: () => onOpenTenantSelector(),
        });
      }
    }

    return list;
  }, [t, setActiveTab, onOpenCreateUser, onOpenBatchImport, onSyncWorkspace, isSuperAdmin, onOpenServiceAccountModal, onOpenTenantSelector]);

  // Compute search results categorized strictly matching user input
  const searchResults = useMemo(() => {
    const rawTerm = searchQuery.trim().toLowerCase();
    if (!rawTerm) {
      return {
        domains: [],
        users: [],
        functions: [],
        all: [],
      };
    }

    // 1. Domains match
    const matchedDomains: SearchResultItem[] = domains
      .filter((d) => d.domainName?.toLowerCase().includes(rawTerm))
      .slice(0, 5)
      .map((d) => ({
        id: `domain-${d.domainName}`,
        type: 'domain',
        title: d.domainName,
        subtitle: d.isPrimary
          ? 'Domínio Primário Institucional'
          : d.verified
          ? 'Domínio Verificado'
          : 'Pendente de Verificação DNS',
        badge: d.isPrimary ? 'Primário' : d.verified ? 'Verificado' : 'Pendente',
        badgeColor: d.verified || d.isPrimary ? 'green' : 'amber',
        icon: Globe,
        action: () => {
          if (onSelectDomain) {
            onSelectDomain(d.domainName);
          } else {
            setActiveTab('domains');
          }
        },
      }));

    // 2. Users match
    const matchedUsers: SearchResultItem[] = users
      .filter((u) => {
        const name = (u.name?.fullName || `${u.name?.givenName || ''} ${u.name?.familyName || ''}`).toLowerCase();
        const email = (u.primaryEmail || '').toLowerCase();
        const dept = (u.department || '').toLowerCase();
        const title = (u.jobTitle || '').toLowerCase();
        return (
          name.includes(rawTerm) ||
          email.includes(rawTerm) ||
          dept.includes(rawTerm) ||
          title.includes(rawTerm)
        );
      })
      .slice(0, 6)
      .map((u) => {
        const displayName = u.name?.fullName || u.primaryEmail;
        return {
          id: `user-${u.id || u.primaryEmail}`,
          type: 'user',
          title: displayName,
          subtitle: `${u.primaryEmail}${u.department ? ` • ${u.department}` : ''}`,
          badge: u.status === 'ACTIVE' ? 'Ativo' : u.status === 'SUSPENDED' ? 'Suspenso' : undefined,
          badgeColor: u.status === 'ACTIVE' ? 'green' : 'neutral',
          icon: User,
          action: () => {
            if (onSelectUser) {
              onSelectUser(u);
            } else {
              setActiveTab('licenses');
            }
          },
        };
      });

    // 3. Functions & Settings match
    const matchedFunctions: SearchResultItem[] = systemFunctions.filter((f) => {
      const titleMatch = f.title.toLowerCase().includes(rawTerm);
      const subtitleMatch = (f.subtitle || '').toLowerCase().includes(rawTerm);
      return titleMatch || subtitleMatch;
    });

    const all = [...matchedDomains, ...matchedUsers, ...matchedFunctions];

    return {
      domains: matchedDomains,
      users: matchedUsers,
      functions: matchedFunctions,
      all,
    };
  }, [searchQuery, domains, users, systemFunctions, onSelectDomain, onSelectUser, setActiveTab]);

  // Handle selecting an item
  const handleSelectItem = (item: SearchResultItem) => {
    item.action();
    setIsSearchOpen(false);
    onSearchChange('');
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsSearchOpen(true);
      }
      return;
    }

    const total = searchResults.all.length;
    if (total === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % total);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + total) % total);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.all[highlightedIndex]) {
        handleSelectItem(searchResults.all[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsSearchOpen(false);
    }
  };

  return (
    <header
      id="hulu-header"
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E6DF] px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 transition-all"
    >
      {/* Full-width Mobile Search Bar Overlay */}
      {isMobileSearchActive && (
        <div className="fixed inset-x-0 top-0 h-[56px] bg-white z-50 px-3 flex items-center gap-2 border-b border-[#E2E6DF] shadow-sm animate-in fade-in duration-150 sm:hidden">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-[#868685] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={mobileSearchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                onSearchChange(val);
                if (val.trim().length > 0) {
                  setIsSearchOpen(true);
                  setHighlightedIndex(0);
                } else {
                  setIsSearchOpen(false);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder={t('header.searchPlaceholder')}
              className="w-full bg-[#F4F5F0] text-xs text-[#0E0F0C] placeholder-[#868685] pl-10 pr-8 py-2 rounded-full border border-[#163300] focus:bg-white focus:outline-none transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  setIsSearchOpen(false);
                  mobileSearchInputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#868685] hover:text-[#0E0F0C] px-1 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setIsMobileSearchActive(false);
              setIsSearchOpen(false);
            }}
            className="px-3 py-1.5 text-xs font-bold text-[#163300] hover:bg-[#F4F5F0] rounded-full shrink-0 transition-colors cursor-pointer"
          >
            {t('common.cancel') || 'Fechar'}
          </button>
        </div>
      )}
      {/* Brand & Mobile Navigation Hamburger Toggle */}
      <div className="w-auto lg:w-72 -my-2.5 sm:-my-3 lg:-ml-8 py-2.5 sm:py-3 flex items-center justify-start lg:justify-center border-r-0 lg:border-r border-[#E2E6DF] shrink-0 gap-2 sm:gap-2.5">
        {/* Mobile Menu Hamburger Button (< lg) */}
        {onToggleMobileMenu && (
          <button
            type="button"
            id="mobile-menu-toggle-btn"
            onClick={onToggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu de navegação'}
            className="lg:hidden p-2 rounded-xl text-[#163300] hover:bg-[#F4F5F0] active:bg-[#E8F7DC] transition-colors cursor-pointer shrink-0"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <Menu className="w-5 h-5 stroke-[2.5]" />
            )}
          </button>
        )}

        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center justify-center cursor-pointer select-none group"
        >
          <span className="text-xl sm:text-2xl lg:text-3xl font-black text-[#163300] hover:text-[#0A1A00] transition-colors font-['Outfit'] tracking-tight whitespace-nowrap">
            skoolia
          </span>
        </div>
      </div>

      {/* Global Search Bar - Universal Search Across Domains, Users & Settings */}
      <div ref={searchContainerRef} className="hidden sm:block flex-1 min-w-0 max-w-xs sm:max-w-md mx-1 sm:mx-2 relative">
        <div className="relative">
          <Search className="w-4 h-4 text-[#868685] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            id="workspace-search-input"
            type="text"
            value={searchQuery}
            onFocus={() => {
              if (searchQuery.trim().length > 0) {
                setIsSearchOpen(true);
                setHighlightedIndex(0);
              }
            }}
            onChange={(e) => {
              const val = e.target.value;
              onSearchChange(val);
              if (val.trim().length > 0) {
                setIsSearchOpen(true);
                setHighlightedIndex(0);
              } else {
                setIsSearchOpen(false);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={t('header.searchPlaceholder')}
            autoComplete="off"
            className="w-full bg-[#F4F5F0] text-xs lg:text-sm text-[#0E0F0C] placeholder-[#868685] pl-11 pr-8 py-2.5 rounded-full border border-[#E2E6DF] focus:border-[#163300] focus:bg-white focus:outline-none transition-all shadow-2xs font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => {
                onSearchChange('');
                setIsSearchOpen(false);
                searchInputRef.current?.focus();
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#868685] hover:text-[#0E0F0C] px-1 cursor-pointer"
              title="Limpar busca"
            >
              ✕
            </button>
          )}
        </div>

        {/* Global Search Results Dropdown Overlay - ONLY shown when user has typed something */}
        {isSearchOpen && searchQuery.trim().length > 0 && (
          <div
            id="global-search-results-popover"
            className="fixed inset-x-3 top-14 sm:absolute sm:inset-x-auto sm:left-0 sm:right-0 sm:top-full mt-2 bg-white rounded-2xl border border-[#E2E6DF] shadow-2xl overflow-hidden z-50 animate-modal-pop max-h-[75vh] flex flex-col"
          >
            <div className="overflow-y-auto divide-y divide-[#F4F5F0] p-2 space-y-2">
              {/* If no results found */}
              {searchResults.all.length === 0 && (
                <div className="py-8 text-center px-4">
                  <div className="w-10 h-10 rounded-full bg-[#F4F5F0] border border-[#E2E6DF] flex items-center justify-center mx-auto mb-2.5 text-[#868685]">
                    <Search className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-[#0E0F0C]">
                    {t('header.noResultsFound') || 'Nenhum resultado encontrado para'} "{searchQuery}"
                  </p>
                  <p className="text-xs text-[#868685] mt-1">
                    Tente buscar por nome de domínio, e-mail de usuário ou recurso do sistema.
                  </p>
                </div>
              )}

              {/* DOMAINS SECTION */}
              {searchResults.domains.length > 0 && (
                <div className="pt-1">
                  <div className="px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#163300] font-['Outfit'] flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#163300]" />
                    <span>{t('header.domainsCategory') || 'Domínios'}</span>
                  </div>
                  <div className="space-y-0.5">
                    {searchResults.domains.map((item) => {
                      const itemIndex = searchResults.all.findIndex((i) => i.id === item.id);
                      const isHighlighted = itemIndex === highlightedIndex;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectItem(item)}
                          onMouseEnter={() => setHighlightedIndex(itemIndex)}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
                            isHighlighted ? 'bg-[#E8F7DC] text-[#163300]' : 'hover:bg-[#F8F9F6] text-[#0E0F0C]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                isHighlighted
                                  ? 'bg-white border-[#9FE870] text-[#163300]'
                                  : 'bg-[#F4F5F0] border-[#E2E6DF] text-[#5E605D]'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs sm:text-sm font-bold truncate">{item.title}</p>
                              {item.subtitle && (
                                <p className="text-[11px] text-[#5E605D] truncate">{item.subtitle}</p>
                              )}
                            </div>
                          </div>
                          {item.badge && (
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                                item.badgeColor === 'green'
                                  ? 'bg-[#E8F7DC] text-[#163300] border border-[#9FE870]/50'
                                  : item.badgeColor === 'amber'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                  : 'bg-[#E8EBE6] text-[#5E605D]'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* USERS SECTION */}
              {searchResults.users.length > 0 && (
                <div className="pt-1">
                  <div className="px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#163300] font-['Outfit'] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#163300]" />
                    <span>{t('header.usersCategory') || 'Contas de Usuário'}</span>
                  </div>
                  <div className="space-y-0.5">
                    {searchResults.users.map((item) => {
                      const itemIndex = searchResults.all.findIndex((i) => i.id === item.id);
                      const isHighlighted = itemIndex === highlightedIndex;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectItem(item)}
                          onMouseEnter={() => setHighlightedIndex(itemIndex)}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
                            isHighlighted ? 'bg-[#E8F7DC] text-[#163300]' : 'hover:bg-[#F8F9F6] text-[#0E0F0C]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 border ${
                                isHighlighted
                                  ? 'bg-[#9FE870] border-[#163300] text-[#163300]'
                                  : 'bg-[#E8F7DC] border-[#CBD3C5] text-[#163300]'
                              }`}
                            >
                              {item.title ? item.title.slice(0, 2).toUpperCase() : 'U'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs sm:text-sm font-bold truncate">{item.title}</p>
                              {item.subtitle && (
                                <p className="text-[11px] text-[#5E605D] font-mono truncate">
                                  {item.subtitle}
                                </p>
                              )}
                            </div>
                          </div>
                          {item.badge && (
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                                item.badgeColor === 'green'
                                  ? 'bg-[#E8F7DC] text-[#163300] border border-[#9FE870]/50'
                                  : 'bg-[#E8EBE6] text-[#5E605D]'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* FUNCTIONS & SETTINGS SECTION */}
              {searchResults.functions.length > 0 && (
                <div className="pt-1">
                  <div className="px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#163300] font-['Outfit'] flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-[#163300]" />
                    <span>{t('header.functionsCategory') || 'Funções e Configurações'}</span>
                  </div>
                  <div className="space-y-0.5">
                    {searchResults.functions.map((item) => {
                      const itemIndex = searchResults.all.findIndex((i) => i.id === item.id);
                      const isHighlighted = itemIndex === highlightedIndex;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectItem(item)}
                          onMouseEnter={() => setHighlightedIndex(itemIndex)}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
                            isHighlighted ? 'bg-[#E8F7DC] text-[#163300]' : 'hover:bg-[#F8F9F6] text-[#0E0F0C]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                isHighlighted
                                  ? 'bg-[#163300] border-[#163300] text-[#9FE870]'
                                  : 'bg-[#F4F5F0] border-[#E2E6DF] text-[#5E605D]'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs sm:text-sm font-bold truncate">{item.title}</p>
                              {item.subtitle && (
                                <p className="text-[11px] text-[#5E605D] truncate">{item.subtitle}</p>
                              )}
                            </div>
                          </div>
                          <ArrowRight
                            className={`w-4 h-4 shrink-0 transition-transform ${
                              isHighlighted ? 'translate-x-1 text-[#163300]' : 'text-[#868685]'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer keyboard guide */}
            <div className="px-3 py-2 bg-[#F8F9F6] border-t border-[#E2E6DF] flex items-center justify-between text-[11px] text-[#868685]">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#CBD3C5] font-mono text-[10px]">
                  ↑
                </kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#CBD3C5] font-mono text-[10px]">
                  ↓
                </kbd>
                para navegar
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#CBD3C5] font-mono text-[10px]">
                  Enter
                </kbd>
                para abrir
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#CBD3C5] font-mono text-[10px]">
                  Esc
                </kbd>
                para fechar
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Profile, Language Selector, SuperAdmin Notifications & Logout */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Mobile Search Button (< sm) */}
        <button
          type="button"
          id="btn-header-mobile-search"
          onClick={() => {
            setIsMobileSearchActive(true);
            setTimeout(() => mobileSearchInputRef.current?.focus(), 80);
          }}
          className="sm:hidden p-2 rounded-full text-[#5E605D] hover:text-[#0E0F0C] hover:bg-[#F4F5F0] border border-[#E2E6DF] transition-all cursor-pointer shrink-0"
          title="Buscar"
          aria-label="Buscar"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* SuperAdmin Active Tenant Selector Pill Button */}
        {isSuperAdmin && onOpenTenantSelector && (
          <button
            type="button"
            id="btn-header-tenant-selector"
            onClick={onOpenTenantSelector}
            title="Alternar organização / escola ativa"
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-[#E8F7DC] hover:bg-[#DCF2C9] text-[#163300] border border-[#9FE870]/60 text-xs font-bold transition-all cursor-pointer shadow-2xs whitespace-nowrap shrink-0 group active:scale-[0.98]"
          >
            <Building2 className="w-3.5 h-3.5 text-[#163300] stroke-[2.4]" />
            <span className="max-w-[120px] sm:max-w-[180px] truncate text-left font-black font-['Outfit']">
              {currentTenant?.name || 'Todas as Escolas'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#163300] opacity-80 group-hover:translate-y-0.5 transition-transform" />
          </button>
        )}

        {/* SuperAdmin Ticket Notification Alert */}
        {isSuperAdmin && pendingTicketsCount > 0 && (
          <button
            id="header-superadmin-ticket-alert-btn"
            onClick={() => setActiveTab('support')}
            title={`${pendingTicketsCount} chamado(s) aguardando resposta da equipe técnica`}
            className="relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#E8F7DC] hover:bg-[#DCF2C9] text-[#163300] border border-[#CBD3C5] text-xs font-bold transition-all cursor-pointer shadow-2xs whitespace-nowrap shrink-0 group"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00c868] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#163300]"></span>
            </span>
            <Bell className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="text-[11px] font-mono font-black whitespace-nowrap hidden sm:inline">
              {pendingTicketsCount} {pendingTicketsCount === 1 ? 'chamado' : 'chamados'}
            </span>
            <span className="text-[11px] font-mono font-black whitespace-nowrap sm:hidden">
              {pendingTicketsCount}
            </span>
          </button>
        )}

        {/* Language Selector near user name */}
        <LanguageSelector variant="header" />

        {/* User Badge */}
        <div className="flex items-center gap-2 sm:gap-2.5 bg-[#F4F5F0] py-1.5 px-2 sm:px-3 rounded-full border border-[#E2E6DF] shrink-0">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Avatar'}
              className="w-7 h-7 rounded-full border border-[#CBD3C5] object-cover shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-[#9FE870] text-[#163300] font-black text-xs flex items-center justify-center shadow-2xs shrink-0">
              {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'AD'}
            </div>
          )}
          <div className="hidden sm:block text-left pr-1">
            <p className="text-xs font-bold text-[#0E0F0C] leading-tight truncate max-w-[140px] whitespace-nowrap">
              {user?.displayName || activeInstitution?.technicalContactName || t('common.superAdmin')}
            </p>
            <p className="text-[10px] text-[#5E605D] font-mono leading-tight truncate max-w-[140px] whitespace-nowrap">
              {user?.email || 'admin@workspace.com'}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          title={t('header.logoutTitle')}
          id="btn-header-logout"
          className="p-2 rounded-full text-[#868685] hover:text-rose-600 hover:bg-rose-50 border border-[#E2E6DF] hover:border-rose-200 transition-all cursor-pointer whitespace-nowrap shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
