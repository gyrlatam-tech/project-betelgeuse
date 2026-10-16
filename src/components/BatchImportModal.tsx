import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Users,
  Lock,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  Globe,
  Check,
  Ban,
  Key,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { WorkspaceUser, WorkspaceDomain } from '../types';
import {
  parseSpreadsheetFile,
  generateSampleCsv,
  downloadCsv,
  generateSharedBatchPassword,
  ParsedCsvUser,
} from '../utils/csvHelper';
import { SkooliaTwinOGlyph } from './SkooliaLoader';
import { useLanguage } from '../context/LanguageContext';
import { translateWorkspaceError } from '../utils/errorTranslator';

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (createdUsers: WorkspaceUser[]) => void;
  domains?: WorkspaceDomain[];
  allTenantDomains?: WorkspaceDomain[];
  onNavigateToDomains?: () => void;
}

export const BatchImportModal: React.FC<BatchImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  domains = [],
  allTenantDomains = [],
  onNavigateToDomains,
}) => {
  const { t, language } = useLanguage();
  const [fileName, setFileName] = useState<string>('');
  const [parsedUsers, setParsedUsers] = useState<ParsedCsvUser[]>([]);
  const [sharedTemporaryPassword, setSharedTemporaryPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStage, setProcessingStage] = useState<'validating' | 'provisioning' | 'securing' | 'finalizing'>('validating');
  const [filterTab, setFilterTab] = useState<'all' | 'ready' | 'blocked'>('all');
  const [copiedPassword, setCopiedPassword] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; percent: number }>({
    current: 0,
    total: 0,
    percent: 0,
  });
  const [currentProcessingEmail, setCurrentProcessingEmail] = useState<string>('');

  // Results step after execution
  const [importResult, setImportResult] = useState<{
    success: boolean;
    createdCount: number;
    errorCount: number;
    createdUsers: WorkspaceUser[];
    errors: { email: string; error: string }[];
    blockedAccounts: { user: ParsedCsvUser; domain: string; reason: string }[];
    sharedTemporaryPassword: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set of strictly verified domains belonging to this tenant
  const verifiedDomainNames = useMemo(() => {
    return new Set(
      (domains || [])
        .filter(
          (d) =>
            Boolean(d.verified === true || d.state === 'VERIFIED') &&
            d.state !== 'FAILED' &&
            d.state !== 'CONFIG_ERROR' &&
            d.state !== 'REMOVED'
        )
        .map((d) => d.domainName.toLowerCase().trim())
    );
  }, [domains]);

  // Map of all tenant domains (including pending validation)
  const allTenantDomainsMap = useMemo(() => {
    const list = allTenantDomains.length > 0 ? allTenantDomains : domains || [];
    return new Map(list.map((d) => [d.domainName.toLowerCase().trim(), d]));
  }, [allTenantDomains, domains]);

  // Comprehensive domain validation analysis of the imported file
  const domainAnalysis = useMemo(() => {
    if (parsedUsers.length === 0) {
      return {
        domainStats: [] as { domainName: string; count: number; isVerified: boolean; status: 'VERIFIED' | 'PENDING_DNS' | 'NOT_IN_TENANT' }[],
        unverifiedDomains: [] as { domainName: string; count: number; status: 'PENDING_DNS' | 'NOT_IN_TENANT' }[],
        validUsers: [] as ParsedCsvUser[],
        blockedUsers: [] as { user: ParsedCsvUser; domain: string; reason: string; status: 'PENDING_DNS' | 'NOT_IN_TENANT' }[],
        hasUnverified: false,
        allBlocked: false,
        verifiedDomainNames,
      };
    }

    const domainCountMap = new Map<string, number>();
    const validUsers: ParsedCsvUser[] = [];
    const blockedUsers: { user: ParsedCsvUser; domain: string; reason: string; status: 'PENDING_DNS' | 'NOT_IN_TENANT' }[] = [];

    parsedUsers.forEach((u) => {
      const emailDomain = (u.primaryEmail.split('@')[1] || '').trim().toLowerCase();
      domainCountMap.set(emailDomain, (domainCountMap.get(emailDomain) || 0) + 1);

      if (emailDomain && verifiedDomainNames.has(emailDomain)) {
        validUsers.push(u);
      } else {
        const tenantDomain = allTenantDomainsMap.get(emailDomain);
        const isPending = !!tenantDomain;
        const status: 'PENDING_DNS' | 'NOT_IN_TENANT' = isPending ? 'PENDING_DNS' : 'NOT_IN_TENANT';
        const reason = isPending
          ? t('modals.batchImport.domainStatusPending') || 'Pendente de validação DNS no tenant'
          : t('modals.batchImport.domainStatusNotAssociated') || 'Não pertence a este tenant';

        blockedUsers.push({
          user: u,
          domain: emailDomain || 'sem-dominio',
          reason,
          status,
        });
      }
    });

    const domainStats = Array.from(domainCountMap.entries()).map(([dName, count]) => {
      const isVerified = verifiedDomainNames.has(dName);
      const tenantDomain = allTenantDomainsMap.get(dName);
      const status: 'VERIFIED' | 'PENDING_DNS' | 'NOT_IN_TENANT' = isVerified
        ? 'VERIFIED'
        : tenantDomain
        ? 'PENDING_DNS'
        : 'NOT_IN_TENANT';

      return {
        domainName: dName,
        count,
        isVerified,
        status,
      };
    });

    const unverifiedDomains = domainStats.filter((d) => !d.isVerified);
    const hasUnverified = unverifiedDomains.length > 0;
    const allBlocked = validUsers.length === 0;

    return {
      domainStats,
      unverifiedDomains,
      validUsers,
      blockedUsers,
      hasUnverified,
      allBlocked,
      verifiedDomainNames,
    };
  }, [parsedUsers, verifiedDomainNames, allTenantDomainsMap, t]);

  // Accounts displayed based on active filter tab
  const displayedUsers = useMemo(() => {
    if (filterTab === 'ready') return domainAnalysis.validUsers;
    if (filterTab === 'blocked') return domainAnalysis.blockedUsers.map((b) => b.user);
    return parsedUsers;
  }, [filterTab, parsedUsers, domainAnalysis]);

  const handleDownloadSample = () => {
    const sampleContent = generateSampleCsv('example.com');
    downloadCsv('modelo_importacao_usuarios.csv', sampleContent);
  };

  const handleCopyPassword = (pwd: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(pwd);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2500);
    }
  };

  const processFile = async (file: File) => {
    setError(null);
    setImportResult(null);
    setFilterTab('all');

    const lowerName = file.name.toLowerCase();
    const isValidFormat =
      lowerName.endsWith('.csv') ||
      lowerName.endsWith('.xlsx') ||
      lowerName.endsWith('.xls');

    if (!isValidFormat) {
      setError(
        t('modals.batchImport.errorSelectSpreadsheet') ||
          'Por favor, selecione um arquivo de planilha (.csv, .xlsx ou .xls)'
      );
      return;
    }

    setFileName(file.name);
    try {
      // Generate a shared temporary password for the entire batch
      const batchPassword = generateSharedBatchPassword();
      setSharedTemporaryPassword(batchPassword);

      const users = await parseSpreadsheetFile(file, batchPassword);
      if (users.length === 0) {
        setError(
          t('modals.batchImport.errorNoValidUsers') ||
            'Nenhum usuário válido encontrado na planilha. Verifique se o arquivo possui colunas com cabeçalhos como "First Name", "Last Name" e "Email Address".'
        );
        setParsedUsers([]);
      } else {
        setParsedUsers(users);
      }
    } catch (err: any) {
      setError(
        (t('modals.batchImport.errorProcessingSpreadsheet') || 'Erro ao processar planilha: ') +
          (err?.message || 'Arquivo inválido')
      );
      setParsedUsers([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleExecuteBatchImport = async () => {
    // Only verified accounts can advance
    const usersToCreate = domainAnalysis.validUsers;
    if (usersToCreate.length === 0 || isProcessing) {
      if (domainAnalysis.allBlocked) {
        setError(
          t('modals.batchImport.allBlockedNotice') ||
            'Nenhuma conta elegível para avançar. Todos os domínios do arquivo precisam estar cadastrados e verificados na conta deste tenant para prosseguir.'
        );
      }
      return;
    }

    setIsProcessing(true);
    setError(null);
    setImportResult(null);
    setProcessingStage('validating');

    const total = usersToCreate.length;
    setImportProgress({ current: 0, total, percent: 10 });
    setCurrentProcessingEmail(usersToCreate[0]?.primaryEmail || '');

    const finalBatchPassword =
      sharedTemporaryPassword || generateSharedBatchPassword();

    // The loading experience must last at least 10 seconds
    const MIN_LOADING_TIME_MS = 10000;
    const startTime = Date.now();

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed < 2500) {
        setProcessingStage('validating');
        const pct = 10 + Math.round((elapsed / 2500) * 18);
        setImportProgress({
          current: 0,
          total,
          percent: Math.min(pct, 28),
        });
        setCurrentProcessingEmail(usersToCreate[0]?.primaryEmail || '');
      } else if (elapsed < 7500) {
        setProcessingStage('provisioning');
        const stageRatio = (elapsed - 2500) / 5000;
        const pct = 28 + Math.round(stageRatio * 52);
        const activeIdx = Math.min(Math.floor(stageRatio * total), total - 1);
        setCurrentProcessingEmail(usersToCreate[activeIdx]?.primaryEmail || '');
        setImportProgress({
          current: Math.min(activeIdx + 1, total),
          total,
          percent: Math.min(pct, 80),
        });
      } else if (elapsed < 9600) {
        setProcessingStage('securing');
        const stageRatio = (elapsed - 7500) / 2100;
        const pct = 80 + Math.round(stageRatio * 16);
        setImportProgress({
          current: total,
          total,
          percent: Math.min(pct, 96),
        });
        setCurrentProcessingEmail(usersToCreate[total - 1]?.primaryEmail || '');
      } else {
        // Holding smoothly near completion if network takes >= 10s
        setProcessingStage('securing');
        setImportProgress({
          current: total,
          total,
          percent: 96,
        });
      }
    }, 100);

    try {
      // Call the server batch creation endpoint with verified accounts and shared temporary password
      const res = await fetch('/api/users/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          users: usersToCreate,
          allowedDomains: Array.from(domainAnalysis.verifiedDomainNames),
          sharedTemporaryPassword: finalBatchPassword,
        }),
      });

      // Ensure at least 10 seconds have elapsed for the loading experience
      const elapsedSoFar = Date.now() - startTime;
      if (elapsedSoFar < MIN_LOADING_TIME_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_LOADING_TIME_MS - elapsedSoFar));
      }

      clearInterval(progressInterval);
      setProcessingStage('finalizing');
      setImportProgress({ current: total, total, percent: 100 });

      // Small pause so the user can perceive 100% completion
      await new Promise((resolve) => setTimeout(resolve, 350));

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Falha ao processar o lote de usuários no servidor.');
      }

      const data = await res.json();

      const createdUsers: WorkspaceUser[] = data.createdUsers || [];
      const errors = data.errors || [];
      const confirmedPassword = data.sharedTemporaryPassword || finalBatchPassword;

      setImportResult({
        success: createdUsers.length > 0,
        createdCount: createdUsers.length,
        errorCount: errors.length,
        createdUsers,
        errors,
        blockedAccounts: domainAnalysis.blockedUsers,
        sharedTemporaryPassword: confirmedPassword,
      });

      if (onImportComplete && createdUsers.length > 0) {
        onImportComplete(createdUsers);
      }
    } catch (err: any) {
      const elapsedSoFar = Date.now() - startTime;
      if (elapsedSoFar < MIN_LOADING_TIME_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_LOADING_TIME_MS - elapsedSoFar));
      }
      clearInterval(progressInterval);
      setError(err?.message || 'Ocorreu um erro durante a criação das contas de usuários.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetModal = useCallback(() => {
    setParsedUsers([]);
    setFileName('');
    setError(null);
    setImportResult(null);
    setFilterTab('all');
    setProcessingStage('validating');
    setImportProgress({ current: 0, total: 0, percent: 0 });
    setCurrentProcessingEmail('');
    setSharedTemporaryPassword('');
    setCopiedPassword(false);
    setShowPassword(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Centralized close handler that guarantees the entire state is reset to 0
  const handleClose = useCallback(() => {
    handleResetModal();
    onClose();
  }, [handleResetModal, onClose]);

  // Reset entire flow whenever the modal is closed or reopened
  useEffect(() => {
    if (!isOpen) {
      handleResetModal();
    }
  }, [isOpen, handleResetModal]);

  // ESC key listener to safely dismiss and reset
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isProcessing) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) {
          handleClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00c868]/15 text-[#008a46] flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-['Outfit']">
                {t('modals.batchImport.title')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('modals.batchImport.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Header download button removed per user request: only keep text link below import dropzone */}
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* RESULT SUMMARY VIEW IF COMPLETED */}
          {importResult ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div
                className={`p-4.5 rounded-2xl border ${
                  importResult.errorCount === 0 && importResult.blockedAccounts.length === 0
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : importResult.createdCount > 0
                    ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                    : 'bg-rose-50/70 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      importResult.errorCount === 0 && importResult.blockedAccounts.length === 0
                        ? 'bg-emerald-500 text-white'
                        : importResult.createdCount > 0
                        ? 'bg-amber-500 text-white'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    {importResult.errorCount === 0 && importResult.blockedAccounts.length === 0 ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm sm:text-base font-bold font-['Outfit']">
                      {importResult.errorCount === 0 && importResult.blockedAccounts.length === 0
                        ? t('modals.batchImport.allSuccessTitle')
                        : importResult.createdCount > 0
                        ? t('modals.batchImport.partialSuccessTitle')
                        : t('modals.batchImport.failureTitle')}
                    </h3>
                    <p className="text-xs mt-1 text-slate-600 leading-relaxed">
                      {t('modals.batchImport.resultSuccessSummary', { count: importResult.createdCount })}{' '}
                      {importResult.errorCount > 0 && (
                        <span className="text-rose-600 font-semibold">
                          {t('modals.batchImport.resultErrorsSummary', { count: importResult.errorCount })}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* SHARED TEMPORARY PASSWORD DISPLAY CARD */}
              {importResult.createdCount > 0 && importResult.sharedTemporaryPassword && (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-3 shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#00c868]/20 text-[#00c868] flex items-center justify-center shrink-0">
                        <Key className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold font-['Outfit'] text-white">
                          {t('modals.batchImport.tempPasswordCardTitle')}
                        </h4>
                        <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                          {t('modals.batchImport.tempPasswordCardSubtitle')}
                        </p>
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                      Temporária
                    </span>
                  </div>

                  {/* Password Value and Actions */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-sm sm:text-base font-bold tracking-wider text-emerald-400 select-all">
                        {showPassword ? importResult.sharedTemporaryPassword : '••••••••••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
                        title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyPassword(importResult.sharedTemporaryPassword)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#00c868] hover:bg-[#00b35c] text-white flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
                    >
                      {copiedPassword ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{t('modals.batchImport.tempPasswordCopiedBtn')}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{t('modals.batchImport.tempPasswordCopyBtn')}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{t('modals.batchImport.tempPasswordMustChangeNotice')}</span>
                  </p>
                </div>
              )}

              {/* Created accounts list */}
              {importResult.createdCount > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {t('modals.batchImport.activatedAccounts')} ({importResult.createdCount})
                  </span>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl max-h-44 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {importResult.createdUsers.map((u, i) => (
                      <div key={i} className="p-2.5 sm:p-3 flex items-center justify-between gap-3 hover:bg-white transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-5 h-5 rounded-full bg-[#00c868]/15 text-[#008a46] flex items-center justify-center font-bold text-[10px] shrink-0">
                            {i + 1}
                          </div>
                          <div className="truncate">
                            <span className="font-bold text-slate-900">{u.name?.fullName || `${u.name?.givenName} ${u.name?.familyName}`}</span>
                            <span className="text-slate-500 font-mono text-[11px] ml-2">({u.primaryEmail})</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                          {t('modals.batchImport.statusCreated')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Blocked accounts list due to unverified domain */}
              {importResult.blockedAccounts.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <Ban className="w-3.5 h-3.5 text-amber-600" />
                    {t('modals.batchImport.blockedAccountsSummary')} ({importResult.blockedAccounts.length})
                  </span>
                  <div className="bg-amber-50/40 border border-amber-200/80 rounded-2xl max-h-36 overflow-y-auto divide-y divide-amber-100 text-xs">
                    {importResult.blockedAccounts.map((b, i) => (
                      <div key={i} className="p-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0 truncate">
                          <span className="font-semibold text-slate-900">{b.user.givenName} {b.user.familyName}</span>
                          <span className="font-mono text-slate-500 text-[11px] ml-1.5">({b.user.primaryEmail})</span>
                        </div>
                        <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0">
                          {b.reason}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors list if any */}
              {importResult.errors.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    {t('modals.batchImport.failedAccounts')} ({importResult.errors.length})
                  </span>
                  <div className="bg-rose-50/50 border border-rose-200 rounded-2xl max-h-32 overflow-y-auto divide-y divide-rose-100 text-xs">
                    {importResult.errors.map((err, i) => (
                      <div key={i} className="p-2.5 flex items-center justify-between gap-3">
                        <span className="font-mono font-semibold text-rose-900">{err.email}</span>
                        <span className="text-rose-600 text-[11px] text-right font-medium">
                          {translateWorkspaceError(err.error, language)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* STATE 1: Dropzone when no file is uploaded */}
              {parsedUsers.length === 0 ? (
                <div className="space-y-3">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-[#00c868] hover:bg-emerald-50/15 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#008a46] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 font-['Outfit']">
                      {t('modals.batchImport.dropzoneText')}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      {t('modals.batchImport.acceptedFormats')}
                    </p>
                  </div>

                  {/* Clean Helper link to download spreadsheet template */}
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 py-1">
                    <span>{t('modals.batchImport.needTemplatePrompt')}</span>
                    <button
                      type="button"
                      onClick={handleDownloadSample}
                      className="font-bold text-[#008a46] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{t('modals.batchImport.downloadSampleBtn')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* STATE 2: Sleek, compact File Info Bar when file IS uploaded */
                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#008a46] flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-4.5 h-4.5" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {fileName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {parsedUsers.length === 1
                          ? t('modals.batchImport.fileAccountsCountSingular')
                          : t('modals.batchImport.fileAccountsCount', { count: parsedUsers.length })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-500" />
                      <span>{t('modals.batchImport.replaceFileBtn')}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* General Parsing Error Notice */}
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-rose-900">Erro no processamento da planilha</p>
                    <p className="mt-0.5 text-rose-800">{error}</p>
                  </div>
                </div>
              )}

              {/* REFINED DOMAIN VERIFICATION ALERT BANNER */}
              {parsedUsers.length > 0 && !isProcessing && domainAnalysis.hasUnverified && (
                <div
                  id="domain-validation-alert"
                  className={`p-4 rounded-2xl border transition-all ${
                    domainAnalysis.allBlocked
                      ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                      : 'bg-amber-50/70 border-amber-200 text-amber-950'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                          domainAnalysis.allBlocked
                            ? 'bg-rose-600 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold font-['Outfit']">
                        {domainAnalysis.allBlocked
                          ? t('modals.batchImport.domainBlockedAllTitle')
                          : t('modals.batchImport.domainWarningTitle')}
                      </h4>
                    </div>

                    {onNavigateToDomains && (
                      <button
                        type="button"
                        onClick={() => {
                          handleClose();
                          onNavigateToDomains();
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
                      >
                        <Globe className="w-3.5 h-3.5 text-[#00c868]" />
                        <span>{t('modals.batchImport.goToDomainsBtn')}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                    {domainAnalysis.allBlocked
                      ? t('modals.batchImport.domainWarningDesc')
                      : t('modals.batchImport.cannotAdvanceNotice', { count: domainAnalysis.blockedUsers.length })}
                  </p>

                  {/* Clean Domain Summary Badges */}
                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-slate-200/50 text-xs">
                    {domainAnalysis.domainStats.map((item, idx) => (
                      <div
                        key={idx}
                        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-mono ${
                          item.isVerified
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                            : item.status === 'PENDING_DNS'
                            ? 'bg-amber-100/70 border-amber-300 text-amber-900'
                            : 'bg-white border-rose-200 text-rose-900'
                        }`}
                      >
                        <div className="flex items-center gap-1 font-bold">
                          {item.isVerified ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Ban className="w-3 h-3 text-rose-600" />
                          )}
                          <span>@{item.domainName}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-sans">
                          ({item.count} {item.count === 1 ? 'conta' : 'contas'})
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider font-sans ${
                            item.isVerified
                              ? 'bg-emerald-600 text-white'
                              : item.status === 'PENDING_DNS'
                              ? 'bg-amber-600 text-white'
                              : 'bg-rose-600 text-white'
                          }`}
                        >
                          {item.isVerified
                            ? t('modals.batchImport.domainStatusVerified')
                            : item.status === 'PENDING_DNS'
                            ? t('modals.batchImport.domainStatusPending')
                            : t('modals.batchImport.domainStatusNotAssociated')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CLEAN MINIMALIST LOADING STATE */}
              {isProcessing && (
                <div className="bg-white border border-[#E2E6DF] rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center text-center space-y-5 animate-in fade-in duration-300 shadow-xs">
                  {/* Central Elegant Spinner */}
                  <div className="w-14 h-14 rounded-2xl bg-[#E8F7DC] border border-[#9FE870]/60 flex items-center justify-center text-[#163300] shadow-xs">
                    <Loader2 className="w-7 h-7 animate-spin text-[#163300]" />
                  </div>

                  {/* Clean Title and Current Email */}
                  <div className="space-y-1.5 max-w-md">
                    <h3 className="text-lg sm:text-xl font-black text-[#163300] font-['Outfit'] tracking-tight">
                      {t('modals.batchImport.processingTitle')}
                    </h3>
                    {currentProcessingEmail && (
                      <p className="text-xs sm:text-sm text-[#5E605D] font-mono truncate">
                        {currentProcessingEmail}
                      </p>
                    )}
                  </div>

                  {/* Minimalist High-Craft Progress Bar */}
                  <div className="w-full max-w-sm space-y-2 pt-1">
                    <div className="w-full bg-[#E8EBE6] rounded-full h-2.5 overflow-hidden p-0.5 shadow-inner">
                      <div
                        className="bg-gradient-to-r from-[#163300] via-[#2d5e0a] to-[#00c868] h-full transition-all duration-300 rounded-full"
                        style={{ width: `${Math.max(5, importProgress.percent)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold text-[#868685]">
                      <span>
                        {importProgress.current > 0
                          ? `${importProgress.current} de ${importProgress.total} ${
                              importProgress.total === 1 ? 'conta' : 'contas'
                            }`
                          : 'Iniciando criação...'}
                      </span>
                      <span className="font-mono text-[#163300] font-bold">
                        {importProgress.percent}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ACCOUNTS PREVIEW TABLE & FILTER TABS */}
              {parsedUsers.length > 0 && !isProcessing && (
                <div className="space-y-2.5">
                  {/* Section Title & Segmented Filter Tabs */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      Prévia das Contas ({parsedUsers.length})
                    </span>

                    {/* Filter tabs */}
                    {domainAnalysis.hasUnverified && (
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setFilterTab('all')}
                          className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                            filterTab === 'all'
                              ? 'bg-white text-slate-900 shadow-2xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Todas ({parsedUsers.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilterTab('ready')}
                          className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                            filterTab === 'ready'
                              ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Prontas ({domainAnalysis.validUsers.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilterTab('blocked')}
                          className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                            filterTab === 'blocked'
                              ? 'bg-white text-rose-700 shadow-2xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Bloqueadas ({domainAnalysis.blockedUsers.length})
                        </button>
                      </div>
                    )}
                  </div>

                  {/* List of accounts */}
                  <div className="bg-white rounded-2xl border border-slate-200 max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs shadow-2xs">
                    {displayedUsers.length === 0 ? (
                      <div className="p-6 text-center text-slate-400">
                        Nenhuma conta nesta categoria.
                      </div>
                    ) : (
                      displayedUsers.map((u, i) => {
                        const emailDomain = (u.primaryEmail.split('@')[1] || '').trim().toLowerCase();
                        const isDomainVerified = domainAnalysis.verifiedDomainNames.has(emailDomain);
                        const blockedInfo = domainAnalysis.blockedUsers.find((b) => b.user.primaryEmail === u.primaryEmail);

                        return (
                          <div
                            key={i}
                            className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                              !isDomainVerified ? 'bg-rose-50/30 hover:bg-rose-50/50' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                  isDomainVerified
                                    ? 'bg-[#00c868]/15 text-[#008a46]'
                                    : 'bg-rose-100 text-rose-700'
                                }`}
                              >
                                {i + 1}
                              </div>
                              <div className="truncate">
                                <div className="flex items-center gap-2 truncate">
                                  <span className="font-bold text-slate-900 truncate">
                                    {u.givenName} {u.familyName}
                                  </span>
                                  <span className="text-slate-500 font-mono text-[11px] truncate">
                                    {u.primaryEmail}
                                  </span>
                                </div>
                                {!isDomainVerified && blockedInfo && (
                                  <p className="text-[11px] text-rose-700 font-medium mt-0.5">
                                    {blockedInfo.reason}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isDomainVerified
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-100 text-rose-700'
                                }`}
                              >
                                {isDomainVerified ? 'Elegível' : 'Bloqueado'}
                              </span>

                              <span className="text-slate-500 font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5 text-slate-400" />
                                <span>Mesma Senha</span>
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          {importResult ? (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={handleResetModal}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('modals.batchImport.importAnother')}</span>
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-[#00c868] hover:bg-[#00b35c] text-white transition-all shadow-xs cursor-pointer"
              >
                {t('modals.batchImport.finishBtn') || t('common.confirm') || 'Concluir'}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full gap-3">
              <div className="text-xs text-slate-500">
                {parsedUsers.length > 0 ? (
                  domainAnalysis.allBlocked ? (
                    <span className="text-rose-600 font-semibold">
                      Nenhuma conta elegível para avançar.
                    </span>
                  ) : domainAnalysis.hasUnverified ? (
                    <span className="text-slate-600 font-medium">
                      {domainAnalysis.validUsers.length} de {parsedUsers.length} contas serão provisionadas.
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-medium">
                      {parsedUsers.length} {parsedUsers.length === 1 ? 'conta pronta' : 'contas prontas'} para criação.
                    </span>
                  )
                ) : null}
              </div>

              <div className="flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBatchImport}
                  disabled={parsedUsers.length === 0 || domainAnalysis.allBlocked || isProcessing}
                  id="btn-confirm-batch-import"
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-2xs ${
                    isProcessing
                      ? 'bg-[#E8F7DC] text-[#163300] border border-[#9FE870]/60 cursor-wait'
                      : parsedUsers.length > 0 && !domainAnalysis.allBlocked
                      ? 'bg-[#9FE870] hover:bg-[#8EE05B] text-[#163300] font-black cursor-pointer active:scale-95'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#163300]" />
                      <span>
                        {t('modals.batchImport.creatingAccounts', {
                          count: domainAnalysis.validUsers.length,
                        })}
                      </span>
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      <span>
                        {parsedUsers.length === 0
                          ? t('modals.batchImport.createAccountsBtnEmpty')
                          : domainAnalysis.allBlocked
                          ? 'Importação Bloqueada'
                          : domainAnalysis.hasUnverified
                          ? t('modals.batchImport.createOnlyValidBtn', {
                              count: domainAnalysis.validUsers.length,
                            })
                          : t('modals.batchImport.createAccountsBtn', {
                              count: parsedUsers.length,
                            })}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
