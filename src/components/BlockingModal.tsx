import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Lock,
  ShieldAlert,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  LogOut,
  RefreshCw,
  Mail,
  Receipt,
  ShieldCheck,
  Building,
} from 'lucide-react';
import type { Tenant, Invoice, InstitutionProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  markInstitutionInvoicePaidInFirestore,
  updateInstitutionStatusInFirestore,
  broadcastTenantStatus,
  tenantStatusChannel,
} from '../lib/firebase';

interface BlockingModalProps {
  tenant: Tenant | Partial<Tenant>;
  institution?: InstitutionProfile | null;
  onUnlockSuccess: () => Promise<void> | void;
  onLogout: () => Promise<void> | void;
}

export const BlockingModal: React.FC<BlockingModalProps> = ({
  tenant,
  institution,
  onUnlockSuccess,
  onLogout,
}) => {
  const { user, refreshProfile } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  // Priority order for account language:
  // 1. tenant's explicit preferredLanguage or language
  // 2. institution profile preferredLanguage or language
  // 3. user preferredLanguage or language
  const accountLanguage =
    (tenant as any)?.preferredLanguage ||
    (tenant as any)?.language ||
    institution?.preferredLanguage ||
    (institution as any)?.language ||
    (user as any)?.preferredLanguage ||
    (user as any)?.language;

  useEffect(() => {
    if (accountLanguage && (accountLanguage === 'pt' || accountLanguage === 'en' || accountLanguage === 'es')) {
      if (accountLanguage !== language) {
        setLanguage(accountLanguage);
      }
    }
  }, [accountLanguage]);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState<boolean>(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active payment submodal / sheet for selected invoice
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  const tenantName =
    institution?.institutionName ||
    tenant.name ||
    'Instituição de Ensino';

  const tenantEmail =
    institution?.financialContactEmail ||
    institution?.institutionEmail ||
    institution?.ownerEmail ||
    tenant.financialContactEmail ||
    tenant.primaryContactEmail ||
    user?.email ||
    '';

  const tenantId =
    tenant.id ||
    (institution ? `tenant-${institution.ownerUid || institution.id}` : `tenant-${user?.uid}`);

  const rawBlockReason =
    tenant.suspendedReason ||
    institution?.suspendedReason;

  // Localize preset administrative suspension reasons across languages
  const blockReason = useMemo(() => {
    if (!rawBlockReason) return t('blockingModal.adminReasonHelpNoInvoices');
    if (rawBlockReason.includes('Inadimplência de faturas') || rawBlockReason.includes('pendências financeiras')) {
      return t('tenants.adminModal.submodals.blockConfirm.preset1');
    }
    if (rawBlockReason.includes('Atraso no pagamento') || rawBlockReason.includes('licenças do Workspace')) {
      return t('tenants.adminModal.submodals.blockConfirm.preset2');
    }
    if (rawBlockReason.includes('Suspensão temporária para auditoria') || rawBlockReason.includes('segurança institucional')) {
      return t('tenants.adminModal.submodals.blockConfirm.preset3');
    }
    return rawBlockReason;
  }, [rawBlockReason, t]);

  // Normalize amount: legacy 25000 is 250.00 USD
  const normalizeAmount = (val: number | string | undefined): number => {
    const num = Number(val) || 0;
    if (num === 25000) return 250.0;
    if (num >= 10000 && num % 100 === 0) return num / 100;
    return num;
  };

  // Helper to determine if an invoice is voided/annulled
  const isInvoiceVoided = (inv: Invoice): boolean => {
    if (!inv) return false;
    const status = (inv.status || '').toUpperCase();
    if (status === 'VOID' || status === 'VOIDED' || status === 'CANCELED' || status === 'CANCELLED') return true;
    const voidedList = [
      ...(Array.isArray(tenant.voidedInvoiceIds) ? tenant.voidedInvoiceIds : []),
      ...(Array.isArray((institution as any)?.voidedInvoiceIds) ? (institution as any).voidedInvoiceIds : []),
    ];
    if (inv.id && voidedList.includes(inv.id)) return true;
    if (inv.invoiceNumber && voidedList.includes(inv.invoiceNumber)) return true;
    return false;
  };

  // Helper to determine if an invoice is in state 'OVERDUE'
  const isInvoiceOverdue = (inv: Invoice): boolean => {
    if (!inv || isInvoiceVoided(inv)) return false;
    const status = (inv.status || '').toUpperCase();
    if (status === 'OVERDUE' || status === 'PAST_DUE' || status === 'UNCOLLECTIBLE') return true;
    if (inv.dueDate && (status === 'OPEN' || status === 'PENDING')) {
      return new Date(inv.dueDate).getTime() < Date.now();
    }
    return false;
  };

  // Fetch invoices and strictly isolate ONLY those in OVERDUE state
  const loadInvoices = async () => {
    setIsLoadingInvoices(true);
    setErrorMessage(null);

    const allInvoices: Invoice[] = [];

    // 1. Check local institution profile invoices
    if (institution?.invoices && Array.isArray(institution.invoices)) {
      allInvoices.push(...institution.invoices);
    }

    // 2. Check tenant invoices if provided
    if (tenant.invoices && Array.isArray(tenant.invoices)) {
      for (const tInv of tenant.invoices) {
        if (!allInvoices.some((p) => p.id === tInv.id || p.invoiceNumber === tInv.invoiceNumber)) {
          allInvoices.push(tInv);
        }
      }
    }

    // 3. Fetch official real-time Stripe invoices from backend
    try {
      const res = await fetch('/api/billing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: tenantEmail,
          tenantUid: institution?.id || user?.uid,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.invoices)) {
          for (const sInv of data.invoices) {
            if (!allInvoices.some((p) => p.id === sInv.id || p.invoiceNumber === sInv.invoiceNumber)) {
              allInvoices.push(sInv);
            }
          }
        }
      }
    } catch (fetchErr) {
      console.warn('[BlockingModal] Erro ao consultar faturas da Stripe:', fetchErr);
    }

    // Strict filtering: Display ONLY invoices in OVERDUE status.
    // Do NOT consider any invoices outside this status (no PAID, no OPEN before due date, no fake fallback 25000).
    const overdueList = allInvoices
      .filter(isInvoiceOverdue)
      .map((inv) => ({
        ...inv,
        amount: normalizeAmount(inv.amount),
      }));

    setInvoices(overdueList);
    setIsLoadingInvoices(false);
  };

  useEffect(() => {
    loadInvoices();
  }, [tenant.id, institution?.id, user?.uid]);

  // Live real-time unblock listener: if SuperAdmin unblocks or payment is made in another tab, unlock immediately!
  useEffect(() => {
    const handleStatusUpdate = (msg: any) => {
      if (!msg) return;
      const targetId = msg.tenantId?.replace(/^tenant-/, '');
      const currentId = (tenant.id || tenantId || '').replace(/^tenant-/, '');
      const userUid = user?.uid;
      const instUid = institution?.ownerUid || institution?.id;

      if (
        msg.tenantId === tenant.id ||
        msg.tenantId === tenantId ||
        targetId === currentId ||
        targetId === userUid ||
        targetId === instUid
      ) {
        if (msg.status === 'ACTIVE') {
          try {
            confetti({
              particleCount: 160,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#00c868', '#008a46', '#22c55e', '#3b82f6', '#fbbf24'],
            });
          } catch {}
          setPaymentSuccess(true);
          setTimeout(() => {
            onUnlockSuccess();
          }, 1200);
        }
      }
    };

    const handleChannelMessage = (e: MessageEvent) => {
      handleStatusUpdate(e.data);
    };

    const handleCustomEvent = (e: any) => {
      handleStatusUpdate(e.detail);
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'skoolia_tenant_status_broadcast' && e.newValue) {
        try {
          handleStatusUpdate(JSON.parse(e.newValue));
        } catch {}
      }
    };

    if (tenantStatusChannel) {
      tenantStatusChannel.addEventListener('message', handleChannelMessage);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('skoolia_tenant_status_change', handleCustomEvent);
      window.addEventListener('storage', handleStorage);
    }

    return () => {
      if (tenantStatusChannel) {
        tenantStatusChannel.removeEventListener('message', handleChannelMessage);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('skoolia_tenant_status_change', handleCustomEvent);
        window.removeEventListener('storage', handleStorage);
      }
    };
  }, [tenant.id, tenantId, user?.uid, institution?.ownerUid, onUnlockSuccess]);

  // Handle Initiating Payment for a specific overdue invoice
  const handleOpenPayment = (inv: Invoice) => {
    setSelectedInvoiceForPayment(inv);
    setCardNumber('');
    setCardExpiry('');
    setCardCvc('');
    setCardholderName(institution?.financialContactName || tenantName);
    setErrorMessage(null);
  };

  // Process payment and automatically unlock tenant live
  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;

    setIsProcessingPayment(true);
    setErrorMessage(null);

    try {
      const targetUid = institution?.ownerUid || user?.uid || tenantId.replace(/^tenant-/, '');

      // 1. Call server endpoint to record payment and unblock tenant
      const response = await fetch(`/api/tenants/${tenantId}/pay-pending-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-language': language,
        },
        body: JSON.stringify({
          invoiceId: selectedInvoiceForPayment.id,
          amount: selectedInvoiceForPayment.amount,
          currency: selectedInvoiceForPayment.currency,
          payerEmail: tenantEmail,
          payerName: cardholderName || tenantName,
          paymentMethod: language === 'pt' ? 'Cartão de Crédito' : language === 'es' ? 'Tarjeta de Crédito' : 'Credit Card',
          card: {
            number: cardNumber || '4242424242424242',
            exp_month: cardExpiry.split('/')[0] || '12',
            exp_year: cardExpiry.split('/')[1] || '28',
            cvc: cardCvc || '123',
          },
        }),
      });

      const resData = await response.json();
      if (!response.ok || resData.success === false) {
        throw new Error(resData.error || t('blockingModal.paymentModal.processing'));
      }

      // 2. Persist in Firestore: mark invoice as PAID and update institution status to ACTIVE
      await markInstitutionInvoicePaidInFirestore(targetUid, selectedInvoiceForPayment.id, {
        paymentMethod: `Cartão de Crédito (•••• ${cardNumber.slice(-4) || '4242'})`,
      });
      await updateInstitutionStatusInFirestore(targetUid, 'ACTIVE');

      // 3. Broadcast instant live unblock across all tabs & SuperAdmin
      broadcastTenantStatus({
        tenantId: targetUid,
        status: 'ACTIVE',
      });

      // 4. Mark as paid in local state
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === selectedInvoiceForPayment.id
            ? { ...inv, status: 'PAID' }
            : inv
        )
      );

      // 5. Trigger celebration
      try {
        confetti({
          particleCount: 160,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#00c868', '#008a46', '#22c55e', '#3b82f6', '#fbbf24'],
        });
      } catch {
        // non-blocking
      }

      setPaymentSuccess(true);
      setSelectedInvoiceForPayment(null);

      // 6. Automatic Unlock immediately
      setTimeout(async () => {
        if (refreshProfile) {
          await refreshProfile();
        }
        await onUnlockSuccess();
      }, 1500);
    } catch (err: any) {
      console.error('[BlockingModal Payment Error]', err);
      setErrorMessage(err?.message || 'Erro ao processar transação financeira.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Fast Test Payment Handler for immediate unlock in testing environments
  const handleFastSimulatePayment = (inv: Invoice) => {
    setSelectedInvoiceForPayment(inv);
    setCardNumber('4242 •••• •••• 4242');
    setCardExpiry('12/28');
    setCardCvc('123');
    setCardholderName(tenantName);
  };

  const hasOverdueInvoices = invoices.length > 0;

  const supportSubject = language === 'en'
    ? `[Unblock Request] ${tenantName} (ID: ${tenantId})`
    : language === 'es'
    ? `[Solicitud de Desbloqueo] ${tenantName} (ID: ${tenantId})`
    : `[Desbloqueio] ${tenantName} (ID: ${tenantId})`;

  const supportBody = language === 'en'
    ? `Hello skoolia Support,\n\nI request assistance to regularize our institution ${tenantName} (ID: ${tenantId}).\nContact email: ${tenantEmail}\n\nThank you.`
    : language === 'es'
    ? `Hola Soporte de skoolia,\n\nSolicito asistencia para regularizar la institución ${tenantName} (ID: ${tenantId}).\nCorreo de contacto: ${tenantEmail}\n\nMuchas gracias.`
    : `Olá Suporte skoolia,\n\nSolicito apoio para regularização da instituição ${tenantName} (ID: ${tenantId}).\nE-mail de contato: ${tenantEmail}\n\nObrigado.`;

  return (
    <div
      id="tenant-blocking-modal-overlay"
      className="fixed inset-0 z-[9999] bg-[#0E0F0C]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto select-none"
      style={{ touchAction: 'pan-y' }}
    >
      <div
        id="tenant-blocking-modal-card"
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-rose-200 overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Warning Banner with Language Switcher */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 px-6 py-5 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-inner shrink-0">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-900/40 text-rose-100 border border-rose-400/30 mb-1">
                <ShieldAlert className="w-3 h-3" />
                <span>{t('blockingModal.badge')}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black font-['Outfit'] tracking-tight">
                {t('blockingModal.title')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Multi-language Selector Pills in Header */}
            <div className="flex items-center gap-1 bg-black/25 p-1 rounded-xl border border-white/15">
              <button
                type="button"
                onClick={() => setLanguage('pt')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  language === 'pt'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-white/75 hover:text-white hover:bg-white/10'
                }`}
                title="Português"
              >
                PT
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-white/75 hover:text-white hover:bg-white/10'
                }`}
                title="English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('es')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  language === 'es'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-white/75 hover:text-white hover:bg-white/10'
                }`}
                title="Español"
              >
                ES
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Tenant Identification Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#F4F5F0] border border-[#E2E6DF]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-[#E2E6DF] text-[#163300] font-black">
                <Building className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#5E605D]">
                  {t('blockingModal.suspendedOrg')}
                </p>
                <h3 className="text-base font-black text-[#0E0F0C] font-['Outfit']">{tenantName}</h3>
              </div>
            </div>
            {tenantEmail && (
              <div className="text-xs text-[#5E605D] flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#E2E6DF] self-start sm:self-center">
                <Mail className="w-3.5 h-3.5 text-[#00c868]" />
                <span className="font-medium text-slate-700">{tenantEmail}</span>
              </div>
            )}
          </div>

          {/* Communicated Block Reason */}
          <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wide">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{t('blockingModal.adminReasonLabel')}</span>
            </div>
            <p className="text-sm text-rose-900 leading-relaxed font-medium bg-white/80 p-3.5 rounded-xl border border-rose-200/80">
              "{blockReason}"
            </p>
            <p className="text-[11px] text-rose-700">
              {hasOverdueInvoices
                ? t('blockingModal.adminReasonHelpWithInvoices')
                : t('blockingModal.adminReasonHelpNoInvoices')}
            </p>
          </div>

          {/* Overdue Invoices Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-600" />
                <h4 className="text-sm font-black text-[#0E0F0C] font-['Outfit'] uppercase tracking-wider">
                  {t('blockingModal.sectionTitle')}
                </h4>
              </div>
              <button
                type="button"
                onClick={loadInvoices}
                disabled={isLoadingInvoices}
                className="text-xs font-bold text-[#008a46] hover:underline cursor-pointer inline-flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingInvoices ? 'animate-spin' : ''}`} />
                <span>{isLoadingInvoices ? t('blockingModal.refreshing') : t('blockingModal.refresh')}</span>
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Unlocked Banner */}
            {paymentSuccess && (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 animate-in zoom-in-95">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h5 className="text-sm font-black text-emerald-950 font-['Outfit']">
                    {t('blockingModal.paymentModal.successTitle')}
                  </h5>
                  <p className="text-xs text-emerald-700">
                    {t('blockingModal.paymentModal.successDesc')}
                  </p>
                </div>
              </div>
            )}

            {/* Invoices List - Strictly Overdue Invoices */}
            {isLoadingInvoices ? (
              <div className="p-8 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 text-[#00c868] animate-spin" />
                <p className="text-xs font-semibold text-slate-600">{t('blockingModal.refreshing')}</p>
              </div>
            ) : invoices.length === 0 ? (
              <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600" />
                <h5 className="text-sm font-bold text-slate-800">
                  {t('blockingModal.noOverdueTitle')}
                </h5>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {t('blockingModal.noOverdueDesc')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map((inv) => {
                  const isPaid = inv.status === 'PAID';
                  return (
                    <div
                      key={inv.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isPaid
                          ? 'border-emerald-200 bg-emerald-50/50'
                          : 'border-rose-300 bg-rose-50/30 hover:border-rose-400'
                      } flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            {inv.invoiceNumber}
                          </span>
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                            }`}
                          >
                            {isPaid ? t('blockingModal.settled') : t('blockingModal.overdueBadge')}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-900 font-['Outfit']">
                          {inv.planName || 'Assinatura Google Workspace Unlimited'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {t('blockingModal.issuedOn', {
                            date: new Date(inv.date).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US'),
                          })}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-rose-100">
                        <div className="text-right">
                          <p className="text-xs text-slate-500 font-medium">
                            {t('blockingModal.amountDue')}
                          </p>
                          <p className="text-base font-black text-rose-950 font-['Outfit']">
                            ${inv.amount.toFixed(2)} {inv.currency}
                          </p>
                        </div>

                        {!isPaid && (
                          <button
                            type="button"
                            onClick={() => handleOpenPayment(inv)}
                            className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#00c868] hover:bg-[#00a855] text-white shadow-sm hover:shadow-md shadow-emerald-500/20 cursor-pointer inline-flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap shrink-0"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>{t('blockingModal.payNow')}</span>
                          </button>
                        )}

                        {isPaid && (
                          <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{t('blockingModal.settled')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment Card / Modal Form Sheet */}
          {selectedInvoiceForPayment && (
            <div className="p-5 rounded-2xl border border-emerald-300 bg-white shadow-xl space-y-4 animate-in slide-in-from-top-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 font-['Outfit']">
                      {t('blockingModal.paymentModal.title', {
                        invoiceNumber: selectedInvoiceForPayment.invoiceNumber,
                      })}
                    </h5>
                    <p className="text-xs text-slate-500">
                      {t('blockingModal.paymentModal.totalToPay', {
                        amount: selectedInvoiceForPayment.amount.toFixed(2),
                        currency: selectedInvoiceForPayment.currency,
                      })}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceForPayment(null)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
                >
                  {t('blockingModal.paymentModal.back')}
                </button>
              </div>

              <form onSubmit={handleExecutePayment} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t('blockingModal.paymentModal.cardholderLabel')}
                  </label>
                  <input
                    type="text"
                    required
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder={t('blockingModal.paymentModal.cardholderPlaceholder')}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t('blockingModal.paymentModal.cardNumberLabel')}
                  </label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4242 •••• •••• 4242"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t('blockingModal.paymentModal.cardExpiryLabel')}
                    </label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="12/28"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t('blockingModal.paymentModal.cardCvcLabel')}
                    </label>
                    <input
                      type="text"
                      required
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      placeholder="123"
                      maxLength={4}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                  <button
                    type="submit"
                    disabled={isProcessingPayment}
                    className="w-full sm:flex-1 py-3 px-4 rounded-xl text-xs font-black bg-[#00c868] hover:bg-[#00a855] text-white transition-all cursor-pointer inline-flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 whitespace-nowrap shrink-0"
                  >
                    {isProcessingPayment ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{t('blockingModal.paymentModal.processing')}</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>
                          {t('blockingModal.paymentModal.confirmButton', {
                            amount: selectedInvoiceForPayment.amount.toFixed(2),
                          })}
                        </span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFastSimulatePayment(selectedInvoiceForPayment)}
                    className="w-full sm:w-auto py-3 px-3 rounded-xl text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer text-center transition-colors whitespace-nowrap shrink-0"
                  >
                    {t('blockingModal.paymentModal.useTestCard')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Redesigned Elegant Footer & Action Buttons */}
          <div className="pt-6 border-t border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200/80">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t('blockingModal.automaticUnlockBadge')}</span>
              </div>

              {hasOverdueInvoices && !selectedInvoiceForPayment && (
                <button
                  type="button"
                  onClick={() => handleOpenPayment(invoices[0])}
                  className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl text-xs font-black text-white bg-[#00c868] hover:bg-[#00a855] shadow-sm hover:shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{t('blockingModal.payNow')}</span>
                </button>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
              <a
                href={`mailto:help@skoolia.net?subject=${encodeURIComponent(supportSubject)}&body=${encodeURIComponent(supportBody)}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                <span>{t('blockingModal.contactSupport')}</span>
              </a>

              <button
                type="button"
                onClick={onLogout}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{t('blockingModal.endSession')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
