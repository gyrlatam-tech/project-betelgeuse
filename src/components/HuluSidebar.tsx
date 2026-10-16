import React from 'react';
import {
  LayoutDashboard,
  CreditCard,
  Globe,
  Receipt,
  Settings,
  Building2,
  ShieldCheck,
  Mail,
  Layers,
  LifeBuoy,
  X,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { GoogleEducationPartnerBadge } from './auth/GoogleEducationPartnerBadge';

interface SkooliaSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userCount: number;
  pendingApprovalsCount?: number;
  openTicketsCount?: number;
  isSuperAdmin?: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const SkooliaSidebar: React.FC<SkooliaSidebarProps> = ({
  activeTab,
  setActiveTab,
  userCount,
  pendingApprovalsCount = 0,
  openTicketsCount = 0,
  isSuperAdmin = false,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { t } = useLanguage();

  const navItems = [
    {
      id: 'dashboard',
      label: t('sidebar.dashboard'),
      icon: LayoutDashboard,
      badge: null,
      badgeColor: 'normal',
    },
    {
      id: 'licenses',
      label: t('sidebar.licenses'),
      icon: CreditCard,
      badge: null,
      badgeColor: 'normal',
    },
    {
      id: 'domains',
      label: t('sidebar.domains'),
      icon: Globe,
      badge: null,
      badgeColor: 'normal',
    },
    {
      id: 'services',
      label: t('sidebar.additionalServices'),
      icon: Layers,
      badge: t('sidebar.badgeNew'),
      badgeColor: 'green',
    },
    ...(isSuperAdmin
      ? [
          {
            id: 'tenants',
            label: t('sidebar.tenants'),
            icon: Building2,
            badge: null,
            badgeColor: 'normal',
          },
          {
            id: 'approvals',
            label: t('sidebar.approvals'),
            icon: ShieldCheck,
            badge: pendingApprovalsCount > 0 ? pendingApprovalsCount.toString() : null,
            badgeColor: 'amber',
          },
          {
            id: 'emails',
            label: t('sidebar.emailTemplates'),
            icon: Mail,
            badge: null,
            badgeColor: 'normal',
          },
        ]
      : []),
    {
      id: 'billing',
      label: t('sidebar.billing'),
      icon: Receipt,
      badge: null,
      badgeColor: 'normal',
    },
    {
      id: 'settings',
      label: t('sidebar.settings'),
      icon: Settings,
      badge: null,
      badgeColor: 'normal',
    },
    {
      id: 'support',
      label: t('sidebar.support'),
      icon: LifeBuoy,
      badge: openTicketsCount > 0 ? `${openTicketsCount}` : null,
      badgeColor: 'green',
    },
  ];

  const renderNavContent = (isMobile: boolean) => (
    <>
      <div className="space-y-6">
        {isMobile && (
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E6DF]">
            <span className="text-2xl font-black text-[#163300] font-['Outfit'] tracking-tight">
              skoolia
            </span>
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Fechar menu"
              className="p-1.5 rounded-lg text-[#5E605D] hover:text-[#0E0F0C] hover:bg-[#F4F5F0] transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        )}

        {/* Navigation Category */}
        <div>
          <div className="px-3.5 mb-3 text-[11px] font-black uppercase tracking-wider text-[#868685] font-['Outfit']">
            {t('sidebar.mainMenu')}
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  id={isMobile ? `mobile-nav-item-${item.id}` : `nav-item-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (isMobile && onCloseMobile) {
                      onCloseMobile();
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs xl:text-sm transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 group active:scale-[0.98] ${
                    isActive
                      ? 'bg-[#E8F7DC] text-[#163300] font-black shadow-xs border border-[#9FE870]/50'
                      : 'text-[#5E605D] hover:text-[#0E0F0C] hover:bg-[#F4F5F0] hover:shadow-2xs font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <Icon
                      className={`w-4 h-4 xl:w-5 xl:h-5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                        isActive ? 'text-[#163300] stroke-[2.5]' : 'text-[#868685] group-hover:text-[#0E0F0C]'
                      }`}
                    />
                    <span className="tracking-tight whitespace-nowrap overflow-hidden text-ellipsis text-left">
                      {item.label}
                    </span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] xl:text-[11px] font-black px-2 py-0.5 rounded-full shrink-0 ml-1.5 whitespace-nowrap tabular-nums transition-transform duration-200 group-hover:scale-105 ${
                        item.badgeColor === 'amber'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : item.badgeColor === 'green'
                          ? 'bg-[#E8F7DC] text-[#163300] border border-[#9FE870]/40'
                          : isActive
                          ? 'bg-[#9FE870] text-[#163300]'
                          : 'bg-[#E8EBE6] text-[#0E0F0C]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer with Google Partner Badge & Discreet Legal Link */}
      <div className="pt-4 pb-2 border-t border-[#E2E6DF] flex flex-col items-center justify-center px-3 gap-2">
        <GoogleEducationPartnerBadge size="sidebar" />
        <button
          type="button"
          onClick={() => {
            if (window.location.pathname !== '/contracts') {
              window.history.pushState({ contractSlug: null }, '', '/contracts');
            }
            setActiveTab('contracts');
            if (isMobile && onCloseMobile) {
              onCloseMobile();
            }
          }}
          className="text-[11px] text-[#868685] hover:text-[#163300] hover:underline transition-colors text-center cursor-pointer whitespace-nowrap shrink-0"
        >
          {t('sidebar.contracts') || 'Termos de Uso & Contratos'}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (lg screens and up) */}
      <aside
        id="hulu-sidebar"
        className="hidden lg:flex w-64 xl:w-72 bg-white border-r border-[#E2E6DF] flex-col justify-between p-5 shrink-0 select-none h-full overflow-y-auto sticky top-0"
      >
        {renderNavContent(false)}
      </aside>

      {/* Mobile Slide-over Drawer (< lg screens) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <div
            id="hulu-sidebar-mobile"
            className="relative w-72 max-w-[85vw] bg-white h-[100dvh] min-h-[100dvh] max-h-[100dvh] flex flex-col justify-between p-4 sm:p-5 shadow-2xl z-10 select-none overflow-y-auto animate-in slide-in-from-left duration-200"
          >
            {renderNavContent(true)}
          </div>
        </div>
      )}
    </>
  );
};

