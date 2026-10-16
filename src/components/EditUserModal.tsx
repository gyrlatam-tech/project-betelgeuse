import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  User,
  KeyRound,
  Mail,
  Plus,
  Trash2,
  Check,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Shield,
  UserX,
  Lock,
  Unlock,
  Save,
  Info,
  Layers,
  Briefcase,
  HardDrive,
  Clock,
  Cloud,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { WorkspaceUser, WorkspaceDomain } from '../types';
import { useLanguage } from '../context/LanguageContext';

export interface EditUserModalProps {
  user: WorkspaceUser | null;
  domains: WorkspaceDomain[];
  isOpen: boolean;
  initialTab?: TabType;
  autoOpenResetPasswordConfirm?: boolean;
  onClose: () => void;
  onSaveUser: (updatedUser: WorkspaceUser & { password?: string }) => void;
  onToggleUserStatus?: (user: WorkspaceUser) => void;
  onResetPassword?: (user: WorkspaceUser, newPass?: string) => void;
  onDeleteUser?: (user: WorkspaceUser) => void;
  onNavigateToServices?: () => void;
}

type TabType = 'info' | 'aliases' | 'storage' | 'security';

const EditUserModalContent: React.FC<{
  user: WorkspaceUser;
  domains: WorkspaceDomain[];
  initialTab?: TabType;
  autoOpenResetPasswordConfirm?: boolean;
  onClose: () => void;
  onSaveUser: (updatedUser: WorkspaceUser & { password?: string }) => void;
  onToggleUserStatus?: (user: WorkspaceUser) => void;
  onResetPassword?: (user: WorkspaceUser, newPass?: string) => void;
  onDeleteUser?: (user: WorkspaceUser) => void;
  onNavigateToServices?: () => void;
}> = ({
  user,
  domains,
  initialTab,
  autoOpenResetPasswordConfirm,
  onClose,
  onSaveUser,
  onToggleUserStatus,
  onResetPassword,
  onDeleteUser,
  onNavigateToServices,
}) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'info');
  const [showResetPasswordConfirm, setShowResetPasswordConfirm] = useState(Boolean(autoOpenResetPasswordConfirm));
  const [isDirectResetMode, setIsDirectResetMode] = useState(Boolean(autoOpenResetPasswordConfirm));

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (autoOpenResetPasswordConfirm) {
      setShowResetPasswordConfirm(true);
      setIsDirectResetMode(true);
    }
  }, [autoOpenResetPasswordConfirm]);

  // Filter strictly to verified domains registered by the tenant
  const verifiedDomains = domains.filter(
    (d) =>
      (d.verified || d.state === 'VERIFIED') &&
      d.state !== 'FAILED' &&
      d.state !== 'REMOVED' &&
      d.state !== 'CONFIG_ERROR'
  );
  const availableDomains = verifiedDomains.length > 0 ? verifiedDomains : domains;

  // Extract initial email parts
  const initialEmailParts = (user.primaryEmail || '').split('@');
  const initialPrefix = initialEmailParts[0] || '';
  const initialDomain = initialEmailParts[1] || availableDomains[0]?.domainName || '';

  // Form states
  const [givenName, setGivenName] = useState(user.name?.givenName || '');
  const [familyName, setFamilyName] = useState(user.name?.familyName || '');
  const [emailPrefix, setEmailPrefix] = useState(initialPrefix);
  const [selectedDomain, setSelectedDomain] = useState(initialDomain);
  const [secondaryEmail, setSecondaryEmail] = useState(user.secondaryEmail || '');
  const [recoveryPhone, setRecoveryPhone] = useState(user.recoveryPhone || '');

  // Additional Workspace properties
  const [department, setDepartment] = useState(user.department || '');
  const [jobTitle, setJobTitle] = useState(user.jobTitle || '');

  // Account Status (ACTIVE or SUSPENDED)
  const [currentStatus, setCurrentStatus] = useState<'ACTIVE' | 'SUSPENDED'>(
    user.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE'
  );
  const [statusLoading, setStatusLoading] = useState(false);

  // Aliases
  const [aliases, setAliases] = useState<string[]>(user.aliases || []);
  const [newAliasPrefix, setNewAliasPrefix] = useState('');

  // Storage Quota state
  const [storageLimitGb, setStorageLimitGb] = useState<number>(user.storageLimitGb || 15);

  // Password & Security Reset states
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [passwordActionSuccess, setPasswordActionSuccess] = useState<string | null>(null);

  // Delete confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setGivenName(user.name?.givenName || '');
    setFamilyName(user.name?.familyName || '');
    const parts = (user.primaryEmail || '').split('@');
    setEmailPrefix(parts[0] || '');
    if (parts[1]) {
      setSelectedDomain(parts[1]);
    }
    setSecondaryEmail(user.secondaryEmail || '');
    setRecoveryPhone(user.recoveryPhone || '');
    setDepartment(user.department || '');
    setJobTitle(user.jobTitle || '');
    setAliases(user.aliases || []);
    setCurrentStatus(user.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE');
    setPasswordActionSuccess(null);

    const initialLimit = typeof user.storageLimitGb === 'number' && user.storageLimitGb > 0 ? user.storageLimitGb : 15;
    setStorageLimitGb(initialLimit);
  }, [user]);

  const handleDomainChange = (newDomain: string) => {
    setSelectedDomain(newDomain);
  };

  const effectiveRecoveryEmail = (
    secondaryEmail ||
    user.secondaryEmail ||
    (user as any).recoveryEmail ||
    ''
  ).trim();

  const handleExecutePasswordReset = async () => {
    if (!effectiveRecoveryEmail) {
      setError(
        t('modals.editUser.resetPasswordNoRecoveryEmailDesc') ||
          'Este usuário não possui um e-mail de recuperação cadastrado. É obrigatório ter um e-mail de recuperação para restaurar a senha.'
      );
      return;
    }

    setResetPasswordLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/users/${encodeURIComponent(user.primaryEmail || user.id)}/reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-app-language': language,
          },
          body: JSON.stringify({
            recoveryEmail: effectiveRecoveryEmail,
            preferredLanguage: language,
            lang: language,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao redefinir senha no Google Workspace');
      }

      if (onResetPassword) {
        onResetPassword(user);
      }

      setShowResetPasswordConfirm(false);
      if (isDirectResetMode) {
        onClose();
        return;
      }

      setPasswordActionSuccess(
        t('modals.editUser.resetPasswordSuccess', { email: effectiveRecoveryEmail }) ||
          `Nova senha temporária de acesso ao Google Workspace gerada e enviada com sucesso para: ${effectiveRecoveryEmail}`
      );
      setTimeout(() => setPasswordActionSuccess(null), 8000);
    } catch (err: any) {
      setError(`${t('common.error') || 'Erro'}: ${err?.message}`);
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setStatusLoading(true);
    try {
      if (onToggleUserStatus) {
        onToggleUserStatus(user);
      } else {
        await fetch(`/api/users/${encodeURIComponent(user.primaryEmail || user.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus }),
        });
      }
      setCurrentStatus(nextStatus);
    } catch (err: any) {
      setError(`Erro ao alterar status: ${err?.message}`);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAddAlias = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAliasPrefix.trim()) return;
    const domainForAlias = selectedDomain || availableDomains[0]?.domainName || 'instituicao.edu.br';
    const fullAlias = `${newAliasPrefix.trim().toLowerCase()}@${domainForAlias}`;
    if (!aliases.includes(fullAlias)) {
      setAliases([...aliases, fullAlias]);
      setNewAliasPrefix('');
    }
  };

  const handleRemoveAlias = (aliasToRemove: string) => {
    setAliases(aliases.filter((a) => a !== aliasToRemove));
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (onDeleteUser) {
        onDeleteUser(user);
      } else {
        await fetch(`/api/users/${encodeURIComponent(user.primaryEmail || user.id)}`, {
          method: 'DELETE',
        });
      }
      setShowDeleteConfirm(false);
      onClose();
    } catch (err: any) {
      setError(`Erro ao excluir usuário: ${err?.message}`);
      setIsDeleting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!givenName.trim() || !familyName.trim()) {
      setError(
        t('modals.editUser.validationNameRequired') ||
          t('modals.createUser.enterFirstAndLastName') ||
          'Por favor, informe o Nome e Sobrenome da conta.'
      );
      return;
    }
    if (!emailPrefix.trim()) {
      setError(
        t('modals.editUser.validationEmailRequired') ||
          t('modals.createUser.enterEmail') ||
          'Por favor, defina o endereço de e-mail Workspace do usuário.'
      );
      return;
    }

    const domainToUse = selectedDomain || availableDomains[0]?.domainName || 'instituicao.edu.br';
    const updatedPrimaryEmail = `${emailPrefix.trim().toLowerCase()}@${domainToUse}`;

    const updatedUser: WorkspaceUser & { password?: string } = {
      ...user,
      primaryEmail: updatedPrimaryEmail,
      name: {
        givenName: givenName.trim(),
        familyName: familyName.trim(),
        fullName: `${givenName.trim()} ${familyName.trim()}`,
      },
      secondaryEmail: secondaryEmail.trim() || undefined,
      recoveryPhone: recoveryPhone.trim() || undefined,
      orgUnitPath: user.orgUnitPath || '/',
      department: department.trim(),
      jobTitle: jobTitle.trim(),
      status: currentStatus,
      mustChangePasswordAtNextLogin: user.mustChangePasswordAtNextLogin,
      aliases,
      storageLimitGb,
    };

    onSaveUser(updatedUser);
    onClose();
  };

  const userInitials = `${user.name.givenName?.[0] || ''}${user.name.familyName?.[0] || ''}`.toUpperCase() || 'U';

  const renderResetPasswordModal = () => (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 space-y-5">
        {!effectiveRecoveryEmail ? (
          // CASE 1: NO RECOVERY EMAIL - BLOCKED
          <>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 font-['Outfit']">
                {t('modals.editUser.resetPasswordNoRecoveryEmailTitle')}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                {t('modals.editUser.resetPasswordNoRecoveryEmailDesc')}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1.5 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5 text-amber-950">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{t('modals.editUser.resetPasswordNoRecoveryHowTo')}</span>
              </p>
              <p className="text-slate-600">
                {t('modals.editUser.resetPasswordNoRecoveryInstructions')}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (isDirectResetMode) {
                    onClose();
                  } else {
                    setShowResetPasswordConfirm(false);
                  }
                }}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDirectResetMode(false);
                  setShowResetPasswordConfirm(false);
                  setActiveTab('info');
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                <span>{t('modals.editUser.resetPasswordGoToInfo')}</span>
              </button>
            </div>
          </>
        ) : (
          // CASE 2: RECOVERY EMAIL EXISTS - PROCEED WITH EXPLANATION
          <>
            <div className="w-12 h-12 rounded-2xl bg-[#00c868]/15 text-[#008a46] flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base sm:text-lg font-black text-slate-900 font-['Outfit']">
                {t('modals.editUser.resetPasswordPopupTitle')}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                {t('modals.editUser.resetPasswordPopupDesc')}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-200/70">
                  <span className="text-slate-500 font-medium">
                    {t('modals.editUser.resetPasswordWorkspaceAccount')}:
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {emailPrefix}@{selectedDomain}
                  </span>
                </div>
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    {t('modals.editUser.resetPasswordRecoveryDestination')}:
                  </span>
                  <div className="flex items-center gap-2 p-2.5 bg-white border border-emerald-200 rounded-xl">
                    <Mail className="w-4 h-4 text-[#008a46] shrink-0" />
                    <span className="font-mono text-xs font-bold text-slate-900 break-all select-all">
                      {effectiveRecoveryEmail}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-1.5 text-xs text-emerald-900 leading-relaxed">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    {t('modals.editUser.resetPasswordMustChangeNotice')}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    {t('modals.editUser.resetPasswordAdminPrivacyNotice')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (isDirectResetMode) {
                    onClose();
                  } else {
                    setShowResetPasswordConfirm(false);
                  }
                }}
                disabled={resetPasswordLoading}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleExecutePasswordReset}
                disabled={resetPasswordLoading}
                className="px-5 py-2.5 rounded-xl bg-[#00c868] hover:bg-[#00b35c] text-white text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {resetPasswordLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <KeyRound className="w-4 h-4" />
                )}
                <span>
                  {resetPasswordLoading
                    ? t('modals.editUser.resetPasswordSending')
                    : t('modals.editUser.resetPasswordConfirmBtn')}
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  if (isDirectResetMode) {
    return showResetPasswordConfirm ? renderResetPasswordModal() : null;
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl h-[92vh] max-h-[920px] flex flex-col shadow-2xl relative overflow-hidden">
          {/* Modal Header */}
          <div className="bg-white px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-[#00c868]/15 text-[#008a46] font-bold text-base flex items-center justify-center font-['Outfit'] border border-[#00c868]/20">
                  {userInitials}
                </div>
                <span
                  className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                    currentStatus === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 font-['Outfit']">
                    {user.name.fullName || t('modals.editUser.title')}
                  </h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                      currentStatus === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {currentStatus === 'ACTIVE'
                      ? t('modals.editUser.statusActive') || 'Ativo'
                      : t('modals.editUser.statusSuspended') || 'Suspenso'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{user.primaryEmail}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              title={t('common.close') || 'Fechar'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 sm:px-8 bg-slate-50/80 border-b border-slate-200/80 flex items-center gap-2 shrink-0 overflow-x-auto custom-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`py-3.5 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'info'
                  ? 'border-[#00c868] text-[#008a46] bg-white rounded-t-xl shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{t('modals.editUser.tabInfo') || 'Informações'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('aliases')}
              className={`py-3.5 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'aliases'
                  ? 'border-[#00c868] text-[#008a46] bg-white rounded-t-xl shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>{t('modals.editUser.tabAliases') || 'Aliases'}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-extrabold font-mono">
                {aliases.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('storage')}
              className={`py-3.5 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'storage'
                  ? 'border-[#00c868] text-[#008a46] bg-white rounded-t-xl shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span>{t('modals.editUser.tabStorage') || 'Armazenamento'}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold font-mono">
                {user.storageUsageGb === 0
                  ? '0 GB'
                  : user.storageUsageGb < 1
                  ? `${Math.round(user.storageUsageGb * 1024)} MB`
                  : `${user.storageUsageGb.toFixed(2)} GB`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`py-3.5 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'security'
                  ? 'border-[#00c868] text-[#008a46] bg-white rounded-t-xl shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>{t('modals.editUser.tabSecurity') || 'Segurança'}</span>
              {currentStatus === 'SUSPENDED' && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 bg-white">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-2xl text-xs sm:text-sm text-red-600 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {passwordActionSuccess && (
              <div className="mb-6 bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs sm:text-sm text-emerald-700 flex items-center gap-3 animate-in fade-in">
                <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-semibold">{passwordActionSuccess}</span>
              </div>
            )}

            {/* TAB 1: INFORMAÇÕES */}
            {activeTab === 'info' && (
              <form id="edit-user-form" onSubmit={handleSave} className="space-y-6 max-w-3xl mx-auto w-full">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#008a46]" />
                    <span>{t('modals.editUser.personalData') || 'Dados Pessoais & Nome'}</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        {t('modals.editUser.firstName') || 'Nome'} <span className="text-[#00c868]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={givenName}
                        onChange={(e) => setGivenName(e.target.value)}
                        placeholder={t('modals.editUser.firstNamePlaceholder') || 'Ex: Gabriela'}
                        className="w-full bg-slate-50 text-sm text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:border-[#00c868] focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        {t('modals.editUser.lastName') || 'Sobrenome'} <span className="text-[#00c868]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={familyName}
                        onChange={(e) => setFamilyName(e.target.value)}
                        placeholder={t('modals.editUser.lastNamePlaceholder') || 'Ex: Ferreira'}
                        className="w-full bg-slate-50 text-sm text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:border-[#00c868] focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#008a46]" />
                    <span>{t('modals.editUser.primaryEmail') || 'Endereço de E-mail Principal'}</span>
                  </h3>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      required
                      value={emailPrefix}
                      onChange={(e) => setEmailPrefix(e.target.value)}
                      placeholder={t('modals.editUser.emailPrefixPlaceholder') || 'prefixo'}
                      className="flex-1 bg-slate-50 text-sm text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:border-[#00c868] focus:bg-white focus:outline-none font-mono font-medium transition-all placeholder:text-slate-400"
                    />
                    <div className="flex items-center gap-1.5 bg-slate-100 px-3.5 py-3 rounded-xl border border-slate-200 min-w-56">
                      <span className="text-slate-400 font-mono text-sm font-bold">@</span>
                      {availableDomains.length > 0 ? (
                        <select
                          value={selectedDomain}
                          onChange={(e) => handleDomainChange(e.target.value)}
                          className="bg-transparent text-xs sm:text-sm font-bold text-[#008a46] focus:outline-none cursor-pointer w-full"
                        >
                          {availableDomains.map((d) => (
                            <option key={d.domainName} value={d.domainName} className="bg-white text-slate-900">
                              {d.domainName} {d.isPrimary ? `(${t('domains.primaryTag') || 'Principal'})` : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-1 text-rose-600 text-xs font-semibold select-none w-full">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{t('modals.editUser.noVerifiedDomain') || 'Sem domínio'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#008a46]" />
                    <span>{t('modals.editUser.jobAndOrg') || 'Função & Organização'}</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        {t('modals.editUser.jobTitle') || 'Cargo / Função'}
                      </label>
                      <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder={t('modals.editUser.jobTitlePlaceholder') || 'Ex: Professor de Matemática'}
                        className="w-full bg-slate-50 text-sm text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:border-[#00c868] focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        {t('modals.editUser.department') || 'Departamento'}
                      </label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder={t('modals.editUser.departmentPlaceholder') || 'Ex: Ensino Fundamental II'}
                        className="w-full bg-slate-50 text-sm text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:border-[#00c868] focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#008a46]" />
                    <span>{t('modals.editUser.recoveryContacts') || 'Contatos de Recuperação'}</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        {t('modals.editUser.recoveryEmail') || 'E-mail de Recuperação'}{' '}
                        <span className="text-slate-400 font-normal">({t('common.optional') || 'Opcional'})</span>
                      </label>
                      <input
                        type="email"
                        value={secondaryEmail}
                        onChange={(e) => setSecondaryEmail(e.target.value)}
                        placeholder={t('modals.editUser.recoveryEmailPlaceholder') || 'pessoal@gmail.com'}
                        className="w-full bg-slate-50 text-sm text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:border-[#00c868] focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        {t('modals.editUser.recoveryPhone') || 'Telefone de Recuperação'}{' '}
                        <span className="text-slate-400 font-normal">({t('common.optional') || 'Opcional'})</span>
                      </label>
                      <input
                        type="tel"
                        value={recoveryPhone}
                        onChange={(e) => setRecoveryPhone(e.target.value)}
                        placeholder={t('modals.editUser.recoveryPhonePlaceholder') || '+55 11 99999-0000'}
                        className="w-full bg-slate-50 text-sm text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:border-[#00c868] focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 2: ALIASES */}
            {activeTab === 'aliases' && (
              <div className="space-y-6 max-w-3xl mx-auto w-full">
                <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-emerald-950">
                      {t('modals.editUser.aliasesWhatAreTitle') || 'O que são Aliases no Google Workspace?'}
                    </h4>
                    <p className="text-xs text-emerald-800/90 mt-1 leading-relaxed">
                      {t('modals.editUser.aliasesWhatAreDesc') ||
                        'Apelidos de e-mail permitem que este usuário receba mensagens enviadas para múltiplos endereços diretamente em sua caixa de entrada principal, sem necessidade de licenças adicionais.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    {t('modals.editUser.addAlias') || 'Adicionar Novo Apelido (Alias)'}
                  </label>
                  <form onSubmit={handleAddAlias} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      value={newAliasPrefix}
                      onChange={(e) => setNewAliasPrefix(e.target.value)}
                      placeholder={t('modals.editUser.newAliasPlaceholder') || 'novo.apelido'}
                      className="flex-1 bg-slate-50 text-sm text-slate-900 px-4 py-3 rounded-xl border border-slate-200 focus:border-[#00c868] focus:bg-white focus:outline-none font-mono placeholder:text-slate-400"
                    />
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-4 py-3 rounded-xl border border-slate-200 text-center sm:text-left">
                      @{selectedDomain || availableDomains[0]?.domainName || 'dominio.com'}
                    </span>
                    <button
                      type="submit"
                      disabled={!newAliasPrefix.trim()}
                      className="px-5 py-3 bg-[#00c868] hover:bg-[#00b35c] disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>{t('modals.editUser.addAlias') || 'Adicionar'}</span>
                    </button>
                  </form>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {t('modals.editUser.aliasesListTitle', { count: aliases.length }) || `Aliases Configurados (${aliases.length})`}
                    </span>
                  </div>

                  {aliases.length === 0 ? (
                    <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center">
                      <Mail className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-medium text-slate-500">
                        {t('modals.editUser.noAliasesFound') || 'Nenhum alias configurado para esta conta.'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {t('modals.editUser.aliasesEmptyDesc') ||
                          'Utilize o campo acima para adicionar endereços adicionais vinculados a este usuário.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {aliases.map((alias) => (
                        <div
                          key={alias}
                          className="flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 p-3.5 rounded-2xl border border-slate-200 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                              <Mail className="w-3.5 h-3.5 text-[#008a46]" />
                            </div>
                            <span className="font-mono text-xs font-semibold text-slate-800 truncate">
                              {alias}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAlias(alias)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0 ml-2"
                            title={t('modals.editUser.removeAliasTooltip') || 'Remover Alias'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: STORAGE (ARMAZENAMENTO) */}
            {activeTab === 'storage' && (
              <div className="space-y-6 max-w-3xl mx-auto w-full animate-in fade-in duration-200">
                {/* 1. Alerta de Latência da Sincronização do Google Workspace (até 48h) */}
                <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-xs">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-5 h-5 text-amber-700" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-2">
                      <span>{t('modals.editUser.storageDelayNoticeTitle') || 'Atualizações não são imediatas (podem levar até 48 horas)'}</span>
                    </h4>
                    <p className="text-xs text-amber-900/90 leading-relaxed">
                      {t('modals.editUser.storageDelayNoticeDesc') ||
                        'Os relatórios de armazenamento do Google Admin operam de forma assíncrona. Dados de upload, exclusão de arquivos ou esvaziamento de lixeira podem demorar de 24 a 48 horas para serem computados e refletidos nesta interface.'}
                    </p>
                    <div className="pt-1 flex items-center gap-2 text-[11px] text-amber-800 font-medium">
                      <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{t('modals.editUser.storageTrashNotice') || 'Dica: Arquivos excluídos continuam consumindo cota até que a lixeira do Google Drive e do Gmail seja definitivamente esvaziada.'}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Cartão Principal de Consumo e Status */}
                {(() => {
                  const usageGb = typeof user.storageUsageGb === 'number' ? user.storageUsageGb : 0;
                  const driveGb = typeof user.driveUsageGb === 'number' ? user.driveUsageGb : 0;
                  const gmailGb = typeof user.gmailUsageGb === 'number' ? user.gmailUsageGb : 0;
                  const photosGb = typeof user.photosUsageGb === 'number' ? user.photosUsageGb : 0;
                  const limitGb = storageLimitGb > 0 ? storageLimitGb : 15;
                  const percent = limitGb > 0 ? Math.min(100, Math.round((usageGb / limitGb) * 100)) : 0;

                  const isCritical = percent >= 95;
                  const isWarning = percent >= 80 && percent < 95;

                  const statusColor = isCritical
                    ? 'bg-red-100 text-red-800 border-red-200'
                    : isWarning
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-emerald-100 text-[#008a46] border-emerald-200';

                  const statusText = isCritical
                    ? (t('modals.editUser.storageStatusCritical') || 'Crítico (Cota Quase Esgotada)')
                    : isWarning
                    ? (t('modals.editUser.storageStatusWarning') || 'Atenção (Consumo Elevado)')
                    : (t('modals.editUser.storageStatusNormal') || 'Normal (Dentro do Limite)');

                  const barColor = isCritical
                    ? 'bg-red-500'
                    : isWarning
                    ? 'bg-amber-500'
                    : 'bg-[#00c868]';

                  const formattedUsed = usageGb === 0
                    ? '0.00 GB'
                    : usageGb < 0.01
                    ? `${(usageGb * 1024).toFixed(0)} MB`
                    : `${usageGb.toFixed(2)} GB`;

                  const formattedLimit = limitGb >= 1000
                    ? `${Number((limitGb >= 1024 ? limitGb / 1024 : limitGb / 1000).toFixed(1))} TB`
                    : `${limitGb} GB`;

                  const freeGb = Math.max(0, limitGb - usageGb);
                  const formattedFree = freeGb >= 1000
                    ? `${Number((freeGb >= 1024 ? freeGb / 1024 : freeGb / 1000).toFixed(1))} TB`
                    : `${freeGb.toFixed(2)} GB`;

                  return (
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-7 space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-[#00c868]/15 text-[#008a46] flex items-center justify-center shrink-0">
                            <HardDrive className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 font-['Outfit']">
                              {t('modals.editUser.storageTitle') || 'Armazenamento Google Workspace'}
                            </h3>
                            <p className="text-xs text-slate-500">
                              {t('modals.editUser.storageSubtitle') || 'Monitore o consumo consolidado entre Google Drive, Gmail e Google Fotos.'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${statusColor}`}>
                            <span className={`w-2 h-2 rounded-full ${isCritical ? 'bg-red-600' : isWarning ? 'bg-amber-600' : 'bg-[#008a46]'}`} />
                            {statusText}
                          </span>
                        </div>
                      </div>

                      {/* Display Numérico e Barra de Progresso */}
                      <div className="space-y-3">
                        <div className="flex items-baseline justify-between gap-2 flex-wrap">
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                              {t('modals.editUser.storageConsumedLabel') || 'Espaço Consumido'}
                            </span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                                {formattedUsed}
                              </span>
                              <span className="text-xs font-semibold text-slate-400">
                                / {formattedLimit}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs font-mono">
                              {t('modals.editUser.storagePercentageLabel', { percent }) || `${percent}% da cota utilizada`}
                            </span>
                          </div>
                        </div>

                        {/* Barra de Progresso */}
                        <div className="w-full h-3 bg-slate-200/80 rounded-full overflow-hidden p-0.5">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                            style={{ width: `${Math.max(2, Math.min(100, percent))}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 font-mono">
                          <span>0 GB</span>
                          <span className="font-sans font-medium text-slate-600">
                            {t('modals.editUser.storageEstimatedFree') || 'Espaço livre estimado:'}{' '}
                            <strong className="font-mono text-slate-900">{formattedFree}</strong>
                          </span>
                          <span>{formattedLimit}</span>
                        </div>
                      </div>

                      {/* Informações Complementares da Cota */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 flex items-center justify-between">
                          <span className="text-xs text-slate-500 font-medium">{t('modals.editUser.storageQuotaStatus') || 'Status da Cota'}:</span>
                          <span className="text-xs font-bold text-slate-800 font-mono">
                            {statusText}
                          </span>
                        </div>
                        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 flex items-center justify-between">
                          <span className="text-xs text-slate-500 font-medium">{t('modals.editUser.storageLimitLabel') || 'Limite Individual'}:</span>
                          <span className="text-xs font-bold text-slate-800 font-mono">
                            {formattedLimit}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 3. Detalhamento Real dos Serviços Unificados do Workspace */}
                {(() => {
                  const usageGb = typeof user.storageUsageGb === 'number' ? user.storageUsageGb : 0;
                  const driveGb = typeof user.driveUsageGb === 'number' ? user.driveUsageGb : 0;
                  const gmailGb = typeof user.gmailUsageGb === 'number' ? user.gmailUsageGb : 0;
                  const photosGb = typeof user.photosUsageGb === 'number' ? user.photosUsageGb : 0;

                  const drivePct = usageGb > 0 ? Math.round((driveGb / usageGb) * 100) : 0;
                  const gmailPct = usageGb > 0 ? Math.round((gmailGb / usageGb) * 100) : 0;
                  const photosPct = usageGb > 0 ? Math.round((photosGb / usageGb) * 100) : 0;

                  const formatSub = (gb: number) => {
                    if (gb === 0) return '0 MB';
                    if (gb < 1) return `${Math.round(gb * 1024)} MB`;
                    return `${gb.toFixed(2)} GB`;
                  };

                  return (
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          {t('modals.editUser.storageIncludedServices') || 'Serviços Compartilhados do Google Workspace'}
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {t('modals.editUser.storageSubBreakdownDesc') || 'Consumo individual consolidado por serviço:'}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        {/* Google Drive */}
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                              <HardDrive className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-black font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200/60">
                              {formatSub(driveGb)}
                            </span>
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-slate-900">
                              {t('modals.editUser.storageServiceDrive') || 'Google Drive'}
                            </h5>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                              {t('modals.editUser.storageServiceDriveDesc') || 'Documentos, planilhas, arquivos pessoais e pastas.'}
                            </p>
                          </div>
                          <div className="text-[10px] font-bold font-mono text-slate-400">
                            {t('modals.editUser.storagePercentOfTotal', { percent: drivePct }) || `${drivePct}% do espaço total utilizado`}
                          </div>
                        </div>

                        {/* Gmail */}
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                              <Mail className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-black font-mono text-red-700 bg-red-50 px-2 py-0.5 rounded-lg border border-red-200/60">
                              {formatSub(gmailGb)}
                            </span>
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-slate-900">
                              {t('modals.editUser.storageServiceGmail') || 'Gmail'}
                            </h5>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                              {t('modals.editUser.storageServiceGmailDesc') || 'Mensagens, anexos de e-mail e itens arquivados.'}
                            </p>
                          </div>
                          <div className="text-[10px] font-bold font-mono text-slate-400">
                            {t('modals.editUser.storagePercentOfTotal', { percent: gmailPct }) || `${gmailPct}% do espaço total utilizado`}
                          </div>
                        </div>

                        {/* Google Fotos */}
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#008a46] flex items-center justify-center">
                              <Cloud className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-black font-mono text-[#008a46] bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/60">
                              {formatSub(photosGb)}
                            </span>
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-slate-900">
                              {t('modals.editUser.storageServicePhotos') || 'Google Fotos'}
                            </h5>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                              {t('modals.editUser.storageServicePhotosDesc') || 'Fotos e vídeos salvos na nuvem institucional.'}
                            </p>
                          </div>
                          <div className="text-[10px] font-bold font-mono text-slate-400">
                            {t('modals.editUser.storagePercentOfTotal', { percent: photosPct }) || `${photosPct}% do espaço total utilizado`}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 4. Card: Precisa de mais armazenamento? */}
                <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-sm">
                  <div className="space-y-2 max-w-xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00c868]/20 border border-[#00c868]/30 text-[#00c868] text-xs font-bold uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t('modals.editUser.needMoreStorageTitle') || 'Precisa de mais armazenamento?'}</span>
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-white font-['Outfit']">
                      {t('modals.editUser.needMoreStorageTitle') || 'Precisa de mais armazenamento?'}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {t('modals.editUser.needMoreStorageDesc') || 'Você pode solicitar cotas adicionais de armazenamento, pacotes de expansão em nuvem ou fazer upgrade de licenças para sua instituição.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToServices?.();
                    }}
                    className="shrink-0 px-5 py-3 rounded-full bg-[#00c868] hover:bg-[#00b05b] text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer group"
                  >
                    <span>{t('modals.editUser.needMoreStorageAction') || 'Ver Serviços Adicionais'}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: SEGURANÇA */}
            {activeTab === 'security' && (
              <div className="space-y-6 max-w-3xl mx-auto w-full">
                {/* 1. Status da Conta (Ativação / Suspensão) */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                          currentStatus === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {currentStatus === 'ACTIVE' ? (
                          <Unlock className="w-5 h-5" />
                        ) : (
                          <Lock className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">
                            {t('modals.editUser.accessStatusTitle') || 'Status do Acesso Google Workspace'}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold ${
                              currentStatus === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {currentStatus === 'ACTIVE'
                              ? (t('modals.editUser.statusActive') || 'ATIVO').toUpperCase()
                              : (t('modals.editUser.statusSuspended') || 'SUSPENSO').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {currentStatus === 'ACTIVE'
                            ? t('modals.editUser.statusActiveDesc') ||
                              'Usuário com acesso regular ao Gmail, Drive, Classroom e Meet.'
                            : t('modals.editUser.statusSuspendedDesc') ||
                              'Acesso suspenso. O usuário não consegue fazer login no Google Workspace.'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleStatus}
                      disabled={statusLoading}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-xs active:scale-95 ${
                        currentStatus === 'ACTIVE'
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {currentStatus === 'ACTIVE' ? (
                        <>
                          <UserX className="w-4 h-4 text-amber-700" />
                          <span>{t('modals.editUser.suspendUser') || 'Suspender Conta'}</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4 text-white" />
                          <span>{t('modals.editUser.reactivateUser') || 'Reativar Conta'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 2. Redefinição de Senha */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#00c868]/15 text-[#008a46] flex items-center justify-center shrink-0 mt-0.5">
                        <KeyRound className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-900">
                          {t('modals.editUser.passwordResetTitle') || 'Redefinição de Senha de Acesso'}
                        </h4>
                        <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                          {t('modals.editUser.resetPasswordSubtitle') ||
                            'Gera uma nova credencial temporária para a conta Google Workspace e envia diretamente para o e-mail de recuperação cadastrado.'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowResetPasswordConfirm(true)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#00c868] hover:bg-[#00b35c] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>{t('modals.editUser.resetPasswordBtn') || 'Restaurar Senha'}</span>
                    </button>
                  </div>

                  {passwordActionSuccess && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 font-medium animate-in fade-in">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{passwordActionSuccess}</span>
                    </div>
                  )}
                </div>

                {/* 3. Zona de Perigo - Exclusão de Conta com Confirmação */}
                <div className="border border-red-200 bg-red-50/50 rounded-2xl p-5 sm:p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-red-950">
                        {t('modals.editUser.dangerZone') || 'Zona de Perigo'}
                      </h4>
                      <p className="text-xs text-red-800/90 leading-relaxed">
                        {t('modals.editUser.deleteUserDesc') ||
                          'A exclusão removerá permanentemente esta conta do Google Workspace, incluindo e-mails do Gmail e arquivos do Drive. Esta ação não pode ser desfeita.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteConfirmInput('');
                        setShowDeleteConfirm(true);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{t('modals.editUser.deleteUser') || 'Excluir Usuário do Workspace'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="bg-slate-50 px-6 sm:px-8 py-4 border-t border-slate-100 flex items-center justify-between shrink-0">
            <div className="text-xs text-slate-400 font-medium hidden sm:block">
              {activeTab === 'info' && (t('modals.editUser.footerInfoHint') || 'Campos com * são obrigatórios para sincronização')}
              {activeTab === 'aliases' && (t('modals.editUser.footerAliasesHint') || 'Aliases são vinculados instantaneamente no Google Workspace')}
              {activeTab === 'storage' && (t('modals.editUser.footerStorageHint') || 'Métricas consolidadas de armazenamento do Google Workspace')}
              {activeTab === 'security' && (t('modals.editUser.footerSecurityHint') || 'Ações de segurança têm efeito imediato no domínio')}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {t('common.cancel') || 'Cancelar'}
              </button>
              <button
                type="submit"
                form="edit-user-form"
                onClick={(e) => {
                  if (activeTab !== 'info') {
                    // Trigger save programmatically if on other tabs
                    handleSave(e);
                  }
                }}
                className="px-6 py-2.5 rounded-full bg-[#00c868] hover:bg-[#00b35c] text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer flex items-center gap-2 active:scale-98 whitespace-nowrap shrink-0"
              >
                <Save className="w-4 h-4 stroke-[2.5]" />
                <span className="whitespace-nowrap">{t('modals.editUser.saveUser') || 'Salvar Alterações'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Security Confirmation Modal for Deletion */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-red-100 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base sm:text-lg font-black text-slate-900 font-['Outfit']">
                {t('modals.editUser.deleteConfirmTitle') || 'Excluir Conta Permanentemente?'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('modals.editUser.deleteConfirmWarning') ||
                  'Atenção: Esta ação é definitiva e irreversível. Todos os dados, e-mails e arquivos vinculados a esta conta no Google Workspace serão permanentemente apagados.'}
              </p>
            </div>

            <div className="bg-red-50/80 border border-red-200/80 rounded-2xl p-3.5 space-y-2">
              <p className="text-xs text-red-900 font-medium">
                {t('modals.editUser.deleteConfirmPrompt') || 'Para confirmar, digite o e-mail exato do usuário:'}
              </p>
              <p className="font-mono text-xs font-bold text-red-700 bg-white px-3 py-1.5 rounded-lg border border-red-200 truncate select-all">
                {user.primaryEmail}
              </p>
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                placeholder={user.primaryEmail}
                className="w-full bg-white text-xs sm:text-sm font-mono px-3.5 py-2 rounded-xl border border-red-300 focus:border-red-500 focus:outline-none placeholder:text-slate-400"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {t('common.cancel') || 'Cancelar'}
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteConfirmInput.trim() !== user.primaryEmail?.trim() || isDeleting}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 whitespace-nowrap shrink-0"
              >
                {isDeleting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span className="whitespace-nowrap">{t('modals.editUser.deleteConfirmBtn') || 'Sim, Excluir Definitivamente'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Confirmation Modal for Workspace Password Reset */}
      {showResetPasswordConfirm && renderResetPasswordModal()}
    </>
  );
};

export const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  domains,
  isOpen,
  initialTab,
  autoOpenResetPasswordConfirm,
  onClose,
  onSaveUser,
  onToggleUserStatus,
  onResetPassword,
  onDeleteUser,
  onNavigateToServices,
}) => {
  if (!isOpen || !user) return null;

  return (
    <EditUserModalContent
      key={user.id + (user.primaryEmail || '')}
      user={user}
      domains={domains}
      initialTab={initialTab}
      autoOpenResetPasswordConfirm={autoOpenResetPasswordConfirm}
      onClose={onClose}
      onSaveUser={onSaveUser}
      onToggleUserStatus={onToggleUserStatus}
      onResetPassword={onResetPassword}
      onDeleteUser={onDeleteUser}
      onNavigateToServices={onNavigateToServices}
    />
  );
};
