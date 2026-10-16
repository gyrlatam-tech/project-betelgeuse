import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Globe,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Star,
  ShieldCheck,
  X,
  Copy,
  Check,
  ArrowRight,
  Clock,
  ExternalLink,
  Info,
  Server,
  FileText,
  Mail,
  HelpCircle,
  Loader2,
  Users,
  Sparkles,
  Edit3,
  Save,
  Eye,
  Settings2,
} from 'lucide-react';
import { WorkspaceDomain, WorkspaceUser, DomainState, DomainAuditRecord, CustomDnsRecord } from '../types';
import { SkooliaTwinOGlyph } from './SkooliaLoader';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface DomainsViewProps {
  domains: WorkspaceDomain[];
  users?: WorkspaceUser[];
  onAddDomain: (newDomain: WorkspaceDomain) => void;
  onVerifyDomain?: (domainName: string) => void;
  onDeleteDomain?: (domainName: string) => void;
  onSetPrimaryDomain?: (domainName: string) => void;
  onNavigateToServices?: () => void;
  onUpdateDomain?: (updatedDomain: WorkspaceDomain) => void;
}

type ModalStage = 'INPUT' | 'SUBMITTED_AWAITING' | 'DNS_CONFIG' | 'ERROR' | 'QUOTA_EXCEEDED';

export const DomainsView: React.FC<DomainsViewProps> = ({
  domains,
  users = [],
  onAddDomain,
  onVerifyDomain,
  onDeleteDomain,
  onSetPrimaryDomain,
  onNavigateToServices,
  onUpdateDomain,
}) => {
  const { user, institution, isSuperAdmin } = useAuth();
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRIMARY' | 'VERIFIED' | 'PENDING_APPROVAL' | 'PENDING_DNS'>('ALL');

  // Calculate domain quotas (1 free domain by default for every tenant + purchased add-on domain licenses)
  // SuperAdmin has NO restrictions to add domains
  const additionalServices = institution?.subscription?.additionalServices || [];
  const additionalDomainLicenses = additionalServices
    .filter((s: any) => s.status === 'ACTIVE' && (s.id === 'prod_UsDMgccT772IQB' || s.category === 'DOMAIN'))
    .reduce((acc: number, s: any) => acc + (Number(s.quantity) || 1), 0);

  const totalAllowedDomains = isSuperAdmin ? 999999 : (1 + additionalDomainLicenses); // 1 free base + add-ons, or unlimited for superadmin
  const registeredDomainsCount = domains.length;
  const availableDomainSlots = isSuperAdmin ? 999999 : Math.max(0, totalAllowedDomains - registeredDomainsCount);
  const hasAvailableSlots = isSuperAdmin || availableDomainSlots > 0;
  // Tenant has effectively verified at least their first/primary domain
  const hasVerifiedFirstDomain = domains.some((d) => d.verified || d.state === 'VERIFIED');

  // Add Domain Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalStage, setModalStage] = useState<ModalStage>('INPUT');
  const [newDomainInput, setNewDomainInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedDomainData, setSubmittedDomainData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorHelpUrl, setErrorHelpUrl] = useState<string | null>(null);
  const [errorDeleteAccountHelpUrl, setErrorDeleteAccountHelpUrl] = useState<string | null>(null);

  // DNS Verification Modal State
  const [activeDnsDomain, setActiveDnsDomain] = useState<WorkspaceDomain | null>(null);
  const [isVerifyingDns, setIsVerifyingDns] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [verificationFeedback, setVerificationFeedback] = useState<{
    status: 'SUCCESS' | 'PROPAGATING' | 'ERROR' | null;
    message: string;
    expectedToken?: string;
    foundTxtRecords?: string[];
    foundMxRecords?: string[];
    tokenMatched?: boolean;
    adminConsoleActive?: boolean;
    adminConsoleStatus?: string;
  }>({ status: null, message: '' });

  // Superadmin Manual DNS Editing State
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTxtHost, setEditTxtHost] = useState('@');
  const [editTxtToken, setEditTxtToken] = useState('');
  const [editMxHost, setEditMxHost] = useState('@');
  const [editMxServer, setEditMxServer] = useState('SMTP.GOOGLE.COM');
  const [editMxPriority, setEditMxPriority] = useState('1');
  const [editSpfHost, setEditSpfHost] = useState('@');
  const [editSpfValue, setEditSpfValue] = useState('v=spf1 include:_spf.google.com ~all');
  const [editCustomRecords, setEditCustomRecords] = useState<CustomDnsRecord[]>([]);
  const [editInstructions, setEditInstructions] = useState('');
  const [isSavingDns, setIsSavingDns] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Delete Domain State
  const [domainToDelete, setDomainToDelete] = useState<WorkspaceDomain | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered domains
  const filteredDomains = domains.filter((d) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || d.domainName.toLowerCase().includes(q);

    let matchesStatus = true;
    if (statusFilter === 'PRIMARY') matchesStatus = d.isPrimary;
    if (statusFilter === 'VERIFIED') matchesStatus = d.verified || d.state === 'VERIFIED';
    if (statusFilter === 'PENDING_APPROVAL') matchesStatus = d.state === 'PENDING_APPROVAL';
    if (statusFilter === 'PENDING_DNS') matchesStatus = d.state === 'PENDING_DNS';

    return matchesSearch && matchesStatus;
  });

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const openAddModal = () => {
    if (!isSuperAdmin && !hasAvailableSlots) {
      setModalStage('QUOTA_EXCEEDED');
      setIsAddModalOpen(true);
      return;
    }
    setNewDomainInput('');
    setErrorMessage('');
    setSubmittedDomainData(null);
    setModalStage('INPUT');
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setModalStage('INPUT');
    setNewDomainInput('');
    setSubmittedDomainData(null);
    setErrorMessage('');
    setErrorHelpUrl(null);
    setErrorDeleteAccountHelpUrl(null);
  };

  // Step 1: User submits domain for registration & approval
  const handleRegisterDomain = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!isSuperAdmin && !hasAvailableSlots) {
      setModalStage('QUOTA_EXCEEDED');
      return;
    }

    const clean = newDomainInput
      .trim()
      .toLowerCase()
      .replace(/https?:\/\//, '')
      .replace(/\/.*$/, '');

    if (!clean || !clean.includes('.')) {
      setErrorMessage(t('domains.validationInvalidDomain'));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setErrorHelpUrl(null);
    setErrorDeleteAccountHelpUrl(null);

    try {
      const effectiveTenantId = institution?.ownerUid || institution?.id || user?.uid || '';
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-language': language,
          'x-is-superadmin': isSuperAdmin ? 'true' : 'false',
          'x-tenant-id': effectiveTenantId,
        },
        body: JSON.stringify({
          domainName: clean,
          tenantId: effectiveTenantId,
          institutionName: institution?.institutionName,
          preferredLanguage: language,
          lang: language,
          isSuperAdmin: !!isSuperAdmin,
        }),
      });

      const data = await res.json();

      if (res.status === 201 || res.ok) {
        const addedDomain: WorkspaceDomain = {
          domainName: data.domain || clean,
          tenantId: effectiveTenantId,
          isPrimary: domains.length === 0,
          verified: false,
          state: 'PENDING_APPROVAL',
          auditRecord: data.auditRecord,
          mxConfigured: false,
          spfConfigured: false,
          dkimConfigured: false,
          submittedAt: data.submittedAt || new Date().toISOString(),
        };

        onAddDomain(addedDomain);
        setSubmittedDomainData(data);
        setModalStage('SUBMITTED_AWAITING');
      } else {
        const msg = data?.error || data?.message || t('domains.modalRegister.errorDefaultMsg');
        const isConflict =
          res.status === 409 ||
          msg.toLowerCase().includes('cadastrado') ||
          msg.toLowerCase().includes('painel anterior') ||
          msg.toLowerCase().includes('registered') ||
          msg.toLowerCase().includes('registrado');

        setErrorMessage(msg);
        setErrorHelpUrl(
          data?.helpUrl ||
            (isConflict
              ? 'https://knowledge.workspace.google.com/admin/domains/remove-a-domain-from-your-managed-google-account?hl=pt-br'
              : null)
        );
        setErrorDeleteAccountHelpUrl(
          data?.deleteAccountHelpUrl ||
            (isConflict
              ? 'https://knowledge.workspace.google.com/admin/billing/delete-your-organizations-google-account?hl=pt-br'
              : null)
        );
        setModalStage('ERROR');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || t('domains.validationCommError'));
      setModalStage('ERROR');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open DNS Modal for domain in PENDING_DNS
  const handleOpenDnsModal = (domain: WorkspaceDomain) => {
    setActiveDnsDomain(domain);
    setVerificationFeedback({ status: null, message: '' });
    setSaveSuccessMsg(null);
    setIsEditMode(false);
    setEditTxtHost(domain.txtHost || '@');
    setEditTxtToken(domain.verificationTxtToken || domain.auditRecord?.token || '');
    setEditMxHost(domain.mxRecordHost || '@');
    setEditMxServer(domain.mxRecordServer || 'SMTP.GOOGLE.COM');
    setEditMxPriority(String(domain.mxRecordPriority || '1'));
    setEditSpfHost(domain.spfRecordHost || '@');
    setEditSpfValue(domain.spfRecordValue || 'v=spf1 include:_spf.google.com ~all');
    setEditCustomRecords(domain.customDnsRecords ? [...domain.customDnsRecords] : []);
    setEditInstructions(domain.dnsInstructions || '');
  };

  const handleAddCustomRecord = () => {
    setEditCustomRecords((prev) => [
      ...prev,
      {
        id: `dns-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'TXT',
        host: 'google._domainkey',
        value: 'v=DKIM1; k=rsa; p=...',
        priority: '',
        description: 'DKIM Record',
      },
    ]);
  };

  const handleRemoveCustomRecord = (id: string) => {
    setEditCustomRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateCustomRecord = (id: string, field: keyof CustomDnsRecord, val: string) => {
    setEditCustomRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  const handleSaveDns = async () => {
    if (!activeDnsDomain) return;
    setIsSavingDns(true);
    setSaveSuccessMsg(null);

    try {
      const res = await fetch(`/api/domains/${encodeURIComponent(activeDnsDomain.domainName)}/dns`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationTxtToken: editTxtToken,
          txtHost: editTxtHost,
          mxRecordServer: editMxServer,
          mxRecordHost: editMxHost,
          mxRecordPriority: editMxPriority,
          spfRecordValue: editSpfValue,
          spfRecordHost: editSpfHost,
          customDnsRecords: editCustomRecords,
          dnsInstructions: editInstructions,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || t('domains.modalDns.feedbackError'));
      }

      const data = await res.json();
      const updatedDomain: WorkspaceDomain = {
        ...activeDnsDomain,
        verificationTxtToken: editTxtToken,
        txtHost: editTxtHost,
        mxRecordServer: editMxServer,
        mxRecordHost: editMxHost,
        mxRecordPriority: editMxPriority,
        spfRecordValue: editSpfValue,
        spfRecordHost: editSpfHost,
        customDnsRecords: editCustomRecords,
        dnsInstructions: editInstructions,
        auditRecord: data.auditRecord || activeDnsDomain.auditRecord,
      };

      setActiveDnsDomain(updatedDomain);
      onUpdateDomain?.(updatedDomain);
      setSaveSuccessMsg(t('domains.modalDns.dnsSavedSuccess'));
      setIsEditMode(false);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      setVerificationFeedback({
        status: 'ERROR',
        message: err.message || t('domains.modalDns.feedbackError'),
      });
    } finally {
      setIsSavingDns(false);
    }
  };

  // Check DNS propagation via Google Public DNS (8.8.8.8)
  const handleVerifyDnsPropagation = async (domainName: string) => {
    setIsVerifyingDns(true);
    setVerificationFeedback({ status: null, message: '' });

    try {
      const res = await fetch(`/api/domains/${encodeURIComponent(domainName)}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (data.ok || data.state === 'VERIFIED') {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#00c868', '#00e676', '#1ce783', '#111827', '#6366f1'],
          });
        } catch {
          // fallback
        }

        setVerificationFeedback({
          status: 'SUCCESS',
          message: data.message || t('domains.modalDns.feedbackSuccess'),
          expectedToken: data.expectedToken,
          foundTxtRecords: data.foundTxtRecords,
          foundMxRecords: data.foundMxRecords,
          tokenMatched: data.tokenMatched,
          adminConsoleActive: data.adminConsoleActive,
          adminConsoleStatus: data.adminConsoleStatus,
        });

        if (activeDnsDomain) {
          setActiveDnsDomain({
            ...activeDnsDomain,
            verified: true,
            state: 'VERIFIED',
            mxConfigured: true,
            spfConfigured: true,
            auditRecord: data.auditRecord,
          });
        }

        if (onVerifyDomain) {
          onVerifyDomain(domainName);
        }
      } else {
        setVerificationFeedback({
          status: 'PROPAGATING',
          message:
            data.message ||
            t('domains.modalDns.feedbackPropagating'),
          expectedToken: data.expectedToken,
          foundTxtRecords: data.foundTxtRecords,
          foundMxRecords: data.foundMxRecords,
          tokenMatched: data.tokenMatched,
          adminConsoleActive: data.adminConsoleActive,
          adminConsoleStatus: data.adminConsoleStatus,
        });
      }
    } catch (err: any) {
      setVerificationFeedback({
        status: 'ERROR',
        message: err?.message || t('domains.modalDns.feedbackError'),
      });
    } finally {
      setIsVerifyingDns(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!domainToDelete || !onDeleteDomain) return;
    setIsDeleting(true);
    try {
      await onDeleteDomain(domainToDelete.domainName);
      setDomainToDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div id="domains-view" className="space-y-4 sm:space-y-6 animate-fadeIn pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#E2E6DF] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E8F7DC] text-[#163300] flex items-center justify-center font-bold shrink-0">
              <Globe className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-[#0E0F0C] font-['Outfit'] tracking-tight">
                {t('domains.title')}
              </h1>
              <p className="text-[#5E605D] text-xs mt-0.5">
                {additionalDomainLicenses > 0
                  ? t('domains.subtitleExtra', { count: additionalDomainLicenses })
                  : t('domains.subtitleDefault')}
              </p>
            </div>
          </div>
        </div>

        {hasAvailableSlots && (
          <div className="grid grid-cols-1 sm:flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {!isSuperAdmin && onNavigateToServices && (
              <button
                type="button"
                id="buy-more-domains-btn"
                onClick={onNavigateToServices}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full border border-[#E2E6DF] hover:border-[#163300] bg-white text-[#0E0F0C] hover:text-[#163300] font-bold text-xs cursor-pointer shadow-xs transition-all whitespace-nowrap"
                title={t('domains.buyAdditionalDomainBtn')}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#163300] shrink-0" />
                <span>{t('domains.addAdditionalDomainBtn')}</span>
              </button>
            )}
            <button
              id="add-domain-btn"
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#9FE870] hover:bg-[#8EE05B] text-[#163300] font-black text-xs cursor-pointer shadow-xs transition-all active:scale-98 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
              <span>{t('domains.registerNewDomainBtn')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Quota Limit Reached Alert Banner - NEVER shown for SuperAdmin, and only shown if regular tenant has reached quota */}
      {!isSuperAdmin && !hasAvailableSlots && hasVerifiedFirstDomain && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#F9FAF8] to-[#F1F6EC] rounded-2xl sm:rounded-3xl border border-[#9FE870]/50 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#E8F7DC] border border-[#9FE870]/50 flex items-center justify-center text-[#163300] shrink-0 shadow-2xs">
              <Globe className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-[#0E0F0C] font-['Outfit']">
                  {t('domains.quotaLimitTitle')}
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#E8F7DC] text-[#163300] font-['Outfit'] border border-[#9FE870]/40">
                  {t('domains.quotaLimitBadge')}
                </span>
              </div>
              <p className="text-xs text-[#5E605D] max-w-2xl leading-relaxed">
                {t('domains.quotaLimitDesc')}
              </p>
            </div>
          </div>

          {onNavigateToServices && (
            <button
              type="button"
              onClick={onNavigateToServices}
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#163300] hover:bg-[#204900] text-[#9FE870] font-black text-xs cursor-pointer shadow-xs transition-all shrink-0 active:scale-98 whitespace-nowrap w-full md:w-auto"
            >
              <Sparkles className="w-4 h-4 text-[#9FE870]" />
              <span>{t('domains.buyAdditionalDomainBtn')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-[#E2E6DF] shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto flex-1 max-w-xl">
          <div className="relative flex-1 sm:w-80 sm:flex-initial">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#868685] pointer-events-none" />
            <input
              id="domains-search-input"
              type="text"
              placeholder={t('domains.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2 bg-[#F4F5F0] border border-[#E2E6DF] rounded-full text-xs text-[#0E0F0C] placeholder-[#868685] focus:outline-none focus:border-[#163300]"
            />
          </div>

          {/* Domain Quota Badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-['Outfit'] border shrink-0 whitespace-nowrap self-start sm:self-auto ${
              isSuperAdmin
                ? 'bg-[#E8F7DC] text-[#163300] border-[#9FE870]/50'
                : hasAvailableSlots
                ? 'bg-[#E8F7DC] text-[#163300] border-[#9FE870]/50'
                : 'bg-amber-50 text-amber-900 border-amber-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current"></span>
            <span>
              {isSuperAdmin
                ? (language === 'pt'
                    ? `${registeredDomainsCount} domínios • Ilimitado (Superadmin)`
                    : language === 'es'
                    ? `${registeredDomainsCount} dominios • Ilimitado (Superadmin)`
                    : `${registeredDomainsCount} domains • Unlimited (SuperAdmin)`)
                : t('domains.quotaBadge', {
                    available: availableDomainSlots,
                    total: totalAllowedDomains,
                    label: totalAllowedDomains === 1 ? t('domains.domainAvailableSingle') : t('domains.domainAvailablePlural')
                  })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-0.5 sm:pb-0">
          {(
            [
              { key: 'ALL', label: t('domains.filterAll') },
              { key: 'PENDING_APPROVAL', label: t('domains.filterPendingApproval') },
              { key: 'PENDING_DNS', label: t('domains.filterPendingDns') },
              { key: 'VERIFIED', label: t('domains.filterVerified') },
              { key: 'PRIMARY', label: t('domains.filterPrimary') },
            ] as const
          ).map((tTab) => (
            <button
              key={tTab.key}
              onClick={() => setStatusFilter(tTab.key)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === tTab.key
                  ? 'bg-[#163300] text-[#9FE870] shadow-xs'
                  : 'bg-[#F4F5F0] text-[#5E605D] hover:bg-[#E2E6DF]'
              }`}
            >
              {tTab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile View (< md screens): Distinct Responsive Card List with clear spacing */}
      <div className="md:hidden space-y-3 sm:space-y-3.5">
        {filteredDomains.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E6DF] py-12 text-center text-[#868685] p-4 shadow-2xs">
            <Globe className="w-10 h-10 mx-auto text-[#CBD3C5] mb-2" />
            <p className="font-bold text-[#0E0F0C]">{t('domains.noDomainsFound')}</p>
            <p className="text-xs text-[#868685] mt-1">
              {hasAvailableSlots
                ? t('domains.noDomainsFoundHint')
                : t('domains.noDomainsQuotaHint')}
            </p>
          </div>
        ) : (
          filteredDomains.map((domain) => {
            const isVerified = domain.verified || domain.state === 'VERIFIED';
            const isPendingDns = !isVerified && domain.state === 'PENDING_DNS';
            const isPendingApproval = !isVerified && !isPendingDns;
            const domainUsersCount = users.filter((u) => u.primaryEmail?.endsWith(`@${domain.domainName}`)).length;

            return (
              <div key={domain.domainName} className="p-4 bg-white rounded-2xl border border-[#E2E6DF] space-y-3 shadow-2xs">
                {/* Top: Icon + Name + Primary Badge */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isVerified
                          ? 'bg-[#E8F7DC] text-[#163300]'
                          : isPendingApproval
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-[#0E0F0C] text-sm flex items-center gap-1.5 flex-wrap">
                        <span className="truncate">{domain.domainName}</span>
                        {domain.isPrimary && (
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-black bg-[#163300] text-[#9FE870] uppercase">
                            {t('domains.primaryBadge')}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#868685] truncate">
                        {domain.adminNotes
                          ? t('domains.adminNotesPrefix', { notes: domain.adminNotes })
                          : t('domains.secondaryDomain')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-semibold text-[#5E605D] shrink-0 bg-[#F4F5F0] px-2 py-0.5 rounded-full">
                    <Users className="w-3 h-3 text-[#868685]" />
                    <span>{domainUsersCount}</span>
                  </div>
                </div>

                {/* Status */}
                <div>
                  {isPendingApproval && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                      <span>{t('domains.statusPendingApproval')}</span>
                    </span>
                  )}

                  {isPendingDns && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                      <Globe className="w-3 h-3 text-blue-600" />
                      <span>{t('domains.statusPendingDns')}</span>
                    </span>
                  )}

                  {isVerified && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-[#E8F7DC] text-[#163300] border border-[#9FE870]/40">
                      <CheckCircle2 className="w-3 h-3 text-[#163300]" />
                      <span>{t('domains.statusVerifiedActive')}</span>
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-[#F4F5F0]">
                  {isPendingDns && (
                    <button
                      type="button"
                      onClick={() => handleOpenDnsModal(domain)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00c868] hover:bg-[#00b05b] text-white font-bold text-xs cursor-pointer shadow-2xs transition-all whitespace-nowrap"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{t('domains.verifyDnsBtn')}</span>
                    </button>
                  )}

                  {onSetPrimaryDomain && !domain.isPrimary && isVerified && (
                    <button
                      type="button"
                      onClick={() => onSetPrimaryDomain(domain.domainName)}
                      title={t('domains.setAsPrimaryTitle')}
                      className="p-2 text-[#868685] hover:text-amber-500 rounded-full hover:bg-[#F4F5F0] cursor-pointer transition-colors"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}

                  {onDeleteDomain && !domain.isPrimary && (
                    <button
                      type="button"
                      onClick={() => setDomainToDelete(domain)}
                      title={t('domains.removeDomainTitle')}
                      className="p-2 text-[#868685] hover:text-rose-600 rounded-full hover:bg-rose-50 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-2xl sm:rounded-3xl border border-[#E2E6DF] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F4F5F0] border-b border-[#E2E6DF] text-[10px] font-black uppercase tracking-wider text-[#868685] font-['Outfit']">
                <th className="py-3.5 px-5">{t('domains.tableHeaders.domain')}</th>
                <th className="py-3.5 px-4">{t('domains.tableHeaders.status')}</th>
                <th className="py-3.5 px-4">{t('domains.tableHeaders.linkedAccounts')}</th>
                <th className="py-3.5 px-5 text-right">{t('domains.tableHeaders.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E6DF] text-xs">
              {filteredDomains.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[#868685]">
                    <Globe className="w-10 h-10 mx-auto text-[#CBD3C5] mb-2" />
                    <p className="font-bold text-[#0E0F0C]">{t('domains.noDomainsFound')}</p>
                    <p className="text-xs text-[#868685] mt-1">
                      {hasAvailableSlots
                        ? t('domains.noDomainsFoundHint')
                        : t('domains.noDomainsQuotaHint')}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredDomains.map((domain) => {
                  const isVerified = domain.verified || domain.state === 'VERIFIED';
                  const isPendingDns = !isVerified && domain.state === 'PENDING_DNS';
                  const isPendingApproval = !isVerified && !isPendingDns;
                  const domainUsersCount = users.filter((u) => u.primaryEmail?.endsWith(`@${domain.domainName}`)).length;

                  return (
                    <tr key={domain.domainName} className="hover:bg-[#F4F5F0]/60 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                              isVerified
                                ? 'bg-[#E8F7DC] text-[#163300]'
                                : isPendingApproval
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            <Globe className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-[#0E0F0C] flex items-center gap-2">
                              {domain.domainName}
                              {domain.isPrimary && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#163300] text-[#9FE870] uppercase">
                                  {t('domains.primaryBadge')}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#868685]">
                              {domain.adminNotes
                                ? t('domains.adminNotesPrefix', { notes: domain.adminNotes })
                                : t('domains.secondaryDomain')}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {isPendingApproval && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                              {t('domains.statusPendingApproval')}
                            </span>
                            <div className="text-[10px] text-[#868685]">{t('domains.statusPendingApprovalSub')}</div>
                          </div>
                        )}

                        {isPendingDns && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                              <Globe className="w-3.5 h-3.5 text-blue-600" />
                              {t('domains.statusPendingDns')}
                            </span>
                            <div className="text-[10px] text-[#868685]">{t('domains.statusPendingDnsSub')}</div>
                          </div>
                        )}

                        {isVerified && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#E8F7DC] text-[#163300] border border-[#9FE870]/40">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#163300]" />
                              {t('domains.statusVerifiedActive')}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 text-xs font-semibold text-[#5E605D]">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#868685]" />
                          <span>{t('domains.usersCount', { count: domainUsersCount })}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPendingDns && (
                            <button
                              id={`verify-dns-btn-${domain.domainName}`}
                              onClick={() => handleOpenDnsModal(domain)}
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#00c868] hover:bg-[#00b05b] text-white font-bold text-xs cursor-pointer shadow-2xs transition-all whitespace-nowrap shrink-0"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              {t('domains.verifyDnsBtn')}
                            </button>
                          )}

                          {onSetPrimaryDomain && !domain.isPrimary && isVerified && (
                            <button
                              onClick={() => onSetPrimaryDomain(domain.domainName)}
                              title={t('domains.setAsPrimaryTitle')}
                              className="p-1.5 text-[#868685] hover:text-amber-500 rounded-full hover:bg-[#F4F5F0] cursor-pointer transition-colors"
                            >
                              <Star className="w-4 h-4" />
                            </button>
                          )}

                          {onDeleteDomain && !domain.isPrimary && (
                            <button
                              id={`delete-domain-btn-${domain.domainName}`}
                              onClick={() => setDomainToDelete(domain)}
                              title={t('domains.removeDomainTitle')}
                              className="p-1.5 text-[#868685] hover:text-rose-600 rounded-full hover:bg-rose-50 cursor-pointer transition-colors"
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
      </div>

      {/* Modal 1: Register New Domain */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0E0F0C]/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full p-4 sm:p-6 lg:p-8 shadow-2xl border border-[#E2E6DF] space-y-4 sm:space-y-6 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#E8F7DC] text-[#163300] flex items-center justify-center font-bold">
                  <Globe className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#0E0F0C] font-['Outfit']">
                    {t('domains.modalRegister.title')}
                  </h3>
                  <p className="text-xs text-[#5E605D]">
                    {t('domains.modalRegister.subtitle')}
                  </p>
                </div>
              </div>
              <button
                onClick={closeAddModal}
                className="text-[#868685] hover:text-[#0E0F0C] p-2 rounded-full hover:bg-[#F4F5F0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalStage === 'INPUT' && (
              <form onSubmit={handleRegisterDomain} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#0E0F0C] uppercase tracking-wider mb-1.5 font-['Outfit']">
                    {t('domains.modalRegister.inputLabel')}
                  </label>
                  <input
                    id="new-domain-input-field"
                    type="text"
                    required
                    placeholder={t('domains.modalRegister.inputPlaceholder')}
                    value={newDomainInput}
                    onChange={(e) => setNewDomainInput(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F4F5F0] border border-[#E2E6DF] rounded-xl text-xs text-[#0E0F0C] placeholder-[#868685] focus:bg-white focus:outline-none focus:border-[#163300]"
                  />
                  <p className="text-xs text-[#868685] mt-1">
                    {t('domains.modalRegister.inputHint')}
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-[#E2E6DF]">
                  <button
                    type="button"
                    onClick={closeAddModal}
                    className="px-5 py-2.5 rounded-full border border-[#D4DACF] text-[#0E0F0C] hover:bg-[#F4F5F0] font-bold text-xs cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {t('domains.modalRegister.cancelBtn')}
                  </button>
                  <button
                    id="submit-register-domain-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-full bg-[#00c868] hover:bg-[#00b05b] text-white font-black text-xs cursor-pointer shadow-xs transition-all flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                  >
                    {isSubmitting ? (
                      <>
                        <SkooliaTwinOGlyph size="xs" />
                        <span>{t('domains.modalRegister.submittingBtn')}</span>
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        <span>{t('domains.modalRegister.submitBtn')}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {modalStage === 'SUBMITTED_AWAITING' && (
              <div className="space-y-6 text-center py-2">
                <div className="w-16 h-16 rounded-full bg-[#E8F7DC] text-[#163300] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-lg font-black text-[#0E0F0C] font-['Outfit']">
                    {t('domains.modalRegister.successTitle')}
                  </h4>
                  <p className="text-xs font-bold text-[#163300] bg-[#E8F7DC] py-1.5 px-3 rounded-full border border-[#9FE870]/40 inline-block">
                    {submittedDomainData?.domain || newDomainInput}
                  </p>
                </div>

                <div className="bg-[#F4F5F0] border border-[#E2E6DF] rounded-2xl p-5 text-left space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0E0F0C] uppercase tracking-wider font-['Outfit']">
                    <Info className="w-4 h-4 text-[#163300]" />
                    {t('domains.modalRegister.whatHappensTitle')}
                  </div>
                  <ul className="text-xs text-[#5E605D] space-y-2 list-disc list-inside">
                    <li>
                      {t('domains.modalRegister.step1')}
                    </li>
                    <li>
                      {t('domains.modalRegister.step2')}
                    </li>
                    <li>
                      {t('domains.modalRegister.step3')}
                    </li>
                  </ul>
                </div>

                <div className="pt-2">
                  <button
                    onClick={closeAddModal}
                    className="w-full py-3 rounded-full bg-[#163300] hover:bg-[#204900] text-[#9FE870] font-black text-xs cursor-pointer shadow-xs transition-all"
                  >
                    {t('domains.modalRegister.understoodBtn')}
                  </button>
                </div>
              </div>
            )}

            {modalStage === 'ERROR' && (
              <div className="space-y-4 text-center py-2">
                <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-base font-black text-[#0E0F0C] font-['Outfit']">{t('domains.modalRegister.errorTitle')}</h4>
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-left max-w-lg mx-auto">
                    <p className="text-xs text-rose-800 leading-relaxed font-medium">
                      {errorMessage || t('domains.modalRegister.errorDefaultMsg')}
                    </p>
                  </div>
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => setModalStage('INPUT')}
                    className="px-5 py-2.5 rounded-full bg-[#163300] text-[#9FE870] font-black text-xs cursor-pointer shadow-xs"
                  >
                    {t('domains.modalRegister.tryAgainBtn')}
                  </button>
                  <button
                    onClick={closeAddModal}
                    className="px-5 py-2.5 rounded-full border border-[#D4DACF] text-[#0E0F0C] hover:bg-[#F4F5F0] font-bold text-xs cursor-pointer"
                  >
                    {t('domains.modalRegister.closeBtn')}
                  </button>
                </div>
              </div>
            )}

            {modalStage === 'QUOTA_EXCEEDED' && (
              <div className="space-y-6 text-center py-2">
                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                  <Globe className="w-8 h-8 stroke-[2.2]" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-xl font-black text-[#0E0F0C] font-['Outfit']">
                    {t('domains.modalRegister.quotaExceededTitle')}
                  </h4>
                  <p className="text-xs text-[#5E605D] max-w-md mx-auto leading-relaxed">
                    {t('domains.modalRegister.quotaExceededDesc', {
                      count: registeredDomainsCount,
                      total: totalAllowedDomains
                    })}
                  </p>
                </div>

                <div className="bg-[#F4F5F0] border border-[#E2E6DF] rounded-2xl p-5 text-left space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0E0F0C] uppercase tracking-wider font-['Outfit']">
                    <Sparkles className="w-4 h-4 text-[#163300]" />
                    {t('domains.modalRegister.howToAddTitle')}
                  </div>
                  <p className="text-xs text-[#5E605D] leading-relaxed">
                    {t('domains.modalRegister.howToAddDesc')}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeAddModal}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-[#D4DACF] text-[#0E0F0C] hover:bg-[#F4F5F0] font-bold text-xs cursor-pointer"
                  >
                    {t('domains.modalRegister.backBtn')}
                  </button>
                  {onNavigateToServices && (
                    <button
                      type="button"
                      onClick={() => {
                        closeAddModal();
                        onNavigateToServices();
                      }}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#163300] hover:bg-[#204900] text-[#9FE870] font-black text-xs cursor-pointer shadow-xs transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-[#9FE870]" />
                      <span>{t('domains.buyAdditionalDomainBtn')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 2: DNS Verification Modal for Client / Superadmin */}
      {activeDnsDomain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0E0F0C]/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full p-4 sm:p-5 shadow-2xl border border-[#E2E6DF] max-h-[88vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#E2E6DF] shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#E8F7DC] text-[#163300] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-[#0E0F0C] font-['Outfit'] truncate">
                    {t('domains.modalDns.title', { domain: activeDnsDomain.domainName })}
                  </h3>
                  <p className="text-[11px] text-[#5E605D] truncate">
                    {t('domains.modalDns.subtitle')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDnsDomain(null)}
                className="text-[#868685] hover:text-[#0E0F0C] p-1.5 rounded-lg hover:bg-[#F4F5F0] cursor-pointer shrink-0 ml-2 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Superadmin Mode Switcher / Banner */}
            {isSuperAdmin && (
              <div className="mt-2.5 bg-[#F4F9F1] border border-[#CDE5C1] rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-2 py-0.5 rounded-md bg-[#163300] text-[#9FE870] font-black text-[10px] uppercase tracking-wider shrink-0">
                    Superadmin
                  </span>
                  <span className="text-[#163300] font-bold text-[11px] sm:text-xs truncate">
                    {isEditMode ? t('domains.modalDns.superAdminBadge') : t('domains.modalDns.superAdminHint')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isEditMode
                      ? 'bg-[#163300] text-[#9FE870] shadow-xs'
                      : 'bg-white border border-[#CDE5C1] text-[#163300] hover:bg-[#E8F7DC]'
                  }`}
                >
                  {isEditMode ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>{t('domains.modalDns.viewDnsBtn')}</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{t('domains.modalDns.editDnsBtn')}</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Success feedback when Superadmin saves */}
            {saveSuccessMsg && (
              <div className="mt-2 bg-[#E8F7DC] border border-[#9FE870]/60 text-[#163300] px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn shrink-0">
                <CheckCircle2 className="w-4 h-4 text-[#163300] shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {/* Scrollable DNS Records Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 my-2.5 space-y-2.5">
              {/* 1. TXT Verification Record */}
              <div className={`rounded-xl p-3 border transition-colors space-y-2 ${
                isEditMode ? 'bg-white border-[#9FE870] ring-1 ring-[#9FE870]/30' : 'bg-[#F8F9F6] border-[#E2E6DF]'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-[#163300] text-[#9FE870] flex items-center justify-center font-bold text-[11px]">
                      1
                    </div>
                    <span className="text-xs font-black text-[#0E0F0C] uppercase tracking-wider font-['Outfit']">
                      {t('domains.modalDns.step1Title')}
                    </span>
                  </div>
                  <span className="text-[10px] font-black bg-[#E8F7DC] text-[#163300] px-2 py-0.5 rounded-full border border-[#9FE870]/40">
                    {t('domains.modalDns.requiredBadge')}
                  </span>
                </div>

                {isEditMode ? (
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-[#868685] uppercase mb-1">
                          {t('domains.modalDns.recordType')}
                        </label>
                        <input
                          type="text"
                          value="TXT"
                          disabled
                          className="w-full bg-[#F4F5F0] border border-[#E2E6DF] rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold text-[#5E605D] cursor-not-allowed"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-[#868685] uppercase mb-1">
                          {t('domains.modalDns.recordHost')}
                        </label>
                        <input
                          type="text"
                          value={editTxtHost}
                          onChange={(e) => setEditTxtHost(e.target.value)}
                          placeholder="@"
                          className="w-full bg-white border border-[#CBD3C5] focus:border-[#163300] focus:ring-1 focus:ring-[#163300] rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold text-[#0E0F0C]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#868685] uppercase mb-1">
                        {t('domains.modalDns.recordValue')} (Token TXT)
                      </label>
                      <textarea
                        rows={2}
                        value={editTxtToken}
                        onChange={(e) => setEditTxtToken(e.target.value)}
                        placeholder="google-site-verification=exemplo-token"
                        className="w-full bg-white border border-[#CBD3C5] focus:border-[#163300] focus:ring-1 focus:ring-[#163300] rounded-lg p-2 font-mono text-xs font-bold text-[#0E0F0C] resize-none"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="bg-white px-2 py-1 rounded-md border border-[#E2E6DF] flex items-center gap-1.5">
                        <span className="text-[#868685] text-[10px] font-bold">{t('domains.modalDns.typeLabel')}:</span>
                        <span className="font-bold font-mono text-[#0E0F0C]">TXT</span>
                      </div>
                      <div className="bg-white px-2 py-1 rounded-md border border-[#E2E6DF] flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="text-[#868685] text-[10px] font-bold shrink-0">{t('domains.modalDns.hostLabel')}:</span>
                        <span className="font-bold font-mono text-[#0E0F0C] truncate">
                          {activeDnsDomain.txtHost || '@'} <span className="font-normal text-[#868685] text-[10px]">({activeDnsDomain.domainName})</span>
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-[#E2E6DF] flex items-center justify-between gap-2">
                      <div className="font-mono text-xs text-[#0E0F0C] break-all select-all font-semibold leading-relaxed min-w-0">
                        {activeDnsDomain.verificationTxtToken ||
                          activeDnsDomain.auditRecord?.token ||
                          'google-site-verification=exemplo-token'}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            activeDnsDomain.verificationTxtToken || activeDnsDomain.auditRecord?.token || 'google-site-verification=exemplo-token',
                            'txt-record-val'
                          )
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#E8F7DC] text-[#163300] hover:bg-[#d8f2c4] border border-[#9FE870]/40 cursor-pointer shrink-0 transition-all"
                      >
                        {copiedKey === 'txt-record-val' ? (
                          <>
                            <Check className="w-3 h-3 text-[#163300]" />
                            <span>{t('domains.modalDns.copiedBtn')}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>{t('domains.modalDns.copyValueBtn')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* 2. Standard MX Record */}
              <div className={`rounded-xl p-3 border transition-colors space-y-2 ${
                isEditMode ? 'bg-white border-[#9FE870] ring-1 ring-[#9FE870]/30' : 'bg-[#F8F9F6] border-[#E2E6DF]'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-[#163300] text-[#9FE870] flex items-center justify-center font-bold text-[11px]">
                      2
                    </div>
                    <span className="text-xs font-black text-[#0E0F0C] uppercase tracking-wider font-['Outfit']">
                      {t('domains.modalDns.step2Title')}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded-full border border-indigo-200">
                    {t('domains.modalDns.emailsBadge')}
                  </span>
                </div>

                {isEditMode ? (
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-[#868685] uppercase mb-1">
                          {t('domains.modalDns.recordType')}
                        </label>
                        <input
                          type="text"
                          value="MX"
                          disabled
                          className="w-full bg-[#F4F5F0] border border-[#E2E6DF] rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold text-[#5E605D] cursor-not-allowed"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-[#868685] uppercase mb-1">
                          {t('domains.modalDns.recordHost')}
                        </label>
                        <input
                          type="text"
                          value={editMxHost}
                          onChange={(e) => setEditMxHost(e.target.value)}
                          placeholder="@"
                          className="w-full bg-white border border-[#CBD3C5] focus:border-[#163300] focus:ring-1 focus:ring-[#163300] rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold text-[#0E0F0C]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#868685] uppercase mb-1">
                          {t('domains.modalDns.recordPriority')}
                        </label>
                        <input
                          type="text"
                          value={editMxPriority}
                          onChange={(e) => setEditMxPriority(e.target.value)}
                          placeholder="1"
                          className="w-full bg-white border border-[#CBD3C5] focus:border-[#163300] focus:ring-1 focus:ring-[#163300] rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold text-[#0E0F0C]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#868685] uppercase mb-1">
                        {t('domains.modalDns.serverLabel')}
                      </label>
                      <input
                        type="text"
                        value={editMxServer}
                        onChange={(e) => setEditMxServer(e.target.value)}
                        placeholder="SMTP.GOOGLE.COM"
                        className="w-full bg-white border border-[#CBD3C5] focus:border-[#163300] focus:ring-1 focus:ring-[#163300] rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold text-[#0E0F0C]"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="bg-white px-2 py-1 rounded-md border border-[#E2E6DF] flex items-center gap-1.5">
                        <span className="text-[#868685] text-[10px] font-bold">{t('domains.modalDns.typeLabel')}:</span>
                        <span className="font-bold font-mono text-[#0E0F0C]">MX</span>
                      </div>
                      <div className="bg-white px-2 py-1 rounded-md border border-[#E2E6DF] flex items-center gap-1.5">
                        <span className="text-[#868685] text-[10px] font-bold">{t('domains.modalDns.hostLabel')}:</span>
                        <span className="font-bold font-mono text-[#0E0F0C]">{activeDnsDomain.mxRecordHost || '@'}</span>
                      </div>
                      <div className="bg-white px-2 py-1 rounded-md border border-[#E2E6DF] flex items-center gap-1.5">
                        <span className="text-[#868685] text-[10px] font-bold">{t('domains.modalDns.priorityLabel')}:</span>
                        <span className="font-bold font-mono text-[#0E0F0C]">{activeDnsDomain.mxRecordPriority || '1'}</span>
                      </div>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-[#E2E6DF] flex items-center justify-between gap-2">
                      <div className="font-mono text-xs text-[#0E0F0C] break-all select-all font-bold min-w-0">
                        {activeDnsDomain.mxRecordServer || 'SMTP.GOOGLE.COM'}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeDnsDomain.mxRecordServer || 'SMTP.GOOGLE.COM', 'mx-record-val')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 cursor-pointer shrink-0 transition-all"
                      >
                        {copiedKey === 'mx-record-val' ? (
                          <>
                            <Check className="w-3 h-3 text-[#163300]" />
                            <span>{t('domains.modalDns.copiedBtn')}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>{t('domains.modalDns.copyServerBtn')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* 3. SPF Record */}
              <div className={`rounded-xl p-3 border transition-colors space-y-2 ${
                isEditMode ? 'bg-white border-[#9FE870] ring-1 ring-[#9FE870]/30' : 'bg-[#F8F9F6] border-[#E2E6DF]'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-[#163300] text-[#9FE870] flex items-center justify-center font-bold text-[11px]">
                      3
                    </div>
                    <span className="text-xs font-black text-[#0E0F0C] uppercase tracking-wider font-['Outfit']">
                      {t('domains.modalDns.step3Title')}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-purple-50 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                    {t('domains.modalDns.recommendedBadge')}
                  </span>
                </div>

                {isEditMode ? (
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-[#868685] uppercase mb-1">
                          {t('domains.modalDns.recordType')}
                        </label>
                        <input
                          type="text"
                          value="TXT"
                          disabled
                          className="w-full bg-[#F4F5F0] border border-[#E2E6DF] rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold text-[#5E605D] cursor-not-allowed"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-[#868685] uppercase mb-1">
                          {t('domains.modalDns.recordHost')}
                        </label>
                        <input
                          type="text"
                          value={editSpfHost}
                          onChange={(e) => setEditSpfHost(e.target.value)}
                          placeholder="@"
                          className="w-full bg-white border border-[#CBD3C5] focus:border-[#163300] focus:ring-1 focus:ring-[#163300] rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold text-[#0E0F0C]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#868685] uppercase mb-1">
                        {t('domains.modalDns.recordValue')} (SPF)
                      </label>
                      <input
                        type="text"
                        value={editSpfValue}
                        onChange={(e) => setEditSpfValue(e.target.value)}
                        placeholder="v=spf1 include:_spf.google.com ~all"
                        className="w-full bg-white border border-[#CBD3C5] focus:border-[#163300] focus:ring-1 focus:ring-[#163300] rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold text-[#0E0F0C]"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="bg-white px-2 py-1 rounded-md border border-[#E2E6DF] flex items-center gap-1.5">
                        <span className="text-[#868685] text-[10px] font-bold">{t('domains.modalDns.typeLabel')}:</span>
                        <span className="font-bold font-mono text-[#0E0F0C]">TXT</span>
                      </div>
                      <div className="bg-white px-2 py-1 rounded-md border border-[#E2E6DF] flex items-center gap-1.5">
                        <span className="text-[#868685] text-[10px] font-bold">{t('domains.modalDns.hostLabel')}:</span>
                        <span className="font-bold font-mono text-[#0E0F0C]">{activeDnsDomain.spfRecordHost || '@'}</span>
                      </div>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-[#E2E6DF] flex items-center justify-between gap-2">
                      <div className="font-mono text-xs text-[#0E0F0C] break-all select-all font-bold min-w-0">
                        {activeDnsDomain.spfRecordValue || 'v=spf1 include:_spf.google.com ~all'}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeDnsDomain.spfRecordValue || 'v=spf1 include:_spf.google.com ~all', 'spf-record-val')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 cursor-pointer shrink-0 transition-all"
                      >
                        {copiedKey === 'spf-record-val' ? (
                          <>
                            <Check className="w-3 h-3 text-[#163300]" />
                            <span>{t('domains.modalDns.copiedBtn')}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>{t('domains.modalDns.copyValueBtn')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* 4. Additional Custom Records (DKIM, CNAME, etc.) */}
              {isEditMode ? (
                <div className="rounded-xl p-3 border border-amber-200 bg-amber-50/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#0E0F0C] uppercase tracking-wider font-['Outfit']">
                      {t('domains.modalDns.customRecordsTitle')}
                    </span>
                    <button
                      type="button"
                      onClick={handleAddCustomRecord}
                      className="px-2.5 py-1 rounded-lg bg-[#163300] hover:bg-[#204900] text-[#9FE870] font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{t('domains.modalDns.addCustomRecord')}</span>
                    </button>
                  </div>

                  {editCustomRecords.length === 0 ? (
                    <p className="text-[11px] text-[#868685] italic">
                      Nenhum registro personalizado adicionado. Use o botão acima para incluir DKIM, CNAME, etc.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {editCustomRecords.map((rec) => (
                        <div key={rec.id} className="bg-white p-2.5 rounded-lg border border-[#E2E6DF] space-y-1.5 text-xs">
                          <div className="grid grid-cols-4 gap-2">
                            <div>
                              <input
                                type="text"
                                value={rec.type}
                                onChange={(e) => handleUpdateCustomRecord(rec.id, 'type', e.target.value.toUpperCase())}
                                placeholder="TXT / CNAME"
                                className="w-full bg-[#F4F5F0] border border-[#CBD3C5] rounded-md px-2 py-1 font-mono text-[11px] font-bold text-[#0E0F0C]"
                              />
                            </div>
                            <div className="col-span-2">
                              <input
                                type="text"
                                value={rec.host}
                                onChange={(e) => handleUpdateCustomRecord(rec.id, 'host', e.target.value)}
                                placeholder="Host (ex: google._domainkey)"
                                className="w-full bg-white border border-[#CBD3C5] rounded-md px-2 py-1 font-mono text-[11px] font-bold text-[#0E0F0C]"
                              />
                            </div>
                            <div className="flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomRecord(rec.id)}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer transition-colors"
                                title={t('domains.modalDns.removeBtn')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div>
                            <input
                              type="text"
                              value={rec.value}
                              onChange={(e) => handleUpdateCustomRecord(rec.id, 'value', e.target.value)}
                              placeholder="Valor / Destino"
                              className="w-full bg-white border border-[#CBD3C5] rounded-md px-2 py-1 font-mono text-[11px] font-semibold text-[#0E0F0C]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tenant Instructions Textarea */}
                  <div className="pt-1">
                    <label className="block text-[10px] font-bold text-[#868685] uppercase mb-1">
                      {t('domains.modalDns.instructionsTitle')}
                    </label>
                    <textarea
                      rows={2}
                      value={editInstructions}
                      onChange={(e) => setEditInstructions(e.target.value)}
                      placeholder={t('domains.modalDns.instructionsPlaceholder')}
                      className="w-full bg-white border border-[#CBD3C5] focus:border-[#163300] focus:ring-1 focus:ring-[#163300] rounded-lg p-2 text-xs text-[#0E0F0C] resize-none"
                    />
                  </div>
                </div>
              ) : (
                <>
                  {activeDnsDomain.customDnsRecords && activeDnsDomain.customDnsRecords.length > 0 && (
                    <div className="rounded-xl p-3 border border-[#E2E6DF] bg-[#F8F9F6] space-y-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-[#163300] text-[#9FE870] flex items-center justify-center font-bold text-[11px]">
                          +
                        </div>
                        <span className="text-xs font-black text-[#0E0F0C] uppercase tracking-wider font-['Outfit']">
                          {t('domains.modalDns.customRecordsTitle')}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {activeDnsDomain.customDnsRecords.map((rec) => (
                          <div key={rec.id} className="bg-white p-2 rounded-lg border border-[#E2E6DF] space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="bg-[#F4F5F0] px-1.5 py-0.5 rounded font-mono font-bold text-[10px] text-[#0E0F0C]">
                                {rec.type}
                              </span>
                              <span className="font-mono text-[#5E605D] text-[11px] truncate flex-1">
                                {rec.host}
                              </span>
                              {rec.description && (
                                <span className="text-[10px] text-[#868685] italic truncate max-w-[120px]">
                                  {rec.description}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between gap-2 pt-0.5">
                              <div className="font-mono text-xs text-[#0E0F0C] break-all select-all font-semibold min-w-0">
                                {rec.value}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopy(rec.value, `custom-rec-${rec.id}`)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#E8F7DC] text-[#163300] hover:bg-[#d8f2c4] border border-[#9FE870]/40 cursor-pointer shrink-0"
                              >
                                {copiedKey === `custom-rec-${rec.id}` ? (
                                  <>
                                    <Check className="w-3 h-3 text-[#163300]" />
                                    <span>{t('domains.modalDns.copiedBtn')}</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>{t('domains.modalDns.copyValueBtn')}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tenant Instructions display */}
                  {activeDnsDomain.dnsInstructions && (
                    <div className="rounded-xl p-2.5 bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <span className="font-bold">{t('domains.modalDns.instructionsTitle')}: </span>
                        <span>{activeDnsDomain.dnsInstructions}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Live DNS Verification Feedback */}
            {verificationFeedback.status && (
              <div
                className={`p-2.5 rounded-xl text-xs space-y-1 mb-2 shrink-0 ${
                  verificationFeedback.status === 'SUCCESS'
                    ? 'bg-[#E8F7DC] border border-[#9FE870]/60 text-[#163300]'
                    : verificationFeedback.status === 'PROPAGATING'
                    ? 'bg-amber-50 border border-amber-200 text-amber-900'
                    : 'bg-rose-50 border border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  {verificationFeedback.status === 'SUCCESS' ? (
                    <CheckCircle2 className="w-4 h-4 text-[#163300] shrink-0" />
                  ) : verificationFeedback.status === 'PROPAGATING' ? (
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span className="truncate">{verificationFeedback.message}</span>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-3 border-t border-[#E2E6DF] shrink-0">
              <div className="flex items-center gap-2">
                {isSuperAdmin && isEditMode ? (
                  <button
                    type="button"
                    disabled={isSavingDns}
                    onClick={handleSaveDns}
                    className="w-full sm:w-auto px-4 py-2 rounded-full bg-[#163300] hover:bg-[#204900] text-[#9FE870] font-black text-xs cursor-pointer shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    {isSavingDns ? (
                      <>
                        <SkooliaTwinOGlyph size="xs" />
                        <span>{t('domains.modalDns.savingDnsBtn')}</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>{t('domains.modalDns.saveDnsBtn')}</span>
                      </>
                    )}
                  </button>
                ) : null}
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveDnsDomain(null)}
                  className="px-4 py-2 rounded-full border border-[#D4DACF] text-[#0E0F0C] hover:bg-[#F4F5F0] font-bold text-xs cursor-pointer whitespace-nowrap shrink-0 text-center"
                >
                  {t('domains.modalDns.closeBtn')}
                </button>

                <button
                  id="verify-dns-propagation-submit-btn"
                  type="button"
                  disabled={isVerifyingDns}
                  onClick={() => handleVerifyDnsPropagation(activeDnsDomain.domainName)}
                  className="px-4 sm:px-5 py-2 rounded-full bg-[#00c868] hover:bg-[#00b05b] text-white font-black text-xs cursor-pointer shadow-xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  {isVerifyingDns ? (
                    <>
                      <SkooliaTwinOGlyph size="xs" />
                      <span>{t('domains.modalDns.verifyingBtn')}</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{t('domains.modalDns.verifyBtn')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {domainToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0E0F0C]/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-[#E2E6DF] space-y-4 text-center max-h-[90dvh] overflow-y-auto">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#0E0F0C] font-['Outfit']">{t('domains.modalDelete.title')}</h3>
              <p className="text-xs text-[#5E605D] mt-1">
                {t('domains.modalDelete.prompt', { domain: domainToDelete.domainName })}
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDomainToDelete(null)}
                className="px-5 py-2.5 rounded-full border border-[#D4DACF] text-[#0E0F0C] font-bold text-xs cursor-pointer hover:bg-[#F4F5F0] whitespace-nowrap shrink-0"
              >
                {t('domains.modalDelete.cancelBtn')}
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs cursor-pointer shadow-xs whitespace-nowrap shrink-0"
              >
                {isDeleting ? t('domains.modalDelete.deletingBtn') : t('domains.modalDelete.confirmBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
