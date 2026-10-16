import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  UserPlus,
  Check,
  Copy,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Globe,
  ShieldCheck,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  WorkspaceUser,
  WorkspaceLicense,
  WorkspaceDomain,
} from '../types';
import { useLanguage } from '../context/LanguageContext';
import { translateWorkspaceError } from '../utils/errorTranslator';
import { normalizeRecoveryPhone } from '../utils/phoneFormatter';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  domains: WorkspaceDomain[];
  onCreateUser: (newUser: WorkspaceUser, sendWelcomeEmail: boolean) => void;
  onNavigateToDomains?: () => void;
  isSuperAdmin?: boolean;
  currentUsersCount?: number;
  licenseLimit?: number;
  onOpenQuoteTicket?: () => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  domains,
  onCreateUser,
  onNavigateToDomains,
  isSuperAdmin = false,
  currentUsersCount,
  licenseLimit = 200,
  onOpenQuoteTicket,
}) => {
  const { t, language } = useLanguage();

  const isLimitReached = !isSuperAdmin && typeof currentUsersCount === 'number' && currentUsersCount >= licenseLimit;

  // Strictly filter to active and verified domains belonging to this tenant
  const verifiedActiveDomains = useMemo(() => {
    return (domains || []).filter((d) => {
      const isVerified = Boolean(d.verified === true || d.state === 'VERIFIED');
      const isNotFailedOrRemoved = d.state !== 'FAILED' && d.state !== 'CONFIG_ERROR' && d.state !== 'REMOVED';
      return isVerified && isNotFailedOrRemoved;
    });
  }, [domains]);

  const hasVerifiedDomains = verifiedActiveDomains.length > 0;

  // Form states
  const [givenName, setGivenName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [emailPrefix, setEmailPrefix] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(
    verifiedActiveDomains[0]?.domainName || ''
  );
  const [secondaryEmail, setSecondaryEmail] = useState('');
  const [recoveryPhone, setRecoveryPhone] = useState('');

  // Password & Security
  const [password, setPassword] = useState('skooliaSecure@2026!');
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(!isSuperAdmin);

  // Suppress welcome email completely if superadmin
  useEffect(() => {
    if (isSuperAdmin) {
      setSendWelcomeEmail(false);
    }
  }, [isSuperAdmin, isOpen]);

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync default selected domain when verified active domains change
  useEffect(() => {
    if (verifiedActiveDomains.length > 0) {
      const currentExists = verifiedActiveDomains.some(
        (d) => d.domainName.toLowerCase() === selectedDomain.toLowerCase()
      );
      if (!currentExists) {
        setSelectedDomain(verifiedActiveDomains[0].domainName);
      }
    } else {
      setSelectedDomain('');
    }
  }, [verifiedActiveDomains, selectedDomain]);

  if (!isOpen) return null;

  const handleNameChange = (first: string, last: string) => {
    setGivenName(first);
    setFamilyName(last);
    if (!emailPrefix || emailPrefix.includes('.')) {
      const cleanFirst = first.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanLast = last.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanFirst && cleanLast) {
        setEmailPrefix(`${cleanFirst}.${cleanLast}`);
      } else if (cleanFirst) {
        setEmailPrefix(cleanFirst);
      }
    }
  };

  const handleGeneratePassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
    let res = 'skoolia#';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isLimitReached) {
      setError(
        'Limite de 200 licenças atingido. Precisa de uma quantidade customizada? Entre em contato com a nossa equipe em help@skoolia.net ou abra um ticket de suporte para receber uma cotação.'
      );
      return;
    }

    if (!hasVerifiedDomains || !selectedDomain) {
      setError(
        'Não é permitida a criação de usuários sem um domínio institucional verificado e ativo para esta organização.'
      );
      return;
    }

    if (!givenName.trim() || !familyName.trim()) {
      setError(t('completeProfile.fillRequired'));
      return;
    }
    if (!emailPrefix.trim()) {
      setError(t('completeProfile.fillRequired'));
      return;
    }

    const domainToUse = selectedDomain.trim().toLowerCase();
    const domainObj = verifiedActiveDomains.find(
      (d) => d.domainName.toLowerCase() === domainToUse
    );

    if (!domainObj) {
      setError('O domínio selecionado não está verificado ou não pertence a esta organização.');
      return;
    }

    const primaryEmail = `${emailPrefix.trim().toLowerCase()}@${domainToUse}`;
    const autoOrgUnitPath = `/${domainToUse}`;

    // Standard license: Google Workspace Fundamentals
    const defaultLicense: WorkspaceLicense = 'Google Workspace Fundamentals';

    const newUser: WorkspaceUser & { password?: string } = {
      id: `usr-${Date.now()}`,
      primaryEmail,
      name: {
        givenName: givenName.trim(),
        familyName: familyName.trim(),
        fullName: `${givenName.trim()} ${familyName.trim()}`,
      },
      aliases: [],
      secondaryEmail: secondaryEmail.trim() || undefined,
      recoveryPhone: normalizeRecoveryPhone(recoveryPhone) || undefined,
      orgUnitPath: autoOrgUnitPath,
      department: '',
      jobTitle: '',
      status: 'ACTIVE',
      role: 'STANDARD_USER',
      licenses: [defaultLicense],
      isEnrolledIn2SV: false,
      isEnforcedIn2SV: false,
      mustChangePasswordAtNextLogin: mustChangePassword,
      storageUsageGb: 0,
      storageLimitGb: 15,
      lastLoginTime: 'Nunca efetuou login',
      creationTime: new Date().toISOString(),
      avatarColor: '#00c868',
      password: password.trim() || undefined,
    } as any;

    onCreateUser(newUser, isSuperAdmin ? false : sendWelcomeEmail);
    onClose();
  };

  // If the organization does not have any active verified domains, do NOT show the form.
  // Instead, show ONLY a modal with the information and step-by-step instructions.
  if (!hasVerifiedDomains) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden">
          {/* Modal Header */}
          <div className="bg-white px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 font-['Outfit'] flex items-center gap-2">
                  <span>{t('modals.createUser.domainRequiredTitle')}</span>
                </h2>
                <p className="text-xs text-slate-500">
                  {t('modals.createUser.domainRequiredSubtitle')}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body: Info + Step-by-step instructions */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
            {/* Context Info Box */}
            <div className="bg-amber-50 border border-amber-200/90 p-4 rounded-2xl flex items-start gap-3.5 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                  {t('modals.createUser.creationBlockedTitle')}
                </h4>
                <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
                  {t('modals.createUser.creationBlockedDesc')}
                </p>
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <span>{t('modals.createUser.instructionsTitle')}</span>
              </h4>

              <div className="space-y-2.5">
                {/* Step 1 */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100/60 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    1
                  </div>
                  <div>
                    <h5 className="text-xs sm:text-sm font-bold text-slate-900">
                      {t('modals.createUser.step1Title')}
                    </h5>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {t('modals.createUser.step1Desc')}
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100/60 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    2
                  </div>
                  <div>
                    <h5 className="text-xs sm:text-sm font-bold text-slate-900">
                      {t('modals.createUser.step2Title')}
                    </h5>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {t('modals.createUser.step2Desc')}
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100/60 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    3
                  </div>
                  <div>
                    <h5 className="text-xs sm:text-sm font-bold text-slate-900">
                      {t('modals.createUser.step3Title')}
                    </h5>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {t('modals.createUser.step3Desc')}
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100/60 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    4
                  </div>
                  <div>
                    <h5 className="text-xs sm:text-sm font-bold text-slate-900">
                      {t('modals.createUser.step4Title')}
                    </h5>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {t('modals.createUser.step4Desc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              {t('modals.createUser.understandClose')}
            </button>
            {onNavigateToDomains && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToDomains();
                }}
                className="px-6 py-2.5 rounded-full bg-[#00c868] hover:bg-[#00b35c] text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-98"
              >
                <Globe className="w-4 h-4" />
                <span>{t('modals.createUser.goToDomains')}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Modal Header */}
        <div className="bg-white px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#00c868]/15 text-[#008a46] flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 font-['Outfit'] flex items-center gap-2">
                <span>{t('modals.createUser.title')}</span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <form id="create-user-form" onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl text-xs sm:text-sm text-red-600 flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{translateWorkspaceError(error, language)}</span>
              </div>
            )}

            {isLimitReached && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-2">
                <div className="flex items-center gap-2 font-black text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    {language === 'en'
                      ? 'License Limit Reached'
                      : language === 'es'
                      ? 'Límite de Licencias Alcanzado'
                      : 'Limite de Licenças Atingido'}
                  </span>
                </div>
                <p className="leading-relaxed">
                  {language === 'en' ? (
                    <>
                      Need a custom quantity? Contact our team at <strong>help@skoolia.net</strong> or open a support ticket to receive a quote.
                    </>
                  ) : language === 'es' ? (
                    <>
                      ¿Necesita una cantidad personalizada? Comuníquese con nuestro equipo en <strong>help@skoolia.net</strong> o abra un ticket de soporte para recibir una cotización.
                    </>
                  ) : (
                    <>
                      Precisa de uma quantidade customizada? Entre em contato com a nossa equipe em <strong>help@skoolia.net</strong> ou abra um ticket de suporte para receber uma cotação.
                    </>
                  )}
                </p>
                {onOpenQuoteTicket && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenQuoteTicket();
                    }}
                    className="mt-1 px-4 py-2 rounded-full bg-[#163300] hover:bg-[#204700] text-[#9FE870] font-black text-xs cursor-pointer transition-all inline-flex items-center gap-1.5"
                  >
                    <span>
                      {language === 'en'
                        ? 'Request Custom License Quote'
                        : language === 'es'
                        ? 'Solicitar Cotización de Licencias Personalizadas'
                        : 'Solicitar Cotação de Licenças Customizadas'}
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* Section 1: Nome & Sobrenome */}
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    {t('modals.createUser.firstName')} <span className="text-[#00c868]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={givenName}
                    onChange={(e) => handleNameChange(e.target.value, familyName)}
                    placeholder={t('modals.createUser.firstNamePlaceholder')}
                    className="w-full bg-slate-50 text-sm text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#00c868] focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    {t('modals.createUser.lastName')} <span className="text-[#00c868]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={familyName}
                    onChange={(e) => handleNameChange(givenName, e.target.value)}
                    placeholder={t('modals.createUser.lastNamePlaceholder')}
                    className="w-full bg-slate-50 text-sm text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#00c868] focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Email Address with Restricted Verified Domain Dropdown */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  {t('modals.createUser.primaryEmail')} <span className="text-[#00c868]">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={emailPrefix}
                    onChange={(e) => setEmailPrefix(e.target.value)}
                    placeholder={t('modals.createUser.emailPrefixPlaceholder')}
                    className="flex-1 bg-slate-50 text-sm text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#00c868] focus:bg-white focus:outline-none font-mono transition-all placeholder:text-slate-400"
                  />
                  <div className="flex items-center gap-1.5 bg-slate-100/90 px-3 py-2.5 rounded-xl border border-slate-200 min-w-48">
                    <span className="text-slate-400 font-mono text-sm font-bold">@</span>
                    <select
                      id="select-user-domain"
                      value={selectedDomain}
                      onChange={(e) => setSelectedDomain(e.target.value)}
                      className="bg-transparent text-xs sm:text-sm font-bold text-[#008a46] focus:outline-none cursor-pointer w-full"
                    >
                      {verifiedActiveDomains.map((d) => (
                        <option
                          key={d.domainName}
                          value={d.domainName}
                          className="bg-white text-slate-900"
                        >
                          {d.domainName} {d.isPrimary ? `(${t('domains.primaryTag')})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {selectedDomain ? (
                  <div className="space-y-1.5 mt-2">
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline shrink-0" />
                      <span>{t('modals.createUser.accountTag')}: </span>
                      <span className="font-bold text-slate-700">
                        {emailPrefix ? `${emailPrefix}@${selectedDomain}` : `usuario@${selectedDomain}`}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 mt-2">
                    <div className="text-[11px] text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 inline shrink-0" />
                      <span>{t('modals.createUser.waitingDomainActivation')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Recovery fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {t('modals.createUser.recoveryEmail')} <span className="text-slate-400 font-normal">({t('common.optional')})</span>
                  </label>
                  <input
                    type="email"
                    disabled={!hasVerifiedDomains}
                    value={secondaryEmail}
                    onChange={(e) => setSecondaryEmail(e.target.value)}
                    placeholder={t('modals.createUser.recoveryEmailPlaceholder')}
                    className="w-full bg-slate-50 disabled:bg-slate-100 text-xs sm:text-sm text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#00c868] focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {t('modals.createUser.recoveryPhone')} <span className="text-slate-400 font-normal">({t('common.optional')})</span>
                  </label>
                  <input
                    type="tel"
                    disabled={!hasVerifiedDomains}
                    value={recoveryPhone}
                    onChange={(e) => setRecoveryPhone(e.target.value)}
                    placeholder={t('modals.createUser.recoveryPhonePlaceholder')}
                    className="w-full bg-slate-50 disabled:bg-slate-100 text-xs sm:text-sm text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#00c868] focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Senha Temporária & Políticas */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                {t('modals.createUser.password')}
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 bg-slate-50 text-xs sm:text-sm text-[#008a46] px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#00c868] focus:outline-none font-mono font-bold"
                />
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                  <span>{t('modals.createUser.refresh')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="px-3 py-2.5 rounded-xl bg-[#00c868]/15 hover:bg-[#00c868]/25 text-xs text-[#008a46] font-bold flex items-center gap-1.5 transition-colors border border-[#00c868]/40 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? t('modals.createUser.copied') : t('modals.createUser.copy')}</span>
                </button>
              </div>

              {/* Toggles */}
              <div className="space-y-2.5 pt-1 text-xs sm:text-sm">
                <label className="flex items-center gap-2.5 text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={mustChangePassword}
                    onChange={(e) => setMustChangePassword(e.target.checked)}
                    className="rounded text-[#00c868] focus:ring-0 w-4 h-4 cursor-pointer accent-[#00c868]"
                  />
                  <span>{t('modals.createUser.requirePasswordChange')}</span>
                </label>

                {isSuperAdmin ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-medium">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      {language === 'en'
                        ? 'Welcome email suppressed (account created by Superadmin).'
                        : language === 'es'
                        ? 'Correo de bienvenida desactivado (cuenta creada por Superadmin).'
                        : 'E-mail de boas-vindas desativado (conta criada pelo Superadmin).'}
                    </span>
                  </div>
                ) : (
                  <label className="flex items-center gap-2.5 text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sendWelcomeEmail}
                      onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                      className="rounded text-[#00c868] focus:ring-0 w-4 h-4 cursor-pointer accent-[#00c868]"
                    />
                    <span>
                      {language === 'en'
                        ? 'Send welcome email with access details'
                        : language === 'es'
                        ? 'Enviar correo de bienvenida con datos de acceso'
                        : 'Enviar e-mail de boas-vindas com dados de acesso'}
                    </span>
                  </label>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer CTA */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            form="create-user-form"
            disabled={isLimitReached}
            className={`px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
              isLimitReached
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-[#00c868] hover:bg-[#00b35c] text-white cursor-pointer active:scale-98'
            }`}
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span className="whitespace-nowrap">{t('modals.createUser.createButton')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
