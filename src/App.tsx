import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { School } from 'lucide-react';
import {
  WorkspaceUser,
  OrgUnit,
  LicenseInventory,
  WorkspaceDomain,
  Tenant,
  ServiceAccountStatus,
  SubscriptionState,
  Invoice,
  SupportTicket,
  TicketMessage,
  TicketStatus,
  TicketCategory,
} from './types';
import {
  saveInstitutionBilling,
  saveInstitutionProfile,
  fetchInstitutionTickets,
  saveInstitutionTickets,
  sanitizeTicket,
  fetchAllInstitutionsFromFirestore,
  updateInstitutionStatusInFirestore,
  createInstitutionTenantInFirestore,
  deleteInstitutionFromFirestore,
  updateInstitutionInFirestore,
  subscribeAllInstitutions,
  broadcastTenantStatus,
} from './lib/firebase';
import {
  INITIAL_ORG_UNITS,
  INITIAL_LICENSES,
} from './mockData';
import { SkooliaHeader } from './components/HuluHeader';
import { SkooliaSidebar } from './components/HuluSidebar';
import { DashboardView } from './components/DashboardView';
import { LicensesView } from './components/LicensesView';
import { DomainsView } from './components/DomainsView';
import { BillingView } from './components/BillingView';
import { AdditionalServicesView } from './components/AdditionalServicesView';
import { SettingsView } from './components/SettingsView';
import { SupportView } from './components/SupportView';
import { TenantsView } from './components/TenantsView';
import { ApprovalsView } from './components/ApprovalsView';
import { EmailsView } from './components/EmailsView';
import { TenantSelectorModal } from './components/TenantSelectorModal';
import { ServiceAccountSettingsModal } from './components/ServiceAccountSettingsModal';
import { CreateUserModal } from './components/CreateUserModal';
import { BatchImportModal } from './components/BatchImportModal';
import { EditUserModal } from './components/EditUserModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { WelcomeTrialModal } from './components/WelcomeTrialModal';
import { UpgradeActivationModal } from './components/UpgradeActivationModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { exportUsersToGoogleAdminCsv, downloadCsv } from './utils/csvHelper';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthView } from './components/auth/AuthView';
import { AdminPopupAuthView } from './components/auth/AdminPopupAuthView';
import { CompleteProfileView } from './components/auth/CompleteProfileView';
import { HomePage } from './components/home/HomePage';
import { SkooliaLoader } from './components/SkooliaLoader';
import { ContractsView } from './components/ContractsView';
import { PublicLegalView } from './components/PublicLegalView';
import { PublicContactPage } from './components/PublicContactPage';
import { LanguageSelector } from './components/LanguageSelector';
import { BlockingModal } from './components/BlockingModal';
import { ArrowLeft } from 'lucide-react';

function WorkspaceAdminApp() {
  const {
    user,
    institution,
    loading,
    isProfileComplete,
    isSuperAdmin,
    refreshProfile,
    submitInstitutionProfile,
    logout,
  } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  // Sync tenant's preferredLanguage on login
  const hasAppliedLoginLanguageRef = useRef<string | null>(null);
  useEffect(() => {
    if (institution?.ownerUid && institution?.preferredLanguage) {
      if (hasAppliedLoginLanguageRef.current !== institution.ownerUid) {
        hasAppliedLoginLanguageRef.current = institution.ownerUid;
        setLanguage(institution.preferredLanguage);
      }
    }
  }, [institution?.ownerUid, institution?.preferredLanguage, setLanguage]);

  // Keep tenant's preferredLanguage updated in database when changed from the top dropdown
  useEffect(() => {
    if (user && institution && language && institution.preferredLanguage !== language) {
      submitInstitutionProfile({
        ...institution,
        preferredLanguage: language,
      }).catch((err) => console.warn('Aviso ao sincronizar idioma do tenant:', err));
    }
  }, [language, user, institution, submitInstitutionProfile]);

  // Browser URL Path Routing for / (HomePage) vs /login (Auth) vs /contracts vs /legal/privacy/terms vs /legal/terms
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/';
    }
    return '/';
  });

  // Normalize current path (handle double slashes like //legal/terms and trailing slashes)
  const normalizedPath = useMemo(() => {
    const raw = (currentPath || '/').replace(/\/+/g, '/');
    return raw.length > 1 ? raw.replace(/\/$/, '') : raw;
  }, [currentPath]);

  const isPrivacyRoute = useMemo(() => {
    return (
      normalizedPath === '/legal/privacy/terms' ||
      normalizedPath === '/legal/privacy' ||
      normalizedPath === '/privacy' ||
      normalizedPath === '/privacy-policy' ||
      currentPath.includes('/legal/privacy')
    );
  }, [normalizedPath, currentPath]);

  const isTermsRoute = useMemo(() => {
    return (
      normalizedPath === '/legal/terms' ||
      normalizedPath === '/terms' ||
      normalizedPath === '/terms-of-service' ||
      normalizedPath === '/termos' ||
      currentPath.includes('/legal/terms')
    );
  }, [normalizedPath, currentPath]);

  const isContractsRoute = useMemo(() => {
    return (
      normalizedPath === '/contracts' ||
      normalizedPath.startsWith('/contracts/')
    );
  }, [normalizedPath]);

  const isContactRoute = useMemo(() => {
    return (
      normalizedPath === '/contact' ||
      normalizedPath === '/contato' ||
      normalizedPath === '/contacto' ||
      normalizedPath === '/help/contact' ||
      normalizedPath === '/suporte/contato' ||
      normalizedPath.startsWith('/contact') ||
      normalizedPath.startsWith('/contato')
    );
  }, [normalizedPath]);

  // Current contract slug if URL is /contracts/:slug
  const currentContractSlug = useMemo(() => {
    if (normalizedPath.startsWith('/contracts/')) {
      const slug = normalizedPath.replace('/contracts/', '').replace(/\/$/, '');
      return slug || null;
    }
    return null;
  }, [normalizedPath]);

  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname || '/';
      setCurrentPath(p);
      if (p === '/contracts' || p.startsWith('/contracts/')) {
        setActiveTab('contracts');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname !== path) {
        window.history.pushState({}, '', path);
      }
      setCurrentPath(path);
      if (path === '/contracts' || path.startsWith('/contracts/')) {
        setActiveTab('contracts');
      }
      window.scrollTo(0, 0);
    }
  };

  // SaaS Multi-Tenant State
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenantId, setCurrentTenantId] = useState<string>('');
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [previewBlockingModalTenant, setPreviewBlockingModalTenant] = useState<Tenant | null>(null);

  // Current Active Tenant (strictly isolated per user/tenant)
  const currentTenant = useMemo(() => {
    if (!isSuperAdmin) {
      const myId = `tenant-${institution?.ownerUid || institution?.id || user?.uid}`;
      const cleanMyId = (institution?.ownerUid || institution?.id || user?.uid || '').replace(/^tenant-/, '');
      const found = tenants.find(
        (t) =>
          t.id === currentTenantId ||
          t.id === myId ||
          t.id.replace(/^tenant-/, '') === cleanMyId
      );
      if (found) return found;
      if (user?.uid) {
        return {
          id: myId,
          name: institution?.institutionName || 'Minha Organização',
          slug: (institution?.institutionName || 'org').toLowerCase().replace(/[^a-z0-9]/g, '-'),
          primaryContactEmail: institution?.technicalContactEmail || institution?.institutionEmail || user.email || '',
          financialContactEmail: institution?.financialContactEmail || institution?.institutionEmail,
          allowedDomains: institution?.allowedDomains || [],
          rootOrgUnitPath: `/${(institution?.institutionName || 'Tenant').replace(/\s+/g, '')}`,
          contractedSeats: (institution as any)?.contractedSeats || [],
          monthlyBudgetUsd: institution?.subscription?.currentPrice || 0,
          status: 'ACTIVE' as const,
          createdAt: institution?.createdAt || new Date().toISOString(),
        };
      }
      return undefined;
    }
    return tenants.find((t) => t.id === currentTenantId) || tenants[0] || undefined;
  }, [tenants, currentTenantId, isSuperAdmin, institution, user?.uid, user?.email]);

  // Sync Tenant with active Institution profile
  useEffect(() => {
    if (institution && institution.institutionName) {
      fetchTenants();
      const activeId = `tenant-${institution.ownerUid || 'inst'}`;
      setCurrentTenantId(activeId);
    }
  }, [institution]);

  // Real-time synchronization of tenant status (BroadcastChannel + custom & storage events)
  useEffect(() => {
    const handleStatusSync = (msg: any) => {
      if (!msg || !msg.tenantId || !msg.status) return;
      const targetTenantId = msg.tenantId;
      const rawTarget = targetTenantId.replace(/^tenant-/, '');

      // 1. Update tenants list immediately in SuperAdmin or Tenant state
      setTenants((prev) =>
        prev.map((t) => {
          const rawT = t.id.replace(/^tenant-/, '');
          if (t.id === targetTenantId || rawT === rawTarget) {
            return {
              ...t,
              status: msg.status,
              suspendedReason: msg.status === 'SUSPENDED' ? msg.suspendedReason || t.suspendedReason : undefined,
            };
          }
          return t;
        })
      );

      // 2. If preview blocking modal is open for this tenant, update it live
      setPreviewBlockingModalTenant((prev) => {
        if (!prev) return null;
        const rawPrev = prev.id.replace(/^tenant-/, '');
        if (prev.id === targetTenantId || rawPrev === rawTarget) {
          if (msg.status === 'ACTIVE') return null;
          return {
            ...prev,
            status: msg.status,
            suspendedReason: msg.suspendedReason || prev.suspendedReason,
          };
        }
        return prev;
      });

      // 3. If this affects current institution / user, trigger profile refresh
      const myUid = institution?.ownerUid || institution?.id || user?.uid;
      if (myUid && (targetTenantId === myUid || rawTarget === myUid || targetTenantId === `tenant-${myUid}`)) {
        if (refreshProfile) {
          refreshProfile();
        }
      }
    };

    const handleCustomDomEvent = (e: any) => handleStatusSync(e.detail);
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'skoolia_tenant_status_broadcast' && e.newValue) {
        try {
          handleStatusSync(JSON.parse(e.newValue));
        } catch {}
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('skoolia_tenant_status_change', handleCustomDomEvent);
      window.addEventListener('storage', handleStorageEvent);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('skoolia_tenant_status_change', handleCustomDomEvent);
        window.removeEventListener('storage', handleStorageEvent);
      }
    };
  }, [user?.uid, institution?.ownerUid, institution?.id, refreshProfile]);

  // Google Workspace Service Account & Live Status
  const [serviceAccountStatus, setServiceAccountStatus] = useState<ServiceAccountStatus | null>(null);
  const [isServiceAccountModalOpen, setIsServiceAccountModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Users, Domains, Licenses, OrgUnits State
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>(INITIAL_ORG_UNITS);
  const [licenses, setLicenses] = useState<LicenseInventory[]>(INITIAL_LICENSES);
  const [domains, setDomains] = useState<WorkspaceDomain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('');

  // Sync / Ensure domain OUs exist for all known domains
  const syncOrgUnitsWithDomains = (domainList: WorkspaceDomain[]) => {
    setOrgUnits((prevOUs) => {
      const updated = [...prevOUs];
      domainList.forEach((d) => {
        const path = `/${d.domainName}`;
        const exists = updated.some(
          (ou) => ou.path.toLowerCase() === path.toLowerCase() || ou.name.toLowerCase() === d.domainName.toLowerCase()
        );
        if (!exists) {
          updated.push({
            id: `ou-domain-${d.domainName.replace(/[^a-zA-Z0-9]/g, '-')}`,
            name: d.domainName,
            path: path,
            parentPath: '/',
            description: `Unidade Organizacional do domínio ${d.domainName}`,
            userCount: 0,
            policies: {
              externalDriveSharing: true,
              require2SV: false,
              allowYoutubeUploads: true,
              sessionLengthHours: 24,
            },
          });
        }
      });
      return updated;
    });
  };

  // Fetch OUs from backend
  const fetchOrgUnits = async () => {
    try {
      const res = await fetch('/api/orgunits');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setOrgUnits((prev) => {
            const map = new Map<string, OrgUnit>();
            prev.forEach((o) => map.set(o.path, o));
            data.forEach((o: OrgUnit) => map.set(o.path, o));
            return Array.from(map.values());
          });
        }
      }
    } catch {
      // ignore
    }
  };

  // Navigation & Search
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      if (p === '/contracts' || p.startsWith('/contracts/')) {
        return 'contracts';
      }
    }
    return 'dashboard';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Support Pre-fill Navigation State (for custom license quote requests)
  const [supportPrefill, setSupportPrefill] = useState<{
    autoOpen: boolean;
    category?: TicketCategory;
    subject?: string;
    description?: string;
  }>({ autoOpen: false });

  const handleOpenQuoteTicket = () => {
    setSupportPrefill({
      autoOpen: true,
      category: 'CUSTOM_LICENSE_QUOTE',
      subject: t('support.customQuote.ticketSubject'),
      description: t('support.customQuote.defaultDescription'),
    });
    handleTabChange('support');
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    if (tab === 'contracts') {
      if (typeof window !== 'undefined' && window.location.pathname !== '/contracts' && !window.location.pathname.startsWith('/contracts/')) {
        window.history.pushState({ contractSlug: null }, '', '/contracts');
        setCurrentPath('/contracts');
      }
    } else {
      if (typeof window !== 'undefined' && (window.location.pathname === '/contracts' || window.location.pathname.startsWith('/contracts/'))) {
        window.history.pushState({}, '', '/');
        setCurrentPath('/');
      }
    }
  };

  // Route security: prevent non-superadmins from accessing admin tabs
  useEffect(() => {
    if (!isSuperAdmin && (activeTab === 'tenants' || activeTab === 'approvals')) {
      setActiveTab('dashboard');
    }
  }, [isSuperAdmin, activeTab]);

  // Isolate domains per tenant strictly
  const visibleDomains = useMemo(() => {
    if (isSuperAdmin) return domains;
    if (!user) return [];

    const userUid = user.uid;
    const userCleanUid = user.uid.replace(/^tenant-/, '');
    const instOwnerUid = institution?.ownerUid?.replace(/^tenant-/, '');
    const rawInstOwnerUid = institution?.ownerUid;
    const instId = institution?.id ? institution.id.replace(/^tenant-/, '') : undefined;
    const rawInstId = institution?.id;
    const instAllowed = (institution?.allowedDomains || []).map((d: string) => d.toLowerCase().trim());
    const allAllowedSet = new Set(instAllowed);

    return domains.filter((d) => {
      const dName = d.domainName.toLowerCase().trim();
      if (allAllowedSet.has(dName)) return true;

      const dCleanTid = (d.tenantId || '').replace(/^tenant-/, '');
      const rawDTid = d.tenantId || '';
      const auditCleanTid = (d.auditRecord?.tenantId || '').replace(/^tenant-/, '');
      const auditRawTid = d.auditRecord?.tenantId || '';
      const auditInstName = (d.auditRecord?.institutionName || '').toLowerCase().trim();
      const currentInstName = (institution?.institutionName || '').toLowerCase().trim();

      const matchesTenant =
        (rawDTid && (rawDTid === userUid || rawDTid === rawInstId || rawDTid === rawInstOwnerUid)) ||
        (dCleanTid && (dCleanTid === userCleanUid || (instOwnerUid && dCleanTid === instOwnerUid) || (instId && dCleanTid === instId))) ||
        (auditRawTid && (auditRawTid === userUid || auditRawTid === rawInstId || auditRawTid === rawInstOwnerUid)) ||
        (auditCleanTid && (auditCleanTid === userCleanUid || (instOwnerUid && auditCleanTid === instOwnerUid) || (instId && auditCleanTid === instId))) ||
        (auditInstName && currentInstName && auditInstName === currentInstName);

      return Boolean(matchesTenant);
    });
  }, [domains, isSuperAdmin, user, institution]);

  // Approved domain names belonging to this tenant
  const approvedDomains = useMemo(() => {
    return visibleDomains
      .filter((d) => d.verified || d.state === 'VERIFIED')
      .map((d) => d.domainName.toLowerCase());
  }, [visibleDomains]);

  // Strictly active and verified domains belonging to the respective tenant
  const tenantVerifiedActiveDomains = useMemo(() => {
    return visibleDomains.filter((d) => {
      const isVerified = Boolean(d.verified === true || d.state === 'VERIFIED');
      const isNotFailedOrRemoved = d.state !== 'FAILED' && d.state !== 'CONFIG_ERROR' && d.state !== 'REMOVED';
      return isVerified && isNotFailedOrRemoved;
    });
  }, [visibleDomains]);

  // Isolate users: only users with emails matching approved tenant domains
  const visibleUsers = useMemo(() => {
    if (isSuperAdmin) return users;
    return users.filter((u) => {
      const emailDomain = (u.primaryEmail.split('@')[1] || '').toLowerCase();
      return approvedDomains.includes(emailDomain);
    });
  }, [users, isSuperAdmin, approvedDomains]);

  // Custom isolated licenses view for tenant based on institution student/teacher volume
  const visibleLicenses = useMemo(() => {
    if (!institution || isSuperAdmin) return licenses;
    const totalCapacity = (institution.studentsCount || 0) + (institution.teachersCount || 0);
    return [
      {
        sku: 'Google Workspace Fundamentals' as const,
        totalSeats: totalCapacity > 0 ? totalCapacity : 500,
        assignedSeats: visibleUsers.length,
        color: '#00c868',
        monthlyCostUsd: 0.0,
        features: ['Gmail Institucional', 'Google Meet', 'Drive Seguro', 'Classroom Integrado'],
      },
      {
        sku: 'Cloud Identity Free' as const,
        totalSeats: 100,
        assignedSeats: 0,
        color: '#94a3b8',
        monthlyCostUsd: 0.0,
        features: ['Gerenciamento de Identidades', '2SV Obrigatório', 'SSO / SAML'],
      },
    ];
  }, [licenses, institution, isSuperAdmin, visibleUsers]);

  // Modals state
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<WorkspaceUser | null>(null);
  const [editingUserInitialTab, setEditingUserInitialTab] = useState<'info' | 'aliases' | 'storage' | 'security' | undefined>(undefined);
  const [autoOpenResetPasswordConfirm, setAutoOpenResetPasswordConfirm] = useState(false);
  const [isWelcomeTrialOpen, setIsWelcomeTrialOpen] = useState(false);

  // Check whether to show the Welcome Trial Modal for first-time dashboard opening
  useEffect(() => {
    if (user && isProfileComplete && !loading) {
      const storageKey = `skoolia_welcome_trial_seen_${user.uid}`;
      let seenLocally = false;
      try {
        seenLocally = typeof localStorage !== 'undefined' && localStorage.getItem(storageKey) === 'true';
      } catch {}
      const seenInProfile = institution?.hasSeenWelcomeTrial === true;

      if (!seenLocally && !seenInProfile) {
        setIsWelcomeTrialOpen(true);
      }
    }
  }, [user, isProfileComplete, loading, institution?.hasSeenWelcomeTrial]);

  const handleCloseWelcomeTrial = () => {
    if (user) {
      const storageKey = `skoolia_welcome_trial_seen_${user.uid}`;
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(storageKey, 'true');
        }
      } catch {}

      if (institution) {
        saveInstitutionProfile(user.uid, {
          ...institution,
          hasSeenWelcomeTrial: true,
        }).catch((err) => {
          console.warn('Note updating welcome trial status in profile:', err);
        });
      }
    }
    setIsWelcomeTrialOpen(false);
  };

  // Confirmation Modal
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    targetResource?: string;
    confirmLabel: string;
    isDestructive: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirmar',
    isDestructive: true,
    onConfirm: () => {},
  });

  // Upgrade Success Modal (shown after Stripe callback for 1 TB Pool or Gemini AI Pro)
  const [upgradeSuccessModal, setUpgradeSuccessModal] = useState<{
    isOpen: boolean;
    serviceName: string;
    quantity: number;
    protocol: string;
    ticketId: string;
    invoiceNumber?: string;
    amount?: number;
    currency?: string;
  } | null>(null);

  // Ref to prevent duplicate execution of Stripe session verification (e.g. on re-renders or StrictMode)
  const processedSessionIdsRef = useRef<Set<string>>(new Set());

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'SUCCESS' | 'ERROR' | 'INFO', title: string, description?: string) => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random()}`,
      type,
      title,
      description,
    };
    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Listen for Stripe Session Callback (?session_id=cs_...&payment_status=success)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const paymentStatus = params.get('payment_status');
    const urlLang = params.get('lang');

    if (sessionId && paymentStatus === 'success' && user?.uid) {
      if (processedSessionIdsRef.current.has(sessionId)) {
        return;
      }
      processedSessionIdsRef.current.add(sessionId);

      // Clean up URL immediately before async operations so re-renders won't see session_id
      window.history.replaceState({}, document.title, window.location.pathname);

      let storedLang: string | null = null;
      try {
        if (typeof localStorage !== 'undefined') {
          storedLang = localStorage.getItem('skoolia_language');
        }
      } catch {}
      const clientLang = urlLang || language || storedLang || 'pt';

      fetch(`/api/billing/verify-session/${sessionId}?lang=${encodeURIComponent(clientLang)}`, {
        headers: {
          'x-app-language': clientLang,
        },
      })
        .then((res) => res.json())
        .then(async (data) => {
          if (data.success && data.isPaid) {
            if (data.isAdditionalService && data.additionalService) {
              // Handle Additional Service Payment Success
              const existingServices = institution?.subscription?.additionalServices || [];
              const updatedServices = [
                data.additionalService,
                ...existingServices.filter((s: any) => s.id !== data.additionalService.id),
              ];

              const currentSub = institution?.subscription || {
                planId: 'plan-standard-unlimited-monthly',
                planName: 'Workspace Standard Unlimited - Monthly',
                status: 'ACTIVE' as const,
                billingCycle: 'MONTHLY' as const,
                currentPrice: 199.99,
                isUnlimitedLicenses: true,
                startDate: new Date().toISOString(),
                nextRenewalDate: new Date(Date.now() + 30 * 86400000).toISOString(),
                paymentMethod: {
                  brand: 'Cartão de Crédito',
                  last4: 'REAL',
                  expiry: 'Ativo',
                  cardholder: data.customerName || 'Cliente Workspace',
                },
                billingDetails: {
                  fullName: data.customerName || '',
                  email: data.customerEmail || '',
                  taxId: data.taxId || '',
                  address: '',
                  city: '',
                  state: '',
                  zipCode: '',
                  country: 'Brasil',
                  countryCode: 'BR',
                },
              };

              const updatedSubscription: SubscriptionState = {
                ...currentSub,
                additionalServices: updatedServices,
              };

              const addonInvoice: Invoice = {
                id: `inv-addon-${Date.now()}`,
                invoiceNumber: data.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
                date: new Date().toISOString(),
                amount: data.amount,
                currency: data.currency,
                status: 'PAID',
                billingCycle: 'MONTHLY',
                planName: `${data.additionalService.name} (${data.additionalService.quantity} un.)`,
                paymentMethod: 'Cartão de Crédito',
                items: [
                  {
                    description: `${data.additionalService.name} - Extensão Adicional`,
                    quantity: String(data.additionalService.quantity || 1),
                    amount: data.amount,
                  },
                ],
              };

              await saveInstitutionBilling(
                user.uid,
                updatedSubscription.billingDetails,
                updatedSubscription,
                addonInvoice
              );

              if (refreshProfile) {
                await refreshProfile();
              }

              try {
                confetti({
                  particleCount: 160,
                  spread: 85,
                  origin: { y: 0.6 },
                  colors: ['#9FE870', '#163300', '#22c55e', '#3b82f6', '#fbbf24'],
                });
              } catch {
                // ignore
              }

              // RULE: If purchase is an Upgrade (Workspace Upgrade 1 TB Pool or Gemini AI Pro),
              // callback MUST open a support ticket with the subject of Upgrade for system Superadmins
              // and show a modal mentioning activation can take up to 24 hours.
              const isUpgradeService =
                Boolean(data.isUpgradeService) ||
                data.additionalService.category === 'STORAGE_MEET' ||
                data.additionalService.category === 'AI_GEMINI' ||
                data.additionalService.id === 'prod_VAwC3xtg7ekOxe' ||
                data.additionalService.id === 'prod_VAwGEVkbD2LFvp' ||
                (typeof data.additionalService.name === 'string' &&
                  (data.additionalService.name.toLowerCase().includes('workspace upgrade') ||
                    data.additionalService.name.toLowerCase().includes('storage pool') ||
                    data.additionalService.name.toLowerCase().includes('armazenamento 1 tb') ||
                    data.additionalService.name.toLowerCase().includes('gemini ai pro')));

              if (isUpgradeService) {
                const ticketProtocol =
                  data.upgradeTicketProtocol || `HS-${Math.floor(1000 + Math.random() * 9000)}`;
                const ticketId = `tkt-upg-${ticketProtocol}`;
                const targetUid = user?.uid || institution?.ownerUid || data.tenantUid || 'default-tenant';
                
                const instName =
                  (data.institutionName &&
                  data.institutionName !== 'Instituição Educacional' &&
                  data.institutionName !== 'Instituição de Ensino'
                    ? data.institutionName
                    : null) ||
                  (institution?.institutionName &&
                  institution.institutionName !== 'Instituição Educacional' &&
                  institution.institutionName !== 'Instituição de Ensino' &&
                  institution.institutionName !== 'skoolia Global Administration'
                    ? institution.institutionName
                    : null) ||
                  currentTenant?.name ||
                  (user?.displayName && !user.displayName.includes('@') ? user.displayName : null) ||
                  (data.customerName && !data.customerName.includes('@') && data.customerName !== 'Administrador Institucional' ? data.customerName : null) ||
                  institution?.institutionName ||
                  currentTenant?.name ||
                  'Instituição de Ensino';

                const reqName =
                  (user?.displayName && !user.displayName.includes('@') ? user.displayName : null) ||
                  data.customerName ||
                  institution?.financialContactName ||
                  instName;
                const reqEmail = data.customerEmail || institution?.financialContactEmail || user?.email || '';

                const upgradeTicket: SupportTicket = {
                  id: ticketId,
                  protocol: ticketProtocol,
                  subject: `Upgrade: ${data.additionalService.name} (${data.additionalService.quantity} un.) - ${instName}`,
                  description: `Solicitação automática de provisionamento de Upgrade gerada via confirmação de pagamento.\n\nDetalhes da Contratação:\n- Serviço: ${data.additionalService.name}\n- Quantidade: ${data.additionalService.quantity} unidade(s)\n- Instituição: ${instName} (ID: ${targetUid})\n- Solicitante / Contato: ${reqName} (${reqEmail})\n- Fatura: ${addonInvoice.invoiceNumber}\n- Valor Pago: ${data.currency} ${data.amount}\n- ID da Transação: ${sessionId}\n\nAtenção equipe técnica:\nEste chamado foi aberto automaticamente após a confirmação do pagamento com o assunto de Upgrade. Realizar o provisionamento técnico do recurso no console do Google Workspace da instituição.\nPrazo comunicado ao cliente: até 24 horas.`,
                  category: 'WORKSPACE_PROVISIONING',
                  priority: 'HIGH',
                  status: 'NEW',
                  requesterName: reqName,
                  requesterEmail: reqEmail,
                  institutionName: instName,
                  tenantId: targetUid,
                  preferredLanguage: clientLang,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  slaTargetHours: 24,
                  messages: [
                    {
                      id: `msg-${Date.now()}`,
                      senderName: 'Sistema Skoolia',
                      senderEmail: 'suporte@skoolia.net',
                      senderRole: 'SYSTEM',
                      content: `Pagamento aprovado para o upgrade: ${data.additionalService.name} (${data.additionalService.quantity} un.). Chamado de suporte aberto para a equipe de suporte técnico realizar a ativação técnica no Google Workspace. Prazo previsto: até 24 horas.`,
                      timestamp: new Date().toISOString(),
                    },
                  ],
                };

                // Persist ticket to Firestore and update local state for real-time visibility (prevent duplicates)
                try {
                  const currentLoadedTickets = await fetchInstitutionTickets(targetUid);
                  const alreadyExists = currentLoadedTickets.some(
                    (t) => t.protocol === ticketProtocol || t.id === ticketId
                  );
                  if (!alreadyExists) {
                    const updatedTickets = [
                      upgradeTicket,
                      ...currentLoadedTickets.filter((t) => t.id !== ticketId && t.protocol !== ticketProtocol),
                    ];
                    await saveInstitutionTickets(targetUid, updatedTickets);
                    setSupportTickets(updatedTickets);
                  }
                } catch (tktErr) {
                  console.warn('Aviso ao sincronizar ticket de upgrade no Firestore:', tktErr);
                  setSupportTickets((prev) => {
                    if (prev.some((t) => t.protocol === ticketProtocol || t.id === ticketId)) return prev;
                    return [upgradeTicket, ...prev];
                  });
                }

                // Trigger dedicated Upgrade Modal mentioning that activation can take up to 24 hours
                setUpgradeSuccessModal({
                  isOpen: true,
                  serviceName: data.additionalService.name,
                  quantity: data.additionalService.quantity,
                  protocol: ticketProtocol,
                  ticketId: ticketId,
                  invoiceNumber: addonInvoice.invoiceNumber,
                  amount: data.amount,
                  currency: data.currency,
                });

                addToast(
                  'SUCCESS',
                  'Upgrade Contratado - Suporte Notificado!',
                  `${data.additionalService.name}: chamado de suporte #${ticketProtocol} aberto. A confirmação foi enviada para o seu e-mail e a ativação técnica será concluída em até 24 horas.`
                );
              } else {
                addToast(
                  'SUCCESS',
                  'Serviço Adicional Ativado com Sucesso!',
                  `${data.additionalService.name} (${data.additionalService.quantity} un.) foi integrado e ativado para a sua instituição.`
                );
              }
            } else {
              const isAnnual = data.billingCycle === 'ANNUAL';
              const newSubscription: SubscriptionState = {
                planId: isAnnual ? 'plan-standard-unlimited-annual' : 'plan-standard-unlimited-monthly',
                planName: data.planName || (isAnnual ? 'Workspace Standard Unlimited - Annual' : 'Workspace Standard Unlimited - Monthly'),
                status: 'ACTIVE',
                billingCycle: data.billingCycle || 'MONTHLY',
                currentPrice: data.amount,
                isUnlimitedLicenses: true,
                startDate: new Date().toISOString(),
                nextRenewalDate: new Date(
                  Date.now() + (isAnnual ? 365 : 30) * 86400000
                ).toISOString(),
                paymentMethod: {
                  brand: 'Cartão de Crédito',
                  last4: 'REAL',
                  expiry: 'Ativo',
                  cardholder: data.customerName || 'Cliente Workspace',
                },
                billingDetails: {
                  fullName: data.customerName || '',
                  email: data.customerEmail || '',
                  taxId: data.taxId || '',
                  address: '',
                  city: '',
                  state: '',
                  zipCode: '',
                  country: 'Brasil',
                  countryCode: 'BR',
                },
                additionalServices: institution?.subscription?.additionalServices || [],
              };

              const newInvoice: Invoice = {
                id: `inv-${Date.now()}`,
                invoiceNumber: data.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
                date: new Date().toISOString(),
                amount: data.amount,
                currency: data.currency,
                status: 'PAID',
                billingCycle: data.billingCycle || 'MONTHLY',
                planName: data.planName || (isAnnual ? 'Workspace Standard Unlimited - Annual' : 'Workspace Standard Unlimited - Monthly'),
                paymentMethod: 'Cartão de Crédito',
                items: [
                  {
                    description: `${data.planName || (isAnnual ? 'Workspace Standard Unlimited - Annual' : 'Workspace Standard Unlimited - Monthly')} (${
                      data.billingCycle === 'ANNUAL' ? 'Assinatura Anual' : 'Assinatura Mensal'
                    })`,
                    quantity: '1',
                    amount: data.amount,
                  },
                ],
              };

              await saveInstitutionBilling(
                user.uid,
                newSubscription.billingDetails,
                newSubscription,
                newInvoice
              );

              // Automatically unblock tenant if previously suspended
              const targetTenantId = `tenant-${user.uid}`;
              await updateInstitutionStatusInFirestore(user.uid, 'ACTIVE');
              try {
                await fetch(`/api/tenants/${targetTenantId}/status`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    status: 'ACTIVE',
                    reason: 'Desbloqueio automático pós confirmação de pagamento.',
                  }),
                });
              } catch (e) {
                console.warn('Erro ao notificar desbloqueio automático:', e);
              }
              setTenants((prev) =>
                prev.map((t) =>
                  t.id === targetTenantId
                    ? { ...t, status: 'ACTIVE', suspendedReason: undefined }
                    : t
                )
              );

              if (refreshProfile) {
                await refreshProfile();
              }

              try {
                confetti({
                  particleCount: 150,
                  spread: 80,
                  origin: { y: 0.6 },
                  colors: ['#00c868', '#008a46', '#22c55e', '#3b82f6', '#fbbf24'],
                });
              } catch {
                // ignore
              }

              const toastTitle = data.billingCycle === 'ANNUAL'
                ? 'Plano Anual Ativado Imediatamente!'
                : 'Pagamento Confirmado!';

              const toastDesc = data.billingCycle === 'ANNUAL'
                ? `Assinatura de ${data.currency} ${data.amount} processada com sucesso. O ciclo mensal anterior foi cancelado e o novo plano anual de 12 meses já está ativo (sem reembolso residual).`
                : `Assinatura de ${data.currency} ${data.amount} processada e ativada com sucesso. Fatura e recibo emitidos.`;

              addToast('SUCCESS', toastTitle, toastDesc);

              // Clean up URL without reloading
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }
        })
        .catch((err) => {
          console.error('[Payment Callback Error]', err);
        });
    } else if (paymentStatus === 'cancelled') {
      addToast(
        'INFO',
        'Pagamento Cancelado',
        'A sessão de contratação foi cancelada. Você pode retomar a qualquer momento na aba de Faturamento ou Serviços Adicionais.'
      );
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user, refreshProfile]);

  // Direct tab navigation listener (e.g. ?tab=support)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, []);

  // Support Tickets State (Clean list, no demo data)
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);

  // Sync Support Tickets with Firestore / LocalStorage
  useEffect(() => {
    const loadTickets = async () => {
      // 1. Fetch server-stored tickets (including public tickets submitted from contact page)
      let serverTickets: SupportTicket[] = [];
      try {
        const resp = await fetch('/api/support/tickets');
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data.tickets)) {
            serverTickets = data.tickets;
          }
        }
      } catch (e) {
        console.warn('Erro ao carregar tickets do servidor:', e);
      }

      // Check localStorage for any public tickets
      let localPublicTickets: SupportTicket[] = [];
      try {
        const pub = localStorage.getItem('skoolia_public_tickets');
        if (pub) localPublicTickets = JSON.parse(pub);
      } catch {
        // ignore
      }

      if (isSuperAdmin) {
        try {
          const allInsts = await fetchAllInstitutionsFromFirestore();
          const allTickets: SupportTicket[] = [];
          allInsts.forEach((inst: any) => {
            if (Array.isArray(inst.supportTickets)) {
              inst.supportTickets.forEach((t: SupportTicket) => {
                allTickets.push(sanitizeTicket({
                  ...t,
                  institutionName: t.institutionName || inst.institutionName,
                  tenantId: t.tenantId || inst.ownerUid || inst.id,
                }, inst.institutionName));
              });
            }
          });
          const ownTickets = await fetchInstitutionTickets(user?.uid || '');
          ownTickets.forEach((t) => {
            if (!allTickets.some((existing) => existing.id === t.id)) {
              allTickets.push(sanitizeTicket(t, institution?.institutionName));
            }
          });
          // Merge server tickets (from contact page or direct backend API)
          serverTickets.forEach((st) => {
            if (!allTickets.some((existing) => existing.id === st.id || existing.protocol === st.protocol)) {
              allTickets.push(sanitizeTicket(st, st.institutionName));
            }
          });
          // Merge local public tickets
          localPublicTickets.forEach((lt) => {
            if (!allTickets.some((existing) => existing.id === lt.id || existing.protocol === lt.protocol)) {
              allTickets.push(sanitizeTicket(lt, lt.institutionName));
            }
          });
          setSupportTickets(allTickets);
          return;
        } catch (e) {
          console.warn('Erro ao carregar tickets do SuperAdmin:', e);
        }
      }

      const targetUid = institution?.ownerUid || user?.uid;
      if (targetUid) {
        try {
          const loaded = await fetchInstitutionTickets(targetUid);
          const combined = (loaded || []).map((t) => sanitizeTicket(t, institution?.institutionName));
          serverTickets.forEach((st) => {
            if (st.tenantId === targetUid || (user?.email && st.requesterEmail?.toLowerCase() === user.email.toLowerCase())) {
              if (!combined.some((c) => c.id === st.id || c.protocol === st.protocol)) {
                combined.push(sanitizeTicket(st, st.institutionName));
              }
            }
          });
          setSupportTickets(combined);
        } catch {
          setSupportTickets([]);
        }
      } else {
        setSupportTickets([]);
      }
    };
    loadTickets();
  }, [institution?.ownerUid, user?.uid, isSuperAdmin, institution?.institutionName]);

  const handleSaveSupportTicket = async (rawTicket: SupportTicket, isNew = false) => {
    const newTicket = sanitizeTicket(rawTicket, institution?.institutionName);
    setSupportTickets((prev) => {
      const updated = [newTicket, ...prev.filter((t) => t.id !== newTicket.id)];
      const targetUid = newTicket.tenantId || institution?.ownerUid || user?.uid;
      if (targetUid) {
        const tenantTickets = isSuperAdmin
          ? updated.filter((t) => (t.tenantId || targetUid) === targetUid)
          : updated;
        saveInstitutionTickets(targetUid, tenantTickets).catch((e) =>
          console.warn('Erro ao salvar ticket:', e)
        );
      }
      return updated;
    });
    if (isNew) {
      const ticketLang = (newTicket.preferredLanguage as 'en' | 'es' | 'pt') || language || 'pt';
      const toastTitle =
        ticketLang === 'en'
          ? `Ticket #${newTicket.protocol} Registered`
          : ticketLang === 'es'
          ? `Ticket #${newTicket.protocol} Registrado`
          : `Ticket #${newTicket.protocol} Registrado`;
      const toastMsg =
        ticketLang === 'en'
          ? 'Your ticket was registered successfully. Our technical team has been notified and will reply shortly.'
          : ticketLang === 'es'
          ? 'Su ticket fue registrado con éxito. Nuestro equipo técnico fue notificado y responderá a la brevedad.'
          : 'Seu chamado foi registrado com sucesso. Nossa equipe técnica responderá a sua solicitação com brevidade.';

      addToast('SUCCESS', toastTitle, toastMsg);
    }
  };

  const handleAddTicketMessage = async (
    ticketId: string,
    message: TicketMessage,
    newStatus?: TicketStatus
  ) => {
    setSupportTickets((prev) => {
      let targetTenantUid: string | undefined;
      const updated = prev.map((t) => {
        if (t.id === ticketId) {
          targetTenantUid = t.tenantId;
          const nextStatus = newStatus || t.status;
          return {
            ...t,
            status: nextStatus,
            updatedAt: new Date().toISOString(),
            resolvedAt:
              nextStatus === 'RESOLVED' || nextStatus === 'CLOSED'
                ? t.resolvedAt || new Date().toISOString()
                : undefined,
            messages: [...t.messages, message],
          };
        }
        return t;
      });
      const targetUid = targetTenantUid || institution?.ownerUid || user?.uid;
      if (targetUid) {
        const tenantTickets = isSuperAdmin
          ? updated.filter((t) => (t.tenantId || targetUid) === targetUid)
          : updated;
        saveInstitutionTickets(targetUid, tenantTickets).catch((e) =>
          console.warn('Erro ao salvar mensagem no ticket:', e)
        );
      }
      return updated;
    });
    addToast('SUCCESS', 'Mensagem Enviada', 'Sua resposta foi enviada com sucesso.');
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: TicketStatus) => {
    setSupportTickets((prev) => {
      let targetTenantUid: string | undefined;
      const updated = prev.map((t) => {
        if (t.id === ticketId) {
          targetTenantUid = t.tenantId;
          return {
            ...t,
            status,
            updatedAt: new Date().toISOString(),
            resolvedAt:
              status === 'RESOLVED' || status === 'CLOSED'
                ? new Date().toISOString()
                : undefined,
          };
        }
        return t;
      });
      const targetUid = targetTenantUid || institution?.ownerUid || user?.uid;
      if (targetUid) {
        const tenantTickets = isSuperAdmin
          ? updated.filter((t) => (t.tenantId || targetUid) === targetUid)
          : updated;
        saveInstitutionTickets(targetUid, tenantTickets).catch((e) =>
          console.warn('Erro ao atualizar status do ticket:', e)
        );
      }
      return updated;
    });
    const statusLabel =
      status === 'RESOLVED'
        ? 'Resolvido'
        : status === 'CLOSED'
        ? 'Fechado'
        : status === 'IN_PROGRESS'
        ? 'Em Andamento'
        : status === 'NEW'
        ? 'Aberto'
        : status === 'WAITING_USER'
        ? 'Aguardando Usuário'
        : status;
    addToast(
      'SUCCESS',
      status === 'IN_PROGRESS' || status === 'NEW' ? 'Chamado Reaberto' : 'Status Atualizado',
      `O chamado foi atualizado para "${statusLabel}".`
    );
  };

  const openTicketsCount = useMemo(() => {
    return supportTickets.filter(
      (t) => t.status === 'NEW' || t.status === 'IN_PROGRESS' || t.status === 'WAITING_USER'
    ).length;
  }, [supportTickets]);

  const pendingSuperAdminTicketsCount = useMemo(() => {
    if (!isSuperAdmin) return 0;
    return supportTickets.filter((t) => {
      if (t.status === 'RESOLVED' || t.status === 'CLOSED') return false;
      if (t.status === 'NEW') return true;
      if (t.messages && t.messages.length > 0) {
        const lastMsg = t.messages[t.messages.length - 1];
        return lastMsg.senderRole !== 'SUPPORT_AGENT';
      }
      return true;
    }).length;
  }, [supportTickets, isSuperAdmin]);

  // Fetch Service Account Status & Tenants from Backend
  const fetchServiceAccountStatus = async () => {
    try {
      const res = await fetch('/api/workspace/status');
      if (res.ok) {
        const data = await res.json();
        setServiceAccountStatus(data);
      }
    } catch {
      // Backend starting up or not reachable
    }
  };

  // Function to map an institution profile from Firestore to Tenant
  const mapInstToTenant = useCallback((inst: any): Tenant => {
    const instId = `tenant-${inst.ownerUid || inst.id}`;

    let status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' = 'ACTIVE';
    if (inst.subscription?.status === 'SUSPENDED' || inst.status === 'SUSPENDED') {
      status = 'SUSPENDED';
    } else if (inst.subscription?.status === 'TRIAL' || inst.status === 'TRIAL') {
      status = 'TRIAL';
    }

    // Match associated domain if available
    const emailDomain = (inst.technicalContactEmail || inst.institutionEmail || inst.ownerEmail || '')
      .split('@')[1]?.toLowerCase();
    const matched = domains
      .filter(
        (d) =>
          d.tenantId === instId ||
          d.tenantId === inst.ownerUid ||
          (emailDomain && !['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'].includes(emailDomain) && d.domainName.toLowerCase().includes(emailDomain))
      )
      .map((d) => d.domainName);

    const allowedDomains = Array.from(
      new Set([...(inst.allowedDomains || []), ...matched])
    ).filter(Boolean);

    // Contracted seats: use explicit contractedSeats if configured by SuperAdmin; otherwise empty (unlimited Education)
    const contractedSeats = Array.isArray(inst.contractedSeats) ? inst.contractedSeats : [];

    // Check if the school has completed the full registration form (address, phone, contact details)
    const hasAddress = Boolean(inst.institutionAddress && inst.institutionAddress.trim().length > 0);
    const hasPhone = Boolean(
      (inst.institutionPhone && inst.institutionPhone.trim().length > 0) ||
      (inst.technicalContactPhone && inst.technicalContactPhone.trim().length > 0)
    );
    const isProfileComplete = Boolean(
      inst.isProfileComplete !== undefined
        ? inst.isProfileComplete
        : (hasAddress && hasPhone)
    );

    return {
      id: instId,
      name: inst.institutionName || 'Organização',
      slug: (inst.institutionName || 'org').toLowerCase().replace(/[^a-z0-9]/g, '-'),
      primaryContactEmail: inst.technicalContactEmail || inst.institutionEmail || inst.ownerEmail || '',
      financialContactEmail: inst.financialContactEmail || inst.institutionEmail,
      allowedDomains,
      rootOrgUnitPath: `/${(inst.institutionName || 'Tenant').replace(/\s+/g, '')}`,
      contractedSeats,
      monthlyBudgetUsd: inst.subscription?.currentPrice || 0,
      status,
      suspendedReason:
        inst.suspendedReason ||
        (status === 'SUSPENDED'
          ? 'Inadimplência ou faturas pendentes de regularização.'
          : undefined),
      invoices: inst.invoices,
      stripeCustomerId: inst.stripeCustomerId,
      stripeSubscriptionId: inst.stripeSubscriptionId,
      trialEndsAt: inst.subscription?.nextRenewalDate,
      createdAt: inst.createdAt || new Date().toISOString(),
      isProfileComplete,
      institutionPhone: inst.institutionPhone,
      institutionAddress: inst.institutionAddress,
      technicalContactName: inst.technicalContactName,
      technicalContactPhone: inst.technicalContactPhone,
      financialContactName: inst.financialContactName,
      financialContactPhone: inst.financialContactPhone,
    };
  }, [domains]);

  const fetchTenants = async () => {
    try {
      // Strict tenant isolation: Non-superadmins must never load or see other tenants
      if (!isSuperAdmin) {
        if (institution && (institution.institutionName || institution.ownerUid || institution.id)) {
          const myTenant = mapInstToTenant(institution);
          setTenants([myTenant]);
          setCurrentTenantId(myTenant.id);
        } else if (user?.uid) {
          const myId = `tenant-${user.uid}`;
          const myTenant: Tenant = {
            id: myId,
            name: institution?.institutionName || 'Minha Organização',
            slug: (institution?.institutionName || 'org').toLowerCase().replace(/[^a-z0-9]/g, '-'),
            primaryContactEmail: user.email || '',
            allowedDomains: institution?.allowedDomains || [],
            rootOrgUnitPath: `/${(institution?.institutionName || 'Tenant').replace(/\s+/g, '')}`,
            contractedSeats: [],
            monthlyBudgetUsd: 0,
            status: 'ACTIVE',
            createdAt: institution?.createdAt || new Date().toISOString(),
          };
          setTenants([myTenant]);
          setCurrentTenantId(myId);
        } else {
          setTenants([]);
          setCurrentTenantId('');
        }
        return;
      }

      // 1. Fetch from Firestore database (all institutions registered across the platform)
      let firestoreInstitutions: any[] = [];
      try {
        firestoreInstitutions = await fetchAllInstitutionsFromFirestore();
      } catch (e) {
        console.warn('Erro ao buscar instituições no Firestore:', e);
      }

      // 2. Fetch from backend API
      let backendTenants: Tenant[] = [];
      let backendCurrentTenantId: string | undefined;
      try {
        const res = await fetch('/api/tenants');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.tenants)) {
            backendTenants = data.tenants;
          }
          backendCurrentTenantId = data.currentTenantId;
        }
      } catch {
        // ignore
      }

      const mergedMap = new Map<string, Tenant>();

      // Add all institutions from Firestore database
      firestoreInstitutions.forEach((inst) => {
        const tenant = mapInstToTenant(inst);
        mergedMap.set(tenant.id, tenant);
      });

      // Add backend tenants if not already represented
      backendTenants.forEach((bt) => {
        if (
          bt.id === 'tenant-default' ||
          bt.name === 'Organização Principal' ||
          bt.slug === 'principal' ||
          bt.primaryContactEmail === 'admin@dominio.com'
        ) {
          return;
        }
        if (!mergedMap.has(bt.id)) {
          const existing = Array.from(mergedMap.values()).find(
            (m) =>
              (bt.primaryContactEmail && m.primaryContactEmail.toLowerCase() === bt.primaryContactEmail.toLowerCase()) ||
              (bt.name && m.name.toLowerCase() === bt.name.toLowerCase())
          );
          if (!existing) {
            mergedMap.set(bt.id, bt);
          }
        }
      });

      // Ensure active institution of the logged in user is in the map
      if (institution && institution.institutionName) {
        const myTenant = mapInstToTenant(institution);
        if (!mergedMap.has(myTenant.id)) {
          mergedMap.set(myTenant.id, myTenant);
        }
      }

      const allTenantsList = Array.from(mergedMap.values()).filter(
        (t) =>
          t.id !== 'tenant-default' &&
          t.name !== 'Organização Principal' &&
          t.slug !== 'principal' &&
          t.primaryContactEmail !== 'admin@dominio.com'
      );
      setTenants(allTenantsList);
      if (allTenantsList.length > 0) {
        if (!isSuperAdmin && (institution?.ownerUid || institution?.id || user?.uid)) {
          const myId = `tenant-${institution?.ownerUid || institution?.id || user?.uid}`;
          setCurrentTenantId(myId);
        } else if (backendCurrentTenantId && allTenantsList.some((t) => t.id === backendCurrentTenantId)) {
          setCurrentTenantId(backendCurrentTenantId);
        } else if (!allTenantsList.some((t) => t.id === currentTenantId)) {
          setCurrentTenantId(allTenantsList[0].id);
        }
      } else {
        setCurrentTenantId('');
      }
    } catch (err) {
      console.error('Erro ao buscar todos os tenants da base de dados:', err);
    }
  };

  // Automatically refresh all tenants from database for SuperAdmin and on tab view
  useEffect(() => {
    if (isSuperAdmin || activeTab === 'tenants') {
      fetchTenants();
    }
  }, [isSuperAdmin, activeTab]);

  // LIVE REAL-TIME SYNC: Listen for live changes across SuperAdmin and Tenant systems
  useEffect(() => {
    // 1. If SuperAdmin, attach real-time Firestore collection listener to update tenants list live
    let unsubSnapshot: (() => void) | null = null;
    if (isSuperAdmin) {
      unsubSnapshot = subscribeAllInstitutions((liveInsts) => {
        setTenants((prev) => {
          const map = new Map<string, Tenant>();
          // Preserve any existing tenants
          prev.forEach((t) => map.set(t.id, t));

          // Merge every live institution from Firestore
          liveInsts.forEach((inst) => {
            const mapped = mapInstToTenant(inst);
            map.set(mapped.id, mapped);
          });

          const cleanList = Array.from(map.values()).filter(
            (t) =>
              t.id !== 'tenant-default' &&
              t.name !== 'Organização Principal' &&
              t.slug !== 'principal' &&
              t.primaryContactEmail !== 'admin@dominio.com'
          );
          return cleanList;
        });
      });
    }

    // 2. Multi-Tab and Local Real-time Broadcast Listener for instant Block/Unblock
    const handleStatusSync = (e: any) => {
      const data = e.detail;
      if (!data || !data.tenantId) return;
      const cleanId = data.tenantId.replace(/^tenant-/, '');
      setTenants((prev) =>
        prev.map((t) => {
          const matches =
            t.id === data.tenantId ||
            t.id === cleanId ||
            t.id === `tenant-${cleanId}`;
          if (matches) {
            return {
              ...t,
              status: data.status,
              suspendedReason: data.status === 'SUSPENDED' ? data.suspendedReason : undefined,
            };
          }
          return t;
        })
      );
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('skoolia_tenant_status_change', handleStatusSync);
    }

    // 3. Heartbeat status check for active tenant (runs every 3.5s to ensure instant live sync across isolated sockets)
    let intervalId: any = null;
    if (!isSuperAdmin && user?.uid) {
      intervalId = setInterval(async () => {
        const targetId = currentTenantId || (institution ? `tenant-${institution.ownerUid || institution.id}` : `tenant-${user.uid}`);
        try {
          const res = await fetch(`/api/tenants/${targetId}/status`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.status) {
              setTenants((prev) =>
                prev.map((t) =>
                  t.id === targetId || t.id === `tenant-${user.uid}`
                    ? { ...t, status: data.status, suspendedReason: data.suspendedReason }
                    : t
                )
              );
            }
          }
        } catch {
          // non-blocking
        }
      }, 3500);
    }

    return () => {
      if (unsubSnapshot) unsubSnapshot();
      if (typeof window !== 'undefined') {
        window.removeEventListener('skoolia_tenant_status_change', handleStatusSync);
      }
      if (intervalId) clearInterval(intervalId);
    };
  }, [isSuperAdmin, user?.uid, currentTenantId, institution?.id]);

  // Sync users & domains from Google Workspace backend
  const handleSyncWorkspace = async (showNotification = true) => {
    setIsSyncing(true);
    try {
      const currentTid = institution?.ownerUid || institution?.id || currentTenant?.id || user?.uid || '';
      const res = await fetch('/api/workspace/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': currentTid,
          'x-is-superadmin': isSuperAdmin ? 'true' : 'false',
        },
        body: JSON.stringify({
          tenantId: currentTid,
          isSuperAdmin: !!isSuperAdmin,
        }),
      });
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
      let incomingDomains: WorkspaceDomain[] = data.domains || [];
      if (!incomingDomains || incomingDomains.length === 0) {
        try {
          const currentTid = institution?.ownerUid || institution?.id || currentTenant?.id || user?.uid || '';
          const domRes = await fetch(`/api/domains?tenantId=${encodeURIComponent(currentTid)}&isSuperAdmin=${isSuperAdmin}`, {
            headers: currentTid ? { 'x-tenant-id': currentTid } : {},
          });
          if (domRes.ok) {
            incomingDomains = await domRes.json();
          }
        } catch {
          // ignore
        }
      }

      // Merge tenant's allowedDomains strictly from institution profile if not already present
      const instAllowedDomains = institution?.allowedDomains || [];
      if (instAllowedDomains.length > 0 && !isSuperAdmin) {
        const existingNames = new Set((incomingDomains || []).map((d) => d.domainName.toLowerCase().trim()));
        instAllowedDomains.forEach((domName) => {
          const clean = String(domName).toLowerCase().trim();
          if (clean && !existingNames.has(clean)) {
            incomingDomains.push({
              domainName: clean,
              tenantId: institution?.ownerUid || institution?.id || user?.uid,
              isPrimary: incomingDomains.length === 0,
              verified: true,
              state: 'VERIFIED',
              mxConfigured: true,
              spfConfigured: true,
              dkimConfigured: true,
            });
          }
        });
      }

      if (incomingDomains && incomingDomains.length > 0) {
        setDomains((prev) => {
          const map = new Map<string, WorkspaceDomain>();
          // Keep existing local domains if they have pending status or specific tenantId
          prev.forEach((d) => map.set(d.domainName.toLowerCase(), d));
          // Merge incoming domains from backend
          incomingDomains.forEach((d: WorkspaceDomain) => {
            const existing = map.get(d.domainName.toLowerCase());
            map.set(d.domainName.toLowerCase(), {
              ...d,
              tenantId: d.tenantId || existing?.tenantId || (user?.uid ? user.uid : undefined),
              state: d.state || existing?.state || 'PENDING_APPROVAL',
            });
          });
          return Array.from(map.values());
        });
        syncOrgUnitsWithDomains(incomingDomains);
        if (incomingDomains.length > 0 && !selectedDomain) {
          setSelectedDomain(incomingDomains[0].domainName);
        }
      }

      if (showNotification) {
        addToast(
          'SUCCESS',
          'Sincronização com Google Workspace',
          data.message || 'Dados sincronizados com sucesso.'
        );
      }
    } catch (err: any) {
      if (showNotification) {
        addToast('ERROR', 'Erro na Sincronização', err?.message || 'Não foi possível conectar ao servidor.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchServiceAccountStatus();
    fetchTenants();
    handleSyncWorkspace(false);
  }, []);

  // Re-sync domains & workspace data when authenticated user or tenant identity resolves
  useEffect(() => {
    if (user?.uid || institution?.id || currentTenantId) {
      if (!isSuperAdmin) {
        fetchTenants();
      }
      handleSyncWorkspace(false);
    }
  }, [user?.uid, institution?.id, currentTenantId, isSuperAdmin]);

  // Trigger celebration
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#00c868', '#00e676', '#1ce783', '#111827'],
      });
    } catch {
      // fallback
    }
  };

  // Tenant Operations
  const handleSelectTenant = async (tenantId: string) => {
    setCurrentTenantId(tenantId);
    try {
      await fetch('/api/tenants/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId }),
      });
      const selected = tenants.find((t) => t.id === tenantId);
      addToast('SUCCESS', 'Tenant Selecionado', `Agora gerenciando ${selected?.name || 'Organização'}.`);
      handleSyncWorkspace(false);
    } catch {
      // local state already switched
    }
  };

  const handleCreateTenant = async (tenantData: Partial<Tenant>) => {
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': isSuperAdmin ? 'SUPER_ADMIN' : 'ADMIN',
          'x-superadmin': isSuperAdmin ? 'true' : 'false',
        },
        body: JSON.stringify({
          ...tenantData,
          createdBySuperAdmin: isSuperAdmin,
          skipWelcomeEmail: isSuperAdmin,
        }),
      });
      let created: Tenant;
      if (res.ok) {
        created = await res.json();
      } else {
        throw new Error('Falha ao registrar tenant no backend');
      }

      // Persist to Firestore database so it exists permanently in institutions collection
      await createInstitutionTenantInFirestore(created);

      setTenants((prev) => [...prev.filter((t) => t.id !== created.id), created]);
      setCurrentTenantId(created.id);
      addToast(
        'SUCCESS',
        'Nova Organização Criada!',
        `${created.name} cadastrada com sucesso na base de dados.`
      );
      triggerConfetti();
    } catch {
      const fallbackTenant: Tenant = {
        id: `tenant-${Date.now()}`,
        name: tenantData.name || 'Nova Organização',
        slug: (tenantData.name || 'org').toLowerCase().replace(/[^a-z0-9]/g, '-'),
        primaryContactEmail: tenantData.primaryContactEmail || '',
        financialContactEmail: tenantData.financialContactEmail || tenantData.primaryContactEmail,
        allowedDomains: tenantData.allowedDomains || [],
        rootOrgUnitPath: `/Tenants/${tenantData.name?.replace(/\s+/g, '')}`,
        contractedSeats: tenantData.contractedSeats || [
          { sku: 'Google Workspace Enterprise Plus', allocatedSeats: 25 },
        ],
        monthlyBudgetUsd: tenantData.monthlyBudgetUsd || 1000,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };
      await createInstitutionTenantInFirestore(fallbackTenant);
      setTenants((prev) => [...prev.filter((t) => t.id !== fallbackTenant.id), fallbackTenant]);
      setCurrentTenantId(fallbackTenant.id);
      addToast('SUCCESS', 'Organização Criada', `${fallbackTenant.name} ativada.`);
    }
  };

  const handleToggleTenantStatus = async (
    tenantId: string,
    newStatus: 'ACTIVE' | 'SUSPENDED',
    reason?: string
  ): Promise<void> => {
    try {
      const targetTenant = tenants.find((t) => t.id === tenantId);
      const res = await fetch(`/api/tenants/${tenantId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-app-language': language,
        },
        body: JSON.stringify({
          status: newStatus,
          reason,
          name: targetTenant?.name,
          email: targetTenant?.primaryContactEmail,
          preferredLanguage: language,
          lang: language,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao alterar status da organização');
      }

      // Also persist status update to Firestore database
      const uid = tenantId.replace(/^tenant-/, '');
      await updateInstitutionStatusInFirestore(uid, newStatus, reason);

      // Broadcast live status change immediately
      broadcastTenantStatus({
        tenantId,
        status: newStatus,
        suspendedReason: newStatus === 'SUSPENDED' ? reason : undefined,
      });

      setTenants((prev) =>
        prev.map((t) =>
          t.id === tenantId
            ? {
                ...t,
                status: newStatus,
                suspendedReason: newStatus === 'SUSPENDED' ? reason : undefined,
              }
            : t
        )
      );

      addToast(
        'SUCCESS',
        newStatus === 'SUSPENDED' ? 'Organização Bloqueada' : 'Organização Desbloqueada',
        `Status atualizado com sucesso.`
      );
    } catch (err: any) {
      addToast('ERROR', 'Falha ao alterar status', err?.message);
      throw err;
    }
  };

  const handleDeleteTenant = async (tenantId: string): Promise<void> => {
    try {
      // 1. Delete from backend API
      try {
        await fetch(`/api/tenants/${tenantId}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.warn('Erro ao excluir tenant no backend:', err);
      }

      // 2. Delete from Firestore institutions collection
      const uid = tenantId.replace(/^tenant-/, '');
      try {
        await deleteInstitutionFromFirestore(uid);
      } catch (err) {
        console.warn('Erro ao excluir instituição no Firestore:', err);
      }

      // 3. Update local state
      setTenants((prev) => {
        const remaining = prev.filter((t) => t.id !== tenantId);
        if (currentTenantId === tenantId) {
          setCurrentTenantId(remaining[0]?.id || '');
        }
        return remaining;
      });

      addToast('SUCCESS', 'Organização Excluída', 'A instituição foi excluída com sucesso do sistema.');
    } catch (err: any) {
      addToast('ERROR', 'Falha na Exclusão', err?.message || 'Não foi possível excluir a organização.');
      throw err;
    }
  };

  const handleUpdateTenant = async (
    tenantId: string,
    updates: Partial<Tenant>,
    customToast?: { title: string; message: string } | null
  ): Promise<void> => {
    try {
      // 1. Send update to backend
      try {
        await fetch(`/api/tenants/${tenantId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
      } catch (err) {
        console.warn('Erro ao atualizar tenant no backend:', err);
      }

      // 2. Update Firestore
      const uid = tenantId.replace(/^tenant-/, '');
      const firestoreUpdates: any = {};
      if (updates.name) firestoreUpdates.institutionName = updates.name;
      if (updates.primaryContactEmail) {
        firestoreUpdates.institutionEmail = updates.primaryContactEmail;
        firestoreUpdates.technicalContactEmail = updates.primaryContactEmail;
      }
      if (updates.financialContactEmail) {
        firestoreUpdates.financialContactEmail = updates.financialContactEmail;
      }
      if (updates.status) {
        firestoreUpdates.status = updates.status;
        firestoreUpdates.subscription = { status: updates.status };
      }
      if (updates.suspendedReason !== undefined) {
        firestoreUpdates.suspendedReason = updates.suspendedReason;
      }
      if (updates.invoices) {
        firestoreUpdates.invoices = updates.invoices;
      }
      if (updates.allowedDomains) {
        firestoreUpdates.allowedDomains = updates.allowedDomains;
      }
      if (updates.contractedSeats) {
        firestoreUpdates.contractedSeats = updates.contractedSeats;
      }
      try {
        await updateInstitutionInFirestore(uid, firestoreUpdates);
        fetch('/api/tenants/sync-firestore', { method: 'POST' }).catch(() => {});
      } catch (err) {
        console.warn('Erro ao atualizar instituição no Firestore:', err);
      }

      // 3. Update local state
      setTenants((prev) =>
        prev.map((t) => (t.id === tenantId ? { ...t, ...updates } : t))
      );

      // If current institution matches, synchronize it in memory
      if (institution && ((institution as any).tenantUid === tenantId || (institution as any).tenantUid === uid || institution.ownerUid === uid)) {
        if (refreshProfile) {
          refreshProfile().catch(() => {});
        }
      }

      // 4. Personalized Toast Notifications
      if (customToast === null) {
        // Explicitly suppressed by caller
        return;
      }

      if (customToast) {
        addToast('SUCCESS', customToast.title, customToast.message);
      } else if (updates.status === 'SUSPENDED') {
        addToast('INFO', 'Organização Bloqueada', 'O acesso desta instituição foi suspenso com sucesso.');
      } else if (updates.status === 'ACTIVE') {
        addToast('SUCCESS', 'Organização Desbloqueada', 'O acesso ao console foi reativado com sucesso.');
      } else if (updates.contractedSeats) {
        addToast('SUCCESS', 'Licenças Atualizadas', 'As licenças e assentos da organização foram salvos.');
      } else if (updates.allowedDomains) {
        addToast('SUCCESS', 'Domínios Atualizados', 'A lista de domínios da organização foi atualizada.');
      } else if (updates.invoices) {
        addToast('SUCCESS', 'Faturas Sincronizadas', 'O histórico de faturas foi atualizado com sucesso.');
      } else if (updates.suspendedReason !== undefined) {
        addToast('SUCCESS', 'Motivo Atualizado', 'O motivo do bloqueio foi salvo com sucesso.');
      } else {
        addToast('SUCCESS', 'Dados Salvos', 'As informações cadastrais foram atualizadas com sucesso.');
      }
    } catch (err: any) {
      addToast('ERROR', 'Erro ao Atualizar', err?.message || 'Falha ao salvar alterações.');
      throw err;
    }
  };

  const handleAddTenantDomain = async (tenantId: string, domainName: string, isPrimary = false): Promise<void> => {
    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
          'x-is-superadmin': 'true',
        },
        body: JSON.stringify({
          domainName,
          tenantId,
          isPrimary,
          isSuperAdmin: true,
        }),
      });
      fetch('/api/tenants/sync-firestore', { method: 'POST' }).catch(() => {});
      const data = await res.json();
      if (data.success && data.domain) {
        setDomains((prev) => [data.domain, ...prev.filter((d) => d.domainName !== domainName)]);
      } else {
        const fallbackDomain: WorkspaceDomain = {
          domainName,
          tenantId,
          isPrimary,
          verified: true,
          state: 'VERIFIED',
          mxConfigured: true,
          spfConfigured: true,
          dkimConfigured: true,
        };
        setDomains((prev) => [fallbackDomain, ...prev.filter((d) => d.domainName !== domainName)]);
      }

      // Also ensure tenant allowedDomains is updated
      setTenants((prev) =>
        prev.map((t) => {
          if (t.id === tenantId) {
            const allowed = Array.from(new Set([...(t.allowedDomains || []), domainName]));
            return { ...t, allowedDomains: allowed };
          }
          return t;
        })
      );

      addToast('SUCCESS', 'Domínio Vinculado', `${domainName} vinculado à organização.`);
    } catch (err: any) {
      addToast('ERROR', 'Erro ao Vincular Domínio', err?.message);
      throw err;
    }
  };

  const handleDeleteTenantDomain = async (domainName: string, tenantId?: string): Promise<void> => {
    try {
      await fetch(`/api/domains/${encodeURIComponent(domainName)}`, {
        method: 'DELETE',
      });
      setDomains((prev) => prev.filter((d) => d.domainName !== domainName));

      if (tenantId) {
        setTenants((prev) =>
          prev.map((t) => {
            if (t.id === tenantId) {
              return {
                ...t,
                allowedDomains: (t.allowedDomains || []).filter((d) => d !== domainName),
              };
            }
            return t;
          })
        );
      }
      addToast('SUCCESS', 'Domínio Removido', `${domainName} desvinculado com sucesso.`);
    } catch (err: any) {
      addToast('ERROR', 'Erro ao Remover Domínio', err?.message);
      throw err;
    }
  };

  const handleUpdateTenantDomain = async (domainName: string, updates: Partial<WorkspaceDomain>): Promise<void> => {
    setDomains((prev) =>
      prev.map((d) => (d.domainName === domainName ? { ...d, ...updates } : d))
    );
    addToast('SUCCESS', 'Domínio Atualizado', `Configurações de ${domainName} atualizadas.`);
  };

  // User Actions (calls backend service with Google Workspace live communication)
  const handleCreateUser = async (newUser: WorkspaceUser, sendWelcomeEmail = true) => {
    const tenantLicenseLimit = institution?.subscription?.quantity ?? institution?.subscription?.licenseLimit ?? 200;
    if (!isSuperAdmin && users.length >= tenantLicenseLimit) {
      addToast(
        'ERROR',
        `Limite de Licenças Atingido (${tenantLicenseLimit} Licenças)`,
        'Precisa de uma quantidade customizada? Entre em contato com a nossa equipe em help@skoolia.net ou abra um ticket de suporte para receber uma cotação.'
      );
      return;
    }

    const emailDomain = (newUser.primaryEmail.split('@')[1] || '').trim().toLowerCase();
    const verifiedTenantDomainNames = tenantVerifiedActiveDomains.map((d) => d.domainName.toLowerCase());

    if (!verifiedTenantDomainNames.includes(emailDomain)) {
      addToast(
        'ERROR',
        'Domínio Não Permitido',
        'Não é permitida a criação de usuário sem um domínio institucional ativo e verificado para este tenant.'
      );
      return;
    }

    try {
      const shouldSendWelcome = !isSuperAdmin && sendWelcomeEmail;
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': isSuperAdmin ? 'SUPER_ADMIN' : 'ADMIN',
          'x-superadmin': isSuperAdmin ? 'true' : 'false',
        },
        body: JSON.stringify({
          ...newUser,
          createdBySuperAdmin: isSuperAdmin,
          skipWelcomeEmail: isSuperAdmin || !shouldSendWelcome,
          sendWelcomeEmail: shouldSendWelcome,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao criar usuário');
      }

      const data = await res.json();
      const userToStore = data.user || newUser;

      setUsers((prev) => [userToStore, ...prev.filter((u) => u.id !== userToStore.id)]);
      addToast(
        'SUCCESS',
        data.live ? 'Conta criada no Google Workspace!' : 'Conta criada no Workspace!',
        `${userToStore.name.fullName} (${userToStore.primaryEmail}) já está ativo.`
      );
      triggerConfetti();
    } catch (err: any) {
      addToast('ERROR', 'Falha ao Criar Usuário', err?.message);
    }
  };

  const handleBatchImport = async (newUsers: WorkspaceUser[]) => {
    const tenantLicenseLimit = institution?.subscription?.quantity ?? institution?.subscription?.licenseLimit ?? 200;
    if (!isSuperAdmin && users.length + newUsers.length > tenantLicenseLimit) {
      const remaining = Math.max(0, tenantLicenseLimit - users.length);
      addToast(
        'ERROR',
        'Capacidade de Licenças Excedida',
        `Sua instituição possui apenas ${remaining} licença(s) disponível(is) do limite de ${tenantLicenseLimit} contas. Precisa de uma quantidade customizada? Entre em contato com a nossa equipe em help@skoolia.net ou abra um ticket de suporte para receber uma cotação.`
      );
      return;
    }

    setUsers((prev) => [...newUsers, ...prev]);
    addToast(
      'SUCCESS',
      'Importação em Lote Concluída!',
      `${newUsers.length} colaboradores adicionados à lista de usuários.`
    );
    triggerConfetti();
  };

  const handleSaveEditedUser = async (updatedUser: WorkspaceUser & { password?: string }) => {
    try {
      const originalIdentifier =
        editingUser?.primaryEmail || editingUser?.id || updatedUser.primaryEmail || updatedUser.id;

      const res = await fetch(`/api/users/${encodeURIComponent(originalIdentifier)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao atualizar usuário');
      }

      const data = await res.json();
      const userResult = data.user || updatedUser;

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userResult.id || u.id === editingUser?.id || u.primaryEmail === originalIdentifier
            ? userResult
            : u
        )
      );
      addToast(
        'SUCCESS',
        'Usuário atualizado com sucesso!',
        `Alterações sincronizadas para ${userResult.primaryEmail}.`
      );
      setEditingUser(null);
    } catch (err: any) {
      addToast('ERROR', 'Erro ao Atualizar', err?.message);
    }
  };

  const handleToggleUserStatus = (user: WorkspaceUser) => {
    const isSuspending = user.status === 'ACTIVE';

    setConfirmModalState({
      isOpen: true,
      title: isSuspending ? 'Suspender Usuário Workspace?' : 'Reativar Conta do Usuário?',
      message: isSuspending
        ? `O usuário ${user.name?.fullName || user.primaryEmail} perderá acesso imediato ao Gmail, Google Drive, Meet e serviços corporativos.`
        : `Deseja reativar o acesso de ${user.name?.fullName || user.primaryEmail}? O colaborador poderá fazer login novamente usando suas credenciais corporativas.`,
      targetResource: user.primaryEmail,
      confirmLabel: isSuspending ? 'Suspender Conta' : 'Reativar Conta',
      isDestructive: isSuspending,
      onConfirm: async () => {
        const newStatus = isSuspending ? 'SUSPENDED' : 'ACTIVE';
        try {
          await fetch(`/api/users/${user.primaryEmail || user.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
          });

          setUsers((prev) =>
            prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
          );
          addToast(
            'SUCCESS',
            isSuspending ? 'Conta Suspensa' : 'Conta Reativada',
            `${user.primaryEmail} agora está ${isSuspending ? 'SUSPENSO' : 'ATIVO'}.`
          );
        } catch (err: any) {
          addToast('ERROR', 'Erro ao alterar status', err?.message);
        } finally {
          setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleResetUserPassword = (user: WorkspaceUser) => {
    setEditingUser(user);
    setEditingUserInitialTab('security');
    setAutoOpenResetPasswordConfirm(true);
  };

  const handleDeleteUser = (user: WorkspaceUser) => {
    setConfirmModalState({
      isOpen: true,
      title: 'EXCLUIR CONTA NO GOOGLE WORKSPACE?',
      message: `ATENÇÃO: A exclusão de ${user.name?.fullName || user.primaryEmail} (${user.primaryEmail}) removerá permanentemente a conta corporativa, incluindo arquivos do Drive e emails.`,
      targetResource: user.primaryEmail,
      confirmLabel: 'Excluir Definitivamente',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await fetch(`/api/users/${user.primaryEmail || user.id}`, {
            method: 'DELETE',
          });

          setUsers((prev) => prev.filter((u) => u.id !== user.id && u.primaryEmail !== user.primaryEmail));
          addToast(
            'SUCCESS',
            'Conta Excluída',
            `${user.primaryEmail} foi removido do Google Workspace.`
          );
        } catch (err: any) {
          addToast('ERROR', 'Erro ao excluir conta', err?.message);
        } finally {
          setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleExportCsv = (customUsers?: WorkspaceUser[]) => {
    const dataToExport = customUsers && customUsers.length > 0 ? customUsers : users;
    const csvContent = exportUsersToGoogleAdminCsv(dataToExport);
    downloadCsv(`usuarios_workspace_${Date.now()}.csv`, csvContent);
    addToast(
      'SUCCESS',
      'Planilha Exportada!',
      `${dataToExport.length} registros exportados no formato oficial de usuários CSV.`
    );
  };

  // Domain Handlers
  const handleAddDomain = async (newDomain: WorkspaceDomain) => {
    const cleanDomain = newDomain.domainName.toLowerCase().trim();
    const domainWithTenant: WorkspaceDomain = {
      ...newDomain,
      domainName: cleanDomain,
      tenantId: institution?.ownerUid || institution?.id || user?.uid || currentTenant?.id,
      state: newDomain.state || 'PENDING_APPROVAL',
    };
    const domainName = cleanDomain;
    const ouPath = `/${domainName}`;

    // Automatically create Organizational Unit named exactly after the domain
    const newDomainOU: OrgUnit = {
      id: `ou-domain-${domainName.replace(/[^a-zA-Z0-9]/g, '-')}`,
      name: domainName,
      path: ouPath,
      parentPath: '/',
      description: `Unidade Organizacional do domínio ${domainName}`,
      userCount: 0,
      policies: {
        externalDriveSharing: true,
        require2SV: false,
        allowYoutubeUploads: true,
        sessionLengthHours: 24,
      },
    };

    setDomains((prev) => {
      const exists = prev.some((d) => d.domainName.toLowerCase() === domainName.toLowerCase());
      if (exists) {
        return prev.map((d) => (d.domainName.toLowerCase() === domainName.toLowerCase() ? domainWithTenant : d));
      }
      return [...prev, domainWithTenant];
    });

    // Update institution profile in Firestore to persistently record allowedDomains
    if (user?.uid && institution) {
      const currentAllowed = institution.allowedDomains || [];
      if (!currentAllowed.some((d) => d.toLowerCase() === cleanDomain)) {
        const updatedAllowed = [...currentAllowed, cleanDomain];
        saveInstitutionProfile(user.uid, {
          ...institution,
          allowedDomains: updatedAllowed,
        }).catch((err) => console.warn('Could not save allowedDomains to Firestore:', err));
      }
    }

    // Update active tenant state in memory
    setTenants((prev) =>
      prev.map((t) => {
        const matchesUser =
          user?.uid &&
          (t.id === user.uid ||
            t.id === `tenant-${user.uid}` ||
            t.id.replace(/^tenant-/, '') === user.uid);
        const matchesCurrent = currentTenant && t.id === currentTenant.id;
        if (matchesUser || matchesCurrent) {
          const allowed = Array.from(new Set([...(t.allowedDomains || []), cleanDomain]));
          return { ...t, allowedDomains: allowed };
        }
        return t;
      })
    );

    setOrgUnits((prev) => {
      const exists = prev.some(
        (ou) => ou.path.toLowerCase() === ouPath.toLowerCase() || ou.name.toLowerCase() === domainName.toLowerCase()
      );
      if (exists) return prev;
      return [...prev, newDomainOU];
    });

    if (!selectedDomain) setSelectedDomain(domainName);

    try {
      await fetch('/api/orgunits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: domainName,
          parentPath: '/',
          description: `Unidade Organizacional do domínio ${domainName}`,
        }),
      });
    } catch {
      // ignore
    }

    addToast(
      'SUCCESS',
      'Domínio Registrado!',
      `${domainName} cadastrado. Domínio pronto para verificação e gerenciamento no Google Workspace.`
    );
  };

  const handleApproveDomain = async (domainName: string, txtToken: string, adminNotes?: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/domains/${encodeURIComponent(domainName)}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-language': language,
        },
        body: JSON.stringify({
          txtToken,
          adminNotes,
          adminEmail: user?.email || 'gyrlatam@gmail.com',
          preferredLanguage: language,
          lang: language,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao aprovar domínio');
      }

      const data = await res.json();

      setDomains((prev) =>
        prev.map((d) =>
          d.domainName.toLowerCase() === domainName.toLowerCase()
            ? {
                ...d,
                state: 'PENDING_DNS',
                verificationTxtToken: txtToken,
                adminNotes,
                auditRecord: data.auditRecord,
              }
            : d
        )
      );

      addToast(
        'SUCCESS',
        'Registros Enviados ao Cliente',
        `Os registros TXT, MX e SPF foram disponibilizados. O domínio ${domainName} está pendente de propagação DNS.`
      );
      return true;
    } catch (err: any) {
      addToast('ERROR', 'Falha na Aprovação', err?.message);
      return false;
    }
  };

  const handleVerifyDomainDns = async (domainName: string): Promise<any> => {
    try {
      const res = await fetch(`/api/domains/${encodeURIComponent(domainName)}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (data.ok || data.state === 'VERIFIED') {
        setDomains((prev) =>
          prev.map((d) =>
            d.domainName.toLowerCase() === domainName.toLowerCase()
              ? {
                  ...d,
                  state: 'VERIFIED',
                  verified: true,
                  mxConfigured: !!data.mxMatched,
                  spfConfigured: !!data.spfMatched,
                  auditRecord: data.auditRecord,
                }
              : d
          )
        );

        addToast(
          'SUCCESS',
          'Domínio Verificado com Sucesso!',
          `Os registros DNS de ${domainName} foram confirmados no DNS público e ativos no Workspace.`
        );
        triggerConfetti();
      }

      return data;
    } catch (err: any) {
      return { ok: false, message: err?.message || 'Erro ao verificar DNS.' };
    }
  };

  const handleUnverifyDomain = async (domainName: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/domains/${encodeURIComponent(domainName)}/unverify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Falha ao desverificar domínio.');
      }

      const data = await res.json();

      setDomains((prev) =>
        prev.map((d) =>
          d.domainName.toLowerCase() === domainName.toLowerCase()
            ? {
                ...d,
                state: 'PENDING_APPROVAL',
                verified: false,
                verificationTxtToken: undefined,
                auditRecord: data.auditRecord,
              }
            : d
        )
      );

      addToast(
        'INFO',
        'Domínio Desverificado',
        `O status de verificação de ${domainName} foi revogado e retornou para a fila de aprovação.`
      );
      return true;
    } catch (err: any) {
      addToast('ERROR', 'Falha ao desverificar', err?.message);
      return false;
    }
  };

  const handleVerifyDomain = (domainName: string) => {
    setDomains((prev) =>
      prev.map((d) => (d.domainName === domainName ? { ...d, verified: true, state: 'VERIFIED' } : d))
    );
    addToast(
      'SUCCESS',
      'Domínio Verificado!',
      `Os registros DNS do domínio ${domainName} foram validados com sucesso.`
    );
  };

  const handleDeleteDomain = async (domainName: string) => {
    try {
      const res = await fetch(`/api/domains/${encodeURIComponent(domainName)}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Falha ao remover domínio');
      }

      setDomains((prev) => prev.filter((d) => d.domainName !== domainName));
      if (selectedDomain === domainName) {
        setSelectedDomain(domains.find((d) => d.domainName !== domainName)?.domainName || '');
      }
      addToast('INFO', 'Domínio Removido', `O domínio ${domainName} foi removido do console.`);
    } catch (err: any) {
      addToast('ERROR', 'Erro ao remover domínio', err?.message);
    }
  };

  const handleSetPrimaryDomain = (domainName: string) => {
    setDomains((prev) =>
      prev.map((d) => ({
        ...d,
        isPrimary: d.domainName === domainName,
      }))
    );
    setSelectedDomain(domainName);
    addToast(
      'SUCCESS',
      'Domínio Principal Atualizado',
      `${domainName} agora é o domínio corporativo principal.`
    );
  };

  const handleUpdateDomain = (updatedDomain: WorkspaceDomain) => {
    setDomains((prev) =>
      prev.map((d) => (d.domainName === updatedDomain.domainName ? { ...d, ...updatedDomain } : d))
    );
  };

  const pendingApprovalsCount = isSuperAdmin
    ? domains.filter((d) => !d.verified && d.state !== 'VERIFIED' && d.state !== 'PENDING_DNS').length
    : 0;

  // Automatically clear /login and /admin/login/popup from URL once user logs in
  useEffect(() => {
    if (
      user &&
      (currentPath === '/login' ||
        currentPath.startsWith('/login') ||
        currentPath === '/entrar' ||
        currentPath.startsWith('/admin/login/popup'))
    ) {
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.history.replaceState({}, '', '/');
        setCurrentPath('/');
      }
    }
  }, [user, currentPath]);

  if (loading) {
    return <SkooliaLoader variant="fullscreen" />;
  }

  if (!user) {
    if (isPrivacyRoute) {
      return (
        <PublicLegalView
          pageType="privacy"
          onNavigate={navigate}
          isUserLoggedIn={false}
        />
      );
    }

    if (isTermsRoute) {
      return (
        <PublicLegalView
          pageType="terms"
          onNavigate={navigate}
          isUserLoggedIn={false}
        />
      );
    }

    if (isContractsRoute) {
      return (
        <PublicLegalView
          pageType="contracts"
          onNavigate={navigate}
          isUserLoggedIn={false}
        />
      );
    }

    if (isContactRoute) {
      return (
        <PublicContactPage
          onNavigate={navigate}
          isUserLoggedIn={false}
          onGoToLogin={() => navigate('/login')}
          onGoToRegister={() => navigate('/login')}
          onSaveTicket={handleSaveSupportTicket}
        />
      );
    }

    const isAdminPopupLoginRoute =
      normalizedPath === '/admin/login/popup' ||
      normalizedPath === '/admin/login/popup/' ||
      normalizedPath.startsWith('/admin/login/popup');

    if (isAdminPopupLoginRoute) {
      return <AdminPopupAuthView onBackToHome={() => navigate('/')} />;
    }

    const isLoginRoute =
      normalizedPath === '/login' ||
      normalizedPath.startsWith('/login') ||
      normalizedPath === '/entrar' ||
      normalizedPath.startsWith('/entrar');

    if (isLoginRoute) {
      return <AuthView onBackToHome={() => navigate('/')} />;
    }

    return (
      <HomePage
        onGoToLogin={() => navigate('/login')}
        onGoToContracts={() => navigate('/contracts')}
        onGoToPrivacy={() => navigate('/legal/privacy/terms')}
        onGoToTerms={() => navigate('/legal/terms')}
        onGoToContact={() => navigate('/contact')}
      />
    );
  }

  // Handle direct navigation to legal pages when user is authenticated
  if (isPrivacyRoute) {
    return (
      <PublicLegalView
        pageType="privacy"
        onNavigate={navigate}
        isUserLoggedIn={true}
      />
    );
  }

  if (isTermsRoute) {
    return (
      <PublicLegalView
        pageType="terms"
        onNavigate={navigate}
        isUserLoggedIn={true}
      />
    );
  }

  if (isContactRoute) {
    return (
      <PublicContactPage
        onNavigate={navigate}
        isUserLoggedIn={true}
        onGoToLogin={() => navigate('/login')}
        onGoToRegister={() => navigate('/login')}
        onGoToDashboard={() => {
          navigate('/');
          setActiveTab('support');
        }}
        onSaveTicket={handleSaveSupportTicket}
      />
    );
  }

  if (!isProfileComplete) {
    return <CompleteProfileView />;
  }

  // Check if tenant is blocked/suspended by SuperAdmin (non-superadmin users cannot bypass)
  const isTenantSuspended =
    !isSuperAdmin &&
    (institution?.status === 'SUSPENDED' ||
      (institution?.subscription?.status as any) === 'SUSPENDED' ||
      currentTenant?.status === 'SUSPENDED');

  if (isTenantSuspended) {
    return (
      <BlockingModal
        tenant={
          currentTenant || {
            id: `tenant-${user.uid}`,
            name: institution?.institutionName,
            status: 'SUSPENDED',
            suspendedReason: institution?.suspendedReason,
            invoices: institution?.invoices,
          }
        }
        institution={institution}
        onUnlockSuccess={async () => {
          if (currentTenant) {
            setTenants((prev) =>
              prev.map((t) =>
                t.id === currentTenant.id
                  ? { ...t, status: 'ACTIVE', suspendedReason: undefined }
                  : t
              )
            );
          }
          if (refreshProfile) {
            await refreshProfile();
          }
          addToast(
            'SUCCESS',
            'Organização Desbloqueada!',
            'Pagamento confirmado e acesso ao console restaurado com sucesso.'
          );
        }}
        onLogout={async () => {
          await logout();
          navigate('/login');
        }}
      />
    );
  }

  return (
    <div className="min-h-[100dvh] h-[100dvh] w-full max-w-[100vw] overflow-hidden bg-[#F4F5F0] text-[#0E0F0C] flex flex-col font-['Plus_Jakarta_Sans',system-ui,sans-serif]">
      {/* skoolia Header */}
      <SkooliaHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedDomain={selectedDomain || (visibleDomains.find((d) => d.isPrimary)?.domainName)}
        domains={visibleDomains}
        users={visibleUsers}
        onOpenCreateUser={() => setIsCreateUserOpen(true)}
        onOpenBatchImport={() => setIsBatchImportOpen(true)}
        onSelectUser={(u) => {
          setEditingUser(u);
          setEditingUserInitialTab('info');
          setAutoOpenResetPasswordConfirm(false);
          setActiveTab('licenses');
        }}
        onSelectDomain={(domainName) => {
          setSelectedDomain(domainName);
          handleTabChange('domains');
        }}
        setActiveTab={handleTabChange}
        currentTenant={currentTenant}
        onOpenTenantSelector={isSuperAdmin ? () => setIsTenantModalOpen(true) : undefined}
        serviceAccountStatus={serviceAccountStatus}
        onOpenServiceAccountModal={() => setIsServiceAccountModalOpen(true)}
        onSyncWorkspace={() => handleSyncWorkspace(true)}
        isSyncing={isSyncing}
        institution={institution}
        pendingTicketsCount={pendingSuperAdminTicketsCount}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
      />

      {/* Main Body Layout with Fixed Sidebar and Independent Scrollable Content */}
      <div className="flex-1 flex min-w-0 overflow-hidden relative">
        {/* Navigation Sidebar */}
        <SkooliaSidebar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          userCount={visibleUsers.length}
          pendingApprovalsCount={pendingApprovalsCount}
          openTicketsCount={openTicketsCount}
          isSuperAdmin={isSuperAdmin}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Content View Container with independent scroll */}
        <main className="flex-1 min-w-0 w-full h-full overflow-y-auto p-3 sm:p-6 lg:p-8 flex flex-col">
          <div className="max-w-[1600px] mx-auto w-full min-w-0 flex-1 flex flex-col justify-between">
            <div key={activeTab} className="flex-1 animate-view-enter">
              {activeTab === 'dashboard' && (
              <DashboardView
                users={visibleUsers}
                selectedDomain={selectedDomain}
                domains={visibleDomains}
                licenses={visibleLicenses}
                isSuperAdmin={isSuperAdmin}
                tenants={tenants}
                currentTenantId={currentTenantId}
                onSelectTenant={handleSelectTenant}
                onNavigateToTenants={() => handleTabChange('tenants')}
                onOpenCreateUser={() => setIsCreateUserOpen(true)}
                onOpenBatchImport={() => setIsBatchImportOpen(true)}
                onSelectUserForEdit={(user) => {
                  setEditingUser(user);
                  setEditingUserInitialTab('info');
                  setAutoOpenResetPasswordConfirm(false);
                }}
                onToggleUserStatus={handleToggleUserStatus}
                onResetUserPassword={handleResetUserPassword}
                onDeleteUser={handleDeleteUser}
                onExportCsv={handleExportCsv}
              />
            )}

            {activeTab === 'approvals' && isSuperAdmin && (
              <ApprovalsView
                domains={domains}
                onRefreshDomains={() => handleSyncWorkspace(false)}
                onApproveDomain={handleApproveDomain}
                onVerifyDomainDns={handleVerifyDomainDns}
                onUnverifyDomain={handleUnverifyDomain}
                onDeleteDomain={handleDeleteDomain}
              />
            )}

            {activeTab === 'tenants' && isSuperAdmin && (
              <TenantsView
                tenants={tenants}
                currentTenantId={currentTenantId}
                isSuperAdmin={isSuperAdmin}
                users={users}
                domains={domains}
                onSelectTenant={handleSelectTenant}
                onCreateTenant={handleCreateTenant}
                onDeleteTenant={handleDeleteTenant}
                onUpdateTenant={handleUpdateTenant}
                onAddDomain={handleAddTenantDomain}
                onDeleteDomain={handleDeleteTenantDomain}
                onUpdateDomain={handleUpdateTenantDomain}
                onOpenServiceAccountModal={() => setIsServiceAccountModalOpen(true)}
                onToggleTenantStatus={handleToggleTenantStatus}
                onPreviewBlockingModal={(tenantToPreview) => setPreviewBlockingModalTenant(tenantToPreview)}
                onToggleUserStatus={handleToggleUserStatus}
                onResetUserPassword={handleResetUserPassword}
                onDeleteUser={handleDeleteUser}
                onExportCsv={handleExportCsv}
              />
            )}

            {activeTab === 'emails' && isSuperAdmin && (
              <EmailsView
                currentUserEmail={user?.email || 'gyrlatam@gmail.com'}
                isSuperAdmin={isSuperAdmin}
              />
            )}

            {activeTab === 'licenses' && (
              <LicensesView
                users={visibleUsers}
                onOpenCreateUser={() => setIsCreateUserOpen(true)}
                onOpenBatchImport={() => setIsBatchImportOpen(true)}
                onExportCsv={handleExportCsv}
                onSelectUserForEdit={(user) => {
                  setEditingUser(user);
                  setEditingUserInitialTab('info');
                  setAutoOpenResetPasswordConfirm(false);
                }}
                onToggleUserStatus={handleToggleUserStatus}
                onResetUserPassword={handleResetUserPassword}
                onDeleteUser={handleDeleteUser}
                onOpenQuoteTicket={handleOpenQuoteTicket}
              />
            )}

            {activeTab === 'domains' && (
              <DomainsView
                domains={visibleDomains}
                users={visibleUsers}
                onAddDomain={handleAddDomain}
                onVerifyDomain={handleVerifyDomain}
                onDeleteDomain={handleDeleteDomain}
                onSetPrimaryDomain={handleSetPrimaryDomain}
                onNavigateToServices={() => setActiveTab('services')}
                onUpdateDomain={handleUpdateDomain}
              />
            )}

            {activeTab === 'services' && (
              <AdditionalServicesView currentTenant={currentTenant} />
            )}

            {activeTab === 'billing' && (
              <BillingView
                licenses={visibleLicenses}
                users={visibleUsers}
                tenants={tenants}
                isSuperAdmin={isSuperAdmin}
                onOpenQuoteTicket={handleOpenQuoteTicket}
              />
            )}

            {activeTab === 'contracts' && (
              <ContractsView
                initialContractSlug={currentContractSlug}
                onUrlChange={(newPath) => setCurrentPath(newPath)}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                domains={visibleDomains}
                users={visibleUsers}
                isSuperAdmin={isSuperAdmin}
                onSaveNotification={() =>
                  addToast('SUCCESS', 'Configurações Salvas', 'Dados da instituição e políticas atualizados com sucesso.')
                }
              />
            )}

            {activeTab === 'support' && (
              <SupportView
                tickets={supportTickets}
                onSaveTicket={handleSaveSupportTicket}
                onAddMessage={handleAddTicketMessage}
                onUpdateTicketStatus={handleUpdateTicketStatus}
                autoOpenCreateModal={supportPrefill.autoOpen}
                initialCategory={supportPrefill.category}
                initialSubject={supportPrefill.subject}
                initialDescription={supportPrefill.description}
                onResetAutoOpen={() => setSupportPrefill((prev) => ({ ...prev, autoOpen: false }))}
              />
            )}
          </div>

          {/* Discreet Dashboard Legal Footer */}
          <footer className="mt-10 sm:mt-12 pt-6 sm:pt-7 border-t border-[#E2E6DF] pb-6 text-xs text-[#868685]">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
              {/* Left: Entity & Address */}
              <div className="flex flex-col items-center sm:items-start gap-1 text-center sm:text-left">
                <div className="flex items-center gap-2">
                  <span className="font-black text-[#0E0F0C] font-['Outfit'] text-xs">
                    skoolia
                  </span>
                  <span className="text-[#CBD3C5]">•</span>
                  <span className="font-semibold text-[#0E0F0C]">
                    InternetByMOL LLC
                  </span>
                </div>
                <p className="text-[#868685] text-[10.5px] leading-normal">
                  3101 North Central Avenue, Phoenix, 85012, United States
                </p>
              </div>

              {/* Right: Terms, Support Email & Copyright */}
              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-4 text-center sm:text-right">
                <a
                  href="/legal/privacy/terms"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/legal/privacy/terms');
                  }}
                  className="text-[#5E605D] hover:text-[#163300] hover:underline transition-colors"
                >
                  {language === 'pt' ? 'Privacidade' : language === 'es' ? 'Privacidad' : 'Privacy'}
                </a>
                <span className="text-[#CBD3C5]">•</span>
                <a
                  href="/legal/terms"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/legal/terms');
                  }}
                  className="text-[#5E605D] hover:text-[#163300] hover:underline transition-colors"
                >
                  {language === 'pt' ? 'Termos' : language === 'es' ? 'Términos' : 'Terms'}
                </a>
                <span className="text-[#CBD3C5]">•</span>
                <button
                  type="button"
                  onClick={() => {
                    if (window.location.pathname !== '/contracts') {
                      window.history.pushState({ contractSlug: null }, '', '/contracts');
                    }
                    setActiveTab('contracts');
                  }}
                  className="text-[#5E605D] hover:text-[#163300] hover:underline transition-colors cursor-pointer"
                >
                  {t('footer.universalTermsAndContracts') || 'Contratos'}
                </button>
                <span className="text-[#CBD3C5]">•</span>
                <a
                  href="/contact"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/contact');
                  }}
                  className="text-[#5E605D] hover:text-[#163300] hover:underline transition-colors"
                >
                  {language === 'pt' ? 'Contato' : language === 'es' ? 'Contacto' : 'Contact'}
                </a>
                <div className="flex items-center gap-2 text-[#868685]">
                  <span className="hidden sm:inline text-[#CBD3C5]">•</span>
                  <a
                    href="mailto:help@skoolia.net"
                    className="text-[#008a46] font-semibold hover:underline"
                  >
                    help@skoolia.net
                  </a>
                  <span className="text-[#CBD3C5]">•</span>
                  <span>
                    © {new Date().getFullYear()}
                  </span>
                </div>
              </div>
            </div>
          </footer>
          </div>
        </main>
      </div>

      {/* Modals & Dialogs */}
      <TenantSelectorModal
        isOpen={isTenantModalOpen}
        onClose={() => setIsTenantModalOpen(false)}
        tenants={tenants}
        currentTenantId={currentTenantId}
        onSelectTenant={handleSelectTenant}
        onCreateTenant={handleCreateTenant}
      />

      <ServiceAccountSettingsModal
        isOpen={isServiceAccountModalOpen}
        onClose={() => setIsServiceAccountModalOpen(false)}
        status={serviceAccountStatus}
        onRefreshStatus={fetchServiceAccountStatus}
      />

      <CreateUserModal
        isOpen={isCreateUserOpen}
        onClose={() => setIsCreateUserOpen(false)}
        domains={tenantVerifiedActiveDomains}
        onCreateUser={handleCreateUser}
        onNavigateToDomains={() => setActiveTab('domains')}
        isSuperAdmin={isSuperAdmin}
        currentUsersCount={users.length}
        licenseLimit={institution?.subscription?.isUnlimitedLicenses !== false ? 999999 : (institution?.subscription?.quantity ?? institution?.subscription?.licenseLimit ?? 999999)}
        onOpenQuoteTicket={handleOpenQuoteTicket}
      />

      <BatchImportModal
        isOpen={isBatchImportOpen}
        onClose={() => setIsBatchImportOpen(false)}
        onImportComplete={(createdUsers) => {
          const isUnlimited = institution?.subscription?.isUnlimitedLicenses !== false;
          const tenantLicenseLimit = institution?.subscription?.quantity ?? institution?.subscription?.licenseLimit ?? 200;
          if (!isSuperAdmin && !isUnlimited && users.length + createdUsers.length > tenantLicenseLimit) {
            const remaining = Math.max(0, tenantLicenseLimit - users.length);
            addToast(
              'ERROR',
              'Capacidade de Licenças Excedida',
              `Sua instituição possui apenas ${remaining} licença(s) disponível(is). Entre em contato com a nossa equipe em help@skoolia.net para receber suporte.`
            );
            return;
          }

          setUsers((prev) => {
            const existingIds = new Set(createdUsers.map((u) => u.id));
            const existingEmails = new Set(createdUsers.map((u) => u.primaryEmail.toLowerCase()));
            const filtered = prev.filter(
              (u) => !existingIds.has(u.id) && !existingEmails.has(u.primaryEmail.toLowerCase())
            );
            return [...createdUsers, ...filtered];
          });
          addToast(
            'SUCCESS',
            'Importação Concluída com Sucesso',
            `${createdUsers.length} contas criadas e vinculadas aos domínios no Google Workspace.`
          );
          triggerConfetti();
        }}
        domains={tenantVerifiedActiveDomains}
        allTenantDomains={visibleDomains}
        onNavigateToDomains={() => setActiveTab('domains')}
      />

      <EditUserModal
        user={editingUser}
        domains={tenantVerifiedActiveDomains}
        isOpen={editingUser !== null}
        initialTab={editingUserInitialTab}
        autoOpenResetPasswordConfirm={autoOpenResetPasswordConfirm}
        onClose={() => {
          setEditingUser(null);
          setEditingUserInitialTab(undefined);
          setAutoOpenResetPasswordConfirm(false);
        }}
        onSaveUser={handleSaveEditedUser}
        onToggleUserStatus={handleToggleUserStatus}
        onResetPassword={(resetUser) => {
          setUsers((prev) =>
            prev.map((u) =>
              u.id === resetUser.id ? { ...u, mustChangePasswordAtNextLogin: true } : u
            )
          );
        }}
        onDeleteUser={handleDeleteUser}
        onNavigateToServices={() => {
          setEditingUser(null);
          setEditingUserInitialTab(undefined);
          setAutoOpenResetPasswordConfirm(false);
          setActiveTab('services');
        }}
      />

      <WelcomeTrialModal
        isOpen={isWelcomeTrialOpen}
        onClose={handleCloseWelcomeTrial}
        institutionName={institution?.institutionName}
      />

      <ConfirmationModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        targetResource={confirmModalState.targetResource}
        confirmLabel={confirmModalState.confirmLabel}
        isDestructive={confirmModalState.isDestructive}
        onConfirm={confirmModalState.onConfirm}
        onCancel={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
      />

      {upgradeSuccessModal && (
        <UpgradeActivationModal
          isOpen={upgradeSuccessModal.isOpen}
          onClose={() => setUpgradeSuccessModal(null)}
          serviceName={upgradeSuccessModal.serviceName}
          quantity={upgradeSuccessModal.quantity}
          protocol={upgradeSuccessModal.protocol}
          ticketId={upgradeSuccessModal.ticketId}
          invoiceNumber={upgradeSuccessModal.invoiceNumber}
          amount={upgradeSuccessModal.amount}
          currency={upgradeSuccessModal.currency}
          onViewTickets={() => {
            setUpgradeSuccessModal(null);
            setActiveTab('support');
          }}
        />
      )}

      {/* Preview Blocking Modal for SuperAdmin */}
      {previewBlockingModalTenant && (
        <BlockingModal
          tenant={previewBlockingModalTenant}
          institution={institution}
          onUnlockSuccess={async () => {
            const targetId = previewBlockingModalTenant.id;
            setPreviewBlockingModalTenant(null);
            setTenants((prev) =>
              prev.map((t) =>
                t.id === targetId ? { ...t, status: 'ACTIVE', suspendedReason: undefined } : t
              )
            );
            addToast('SUCCESS', 'Simulação Concluída', 'O tenant foi desbloqueado com sucesso na simulação.');
          }}
          onLogout={() => setPreviewBlockingModalTenant(null)}
        />
      )}

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <WorkspaceAdminApp />
      </AuthProvider>
    </LanguageProvider>
  );
}
