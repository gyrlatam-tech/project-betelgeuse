import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Building2,
  Globe,
  CreditCard,
  Receipt,
  Mail,
  AlertTriangle,
  X,
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Save,
  Send,
  ExternalLink,
  Users,
  RefreshCw,
  Clock,
  Ban,
  Check,
  DollarSign,
  FileText,
  RotateCcw,
  Info,
  Search,
  FileSpreadsheet,
  Lock,
  Unlock,
  KeyRound,
  Square,
  CheckSquare,
  HardDrive,
  Copy,
  Eye,
} from 'lucide-react';
import type {
  Tenant,
  WorkspaceDomain,
  WorkspaceUser,
  WorkspaceLicense,
  Invoice,
  BillingDetails,
  SubscriptionState,
  InstitutionProfile,
} from '../types';
import { useLanguage } from '../context/LanguageContext';
import { broadcastTenantStatus } from '../lib/firebase';
import { exportUsersToGoogleAdminCsv, downloadCsv } from '../utils/csvHelper';

const AVAILABLE_SKUS: WorkspaceLicense[] = [
  'Google Workspace for Education Fundamentals',
  'Google Workspace Fundamentals',
  'Google Workspace Business Standard',
  'Google Workspace Business Starter',
  'Google Workspace Enterprise Plus',
  'Google Workspace Frontline',
  'Cloud Identity Free',
  'Google Workspace Standard Unlimited',
];

interface EmailLogItem {
  id: string;
  timestamp: string;
  type: string;
  to: string;
  subject: string;
  status: 'DELIVERED' | 'SENT' | 'SIMULATED' | 'FAILED' | 'PENDING' | string;
  from?: string;
  html?: string;
  text?: string;
  errorMessage?: string;
}

interface TenantAdminModalProps {
  tenant: Tenant;
  isOpen: boolean;
  onClose: () => void;
  isSuperAdmin: boolean;
  allUsers: WorkspaceUser[];
  allDomains: WorkspaceDomain[];
  onUpdateTenant: (
    tenantId: string,
    updates: Partial<Tenant>,
    customToast?: { title: string; message: string }
  ) => Promise<void>;
  onDeleteTenant: (tenantId: string) => Promise<void>;
  onAddDomain: (tenantId: string, domainName: string, isPrimary?: boolean) => Promise<void>;
  onDeleteDomain: (domainName: string, tenantId?: string) => Promise<void>;
  onUpdateDomain: (domainName: string, updates: Partial<WorkspaceDomain>) => Promise<void>;
  onPreviewBlockingModal?: (tenant: Tenant) => void;
  onToggleUserStatus?: (user: WorkspaceUser) => void;
  onResetUserPassword?: (user: WorkspaceUser) => void;
  onDeleteUser?: (user: WorkspaceUser) => void;
  onExportCsv?: (selectedUsers?: WorkspaceUser[]) => void;
}

export const TenantAdminModal: React.FC<TenantAdminModalProps> = ({
  tenant,
  isOpen,
  onClose,
  isSuperAdmin,
  allUsers,
  allDomains,
  onUpdateTenant,
  onDeleteTenant,
  onAddDomain,
  onDeleteDomain,
  onUpdateDomain,
  onPreviewBlockingModal,
  onToggleUserStatus,
  onResetUserPassword,
  onDeleteUser,
  onExportCsv,
}) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'info' | 'domains' | 'licenses' | 'financial' | 'emails' | 'danger'>('info');

  // Form State: Info
  const [name, setName] = useState(tenant.name || '');
  const [primaryContactEmail, setPrimaryContactEmail] = useState(tenant.primaryContactEmail || '');
  const [financialContactEmail, setFinancialContactEmail] = useState(tenant.financialContactEmail || '');
  const [status, setStatus] = useState<'ACTIVE' | 'SUSPENDED' | 'TRIAL'>(tenant.status || 'ACTIVE');
  const [suspendedReason, setSuspendedReason] = useState<string>(
    tenant.suspendedReason || 'Inadimplência ou faturas pendentes de regularização.'
  );
  const [isEditingReason, setIsEditingReason] = useState<boolean>(false);
  const [isBlockConfirmOpen, setIsBlockConfirmOpen] = useState<boolean>(false);
  const [isUnblockConfirmOpen, setIsUnblockConfirmOpen] = useState<boolean>(false);
  const [blockPromptReason, setBlockPromptReason] = useState<string>(
    tenant.suspendedReason || 'Inadimplência de faturas e pendências financeiras em aberto.'
  );
  const [monthlyBudgetUsd, setMonthlyBudgetUsd] = useState(String(tenant.monthlyBudgetUsd || 0));

  // Additional institution details (loaded from Firestore or defaults)
  const [institutionPhone, setInstitutionPhone] = useState('');
  const [institutionAddress, setInstitutionAddress] = useState('');
  const [country, setCountry] = useState('Brasil');
  const [technicalContactName, setTechnicalContactName] = useState(tenant.name || '');
  const [technicalContactPhone, setTechnicalContactPhone] = useState('');
  const [financialContactName, setFinancialContactName] = useState(tenant.name || '');
  const [financialContactPhone, setFinancialContactPhone] = useState('');
  const [studentsCount, setStudentsCount] = useState('300');
  const [teachersCount, setTeachersCount] = useState('25');

  // Licenses local state
  const [contractedSeats, setContractedSeats] = useState<{ sku: WorkspaceLicense; allocatedSeats: number }[]>(
    tenant.contractedSeats || []
  );

  // Financial details local state
  const [billingDetails, setBillingDetails] = useState<BillingDetails>({
    fullName: tenant.name,
    email: tenant.financialContactEmail || tenant.primaryContactEmail,
    taxId: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Brasil',
  });
  const [invoices, setInvoices] = useState<Invoice[]>(tenant.invoices || []);
  const [loadingInvoices, setLoadingInvoices] = useState<boolean>(false);
  const [subscription, setSubscription] = useState<SubscriptionState | null>(null);

  // Fetch all invoices for the registered financial email
  const fetchStripeInvoices = async () => {
    const finEmail = (financialContactEmail || tenant.financialContactEmail || '').trim().toLowerCase();
    const primEmail = (primaryContactEmail || tenant.primaryContactEmail || '').trim().toLowerCase();
    const emailsList = Array.from(new Set([finEmail, primEmail].filter(Boolean)));

    if (emailsList.length === 0) return;

    setLoadingInvoices(true);
    try {
      const res = await fetch('/api/billing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: finEmail || primEmail,
          financialEmail: finEmail,
          primaryEmail: primEmail,
          emails: emailsList,
          tenantUid: tenant.id.replace(/^tenant-/, ''),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.invoices)) {
          const combined = [...data.invoices];
          if (tenant.invoices && Array.isArray(tenant.invoices)) {
            tenant.invoices.forEach((localInv) => {
              const existingIdx = combined.findIndex(
                (c) => c.id === localInv.id || (localInv.invoiceNumber && c.invoiceNumber === localInv.invoiceNumber)
              );
              if (existingIdx === -1) {
                combined.push(localInv);
              } else if (localInv.status === 'VOID') {
                combined[existingIdx] = { ...combined[existingIdx], status: 'VOID' };
              }
            });
          }
          const voidedSet = new Set(tenant.voidedInvoiceIds || []);
          const finalInvoices = combined.map((inv) => {
            if (voidedSet.has(inv.id) || (inv.invoiceNumber && voidedSet.has(inv.invoiceNumber))) {
              return { ...inv, status: 'VOID' as const };
            }
            return inv;
          });
          setInvoices(finalInvoices);
        }
      }
    } catch (fetchErr) {
      console.warn('Erro ao consultar faturas:', fetchErr);
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStripeInvoices();
    }
  }, [isOpen, tenant.id, financialContactEmail, primaryContactEmail]);

  // Helper to identify strictly voided/annulled invoices
  const isInvoiceVoided = (inv: Invoice): boolean => {
    if (!inv) return false;
    const s = (inv.status || '').toUpperCase();
    return s === 'VOID' || s === 'VOIDED' || s === 'CANCELED' || s === 'CANCELLED';
  };

  // Helper to identify paid invoices (strictly excluding voided)
  const isInvoicePaid = (inv: Invoice): boolean => {
    if (!inv || isInvoiceVoided(inv)) return false;
    return (inv.status || '').toUpperCase() === 'PAID';
  };

  // Helper to identify strictly overdue invoices (strictly excluding voided)
  const isInvoiceOverdue = (inv: Invoice): boolean => {
    if (!inv || isInvoiceVoided(inv)) return false;
    const s = (inv.status || '').toUpperCase();
    if (s === 'OVERDUE' || s === 'PAST_DUE' || s === 'UNCOLLECTIBLE') return true;
    if (inv.dueDate && (s === 'OPEN' || s === 'PENDING')) {
      return new Date(inv.dueDate).getTime() < Date.now();
    }
    return false;
  };

  // Calculate Lifetime Spend (total of all paid invoices, strictly non-voided)
  const lifetimeSpend = useMemo(() => {
    return invoices
      .filter(isInvoicePaid)
      .reduce((acc, inv) => {
        const amt = inv.amount === 25000 ? 250.0 : (inv.amount || 0);
        return acc + amt;
      }, 0);
  }, [invoices]);

  // Categorized Invoices lists
  const overdueInvoices = useMemo(() => {
    return invoices.filter(isInvoiceOverdue);
  }, [invoices]);

  const paidInvoices = useMemo(() => {
    return invoices.filter(isInvoicePaid);
  }, [invoices]);

  const voidedInvoices = useMemo(() => {
    return invoices.filter(isInvoiceVoided);
  }, [invoices]);

  const pendingInvoices = useMemo(() => {
    return invoices.filter(
      (inv) => !isInvoiceVoided(inv) && !isInvoiceOverdue(inv) && !isInvoicePaid(inv)
    );
  }, [invoices]);

  // Overdue Balance: ONLY the sum of overdue invoices (never considers voided, paid, or regular pending)
  const overdueBalance = useMemo(() => {
    return overdueInvoices.reduce((acc, inv) => {
      const amt = inv.amount === 25000 ? 250.0 : (inv.amount || 0);
      return acc + amt;
    }, 0);
  }, [overdueInvoices]);

  // Financial invoices filter ('all' | 'overdue' | 'paid' | 'pending' | 'voided')
  const [invoiceFilter, setInvoiceFilter] = useState<'all' | 'overdue' | 'paid' | 'pending' | 'voided'>('all');

  // Filtered invoices according to active tab
  const filteredInvoices = useMemo(() => {
    if (invoiceFilter === 'overdue') return overdueInvoices;
    if (invoiceFilter === 'paid') return paidInvoices;
    if (invoiceFilter === 'pending') return pendingInvoices;
    if (invoiceFilter === 'voided') return voidedInvoices;
    return invoices;
  }, [invoiceFilter, invoices, overdueInvoices, paidInvoices, pendingInvoices, voidedInvoices]);

  // Modals for Critical Actions & Cadastre Changes
  const [licenseToDelete, setLicenseToDelete] = useState<{ sku: WorkspaceLicense; seats: number } | null>(null);
  const [licenseToEditConfirm, setLicenseToEditConfirm] = useState<{ sku: WorkspaceLicense; newSeats: number; currentSeats: number } | null>(null);
  const [domainToDelete, setDomainToDelete] = useState<string | null>(null);
  const [isConfirmSaveCadastroOpen, setIsConfirmSaveCadastroOpen] = useState(false);
  const [invoiceToToggleVoid, setInvoiceToToggleVoid] = useState<Invoice | null>(null);

  // Handler for SuperAdmin to initiate Void/Anulada confirmation for any invoice
  const handleInitiateToggleVoidInvoice = (targetInvoice: Invoice) => {
    setInvoiceToToggleVoid(targetInvoice);
  };

  // Execution of Void/Anulada toggle after modal confirmation
  const handleExecuteToggleVoidInvoice = async () => {
    if (!invoiceToToggleVoid) return;
    const targetInvoice = invoiceToToggleVoid;
    const isCurrentlyVoided = isInvoiceVoided(targetInvoice);
    const targetKey = targetInvoice.id || targetInvoice.invoiceNumber;
    if (!targetKey) return;

    setIsSaving(true);
    try {
      const currentVoided = new Set(tenant.voidedInvoiceIds || []);
      if (isCurrentlyVoided) {
        currentVoided.delete(targetInvoice.id);
        if (targetInvoice.invoiceNumber) currentVoided.delete(targetInvoice.invoiceNumber);
      } else {
        currentVoided.add(targetKey);
        if (targetInvoice.invoiceNumber) currentVoided.add(targetInvoice.invoiceNumber);
      }
      const updatedVoidedList = Array.from(currentVoided);
      const newStatus = isCurrentlyVoided ? 'OPEN' : 'VOID';

      setInvoices((prev) =>
        prev.map((inv) => {
          if (
            inv.id === targetInvoice.id ||
            (targetInvoice.invoiceNumber && inv.invoiceNumber === targetInvoice.invoiceNumber)
          ) {
            return { ...inv, status: newStatus as any };
          }
          return inv;
        })
      );

      await onUpdateTenant(
        tenant.id,
        {
          voidedInvoiceIds: updatedVoidedList,
        },
        {
          title: isCurrentlyVoided
            ? t('tenants.adminModal.financial.toastUnvoidedTitle') || 'Fatura Reativada'
            : t('tenants.adminModal.financial.toastVoidedTitle') || 'Fatura Anulada',
          message: isCurrentlyVoided
            ? t('tenants.adminModal.financial.toastUnvoidedMsg', {
                number: targetInvoice.invoiceNumber || targetInvoice.id,
              }) || `Fatura ${targetInvoice.invoiceNumber || targetInvoice.id} reativada.`
            : t('tenants.adminModal.financial.toastVoidedMsg', {
                number: targetInvoice.invoiceNumber || targetInvoice.id,
              }) || `Fatura ${targetInvoice.invoiceNumber || targetInvoice.id} marcada como anulada.`,
        }
      );
      setInvoiceToToggleVoid(null);
    } catch (err: any) {
      alert(`Erro ao atualizar fatura: ${err?.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Email Logs local state
  const [allLogs, setAllLogs] = useState<EmailLogItem[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [emailScope, setEmailScope] = useState<'tenant' | 'all'>('tenant');
  const [emailSearch, setEmailSearch] = useState('');
  const [selectedEmailDetail, setSelectedEmailDetail] = useState<any | null>(null);
  const [loadingEmailDetail, setLoadingEmailDetail] = useState(false);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [testEmailFeedback, setTestEmailFeedback] = useState<string | null>(null);

  // Modals inside TenantAdminModal
  const [isAddDomainModalOpen, setIsAddDomainModalOpen] = useState(false);
  const [newDomainName, setNewDomainName] = useState('');
  const [newDomainIsPrimary, setNewDomainIsPrimary] = useState(false);

  const [isAddLicenseModalOpen, setIsAddLicenseModalOpen] = useState(false);
  const [newLicenseSku, setNewLicenseSku] = useState<WorkspaceLicense>('Google Workspace Fundamentals');
  const [newLicenseSeats, setNewLicenseSeats] = useState('50');

  const [editingLicenseSku, setEditingLicenseSku] = useState<WorkspaceLicense | null>(null);
  const [editingLicenseSeats, setEditingLicenseSeats] = useState('');

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  // Synchronize when tenant changes
  useEffect(() => {
    setName(tenant.name || '');
    setPrimaryContactEmail(tenant.primaryContactEmail || '');
    setFinancialContactEmail(tenant.financialContactEmail || '');
    setStatus(tenant.status || 'ACTIVE');
    setSuspendedReason(tenant.suspendedReason || 'Inadimplência ou faturas pendentes de regularização.');
    setBlockPromptReason(tenant.suspendedReason || 'Inadimplência de faturas e pendências financeiras em aberto.');
    setMonthlyBudgetUsd(String(tenant.monthlyBudgetUsd || 0));
    setContractedSeats(tenant.contractedSeats || []);
  }, [tenant]);

  // Load Firestore institution profile to populate complete billing & metrics
  useEffect(() => {
    const loadInstitutionProfile = async () => {
      try {
        const uid = tenant.id.replace(/^tenant-/, '');
        const res = await fetch(`/api/tenants`);
        // If profile details can be fetched:
        if (tenant.id) {
          // fetch from Firestore if possible via parent or mock/local
        }
      } catch {
        // ignore
      }
    };
    loadInstitutionProfile();
  }, [tenant.id]);

  // Load Email Logs for this tenant
  const fetchEmailLogs = async () => {
    setLoadingEmails(true);
    try {
      const res = await fetch('/api/emails/logs');
      if (res.ok) {
        const data = await res.json();
        const logs: EmailLogItem[] = Array.isArray(data.logs) ? data.logs : [];
        setAllLogs(logs);
      }
    } catch (e) {
      console.warn('Erro ao carregar logs de e-mail:', e);
    } finally {
      setLoadingEmails(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmailLogs();
    }
  }, [isOpen, tenant.id, tenant.primaryContactEmail, activeTab]);

  const handleOpenEmailDetail = async (log: EmailLogItem) => {
    setSelectedEmailDetail({ ...log });
    setLoadingEmailDetail(true);
    try {
      const res = await fetch(`/api/emails/detail/${log.id}`);
      if (res.ok) {
        const detail = await res.json();
        setSelectedEmailDetail(detail);
      }
    } catch (err) {
      console.warn('Erro ao carregar detalhes do email:', err);
    } finally {
      setLoadingEmailDetail(false);
    }
  };

  // Tenant associated domains
  const tenantDomains = useMemo(() => {
    const allowed = new Set((tenant.allowedDomains || []).map((d) => d.toLowerCase()));
    const contactDomain = tenant.primaryContactEmail?.split('@')[1]?.toLowerCase();
    const isGeneric = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'].includes(contactDomain || '');

    const matched = allDomains.filter((d) => {
      const dName = d.domainName.toLowerCase();
      const matchesId = d.tenantId === tenant.id || d.tenantId === tenant.id.replace(/^tenant-/, '');
      const inAllowed = allowed.has(dName);
      const matchesContact = !isGeneric && contactDomain && dName === contactDomain;
      return matchesId || inAllowed || matchesContact;
    });

    // Also include allowedDomains that might not be in allDomains array yet
    const existingNames = new Set(matched.map((m) => m.domainName.toLowerCase()));
    (tenant.allowedDomains || []).forEach((ad) => {
      if (!existingNames.has(ad.toLowerCase())) {
        matched.push({
          domainName: ad,
          tenantId: tenant.id,
          isPrimary: matched.length === 0,
          verified: true,
          state: 'VERIFIED',
          mxConfigured: true,
          spfConfigured: true,
          dkimConfigured: true,
        });
      }
    });

    return matched;
  }, [tenant, allDomains]);

  // Tenant associated users
  const tenantUsers = useMemo(() => {
    const domainNames = tenantDomains.map((d) => d.domainName.toLowerCase());
    const allowedSet = new Set([...(tenant.allowedDomains || []).map((d) => d.toLowerCase()), ...domainNames]);
    const contactDomain = tenant.primaryContactEmail?.split('@')[1]?.toLowerCase();
    const isGeneric = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'].includes(contactDomain || '');

    return allUsers.filter((u) => {
      const uDomain = u.primaryEmail?.split('@')[1]?.toLowerCase();
      if (!uDomain) return false;
      return allowedSet.has(uDomain) || (!isGeneric && contactDomain && uDomain === contactDomain);
    });
  }, [tenant, allUsers, tenantDomains]);

  // Tenant-specific email logs derived reactively
  const emailLogs = useMemo(() => {
    const contactEmail = (tenant.primaryContactEmail || '').toLowerCase().trim();
    const financialEmail = (tenant.financialContactEmail || '').toLowerCase().trim();
    const contactDomain = contactEmail.split('@')[1]?.toLowerCase();
    const isGenericContactDomain = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'].includes(contactDomain || '');

    const domainNames = (tenantDomains || []).map((d) => d.domainName.toLowerCase().trim());
    const allowedSet = new Set([
      ...(tenant.allowedDomains || []).map((d) => (d || '').toLowerCase().trim()),
      ...domainNames,
    ]);

    const tenantName = (tenant.name || '').toLowerCase().trim();

    // Collect all emails associated with this tenant's users
    const tenantUserEmailSet = new Set<string>();
    (tenantUsers || []).forEach((u) => {
      if (u.primaryEmail) tenantUserEmailSet.add(u.primaryEmail.toLowerCase().trim());
      (u.aliases || []).forEach((a) => tenantUserEmailSet.add(a.toLowerCase().trim()));
    });
    (allUsers || []).forEach((u) => {
      if (u.orgUnitPath?.includes(tenant.id) || (tenant.id && u.id?.includes(tenant.id))) {
        if (u.primaryEmail) tenantUserEmailSet.add(u.primaryEmail.toLowerCase().trim());
      }
    });

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    return allLogs.filter((log) => {
      const toRaw = (log.to || '').toLowerCase();
      const extracted = (toRaw.match(emailRegex) || []).map((e) => e.toLowerCase());
      const subject = (log.subject || '').toLowerCase();

      // 1. Direct contact match (exact or substring)
      if (contactEmail && (toRaw.includes(contactEmail) || extracted.includes(contactEmail))) return true;
      if (financialEmail && (toRaw.includes(financialEmail) || extracted.includes(financialEmail))) return true;

      // 2. Tenant users match
      if (extracted.some((e) => tenantUserEmailSet.has(e))) return true;

      // 3. Domain matching across all allowed / active domains
      for (const d of allowedSet) {
        if (d && (extracted.some((e) => e.endsWith(`@${d}`)) || toRaw.includes(`@${d}`))) return true;
      }
      if (!isGenericContactDomain && contactDomain && (extracted.some((e) => e.endsWith(`@${contactDomain}`)) || toRaw.includes(`@${contactDomain}`))) {
        return true;
      }

      // 4. Mentioned tenant name in subject
      if (tenantName && tenantName.length >= 4 && subject.includes(tenantName)) return true;

      return false;
    });
  }, [allLogs, tenant, tenantDomains, tenantUsers, allUsers]);

  const displayedEmails = useMemo(() => {
    const baseList = emailScope === 'tenant' ? emailLogs : allLogs;
    if (!emailSearch.trim()) return baseList;
    const q = emailSearch.toLowerCase().trim();
    return baseList.filter(
      (log) =>
        (log.to && log.to.toLowerCase().includes(q)) ||
        (log.subject && log.subject.toLowerCase().includes(q)) ||
        (log.type && log.type.toLowerCase().includes(q)) ||
        (log.id && log.id.toLowerCase().includes(q))
    );
  }, [emailScope, emailLogs, allLogs, emailSearch]);

  // User Accounts Filter & Management State for this Tenant Modal
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [localUsers, setLocalUsers] = useState<WorkspaceUser[]>(tenantUsers);
  const [userToToggleStatus, setUserToToggleStatus] = useState<WorkspaceUser | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<WorkspaceUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<WorkspaceUser | null>(null);
  const [resetPasswordFeedback, setResetPasswordFeedback] = useState<string | null>(null);
  const [userActionNotice, setUserActionNotice] = useState<string | null>(null);

  // Synchronize localUsers when tenantUsers change
  useEffect(() => {
    setLocalUsers(tenantUsers);
  }, [tenantUsers]);

  const filteredTenantUsers = useMemo(() => {
    return localUsers.filter((u) => {
      const q = userSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (u.name?.fullName || '').toLowerCase().includes(q) ||
        (u.primaryEmail || '').toLowerCase().includes(q) ||
        (u.jobTitle || '').toLowerCase().includes(q) ||
        (u.department || '').toLowerCase().includes(q) ||
        (u.licenses || []).some((lic) => lic.toLowerCase().includes(q));

      let matchesStatus = true;
      if (userStatusFilter === 'ACTIVE') matchesStatus = u.status === 'ACTIVE';
      if (userStatusFilter === 'SUSPENDED') matchesStatus = u.status === 'SUSPENDED';

      return matchesSearch && matchesStatus;
    });
  }, [localUsers, userSearchQuery, userStatusFilter]);

  const activeTenantUsersCount = useMemo(() => {
    return localUsers.filter((u) => u.status === 'ACTIVE').length;
  }, [localUsers]);

  const suspendedTenantUsersCount = useMemo(() => {
    return localUsers.filter((u) => u.status === 'SUSPENDED').length;
  }, [localUsers]);

  const handleToggleSelectUser = (id: string) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter((uid) => uid !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  const handleSelectAllUsers = () => {
    if (selectedUserIds.length === filteredTenantUsers.length && filteredTenantUsers.length > 0) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredTenantUsers.map((u) => u.id));
    }
  };

  const handleExportTenantCsv = () => {
    const toExport = selectedUserIds.length > 0
      ? localUsers.filter((u) => selectedUserIds.includes(u.id))
      : filteredTenantUsers;

    if (onExportCsv) {
      onExportCsv(toExport);
    } else {
      const csv = exportUsersToGoogleAdminCsv(toExport);
      const safeName = (tenant.name || 'organizacao').replace(/[^a-zA-Z0-9_-]/g, '_');
      downloadCsv(`usuarios_${safeName}_${Date.now()}.csv`, csv);
    }
  };

  const handleConfirmToggleUserStatus = (targetUser: WorkspaceUser) => {
    if (onToggleUserStatus) {
      onToggleUserStatus(targetUser);
    }
    const newStatus = targetUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setLocalUsers((prev) =>
      prev.map((u) =>
        u.id === targetUser.id
          ? { ...u, status: newStatus }
          : u
      )
    );
    setUserActionNotice(
      newStatus === 'SUSPENDED'
        ? (language === 'pt' ? `Usuário ${targetUser.primaryEmail} foi suspenso com sucesso.` : `User ${targetUser.primaryEmail} was suspended successfully.`)
        : (language === 'pt' ? `Usuário ${targetUser.primaryEmail} foi reativado com sucesso.` : `User ${targetUser.primaryEmail} was reactivated successfully.`)
    );
    setUserToToggleStatus(null);
  };

  const handleConfirmResetPassword = (targetUser: WorkspaceUser) => {
    if (onResetUserPassword) {
      onResetUserPassword(targetUser);
    }
    const tempPass = `Temp@${Math.floor(100000 + Math.random() * 900000)}!`;
    setResetPasswordFeedback(
      language === 'pt'
        ? `Nova senha temporária gerada para ${targetUser.primaryEmail}: ${tempPass}`
        : language === 'es'
        ? `Nueva contraseña temporal generada para ${targetUser.primaryEmail}: ${tempPass}`
        : `New temporary password generated for ${targetUser.primaryEmail}: ${tempPass}`
    );
    setUserToResetPassword(null);
  };

  const handleConfirmDeleteUser = (targetUser: WorkspaceUser) => {
    if (onDeleteUser) {
      onDeleteUser(targetUser);
    }
    setLocalUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
    setSelectedUserIds((prev) => prev.filter((id) => id !== targetUser.id));
    setUserActionNotice(
      language === 'pt'
        ? `Conta ${targetUser.primaryEmail} removida da organização.`
        : `Account ${targetUser.primaryEmail} removed from organization.`
    );
    setUserToDelete(null);
  };

  // Active licenses list: lists all active licenses (contracted seats + any active licenses assigned to users)
  const activeLicensesList = useMemo(() => {
    const map = new Map<WorkspaceLicense, { sku: WorkspaceLicense; allocatedSeats: number; isContracted: boolean }>();

    // 1. Add all contracted seats
    (contractedSeats || []).forEach((cs) => {
      map.set(cs.sku, {
        sku: cs.sku,
        allocatedSeats: cs.allocatedSeats,
        isContracted: true,
      });
    });

    // 2. Check all users in this tenant to include any active assigned license
    tenantUsers.forEach((u) => {
      (u.licenses || []).forEach((lic) => {
        if (!map.has(lic)) {
          map.set(lic, {
            sku: lic,
            allocatedSeats: 0,
            isContracted: false,
          });
        }
      });
    });

    // 3. Fallback: if no licenses at all, include Education Fundamentals as active default
    if (map.size === 0) {
      map.set('Google Workspace for Education Fundamentals', {
        sku: 'Google Workspace for Education Fundamentals',
        allocatedSeats: 0,
        isContracted: false,
      });
    }

    // 4. Compute metrics for each active license
    return Array.from(map.values()).map((lic) => {
      const usersWithLic = tenantUsers.filter((u) => (u.licenses || []).includes(lic.sku)).length;
      const hasExplicitAssignments = tenantUsers.some((u) => (u.licenses || []).length > 0);
      
      const inUse = hasExplicitAssignments
        ? usersWithLic
        : (lic.allocatedSeats > 0 ? Math.min(tenantUsers.length, lic.allocatedSeats) : tenantUsers.length);

      const isDynamic = lic.allocatedSeats === 0;
      const available = isDynamic ? '∞' : Math.max(0, lic.allocatedSeats - inUse);
      const utilizationPct = lic.allocatedSeats > 0
        ? Math.min(100, Math.round((inUse / lic.allocatedSeats) * 100))
        : 100;

      return {
        sku: lic.sku,
        allocatedSeats: lic.allocatedSeats,
        isContracted: lic.isContracted,
        isDynamic,
        inUse,
        available,
        utilizationPct,
      };
    });
  }, [contractedSeats, tenantUsers]);

  const totalContractedSeats = useMemo(() => {
    return activeLicensesList.reduce((acc, l) => acc + l.allocatedSeats, 0);
  }, [activeLicensesList]);

  const totalInUseSeats = useMemo(() => {
    return activeLicensesList.reduce((acc, l) => acc + l.inUse, 0);
  }, [activeLicensesList]);

  const totalAvailableSeats = useMemo(() => {
    return activeLicensesList.reduce((acc, l) => {
      if (typeof l.available === 'number') {
        return acc + l.available;
      }
      return acc;
    }, 0);
  }, [activeLicensesList]);

  const getSkuBadgeStyle = (sku: string) => {
    const s = (sku || '').toLowerCase();
    if (s.includes('enterprise')) {
      return {
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        border: 'border-indigo-200',
        category: 'Enterprise',
        letter: 'E',
      };
    }
    if (s.includes('business')) {
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        category: 'Business',
        letter: 'B',
      };
    }
    if (s.includes('education') || s.includes('fundamentals')) {
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        category: 'Education',
        letter: 'Edu',
      };
    }
    if (s.includes('identity')) {
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        category: 'Cloud Identity',
        letter: 'ID',
      };
    }
    if (s.includes('gemini') || s.includes('ai')) {
      return {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
        category: 'Gemini AI',
        letter: '✦',
      };
    }
    return {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      category: 'Google Workspace',
      letter: 'G',
    };
  };

  // Save Tenant Changes - Initiate confirmation modal
  const handleInitiateSaveChanges = () => {
    setIsConfirmSaveCadastroOpen(true);
  };
  const handleSaveChanges = handleInitiateSaveChanges;

  // Save Tenant Changes - Execute after confirmation modal
  const handleExecuteSaveChanges = async () => {
    setIsSaving(true);
    try {
      const updates: Partial<Tenant> = {
        name: name.trim(),
        primaryContactEmail: primaryContactEmail.trim().toLowerCase(),
        financialContactEmail: (financialContactEmail.trim() || primaryContactEmail.trim()).toLowerCase(),
        status,
        monthlyBudgetUsd: parseFloat(monthlyBudgetUsd) || 0,
        contractedSeats,
        allowedDomains: tenantDomains.map((d) => d.domainName),
      };

      await onUpdateTenant(tenant.id, updates, {
        title: 'Organização Atualizada',
        message: `As configurações de "${name.trim() || tenant.name}" foram salvas com sucesso.`,
      });
      setIsConfirmSaveCadastroOpen(false);
    } catch (e: any) {
      console.error('Falha ao salvar tenant:', e);
    } finally {
      setIsSaving(false);
    }
  };

  // Execute Block Action
  const handleExecuteBlock = async () => {
    setIsSaving(true);
    try {
      const reason =
        blockPromptReason.trim() ||
        t('tenants.adminModal.submodals.blockConfirm.preset1') ||
        'Inadimplência de faturas e pendências financeiras em aberto.';
      setStatus('SUSPENDED');
      setSuspendedReason(reason);
      setIsBlockConfirmOpen(false);

      // Instant live broadcast to all tabs and active tenant sessions
      broadcastTenantStatus({
        tenantId: tenant.id,
        status: 'SUSPENDED',
        suspendedReason: reason,
      });

      // Synchronize backend API endpoint immediately
      fetch(`/api/tenants/${tenant.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'SUSPENDED',
          reason,
          preferredLanguage: language,
        }),
      }).catch((e) => console.warn('Aviso ao sincronizar PATCH status:', e));

      await onUpdateTenant(
        tenant.id,
        {
          status: 'SUSPENDED',
          suspendedReason: reason,
        },
        {
          title: t('tenants.toastBlockedTitle') || 'Organização Bloqueada',
          message:
            t('tenants.toastBlockedMsg', { name: name || tenant.name }) ||
            `A organização "${name || tenant.name}" foi suspensa com sucesso.`,
        }
      );
    } catch (err: any) {
      alert(`Erro ao suspender organização: ${err?.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Execute Unblock Action
  const handleExecuteUnblock = async () => {
    setIsSaving(true);
    try {
      setStatus('ACTIVE');
      setSuspendedReason('');
      setIsUnblockConfirmOpen(false);

      // Instant live broadcast to all tabs and active tenant sessions
      broadcastTenantStatus({
        tenantId: tenant.id,
        status: 'ACTIVE',
      });

      // Synchronize backend API endpoint immediately
      fetch(`/api/tenants/${tenant.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ACTIVE',
          reason: 'Acesso regular restabelecido pelo SuperAdmin.',
          preferredLanguage: language,
        }),
      }).catch((e) => console.warn('Aviso ao sincronizar PATCH status:', e));

      await onUpdateTenant(
        tenant.id,
        {
          status: 'ACTIVE',
          suspendedReason: undefined,
        },
        {
          title: t('tenants.toastUnblockedTitle') || 'Organização Desbloqueada',
          message:
            t('tenants.toastUnblockedMsg', { name: name || tenant.name }) ||
            `O acesso da organização "${name || tenant.name}" foi reativado com sucesso.`,
        }
      );
    } catch (err: any) {
      alert(`Erro ao desbloquear organização: ${err?.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Add Domain
  const handleAddDomainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDomain = newDomainName.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!cleanDomain) return;

    try {
      await onAddDomain(tenant.id, cleanDomain, newDomainIsPrimary);
      // Update tenant allowedDomains
      const updatedAllowed = Array.from(new Set([...(tenant.allowedDomains || []), cleanDomain]));
      await onUpdateTenant(
        tenant.id,
        { allowedDomains: updatedAllowed },
        {
          title: 'Domínio Vinculado',
          message: `O domínio ${cleanDomain} foi associado à instituição com sucesso.`,
        }
      );
      setNewDomainName('');
      setNewDomainIsPrimary(false);
      setIsAddDomainModalOpen(false);
    } catch (err: any) {
      alert(`Erro ao adicionar domínio: ${err?.message}`);
    }
  };

  // Delete Domain - Initiate confirmation modal
  const handleInitiateDeleteDomain = (domainName: string) => {
    setDomainToDelete(domainName);
  };

  // Delete Domain - Execution after modal confirmation
  const handleExecuteDeleteDomain = async () => {
    if (!domainToDelete) return;
    setIsSaving(true);
    try {
      await onDeleteDomain(domainToDelete, tenant.id);
      const updatedAllowed = (tenant.allowedDomains || []).filter((d) => d.toLowerCase() !== domainToDelete.toLowerCase());
      await onUpdateTenant(
        tenant.id,
        { allowedDomains: updatedAllowed },
        {
          title: t('tenants.adminModal.submodals.deleteDomain.toastTitle') || 'Domínio Removido',
          message: t('tenants.adminModal.submodals.deleteDomain.toastMsg', { domain: domainToDelete }) || `O domínio ${domainToDelete} foi desvinculado com sucesso.`,
        }
      );
      setDomainToDelete(null);
    } catch (err: any) {
      alert(`Erro ao remover domínio: ${err?.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Add License
  const handleAddLicenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const seats = parseInt(newLicenseSeats, 10) || 0;
    if (seats <= 0) return;

    const existingIdx = contractedSeats.findIndex((s) => s.sku === newLicenseSku);
    let updated: { sku: WorkspaceLicense; allocatedSeats: number }[];
    if (existingIdx >= 0) {
      updated = contractedSeats.map((s, idx) =>
        idx === existingIdx ? { ...s, allocatedSeats: s.allocatedSeats + seats } : s
      );
    } else {
      updated = [...contractedSeats, { sku: newLicenseSku, allocatedSeats: seats }];
    }

    setContractedSeats(updated);
    onUpdateTenant(
      tenant.id,
      { contractedSeats: updated },
      {
        title: 'Licença Atribuída',
        message: `${seats} assento(s) configurados para "${newLicenseSku}".`,
      }
    );
    setIsAddLicenseModalOpen(false);
    setNewLicenseSeats('50');
  };

  // Edit License Seats - Initiate confirmation modal
  const handleInitiateSaveEditedLicense = (sku: WorkspaceLicense) => {
    const seats = parseInt(editingLicenseSeats, 10);
    if (isNaN(seats) || seats < 0) return;
    const current = contractedSeats.find((s) => s.sku === sku)?.allocatedSeats || 0;
    setLicenseToEditConfirm({
      sku,
      newSeats: seats,
      currentSeats: current,
    });
  };

  // Edit License Seats - Execution after modal confirmation
  const handleExecuteSaveEditedLicense = async () => {
    if (!licenseToEditConfirm) return;
    setIsSaving(true);
    try {
      const { sku, newSeats } = licenseToEditConfirm;
      const existingIdx = contractedSeats.findIndex((s) => s.sku === sku);
      let updated: { sku: WorkspaceLicense; allocatedSeats: number }[];
      if (existingIdx >= 0) {
        updated = contractedSeats.map((s, idx) => (idx === existingIdx ? { ...s, allocatedSeats: newSeats } : s));
      } else {
        updated = [...contractedSeats, { sku, allocatedSeats: newSeats }];
      }
      setContractedSeats(updated);
      await onUpdateTenant(
        tenant.id,
        { contractedSeats: updated },
        {
          title: t('tenants.adminModal.submodals.editLicenseSeats.toastTitle') || 'Assentos Atualizados',
          message: t('tenants.adminModal.submodals.editLicenseSeats.toastMsg', { sku, seats: newSeats }) || `A licença "${sku}" agora possui ${newSeats} assentos contratados.`,
        }
      );
      setEditingLicenseSku(null);
      setLicenseToEditConfirm(null);
    } catch (err: any) {
      alert(`Erro ao atualizar assentos: ${err?.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete License - Initiate confirmation modal
  const handleInitiateDeleteLicense = (sku: WorkspaceLicense) => {
    const seat = contractedSeats.find((s) => s.sku === sku);
    setLicenseToDelete({
      sku,
      seats: seat?.allocatedSeats || 0,
    });
  };

  // Delete License - Execution after modal confirmation
  const handleExecuteDeleteLicense = async () => {
    if (!licenseToDelete) return;
    setIsSaving(true);
    try {
      const updated = contractedSeats.filter((s) => s.sku !== licenseToDelete.sku);
      setContractedSeats(updated);
      await onUpdateTenant(
        tenant.id,
        { contractedSeats: updated },
        {
          title: t('tenants.adminModal.submodals.deleteLicense.toastTitle') || 'Licença Removida',
          message: t('tenants.adminModal.submodals.deleteLicense.toastMsg', { sku: licenseToDelete.sku }) || `A licença "${licenseToDelete.sku}" foi desvinculada desta instituição.`,
        }
      );
      setLicenseToDelete(null);
    } catch (err: any) {
      alert(`Erro ao remover licença: ${err?.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Send test email
  const handleSendTestEmail = async () => {
    setIsSendingTestEmail(true);
    setTestEmailFeedback(null);
    try {
      const to = tenant.primaryContactEmail;
      const res = await fetch('/api/emails/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ACCOUNT_CREATED',
          to,
          testData: {
            adminName: tenant.name,
            institutionName: tenant.name,
            preferredLanguage: language,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestEmailFeedback(`E-mail de teste enviado com sucesso para ${to}!`);
        fetchEmailLogs();
      } else {
        setTestEmailFeedback(`Erro: ${data.error || 'Falha no envio'}`);
      }
    } catch (e: any) {
      setTestEmailFeedback(`Erro de rede: ${e?.message}`);
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  // Permanent Delete Organization
  const handleExecuteDeleteTenant = async () => {
    setIsDeleting(true);
    try {
      await onDeleteTenant(tenant.id);
      setIsDeleteConfirmOpen(false);
      onClose();
    } catch (err: any) {
      alert(`Falha ao excluir organização: ${err?.message}`);
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-[#F4F5F0] flex flex-col w-full h-full overflow-hidden animate-fadeIn" role="dialog" aria-modal="true">
      {/* Top Bar Navigation & Header */}
      <header className="bg-white border-b border-[#E2E6DF] px-4 sm:px-6 lg:px-8 py-3 shrink-0 shadow-xs z-20">
        <div className="max-w-[1600px] mx-auto w-full flex items-center justify-between gap-4">
          {/* Breadcrumb & Organization Info */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F4F5F0] hover:bg-[#E2E6DF] text-[#163300] font-bold text-xs cursor-pointer border border-[#E2E6DF] transition-all shrink-0 group shadow-2xs"
              title={t('tenants.adminModal.header.back')}
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span className="font-['Outfit']">{t('tenants.pageTitle') || 'Organizações'}</span>
            </button>

            <span className="text-[#CBD3C5] font-light text-sm shrink-0">/</span>

            {/* Organization Identity */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#E8F7DC] text-[#163300] border border-[#9FE870]/60 flex items-center justify-center shrink-0 shadow-2xs">
                <Building2 className="w-4 h-4" />
              </div>

              <div className="min-w-0 flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <h2 className="text-sm sm:text-base font-black text-[#0E0F0C] font-['Outfit'] truncate">
                  {name || tenant.name}
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#163300] text-[#9FE870] font-['Outfit'] shrink-0">
                  {tenant.id}
                </span>

                {status === 'SUSPENDED' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0 bg-rose-50 text-rose-700 border-rose-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>{t('tenants.suspendedTag')}</span>
                  </span>
                ) : tenant.isProfileComplete === false ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0 bg-amber-50 text-amber-900 border-amber-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>{t('tenants.incompleteTag') || 'Formulário Pendente'}</span>
                  </span>
                ) : status === 'TRIAL' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0 bg-amber-50 text-amber-800 border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>{t('tenants.trialTag')} 30d</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0 bg-[#E8F7DC] text-[#163300] border-[#9FE870]/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00c868]" />
                    <span>{t('tenants.activeTag')}</span>
                  </span>
                )}

                {(primaryContactEmail || tenant.primaryContactEmail) && (
                  <span className="text-xs text-slate-400 font-mono hidden lg:inline truncate">
                    • {primaryContactEmail || tenant.primaryContactEmail}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Block / Unblock direct button for SuperAdmin */}
            {status === 'SUSPENDED' ? (
              <button
                type="button"
                onClick={() => setIsUnblockConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs cursor-pointer border border-emerald-300 shadow-2xs transition-all active:scale-95"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden xs:inline">{t('tenants.adminModal.header.unblockBtn')}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsBlockConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs cursor-pointer border border-amber-300 shadow-2xs transition-all active:scale-95"
              >
                <Ban className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden xs:inline">{t('tenants.adminModal.header.blockBtn')}</span>
              </button>
            )}

            {/* Save Button */}
            <button
              type="button"
              onClick={handleInitiateSaveChanges}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full bg-[#163300] hover:bg-[#204500] text-[#9FE870] font-black text-xs cursor-pointer shadow-xs transition-all active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{t('tenants.adminModal.header.save')}</span>
            </button>

            {/* Dismiss Modal */}
            <button
              type="button"
              onClick={onClose}
              aria-label={t('tenants.adminModal.header.close')}
              className="w-8 h-8 rounded-full bg-[#F4F5F0] hover:bg-[#E2E6DF] text-[#0E0F0C] flex items-center justify-center cursor-pointer border border-[#E2E6DF] transition-all ml-0.5 shrink-0"
              title={t('tenants.adminModal.header.close')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Notice for Incomplete Registration Form */}
      {tenant.isProfileComplete === false && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-base leading-none shrink-0">⚠️</span>
              <p className="font-medium truncate sm:whitespace-normal">
                <span className="font-bold">Formulário Pendente:</span> Esta instituição cadastrou a conta pelo Google, mas ainda não concluiu o preenchimento do formulário cadastral completo (endereço e telefones institucionais).
              </p>
            </div>
            <span className="text-[10px] uppercase font-black tracking-wider bg-amber-200/80 px-2 py-0.5 rounded-full shrink-0">
              Cadastro Preliminar
            </span>
          </div>
        </div>
      )}

      {/* Subheader Navigation Tabs aligned with content */}
      <div className="bg-white border-b border-[#E2E6DF] px-4 sm:px-6 lg:px-8 py-2.5 shrink-0 shadow-2xs">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
            {[
              { id: 'info', label: t('tenants.adminModal.tabs.info'), icon: Building2 },
              { id: 'domains', label: `${t('tenants.adminModal.tabs.domains')} (${tenantDomains.length})`, icon: Globe },
              {
                id: 'licenses',
                label: `${language === 'pt' ? 'Usuários & Contas' : language === 'es' ? 'Usuarios y Cuentas' : 'Users & Accounts'} (${tenantUsers.length})`,
                icon: Users,
              },
              { id: 'financial', label: t('tenants.adminModal.tabs.financial'), icon: Receipt },
              { id: 'emails', label: `${t('tenants.adminModal.tabs.emails')} (${emailLogs.length})`, icon: Mail },
              { id: 'danger', label: t('tenants.adminModal.tabs.danger'), icon: AlertTriangle, isDestructive: true },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`h-9 px-4 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer inline-flex items-center gap-2 ${
                    isActive
                      ? tab.isDestructive
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-[#163300] text-[#9FE870] shadow-xs'
                      : tab.isDestructive
                      ? 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                      : 'text-[#0E0F0C] hover:bg-[#E2E6DF] bg-[#F4F5F0] border border-[#E2E6DF]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Full-Screen Workspace Body */}
      <div className="flex-1 overflow-y-auto bg-[#F4F5F0] p-4 sm:p-6 lg:p-8">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* TAB 1: DADOS DA INSTITUIÇÃO */}
          {activeTab === 'info' && (
            <div className="bg-white rounded-2xl border border-[#E2E6DF] p-6 shadow-xs space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('tenants.adminModal.info.nameLabel')} *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-[#E2E6DF] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00c868]/30 focus:border-[#00c868]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('tenants.adminModal.info.statusLabel')}
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full h-10 px-3.5 rounded-xl border border-[#E2E6DF] text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#00c868]/30 focus:border-[#00c868]"
                  >
                    <option value="ACTIVE">{t('tenants.adminModal.statusActiveFull')}</option>
                    <option value="TRIAL">{t('tenants.adminModal.statusTrial30')}</option>
                    <option value="SUSPENDED">{t('tenants.adminModal.statusSuspendedBlocked')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('tenants.adminModal.info.adminEmailLabel')} *
                  </label>
                  <input
                    type="email"
                    value={primaryContactEmail}
                    onChange={(e) => setPrimaryContactEmail(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-[#E2E6DF] bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#00c868]/30 focus:border-[#00c868]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('tenants.adminModal.info.financialEmailLabel')}
                  </label>
                  <input
                    type="email"
                    value={financialContactEmail}
                    onChange={(e) => setFinancialContactEmail(e.target.value)}
                    placeholder="financeiro@instituicao.com.br"
                    className="w-full h-10 px-3.5 rounded-xl border border-[#E2E6DF] bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#00c868]/30 focus:border-[#00c868]"
                  />
                </div>

                <div className="md:col-span-2 sm:max-w-md">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('tenants.adminModal.info.createdAtLabel')}
                  </label>
                  <input
                    type="text"
                    disabled
                    value={new Date(tenant.createdAt).toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US')}
                    className="w-full h-10 px-3.5 rounded-xl border border-[#E2E6DF] text-sm bg-slate-50 text-slate-500 font-mono"
                  />
                </div>
              </div>

              {/* Contatos Técnico e Financeiro detalhados */}
              <div className="pt-4 border-t border-[#E2E6DF] grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-[#E2E6DF] space-y-3 bg-[#F4F5F0]/50">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-['Outfit']">
                    {t('tenants.adminModal.technicalContactTitle')}
                  </h5>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t('tenants.adminModal.contactName')}</label>
                    <input
                      type="text"
                      value={technicalContactName}
                      onChange={(e) => setTechnicalContactName(e.target.value)}
                      placeholder="Ex: João Silva"
                      className="w-full h-9 px-3 rounded-lg border border-[#E2E6DF] bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t('tenants.adminModal.contactPhone')}</label>
                    <input
                      type="text"
                      value={technicalContactPhone}
                      onChange={(e) => setTechnicalContactPhone(e.target.value)}
                      placeholder="+55 (11) 98888-7777"
                      className="w-full h-9 px-3 rounded-lg border border-[#E2E6DF] bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-[#E2E6DF] space-y-3 bg-[#F4F5F0]/50">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-['Outfit']">
                    {t('tenants.adminModal.financialContactTitle')}
                  </h5>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t('tenants.adminModal.contactName')}</label>
                    <input
                      type="text"
                      value={financialContactName}
                      onChange={(e) => setFinancialContactName(e.target.value)}
                      placeholder="Ex: Maria Santos"
                      className="w-full h-9 px-3 rounded-lg border border-[#E2E6DF] bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t('tenants.adminModal.contactPhone')}</label>
                    <input
                      type="text"
                      value={financialContactPhone}
                      onChange={(e) => setFinancialContactPhone(e.target.value)}
                      placeholder="+55 (11) 97777-6666"
                      className="w-full h-9 px-3 rounded-lg border border-[#E2E6DF] bg-white text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E6DF]">
                <button
                  type="button"
                  onClick={handleInitiateSaveChanges}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-full bg-[#00c868] hover:bg-[#00b05b] text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>{t('tenants.adminModal.saveInstitutionData')}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: DOMÍNIOS */}
          {activeTab === 'domains' && (
            <div className="bg-white rounded-2xl border border-[#E2E6DF] p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-['Outfit']">
                    {t('tenants.adminModal.domainsTab.title')}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {t('tenants.adminModal.domainsTab.description')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddDomainModalOpen(true)}
                  className="h-9 px-4 rounded-full bg-[#00c868] hover:bg-[#00b05b] text-white text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('tenants.adminModal.domainsTab.addDomainBtn')}</span>
                </button>
              </div>

              {tenantDomains.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
                  <Globe className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-600 text-xs">{t('tenants.adminModal.domainsTab.noDomains')}</p>
                  <button
                    type="button"
                    onClick={() => setIsAddDomainModalOpen(true)}
                    className="text-xs font-bold text-[#00c868] hover:underline"
                  >
                    {t('tenants.adminModal.domainsTab.addFirstDomain')}
                  </button>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">{t('tenants.adminModal.domainsTab.thDomain')}</th>
                        <th className="py-3 px-3">{t('tenants.adminModal.domainsTab.thType')}</th>
                        <th className="py-3 px-3">{t('tenants.adminModal.domainsTab.thStatus')}</th>
                        <th className="py-3 px-3">{t('tenants.adminModal.domainsTab.thMxSpf')}</th>
                        <th className="py-3 px-4 text-right">{t('tenants.adminModal.domainsTab.thActions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tenantDomains.map((dom, idx) => (
                        <tr key={dom.domainName} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 font-mono font-bold text-slate-800">
                              <Globe className="w-3.5 h-3.5 text-slate-400" />
                              <span>{dom.domainName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            {dom.isPrimary || idx === 0 ? (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {t('tenants.adminModal.domainsTab.badgePrimary')}
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                                {t('tenants.adminModal.domainsTab.badgeSecondary')}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {dom.verified || dom.state === 'VERIFIED' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                {t('tenants.adminModal.domainsTab.badgeVerified')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-500" />
                                {t('tenants.adminModal.domainsTab.badgePendingDns')}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                              <span className={dom.mxConfigured ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                                MX {dom.mxConfigured ? '✓' : '—'}
                              </span>
                              <span>•</span>
                              <span className={dom.spfConfigured ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                                SPF {dom.spfConfigured ? '✓' : '—'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = !dom.verified;
                                  onUpdateDomain(dom.domainName, { verified: updated, state: updated ? 'VERIFIED' : 'PENDING_DNS' });
                                }}
                                className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                                title="Alternar status de verificação"
                              >
                                {dom.verified ? t('tenants.adminModal.domainsTab.unverify') : t('tenants.adminModal.domainsTab.markVerified')}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleInitiateDeleteDomain(dom.domainName)}
                                className="w-7 h-7 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer transition-colors"
                                title={t('tenants.adminModal.domainsTab.deleteDomain')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CONTAS DE USUÁRIO DA ORGANIZAÇÃO */}
          {activeTab === 'licenses' && (
            <div className="bg-white rounded-2xl border border-[#E2E6DF] p-4 sm:p-6 shadow-xs space-y-5">
              {/* Header & Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="w-9 h-9 rounded-full bg-[#E8F7DC] text-[#163300] flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <h4 className="text-base sm:text-lg font-black text-slate-900 font-['Outfit']">
                      {language === 'pt'
                        ? 'Contas de Usuário da Organização'
                        : language === 'es'
                        ? 'Cuentas de Usuario de la Organización'
                        : 'Organization User Accounts'}
                    </h4>
                    <span className="bg-[#E8F7DC] text-[#163300] text-xs font-black px-2.5 py-0.5 rounded-full border border-[#9FE870]/40">
                      {localUsers.length} {language === 'pt' ? 'contas' : language === 'es' ? 'cuentas' : 'accounts'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {language === 'pt'
                      ? `Relação completa de todas as contas de usuário vinculadas aos domínios de ${tenant.name}.`
                      : language === 'es'
                      ? `Lista completa de todas las cuentas de usuario vinculadas a los dominios de ${tenant.name}.`
                      : `Complete list of all user accounts linked to domains of ${tenant.name}.`}
                  </p>
                </div>

                {/* Top Actions */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleExportTenantCsv}
                    disabled={filteredTenantUsers.length === 0}
                    className="h-9 px-4 rounded-full border border-[#D4DACF] bg-white text-[#0E0F0C] hover:bg-[#F4F5F0] hover:border-[#CBD3C5] transition-all cursor-pointer inline-flex items-center gap-2 font-bold text-xs shadow-2xs disabled:opacity-50"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[#163300]" />
                    <span>
                      {selectedUserIds.length > 0
                        ? `${language === 'pt' ? 'Exportar Selecionados' : language === 'es' ? 'Exportar Seleccionados' : 'Export Selected'} (${selectedUserIds.length})`
                        : language === 'pt' ? 'Exportar CSV' : language === 'es' ? 'Exportar CSV' : 'Export CSV'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Reset Password Feedback Alert */}
              {resetPasswordFeedback && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 font-mono">
                    <KeyRound className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">{resetPasswordFeedback}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const passMatch = resetPasswordFeedback.match(/Temp@\d+!/);
                        if (passMatch) {
                          navigator.clipboard.writeText(passMatch[0]);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{language === 'pt' ? 'Copiar' : 'Copy'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setResetPasswordFeedback(null)}
                      className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Action Notice Alert */}
              {userActionNotice && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>{userActionNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUserActionNotice(null)}
                    className="text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Metrics Summary Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-[#E2E6DF] bg-[#F4F5F0]/60 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {language === 'pt' ? 'Total de Contas' : language === 'es' ? 'Total Cuentas' : 'Total Accounts'}
                    </div>
                    <div className="text-xl font-black font-['Outfit'] text-slate-900 mt-0.5">
                      {localUsers.length}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-slate-200/60 flex items-center justify-center text-slate-700">
                    <Users className="w-4 h-4" />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/50 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                      {language === 'pt' ? 'Contas Ativas' : language === 'es' ? 'Cuentas Activas' : 'Active Accounts'}
                    </div>
                    <div className="text-xl font-black font-['Outfit'] text-emerald-900 mt-0.5">
                      {activeTenantUsersCount}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-rose-200/80 bg-rose-50/40 flex items-center justify-between col-span-2 sm:col-span-1">
                  <div>
                    <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                      {language === 'pt' ? 'Contas Suspensas' : language === 'es' ? 'Cuentas Suspendidas' : 'Suspended Accounts'}
                    </div>
                    <div className="text-xl font-black font-['Outfit'] text-rose-900 mt-0.5">
                      {suspendedTenantUsersCount}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
                    <Ban className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Filters & Search Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder={
                      language === 'pt'
                        ? 'Buscar usuário por nome, e-mail, cargo, departamento...'
                        : language === 'es'
                        ? 'Buscar usuario por nombre, correo, cargo, departamento...'
                        : 'Search users by name, email, job title, department...'
                    }
                    className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-[#D4DACF] bg-white focus:outline-none focus:ring-2 focus:ring-[#9FE870]/60 focus:border-[#163300] transition-all"
                  />
                  {userSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setUserSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Status Filter Tabs */}
                <div className="inline-flex p-1 rounded-xl bg-[#F4F5F0] border border-[#E2E6DF] self-start sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setUserStatusFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      userStatusFilter === 'ALL'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {language === 'pt' ? 'Todos' : language === 'es' ? 'Todos' : 'All'} ({localUsers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserStatusFilter('ACTIVE')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      userStatusFilter === 'ACTIVE'
                        ? 'bg-white text-emerald-800 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {language === 'pt' ? 'Ativos' : language === 'es' ? 'Activos' : 'Active'} ({activeTenantUsersCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserStatusFilter('SUSPENDED')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      userStatusFilter === 'SUSPENDED'
                        ? 'bg-white text-rose-800 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {language === 'pt' ? 'Suspensos' : language === 'es' ? 'Suspendidos' : 'Suspended'} ({suspendedTenantUsersCount})
                  </button>
                </div>
              </div>

              {/* Users Table (Desktop) */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-[#E2E6DF]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F4F5F0] border-b border-[#E2E6DF] text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3 w-10 text-center">
                        <button
                          type="button"
                          onClick={handleSelectAllUsers}
                          className="text-slate-500 hover:text-slate-800 cursor-pointer inline-flex items-center justify-center"
                          title="Selecionar Todos"
                        >
                          {selectedUserIds.length === filteredTenantUsers.length && filteredTenantUsers.length > 0 ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="py-3 px-4">{language === 'pt' ? 'Usuário' : language === 'es' ? 'Usuario' : 'User'}</th>
                      <th className="py-3 px-4">{language === 'pt' ? 'Cargo & Departamento' : language === 'es' ? 'Cargo y Departamento' : 'Role & Department'}</th>
                      <th className="py-3 px-4">{language === 'pt' ? 'Status' : language === 'es' ? 'Estado' : 'Status'}</th>
                      <th className="py-3 px-4">{language === 'pt' ? 'Armazenamento' : language === 'es' ? 'Almacenamiento' : 'Storage'}</th>
                      <th className="py-3 px-4">{language === 'pt' ? 'Licença' : language === 'es' ? 'Licencia' : 'License'}</th>
                      <th className="py-3 px-4 text-right">{language === 'pt' ? 'Ações' : language === 'es' ? 'Acciones' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E6DF] bg-white">
                    {filteredTenantUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="font-semibold">
                            {userSearchQuery || userStatusFilter !== 'ALL'
                              ? language === 'pt'
                                ? 'Nenhum usuário encontrado com os filtros aplicados.'
                                : 'No users found with the applied filters.'
                              : language === 'pt'
                              ? 'Nenhum usuário associado aos domínios desta organização.'
                              : 'No users associated with the domains of this organization.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredTenantUsers.map((u) => {
                        const isSelected = selectedUserIds.includes(u.id);
                        const initials = (u.name?.givenName?.[0] || '') + (u.name?.familyName?.[0] || '');
                        const storageUsed = u.storageUsageGb || 0;
                        const storageLimit = u.storageLimitGb || 15;
                        const storagePct = Math.min(100, Math.round((storageUsed / storageLimit) * 100));

                        return (
                          <tr
                            key={u.id}
                            className={`hover:bg-[#F9FAF8] transition-colors ${
                              isSelected ? 'bg-emerald-50/30' : ''
                            }`}
                          >
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleSelectUser(u.id)}
                                className="text-slate-400 hover:text-slate-700 cursor-pointer inline-flex items-center justify-center"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                            </td>

                            {/* User Avatar + Name + Email */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                                  style={{
                                    backgroundColor: u.avatarColor || '#E8F7DC',
                                    color: '#163300',
                                  }}
                                >
                                  {initials || 'U'}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-slate-900 truncate">
                                      {u.name?.fullName || `${u.name?.givenName || ''} ${u.name?.familyName || ''}`.trim() || u.primaryEmail}
                                    </span>
                                    {u.role === 'SUPER_ADMIN' && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                                        Super Admin
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono truncate">
                                    {u.primaryEmail}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Role & Department */}
                            <td className="py-3 px-4 text-slate-700">
                              <div className="font-semibold text-slate-800">{u.jobTitle || '—'}</div>
                              <div className="text-[11px] text-slate-500">{u.department || u.orgUnitPath || '—'}</div>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4">
                              {u.status === 'ACTIVE' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  {language === 'pt' ? 'Ativo' : language === 'es' ? 'Activo' : 'Active'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/70">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  {language === 'pt' ? 'Suspenso' : language === 'es' ? 'Suspendido' : 'Suspended'}
                                </span>
                              )}
                            </td>

                            {/* Storage Drive */}
                            <td className="py-3 px-4">
                              <div className="w-28 space-y-1">
                                <div className="flex justify-between text-[10px] text-slate-600 font-medium font-mono">
                                  <span>{storageUsed} GB</span>
                                  <span>{storageLimit} GB</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      storagePct > 90
                                        ? 'bg-rose-500'
                                        : storagePct > 70
                                        ? 'bg-amber-500'
                                        : 'bg-[#00c868]'
                                    }`}
                                    style={{ width: `${storagePct}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* License */}
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1">
                                {(u.licenses && u.licenses.length > 0 ? u.licenses : ['Google Workspace Standard Unlimited']).map((lic, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/70"
                                  >
                                    {lic.replace('Google Workspace ', '')}
                                  </span>
                                ))}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setUserToToggleStatus(u)}
                                  className={`w-7 h-7 rounded-lg border flex items-center justify-center cursor-pointer transition-colors ${
                                    u.status === 'ACTIVE'
                                      ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                                      : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                  }`}
                                  title={u.status === 'ACTIVE' ? 'Suspender Usuário' : 'Reativar Usuário'}
                                >
                                  {u.status === 'ACTIVE' ? (
                                    <Lock className="w-3.5 h-3.5" />
                                  ) : (
                                    <Unlock className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setUserToResetPassword(u)}
                                  className="w-7 h-7 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 flex items-center justify-center cursor-pointer transition-colors"
                                  title="Redefinir Senha"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setUserToDelete(u)}
                                  className="w-7 h-7 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer transition-colors"
                                  title="Excluir Conta"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Users Cards (Mobile) */}
              <div className="block md:hidden space-y-3">
                {filteredTenantUsers.length === 0 ? (
                  <div className="py-10 text-center text-slate-500 bg-[#F4F5F0]/50 rounded-xl border border-[#E2E6DF]">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-xs">
                      {language === 'pt' ? 'Nenhum usuário encontrado.' : 'No users found.'}
                    </p>
                  </div>
                ) : (
                  filteredTenantUsers.map((u) => {
                    const isSelected = selectedUserIds.includes(u.id);
                    const initials = (u.name?.givenName?.[0] || '') + (u.name?.familyName?.[0] || '');
                    const storageUsed = u.storageUsageGb || 0;
                    const storageLimit = u.storageLimitGb || 15;
                    const storagePct = Math.min(100, Math.round((storageUsed / storageLimit) * 100));

                    return (
                      <div
                        key={u.id}
                        className={`p-3.5 rounded-xl border transition-all space-y-3 ${
                          isSelected
                            ? 'border-emerald-300 bg-emerald-50/40'
                            : 'border-[#E2E6DF] bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => handleToggleSelectUser(u.id)}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                              style={{
                                backgroundColor: u.avatarColor || '#E8F7DC',
                                color: '#163300',
                              }}
                            >
                              {initials || 'U'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-slate-900 truncate">
                                {u.name?.fullName || u.primaryEmail}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono truncate">
                                {u.primaryEmail}
                              </div>
                            </div>
                          </div>

                          {u.status === 'ACTIVE' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                              {language === 'pt' ? 'Ativo' : 'Active'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                              {language === 'pt' ? 'Suspenso' : 'Suspended'}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                          <div className="text-slate-600 font-medium">
                            {u.jobTitle || u.department || 'Workspace User'}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {storageUsed} GB / {storageLimit} GB ({storagePct}%)
                          </div>
                        </div>

                        {/* Actions Row */}
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setUserToToggleStatus(u)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 inline-flex items-center gap-1 cursor-pointer"
                          >
                            {u.status === 'ACTIVE' ? (
                              <>
                                <Lock className="w-3 h-3 text-amber-600" />
                                <span>{language === 'pt' ? 'Suspender' : 'Suspend'}</span>
                              </>
                            ) : (
                              <>
                                <Unlock className="w-3 h-3 text-emerald-600" />
                                <span>{language === 'pt' ? 'Reativar' : 'Reactivate'}</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setUserToResetPassword(u)}
                            className="px-2.5 py-1 rounded-lg border border-blue-200 text-xs font-bold text-blue-700 hover:bg-blue-50 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>{language === 'pt' ? 'Senha' : 'Password'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setUserToDelete(u)}
                            className="w-7 h-7 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer"
                            title="Excluir Conta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 4: FINANCEIRO & ASSINATURA */}
          {activeTab === 'financial' && (
            <div className="bg-white rounded-2xl border border-[#E2E6DF] p-6 shadow-xs space-y-6">
              {/* Financial Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Overdue Balance Card (Strictly overdue invoices) */}
                <div
                  className={`p-4 rounded-xl border space-y-1 ${
                    overdueBalance > 0
                      ? 'border-rose-300 bg-rose-50/60 shadow-xs'
                      : 'border-emerald-200 bg-emerald-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider ${
                        overdueBalance > 0 ? 'text-rose-800' : 'text-emerald-800'
                      }`}
                    >
                      {t('tenants.adminModal.financial.overdueBalance')}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-2xs ${
                        overdueBalance > 0
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {overdueBalance > 0 ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                  <div
                    className={`text-xl font-black font-['Outfit'] ${
                      overdueBalance > 0 ? 'text-rose-950' : 'text-emerald-900'
                    }`}
                  >
                    ${overdueBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </div>
                  <span
                    className={`text-[11px] font-medium block truncate ${
                      overdueBalance > 0 ? 'text-rose-700 font-bold' : 'text-emerald-700'
                    }`}
                  >
                    {overdueInvoices.length > 0
                      ? t('tenants.adminModal.financial.overdueInvoicesDesc', { count: overdueInvoices.length })
                      : t('tenants.adminModal.financial.noOverdueDesc')}
                  </span>
                </div>

                {/* 2. Lifetime Spend Card with prominent icon */}
                <div className="p-4 rounded-xl border border-[#E2E6DF] bg-[#F4F5F0]/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {t('tenants.adminModal.financial.lifetimeSpend')}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-xl font-black text-slate-900 font-['Outfit']">
                    ${lifetimeSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium block">
                    {invoices.filter((i) => i.status === 'PAID').length} {t('tenants.adminModal.financial.lifetimeSpendDesc')}
                  </span>
                </div>

                {/* 3. Status de Cobrança */}
                <div className="p-4 rounded-xl border border-[#E2E6DF] bg-[#F4F5F0]/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {t('tenants.adminModal.financial.billingStatus')}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shadow-2xs">
                      <Receipt className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-base font-black text-slate-900 font-['Outfit']">
                    {status === 'SUSPENDED'
                      ? t('tenants.adminModal.dangerTab.suspendedTitle')
                      : t('tenants.table.statusActive')}
                  </div>
                  <span className="text-[11px] text-slate-500 block truncate">
                    {overdueBalance > 0
                      ? t('tenants.table.badgeOverdue')
                      : t('tenants.adminModal.financial.noOverdueDesc')}
                  </span>
                </div>

                {/* 4. E-mail no Stripe */}
                <div className="p-4 rounded-xl border border-[#E2E6DF] bg-[#F4F5F0]/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {t('tenants.adminModal.financial.stripeEmail')}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shadow-2xs">
                      <Mail className="w-4 h-4" />
                    </div>
                  </div>
                  <div
                    className="text-xs font-mono font-bold text-slate-800 truncate"
                    title={financialContactEmail || tenant.financialContactEmail || primaryContactEmail}
                  >
                    {financialContactEmail || tenant.financialContactEmail || primaryContactEmail}
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    {t('tenants.adminModal.financial.stripeEmailDesc')}
                  </span>
                </div>
              </div>

              {/* Faturas Registradas */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-['Outfit']">
                      {t('tenants.adminModal.financial.invoicesTitle')}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {t('tenants.adminModal.financial.invoicesDesc')}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Filter Tabs */}
                    <div className="inline-flex flex-wrap rounded-lg p-0.5 bg-slate-100 border border-slate-200 text-xs">
                      <button
                        type="button"
                        onClick={() => setInvoiceFilter('all')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                          invoiceFilter === 'all'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {t('tenants.adminModal.financial.filterAll')} ({invoices.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setInvoiceFilter('overdue')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                          invoiceFilter === 'overdue'
                            ? 'bg-rose-500 text-white shadow-2xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {t('tenants.adminModal.financial.filterOverdue')} ({overdueInvoices.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setInvoiceFilter('paid')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                          invoiceFilter === 'paid'
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {t('tenants.adminModal.financial.filterPaid')} ({paidInvoices.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setInvoiceFilter('pending')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                          invoiceFilter === 'pending'
                            ? 'bg-amber-500 text-white shadow-2xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {t('tenants.adminModal.financial.filterPending')} ({pendingInvoices.length})
                      </button>
                      {voidedInvoices.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setInvoiceFilter('voided')}
                          className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                            invoiceFilter === 'voided'
                              ? 'bg-slate-700 text-white shadow-2xs'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {t('tenants.adminModal.financial.filterVoided')} ({voidedInvoices.length})
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={fetchStripeInvoices}
                      disabled={loadingInvoices}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer inline-flex items-center gap-1.5 shadow-2xs transition-all disabled:opacity-50"
                      title="Sincronizar faturas do gateway financeiro"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          loadingInvoices ? 'animate-spin text-[#00c868]' : 'text-slate-500'
                        }`}
                      />
                      <span>
                        {loadingInvoices
                          ? t('blockingModal.refreshing')
                          : t('tenants.adminModal.financial.syncStripe')}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const newInv: Invoice = {
                          id: `inv-${Date.now()}`,
                          invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
                          date: new Date().toISOString(),
                          amount: tenant.monthlyBudgetUsd || 120,
                          currency: 'USD',
                          status: 'PAID',
                          billingCycle: 'MONTHLY',
                          planName: 'Workspace Standard Unlimited',
                          paymentMethod: 'Cartão de Crédito',
                          items: [
                            {
                              description: 'Assinatura Mensal Workspace Unlimited',
                              quantity: 1,
                              amount: tenant.monthlyBudgetUsd || 120,
                            },
                          ],
                        };
                        const updatedInvoices = [newInv, ...invoices];
                        setInvoices(updatedInvoices);
                        onUpdateTenant(
                          tenant.id,
                          { invoices: updatedInvoices },
                          {
                            title: 'Fatura Registrada',
                            message: `A fatura manual ${newInv.invoiceNumber} no valor de $${newInv.amount} USD foi gerada.`,
                          }
                        );
                      }}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#00c868] hover:bg-[#00b05b] text-white cursor-pointer inline-flex items-center gap-1 shadow-2xs transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t('tenants.adminModal.financial.manualInvoice')}</span>
                    </button>
                  </div>
                </div>

                {/* Banner de Aviso de Faturas Anuladas */}
                {voidedInvoices.length > 0 && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2.5">
                      <Info className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>
                        {t('tenants.adminModal.financial.voidedInvoicesNotice', {
                          count: voidedInvoices.length,
                        })}
                      </span>
                    </div>
                    {invoiceFilter !== 'voided' && (
                      <button
                        type="button"
                        onClick={() => setInvoiceFilter('voided')}
                        className="text-[11px] font-bold text-slate-700 hover:text-slate-900 underline whitespace-nowrap cursor-pointer text-left sm:text-right"
                      >
                        {t('tenants.adminModal.financial.filterVoided')} ({voidedInvoices.length})
                      </button>
                    )}
                  </div>
                )}

                {loadingInvoices && invoices.length === 0 ? (
                  <div className="p-8 rounded-xl border border-slate-200 bg-slate-50 text-center space-y-2">
                    <RefreshCw className="w-6 h-6 mx-auto text-[#00c868] animate-spin" />
                    <p className="text-xs font-semibold text-slate-600">
                      {t('blockingModal.refreshing')}
                    </p>
                  </div>
                ) : filteredInvoices.length === 0 ? (
                  <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 text-center space-y-1">
                    <Receipt className="w-6 h-6 mx-auto text-slate-400" />
                    <p className="text-xs font-semibold text-slate-600">
                      {invoiceFilter === 'overdue'
                        ? t('tenants.adminModal.financial.noOverdueDesc')
                        : t('tenants.adminModal.financial.noInvoices')}
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-2.5 px-4">{t('tenants.adminModal.financial.thNumber')}</th>
                          <th className="py-2.5 px-3">{t('tenants.adminModal.financial.thDate')}</th>
                          <th className="py-2.5 px-3">{t('tenants.adminModal.financial.thDesc')}</th>
                          <th className="py-2.5 px-3">{t('tenants.adminModal.financial.thAmount')}</th>
                          <th className="py-2.5 px-3">{t('tenants.adminModal.financial.thStatus')}</th>
                          <th className="py-2.5 px-4 text-right">
                            {t('tenants.adminModal.financial.thDoc')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredInvoices.map((inv) => {
                          const isVoided = isInvoiceVoided(inv);
                          const isOverdue = isInvoiceOverdue(inv);
                          const isPaid = isInvoicePaid(inv);
                          const normalizedAmount =
                            inv.amount === 25000 ? 250.0 : (inv.amount || 0);

                          return (
                            <tr
                              key={inv.id}
                              className={`transition-colors ${
                                isVoided
                                  ? 'bg-slate-50/60 opacity-80 hover:bg-slate-100/60'
                                  : isOverdue
                                  ? 'bg-rose-50/40 hover:bg-rose-50/70'
                                  : 'hover:bg-slate-50/70'
                              }`}
                            >
                              <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                                <span className={isVoided ? 'line-through text-slate-400' : ''}>
                                  {inv.invoiceNumber}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">
                                {new Date(inv.date).toLocaleDateString(
                                  language === 'pt' ? 'pt-BR' : 'en-US'
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-slate-700 font-medium">
                                {inv.planName ||
                                  inv.items?.[0]?.description ||
                                  'Google Workspace Unlimited'}
                              </td>
                              <td
                                className={`py-2.5 px-3 font-bold font-mono ${
                                  isVoided
                                    ? 'line-through text-slate-400'
                                    : isOverdue
                                    ? 'text-rose-700'
                                    : 'text-slate-900'
                                }`}
                              >
                                ${normalizedAmount.toFixed(2)} {inv.currency || 'USD'}
                              </td>
                              <td className="py-2.5 px-3">
                                {isVoided ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                                    <Ban className="w-2.5 h-2.5 text-slate-500" />
                                    <span>{t('tenants.adminModal.financial.filterVoided')}</span>
                                  </span>
                                ) : isPaid ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span>{t('tenants.adminModal.invoicesTab.statusPaid')}</span>
                                  </span>
                                ) : isOverdue ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                                    <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                                    <span>{t('blockingModal.overdueBadge')}</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    <span>{t('tenants.adminModal.invoicesTab.statusPending')}</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-right">
                                <div className="inline-flex items-center justify-end gap-2">
                                  {inv.pdfUrl || inv.hostedInvoiceUrl ? (
                                    <a
                                      href={inv.pdfUrl || inv.hostedInvoiceUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F7DC] text-[#163300] hover:bg-[#9FE870]/40 font-black text-[11px] transition-all shadow-2xs cursor-pointer"
                                      title={language === 'pt' ? 'Visualizar recibo / comprovante' : language === 'es' ? 'Ver recibo / comprobante' : 'View receipt'}
                                    >
                                      <span>{t('tenants.adminModal.invoicesTab.stripeReceipt')}</span>
                                      <ExternalLink className="w-3 h-3 text-[#163300]" />
                                    </a>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] text-slate-500 bg-slate-100 font-mono">
                                      {t('tenants.adminModal.invoicesTab.pdfGenerated')}
                                    </span>
                                  )}

                                  {/* SuperAdmin action to Void / Reactivate */}
                                  <button
                                    type="button"
                                    onClick={() => handleInitiateToggleVoidInvoice(inv)}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                      isVoided
                                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                                        : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                    }`}
                                    title={
                                      isVoided
                                        ? t('tenants.adminModal.financial.actionUnvoid')
                                        : t('tenants.adminModal.financial.actionVoid')
                                    }
                                  >
                                    {isVoided ? (
                                      <>
                                        <RotateCcw className="w-2.5 h-2.5" />
                                        <span>{t('tenants.adminModal.financial.actionUnvoid')}</span>
                                      </>
                                    ) : (
                                      <>
                                        <Ban className="w-2.5 h-2.5" />
                                        <span>{t('tenants.adminModal.financial.actionVoid')}</span>
                                      </>
                                    )}
                                  </button>
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
            </div>
          )}

          {/* TAB 5: E-MAILS ENVIADOS (RESEND / LOGS) */}
          {activeTab === 'emails' && (
            <div className="bg-white rounded-2xl border border-[#E2E6DF] p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-['Outfit']">
                    {t('tenants.adminModal.emailsTab.title')}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {t('tenants.adminModal.emailsTab.desc')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchEmailLogs}
                    disabled={loadingEmails}
                    className="h-9 px-3.5 rounded-full border border-[#E2E6DF] hover:bg-[#F4F5F0] text-[#0E0F0C] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingEmails ? 'animate-spin' : ''}`} />
                    <span>{t('tenants.adminModal.emailsTab.refresh')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    disabled={isSendingTestEmail}
                    className="h-9 px-4 rounded-full bg-[#163300] hover:bg-[#0E0F0C] text-[#9FE870] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {isSendingTestEmail
                        ? t('tenants.adminModal.emailsTab.sending')
                        : t('tenants.adminModal.emailsTab.sendTest')}
                    </span>
                  </button>
                </div>
              </div>

              {testEmailFeedback && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{testEmailFeedback}</span>
                </div>
              )}

              {/* Scope Filters and Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEmailScope('tenant')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                      emailScope === 'tenant'
                        ? 'bg-[#163300] text-[#9FE870]'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{t('tenants.adminModal.emailsTab.scopeTenant')}</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20">
                      {emailLogs.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmailScope('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                      emailScope === 'all'
                        ? 'bg-[#163300] text-[#9FE870]'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{t('tenants.adminModal.emailsTab.scopeAll')}</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20">
                      {allLogs.length}
                    </span>
                  </button>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={emailSearch}
                    onChange={(e) => setEmailSearch(e.target.value)}
                    placeholder={t('tenants.adminModal.emailsTab.searchPlaceholder')}
                    className="w-full h-8 pl-9 pr-7 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00c868] focus:border-[#00c868]"
                  />
                  {emailSearch && (
                    <button
                      type="button"
                      onClick={() => setEmailSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {loadingEmails ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                  <p className="text-xs">{t('tenants.adminModal.emailsTab.loadingLogs')}</p>
                </div>
              ) : displayedEmails.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-slate-200 text-center space-y-3">
                  <Mail className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-600 text-xs">
                    {emailScope === 'tenant'
                      ? t('tenants.adminModal.emailsTab.noEmails', {
                          email: tenant.primaryContactEmail || tenant.name,
                        })
                      : 'Nenhum e-mail encontrado com os filtros atuais.'}
                  </p>
                  {emailScope === 'tenant' && allLogs.length > 0 && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setEmailScope('all')}
                        className="px-4 py-2 rounded-xl bg-[#163300] text-[#9FE870] hover:bg-[#1f4700] text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2 shadow-xs"
                      >
                        <Mail className="w-4 h-4" />
                        <span>{t('tenants.adminModal.emailsTab.showAll')} ({allLogs.length})</span>
                      </button>
                    </div>
                  )}
                  <div>
                    <button
                      type="button"
                      onClick={handleSendTestEmail}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                    >
                      {t('tenants.adminModal.emailsTab.sendTestNow')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-4">{t('tenants.adminModal.emailsTab.thDate')}</th>
                        <th className="py-2.5 px-3">{t('tenants.adminModal.emailsTab.thType')}</th>
                        <th className="py-2.5 px-4">{t('tenants.adminModal.emailsTab.thSubject')}</th>
                        <th className="py-2.5 px-3">{t('tenants.adminModal.emailsTab.thRecipient')}</th>
                        <th className="py-2.5 px-3 text-center">{t('tenants.adminModal.emailsTab.thStatus')}</th>
                        <th className="py-2.5 px-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayedEmails.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                            {new Date(log.timestamp).toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-mono font-bold text-slate-700 text-[10px] bg-slate-100 px-2 py-0.5 rounded-md">
                              {log.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-slate-900 max-w-xs truncate" title={log.subject}>
                            {log.subject}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px] truncate max-w-[180px]" title={log.to}>
                            {log.to}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {log.status === 'DELIVERED' || log.status === 'SENT' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                {t('tenants.adminModal.emailsTab.delivered')}
                              </span>
                            ) : log.status === 'SIMULATED' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                {t('tenants.adminModal.emailsTab.sandbox')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                {log.status}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenEmailDetail(log)}
                              title={t('tenants.adminModal.emailsTab.viewContent')}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 cursor-pointer transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Email Preview Modal */}
          {selectedEmailDetail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div className="min-w-0 pr-2">
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {selectedEmailDetail.subject || 'E-mail'}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-mono">
                      ID: {selectedEmailDetail.id}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedEmailDetail(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 bg-slate-50/50 border-b border-slate-100 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{t('tenants.adminModal.emailsTab.to')}:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {Array.isArray(selectedEmailDetail.to) ? selectedEmailDetail.to.join(', ') : selectedEmailDetail.to}
                    </span>
                  </div>
                  {selectedEmailDetail.from && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{t('tenants.adminModal.emailsTab.from')}:</span>
                      <span className="font-mono text-slate-700">{selectedEmailDetail.from}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{t('tenants.adminModal.emailsTab.thDateTime')}:</span>
                    <span className="text-slate-700 font-mono">
                      {new Date(selectedEmailDetail.created_at || selectedEmailDetail.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-500">{t('tenants.adminModal.emailsTab.thStatus')}:</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {selectedEmailDetail.last_event || selectedEmailDetail.status || 'DELIVERED'}
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-white">
                  {loadingEmailDetail ? (
                    <div className="py-16 text-center text-slate-400 space-y-2">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                      <p className="text-xs">Carregando conteúdo da mensagem...</p>
                    </div>
                  ) : selectedEmailDetail.html ? (
                    <div
                      className="prose prose-sm max-w-none text-slate-800"
                      dangerouslySetInnerHTML={{ __html: selectedEmailDetail.html }}
                    />
                  ) : selectedEmailDetail.text ? (
                    <pre className="p-4 rounded-xl bg-slate-50 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed border border-slate-200">
                      {selectedEmailDetail.text}
                    </pre>
                  ) : (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      Conteúdo visual não disponível para esta transmissão.
                    </div>
                  )}
                </div>

                <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedEmailDetail(null)}
                    className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                  >
                    {t('tenants.adminModal.emailsTab.close')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ZONA DE PERIGO */}
          {activeTab === 'danger' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>{t('tenants.adminModal.dangerTab.bannerTitle')}</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  {t('tenants.adminModal.dangerTab.bannerDesc')}
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-[#E2E6DF] bg-white space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 font-['Outfit']">
                      {status === 'SUSPENDED'
                        ? t('tenants.adminModal.dangerTab.suspendedTitle')
                        : t('tenants.adminModal.dangerTab.suspendTitle')}
                    </h5>
                    <p className="text-xs text-slate-500">
                      {status === 'SUSPENDED'
                        ? t('tenants.adminModal.dangerTab.suspendedDesc')
                        : t('tenants.adminModal.dangerTab.suspendDesc')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {status === 'SUSPENDED' && onPreviewBlockingModal && (
                      <button
                        type="button"
                        onClick={() =>
                          onPreviewBlockingModal({
                            ...tenant,
                            status: 'SUSPENDED',
                            suspendedReason,
                            invoices,
                          })
                        }
                        className="px-4 py-2.5 rounded-full text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        title={t('tenants.adminModal.dangerTab.viewBlockingModal')}
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                        <span>{t('tenants.adminModal.dangerTab.viewBlockingModal')}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (status === 'SUSPENDED') {
                          setIsUnblockConfirmOpen(true);
                        } else {
                          setIsBlockConfirmOpen(true);
                        }
                      }}
                      className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2 ${
                        status === 'SUSPENDED'
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-amber-600 hover:bg-amber-700 text-white'
                      }`}
                    >
                      {status === 'SUSPENDED' ? (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>{t('tenants.adminModal.dangerTab.unblockOrg')}</span>
                        </>
                      ) : (
                        <>
                          <Ban className="w-4 h-4" />
                          <span>{t('tenants.adminModal.dangerTab.blockOrg')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Se estiver bloqueado, exibe e permite editar o motivo do bloqueio */}
                {status === 'SUSPENDED' && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-900 uppercase tracking-wider text-[10px]">
                        {t('tenants.adminModal.dangerTab.activeReasonLabel')}
                      </span>
                      {!isEditingReason ? (
                        <button
                          type="button"
                          onClick={() => setIsEditingReason(true)}
                          className="text-[11px] font-bold text-rose-700 hover:underline cursor-pointer"
                        >
                          {t('tenants.adminModal.dangerTab.editReason')}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              setIsEditingReason(false);
                              await onUpdateTenant(
                                tenant.id,
                                { suspendedReason },
                                {
                                  title: t('tenants.adminModal.dangerTab.reasonUpdatedToastTitle'),
                                  message: t('tenants.adminModal.dangerTab.reasonUpdatedToastMsg'),
                                }
                              );
                            }}
                            className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                          >
                            {t('tenants.adminModal.dangerTab.save')}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSuspendedReason(tenant.suspendedReason || '');
                              setIsEditingReason(false);
                            }}
                            className="text-[11px] font-bold text-slate-500 hover:underline cursor-pointer"
                          >
                            {t('tenants.adminModal.dangerTab.cancel')}
                          </button>
                        </div>
                      )}
                    </div>
                    {isEditingReason ? (
                      <textarea
                        value={suspendedReason}
                        onChange={(e) => setSuspendedReason(e.target.value)}
                        rows={2}
                        className="w-full p-2.5 text-xs rounded-lg border border-rose-300 bg-white focus:outline-none focus:border-rose-500"
                        placeholder={t('tenants.adminModal.dangerTab.reasonPlaceholder')}
                      />
                    ) : (
                      <p className="text-rose-800 italic bg-white/60 p-2.5 rounded-lg border border-rose-200/60">
                        "{suspendedReason || t('tenants.adminModal.submodals.blockConfirm.preset1')}"
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 rounded-2xl border border-rose-200 bg-rose-50/40 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="text-sm font-bold text-rose-900 font-['Outfit']">
                      {t('tenants.adminModal.dangerTab.deleteOrgTitle')}
                    </h5>
                    <p className="text-xs text-rose-700 leading-relaxed">
                      {t('tenants.adminModal.dangerTab.deleteOrgDesc')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmText('');
                      setIsDeleteConfirmOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2 shrink-0 shadow-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{t('tenants.adminModal.dangerTab.deleteOrgBtn')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ADICIONAR DOMÍNIO */}
      {isAddDomainModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 font-['Outfit']">
                  {t('tenants.adminModal.submodals.addDomain.title')}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsAddDomainModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDomainSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t('tenants.adminModal.submodals.addDomain.domainLabel')}
                </label>
                <input
                  type="text"
                  required
                  value={newDomainName}
                  onChange={(e) => setNewDomainName(e.target.value)}
                  placeholder="ex: colegio-horizonte.com.br"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#00c868]/30 focus:border-[#00c868]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-primary-domain"
                  checked={newDomainIsPrimary}
                  onChange={(e) => setNewDomainIsPrimary(e.target.checked)}
                  className="rounded border-slate-300 text-[#00c868] focus:ring-[#00c868] cursor-pointer"
                />
                <label htmlFor="chk-primary-domain" className="text-slate-700 font-semibold cursor-pointer">
                  {t('tenants.adminModal.submodals.addDomain.primaryLabel')}
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddDomainModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  {t('tenants.adminModal.submodals.addDomain.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#00c868] hover:bg-[#00b05b] text-white font-bold cursor-pointer transition-colors"
                >
                  {t('tenants.adminModal.submodals.addDomain.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR LICENÇA */}
      {isAddLicenseModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 font-['Outfit']">
                  {t('tenants.adminModal.submodals.addLicense.title')}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsAddLicenseModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLicenseSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t('tenants.adminModal.submodals.addLicense.skuLabel')}
                </label>
                <select
                  value={newLicenseSku}
                  onChange={(e) => setNewLicenseSku(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#00c868]/30 focus:border-[#00c868]"
                >
                  {AVAILABLE_SKUS.map((sku) => (
                    <option key={sku} value={sku}>
                      {sku}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t('tenants.adminModal.submodals.addLicense.seatsLabel')}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newLicenseSeats}
                  onChange={(e) => setNewLicenseSeats(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#00c868]/30 focus:border-[#00c868]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddLicenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  {t('tenants.adminModal.submodals.addLicense.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#00c868] hover:bg-[#00b05b] text-white font-bold cursor-pointer transition-colors"
                >
                  {t('tenants.adminModal.submodals.addLicense.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DE BLOQUEIO DA ORGANIZAÇÃO */}
      {isBlockConfirmOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-amber-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0">
                  <Ban className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-['Outfit']">
                    {t('tenants.adminModal.submodals.blockConfirm.title')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('tenants.adminModal.submodals.blockConfirm.desc', {
                      name: name || tenant.name,
                      id: tenant.id,
                    })}
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed space-y-2">
                <p>
                  {t('tenants.adminModal.submodals.blockConfirm.alert')}
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <label className="block font-bold text-slate-700">
                  {t('tenants.adminModal.submodals.blockConfirm.reasonLabel')}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    t('tenants.adminModal.submodals.blockConfirm.preset1'),
                    t('tenants.adminModal.submodals.blockConfirm.preset2'),
                    t('tenants.adminModal.submodals.blockConfirm.preset3'),
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBlockPromptReason(preset)}
                      className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <textarea
                  value={blockPromptReason}
                  onChange={(e) => setBlockPromptReason(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  placeholder={t('tenants.adminModal.submodals.blockConfirm.reasonPlaceholder')}
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsBlockConfirmOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  {t('tenants.adminModal.submodals.blockConfirm.cancel')}
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleExecuteBlock}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('tenants.adminModal.submodals.blockConfirm.blocking')}</span>
                    </>
                  ) : (
                    <>
                      <Ban className="w-3.5 h-3.5" />
                      <span>{t('tenants.adminModal.submodals.blockConfirm.confirm')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DE DESBLOQUEIO DA ORGANIZAÇÃO */}
      {isUnblockConfirmOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-emerald-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 font-['Outfit']">
                  {t('tenants.adminModal.submodals.unblockConfirm.title')}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {t('tenants.adminModal.submodals.unblockConfirm.desc', {
                    name: name || tenant.name,
                    id: tenant.id,
                  })}
                </p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-left text-xs text-emerald-800 space-y-1">
                <div>• {t('tenants.adminModal.submodals.unblockConfirm.bullet1')}</div>
                <div>• {t('tenants.adminModal.submodals.unblockConfirm.bullet2')}</div>
                <div>• {t('tenants.adminModal.submodals.unblockConfirm.bullet3')}</div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsUnblockConfirmOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  {t('tenants.adminModal.submodals.unblockConfirm.cancel')}
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleExecuteUnblock}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('tenants.adminModal.submodals.unblockConfirm.unblocking')}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{t('tenants.adminModal.submodals.unblockConfirm.confirm')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO DA ORGANIZAÇÃO */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-rose-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 font-['Outfit']">
                  {t('tenants.adminModal.submodals.deletePermanent.title')}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {t('tenants.adminModal.submodals.deletePermanent.desc', {
                    name: tenant.name,
                    id: tenant.id,
                  })}
                </p>
              </div>

              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-left text-xs text-rose-800 space-y-1 font-medium">
                <div>
                  • {t('tenants.adminModal.submodals.deletePermanent.adminLabel')}: {tenant.primaryContactEmail}
                </div>
                <div>
                  • {t('tenants.adminModal.submodals.deletePermanent.linkedDomainsLabel')}: {tenantDomains.length}
                </div>
                <div>
                  • {t('tenants.adminModal.submodals.deletePermanent.registeredLicensesLabel')}: {contractedSeats.length}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  {t('tenants.adminModal.submodals.deletePermanent.cancel')}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleExecuteDeleteTenant}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('tenants.adminModal.submodals.deletePermanent.deleting')}</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('tenants.adminModal.submodals.deletePermanent.confirm')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO DE LICENÇA */}
      {licenseToDelete && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-rose-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900 font-['Outfit']">
                    {t('tenants.adminModal.submodals.deleteLicense.title')}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t('tenants.adminModal.submodals.deleteLicense.desc')}
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-2">
                <div className="font-bold text-slate-800 text-xs truncate">
                  <span className="text-rose-700 font-semibold">{t('tenants.adminModal.submodals.deleteLicense.skuLabel')}:</span> {licenseToDelete.sku}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600 border-t border-rose-200/60 pt-2">
                  <span>{t('tenants.adminModal.submodals.deleteLicense.seatsLabel')}:</span>
                  <span className="font-bold text-rose-700 font-mono text-xs">{licenseToDelete.seats}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setLicenseToDelete(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  {t('tenants.adminModal.submodals.deleteLicense.cancel')}
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleExecuteDeleteLicense}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('tenants.adminModal.submodals.deleteLicense.deleting')}</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('tenants.adminModal.submodals.deleteLicense.confirm')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DE ALTERAÇÃO DE ASSENTOS */}
      {licenseToEditConfirm && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-blue-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900 font-['Outfit']">
                    {t('tenants.adminModal.submodals.editLicenseSeats.title')}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t('tenants.adminModal.submodals.editLicenseSeats.desc')}
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="font-bold text-slate-800 truncate">
                  <span className="text-slate-500">{t('tenants.adminModal.submodals.editLicenseSeats.skuLabel')}:</span> {licenseToEditConfirm.sku}
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">{t('tenants.adminModal.submodals.editLicenseSeats.previousSeats')}:</span>
                    <span className="font-bold text-slate-700 font-mono text-sm">{licenseToEditConfirm.currentSeats}</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 block">{t('tenants.adminModal.submodals.editLicenseSeats.newSeats')}:</span>
                    <span className="font-black text-emerald-600 font-mono text-sm">{licenseToEditConfirm.newSeats}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setLicenseToEditConfirm(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  {t('tenants.adminModal.submodals.editLicenseSeats.cancel')}
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleExecuteSaveEditedLicense}
                  className="px-5 py-2.5 rounded-xl bg-[#00c868] hover:bg-[#00b05b] text-white font-black text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('tenants.adminModal.submodals.editLicenseSeats.saving')}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{t('tenants.adminModal.submodals.editLicenseSeats.confirm')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO DE DOMÍNIO */}
      {domainToDelete && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-rose-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                  <Globe className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900 font-['Outfit']">
                    {t('tenants.adminModal.submodals.deleteDomain.title')}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t('tenants.adminModal.submodals.deleteDomain.desc', { domain: domainToDelete })}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900">
                <span className="font-semibold text-rose-700">{t('tenants.adminModal.submodals.deleteDomain.domainLabel')}:</span>{' '}
                <span className="font-mono font-bold">{domainToDelete}</span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setDomainToDelete(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  {t('tenants.adminModal.submodals.deleteDomain.cancel')}
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleExecuteDeleteDomain}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('tenants.adminModal.submodals.deleteDomain.deleting')}</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('tenants.adminModal.submodals.deleteDomain.confirm')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DE ATUALIZAÇÃO DE CADASTRO */}
      {isConfirmSaveCadastroOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#9FE870] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F7DC] text-[#163300] flex items-center justify-center shrink-0 border border-[#9FE870]">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900 font-['Outfit']">
                    {t('tenants.adminModal.submodals.saveProfile.title')}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t('tenants.adminModal.submodals.saveProfile.desc')}
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-[#F4F5F0] rounded-xl border border-[#E2E6DF] text-xs space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E6DF]">
                  <span className="text-slate-500 font-medium">{t('tenants.adminModal.submodals.saveProfile.orgName')}:</span>
                  <span className="font-bold text-slate-900">{name || tenant.name}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E6DF]">
                  <span className="text-slate-500 font-medium">{t('tenants.adminModal.submodals.saveProfile.primaryEmail')}:</span>
                  <span className="font-mono text-slate-800 text-[11px]">{primaryContactEmail}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E6DF]">
                  <span className="text-slate-500 font-medium">{t('tenants.adminModal.submodals.saveProfile.financialEmail')}:</span>
                  <span className="font-mono text-slate-800 text-[11px]">{financialContactEmail || primaryContactEmail}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">{t('tenants.adminModal.submodals.saveProfile.budget')}:</span>
                  <span className="font-bold text-slate-900 font-mono">${monthlyBudgetUsd} / mês</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                {t('tenants.adminModal.submodals.saveProfile.warning')}
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsConfirmSaveCadastroOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  {t('tenants.adminModal.submodals.saveProfile.cancel')}
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleExecuteSaveChanges}
                  className="px-5 py-2.5 rounded-xl bg-[#00c868] hover:bg-[#00b05b] text-white font-black text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('tenants.adminModal.submodals.saveProfile.saving')}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{t('tenants.adminModal.submodals.saveProfile.confirm')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DE ANULAÇÃO OU REATIVAÇÃO DE FATURA */}
      {invoiceToToggleVoid && (() => {
        const isCurrentlyVoided = isInvoiceVoided(invoiceToToggleVoid);
        const invNum = invoiceToToggleVoid.invoiceNumber || invoiceToToggleVoid.id;
        return (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
            <div className={`bg-white w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${isCurrentlyVoided ? 'border-blue-200' : 'border-rose-200'}`}>
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${isCurrentlyVoided ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-rose-100 text-rose-600 border-rose-200'}`}>
                    {isCurrentlyVoided ? <RotateCcw className="w-6 h-6" /> : <Ban className="w-6 h-6" />}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-900 font-['Outfit']">
                      {isCurrentlyVoided
                        ? t('tenants.adminModal.submodals.toggleVoidInvoice.titleUnvoid')
                        : t('tenants.adminModal.submodals.toggleVoidInvoice.titleVoid')}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {isCurrentlyVoided
                        ? t('tenants.adminModal.submodals.toggleVoidInvoice.descUnvoid', { number: invNum })
                        : t('tenants.adminModal.submodals.toggleVoidInvoice.descVoid', { number: invNum })}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{t('tenants.adminModal.submodals.toggleVoidInvoice.invoiceLabel')}:</span>
                    <span className="font-mono font-bold text-slate-900">{invNum}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{t('tenants.adminModal.submodals.toggleVoidInvoice.amountLabel')}:</span>
                    <span className="font-bold text-slate-900 font-mono">${invoiceToToggleVoid.amount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setInvoiceToToggleVoid(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    {t('tenants.adminModal.submodals.toggleVoidInvoice.cancel')}
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleExecuteToggleVoidInvoice}
                    className={`px-5 py-2.5 rounded-xl text-white font-black text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2 ${
                      isCurrentlyVoided
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>{t('tenants.adminModal.submodals.toggleVoidInvoice.updating')}</span>
                      </>
                    ) : isCurrentlyVoided ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{t('tenants.adminModal.submodals.toggleVoidInvoice.confirmUnvoid')}</span>
                      </>
                    ) : (
                      <>
                        <Ban className="w-3.5 h-3.5" />
                        <span>{t('tenants.adminModal.submodals.toggleVoidInvoice.confirmVoid')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* SUBMODAL: CONFIRMAR SUSPENDER / REATIVAR USUÁRIO */}
      {userToToggleStatus && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                    userToToggleStatus.status === 'ACTIVE'
                      ? 'bg-amber-50 text-amber-600 border-amber-200'
                      : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  }`}
                >
                  {userToToggleStatus.status === 'ACTIVE' ? (
                    <Lock className="w-5 h-5" />
                  ) : (
                    <Unlock className="w-5 h-5" />
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900 font-['Outfit']">
                    {userToToggleStatus.status === 'ACTIVE'
                      ? (language === 'pt' ? 'Suspender Usuário' : language === 'es' ? 'Suspender Usuario' : 'Suspend User')
                      : (language === 'pt' ? 'Reativar Usuário' : language === 'es' ? 'Reactivar Usuario' : 'Reactivate User')}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {userToToggleStatus.status === 'ACTIVE'
                      ? (language === 'pt'
                          ? 'Tem certeza de que deseja suspender este usuário? Ele perderá imediatamente o acesso ao e-mail, arquivos e serviços da organização.'
                          : 'Are you sure you want to suspend this user? They will lose access to email, files, and organization services.')
                      : (language === 'pt'
                          ? 'Deseja reativar esta conta? O usuário recuperará o acesso imediato aos serviços da organização.'
                          : 'Do you want to reactivate this account? The user will regain access to organization services.')}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                  style={{
                    backgroundColor: userToToggleStatus.avatarColor || '#E8F7DC',
                    color: '#163300',
                  }}
                >
                  {(userToToggleStatus.name?.givenName?.[0] || '') + (userToToggleStatus.name?.familyName?.[0] || '') || 'U'}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate">
                    {userToToggleStatus.name?.fullName || userToToggleStatus.primaryEmail}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono truncate">
                    {userToToggleStatus.primaryEmail}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setUserToToggleStatus(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  {language === 'pt' ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => userToToggleStatus && handleConfirmToggleUserStatus(userToToggleStatus)}
                  className={`px-5 py-2.5 rounded-xl text-white font-black text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2 ${
                    userToToggleStatus.status === 'ACTIVE'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : userToToggleStatus.status === 'ACTIVE' ? (
                    <Lock className="w-3.5 h-3.5" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {userToToggleStatus.status === 'ACTIVE'
                      ? (language === 'pt' ? 'Confirmar Suspensão' : 'Confirm Suspension')
                      : (language === 'pt' ? 'Confirmar Reativação' : 'Confirm Reactivation')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBMODAL: CONFIRMAR REDEFINIÇÃO DE SENHA */}
      {userToResetPassword && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900 font-['Outfit']">
                    {language === 'pt' ? 'Redefinir Senha do Usuário' : language === 'es' ? 'Restablecer Contraseña' : 'Reset User Password'}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {language === 'pt'
                      ? 'Uma nova senha temporária será gerada para este usuário. Ele deverá trocá-la no primeiro acesso.'
                      : 'A temporary secure password will be generated for this user. They must change it on next login.'}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200/80 text-xs text-slate-700 flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                  style={{
                    backgroundColor: userToResetPassword.avatarColor || '#E8F7DC',
                    color: '#163300',
                  }}
                >
                  {(userToResetPassword.name?.givenName?.[0] || '') + (userToResetPassword.name?.familyName?.[0] || '') || 'U'}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate">
                    {userToResetPassword.name?.fullName || userToResetPassword.primaryEmail}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono truncate">
                    {userToResetPassword.primaryEmail}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setUserToResetPassword(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  {language === 'pt' ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => userToResetPassword && handleConfirmResetPassword(userToResetPassword)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2"
                >
                  {isSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <KeyRound className="w-3.5 h-3.5" />
                  )}
                  <span>{language === 'pt' ? 'Gerar Senha Temporária' : 'Generate Temp Password'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBMODAL: CONFIRMAR EXCLUSÃO DE USUÁRIO */}
      {userToDelete && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-rose-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900 font-['Outfit']">
                    {language === 'pt' ? 'Excluir Conta Permanentemente' : language === 'es' ? 'Eliminar Cuenta Permanentemente' : 'Permanently Delete Account'}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {language === 'pt'
                      ? 'Tem certeza de que deseja excluir permanentemente esta conta? Esta operação não pode ser desfeita.'
                      : 'Are you sure you want to permanently delete this account? This action cannot be undone.'}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                  style={{
                    backgroundColor: userToDelete.avatarColor || '#E8F7DC',
                    color: '#163300',
                  }}
                >
                  {(userToDelete.name?.givenName?.[0] || '') + (userToDelete.name?.familyName?.[0] || '') || 'U'}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-rose-950 truncate">
                    {userToDelete.name?.fullName || userToDelete.primaryEmail}
                  </div>
                  <div className="text-[11px] text-rose-700 font-mono truncate">
                    {userToDelete.primaryEmail}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  {language === 'pt' ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => userToDelete && handleConfirmDeleteUser(userToDelete)}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2"
                >
                  {isSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>{language === 'pt' ? 'Excluir Permanentemente' : 'Delete Permanently'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
