import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Download,
  Calendar,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Receipt,
  Building,
  ShieldCheck,
  Infinity,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Clock,
  Lock,
  FileText,
  Zap,
  Globe2,
  MapPin,
  Mail,
  User,
  Coins,
  ReceiptText,
  Edit3,
  HardDrive,
  Users,
  Layers,
  PackagePlus,
  Server,
  Database,
  ChevronRight,
  ExternalLink,
  X,
  Info,
  AlertTriangle,
} from 'lucide-react';
import type {
  BillingCycle,
  BillingDetails,
  SubscriptionPlan,
  SubscriptionState,
  Invoice,
  WorkspaceUser,
  LicenseInventory,
  Tenant,
} from '../types';
import { SuperAdminBillingDashboard } from './SuperAdminBillingDashboard';
import { PaymentModal } from './PaymentModal';
import { FiscalDetailsModal } from './FiscalDetailsModal';
import {
  AMERICAS_COUNTRIES,
  getCountryConfig,
  getLocalizedCountryName,
  getLocalizedTaxIdLabel,
  getLocalizedStateLabel,
  getLocalizedPostalCodeLabel,
} from '../data/americasCountries';
import { SUBSCRIPTION_PRODUCTS } from '../data/currencyData';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { saveInstitutionBilling } from '../lib/firebase';
import { CustomLicenseQuoteCard } from './CustomLicenseQuoteCard';

interface BillingViewProps {
  licenses: LicenseInventory[];
  users: WorkspaceUser[];
  onTriggerPaymentModal?: () => void;
  tenants?: Tenant[];
  isSuperAdmin?: boolean;
  onOpenQuoteTicket?: () => void;
}

type BillingTab = 'plan' | 'payment_methods' | 'profile_taxes' | 'additional_services' | 'invoices';

export const BillingView: React.FC<BillingViewProps> = ({ licenses, users, tenants, isSuperAdmin, onOpenQuoteTicket }) => {
  const { user, institution, refreshProfile, isSuperAdmin: isSuperAdminAuth } = useAuth();
  const effectiveIsSuperAdmin = isSuperAdmin ?? isSuperAdminAuth;
  const { t, language } = useLanguage();

  // Mode for SuperAdmin: Global System Dashboard vs Individual Organization View
  const [superAdminViewMode, setSuperAdminViewMode] = useState<'GLOBAL_DASHBOARD' | 'MY_ORGANIZATION'>('GLOBAL_DASHBOARD');

  const [activeTab, setActiveTab] = useState<BillingTab>('plan');

  // Plan pricing
  const plan: SubscriptionPlan = {
    id: 'plan-standard-unlimited',
    name: 'Workspace Standard Unlimited',
    description: 'Gestão institucional com licenças ilimitadas Google Workspace, provisionamento multi-domínio e sincronização contínua.',
    monthlyPrice: SUBSCRIPTION_PRODUCTS.MONTHLY.basePriceUsd,
    annualPrice: SUBSCRIPTION_PRODUCTS.ANNUAL.basePriceUsd,
    currency: 'USD',
    isUnlimitedLicenses: true,
    features: [
      'Licenças Google Workspace Standard Ilimitadas',
      'Provisionamento e gestão de usuários sem restrição de contas',
      'Domínios e subdomínios ilimitados com verificação DNS',
      'Sincronização bidirecional de diretório em tempo real',
      'Isolamento multi-tenant e OUs dedicadas',
      'Importação e exportação em lote com relatórios instantâneos',
      'Suporte prioritário 24/7 e SLA garantido',
    ],
  };

  const getDisplayPlanName = (rawName?: string, cycle?: BillingCycle) => {
    const activeCycle = cycle || subscription?.billingCycle;
    return activeCycle === 'ANNUAL' ? 'Workspace Standard Unlimited - Annual' : 'Workspace Standard Unlimited - Monthly';
  };

  // Selected cycle in UI
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>('MONTHLY');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isFiscalModalOpen, setIsFiscalModalOpen] = useState(false);

  // Active Subscription State - dynamically loaded from Firestore tenant profile
  const [subscription, setSubscription] = useState<SubscriptionState>(() => {
    if (institution?.subscription) {
      return institution.subscription;
    }
    return {
      planId: 'plan-standard-unlimited',
      planName: 'Workspace Standard Unlimited - Monthly',
      status: 'TRIAL',
      billingCycle: 'MONTHLY',
      currentPrice: SUBSCRIPTION_PRODUCTS.MONTHLY.basePriceUsd,
      isUnlimitedLicenses: true,
      startDate: new Date().toISOString(),
      nextRenewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      paymentMethod: {
        brand: '',
        last4: '',
        expiry: '',
        cardholder: '',
      },
      billingDetails: {
        fullName: institution?.billingDetails?.fullName || '',
        email: institution?.billingDetails?.email || institution?.billingContact?.email || institution?.ownerEmail || '',
        taxId: institution?.billingDetails?.taxId || '',
        address: institution?.billingDetails?.address || '',
        neighborhood: institution?.billingDetails?.neighborhood || '',
        city: institution?.billingDetails?.city || '',
        state: institution?.billingDetails?.state || '',
        zipCode: institution?.billingDetails?.zipCode || '',
        country: institution?.billingDetails?.country || institution?.country || 'Brasil',
        countryCode: institution?.billingDetails?.countryCode || institution?.countryCode || 'BR',
      },
      additionalServices: institution?.subscription?.additionalServices || [],
    };
  });

  // Loading state while checking real-time Stripe status to prevent UI flicker or false active state
  const [isVerifyingStripeStatus, setIsVerifyingStripeStatus] = useState<boolean>(true);

  // Calculate opposite billing cycle for active plan toggle
  const isCurrentMonthly = subscription.billingCycle === 'MONTHLY';
  const oppositeCycle: BillingCycle = isCurrentMonthly ? 'ANNUAL' : 'MONTHLY';

  // Financial email defined in Stripe or organization settings
  const financialEmail =
    institution?.stripeFinancialEmail ||
    institution?.financialContactEmail ||
    subscription.billingDetails?.email ||
    institution?.billingContact?.email ||
    institution?.ownerEmail ||
    user?.email ||
    '';

  // Invoice History - Stripe is the single source of truth
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  // Fetch real-time invoices from Stripe API filtered strictly by the financial email / customer ID
  const fetchStripeInvoices = async () => {
    const targetEmail =
      institution?.stripeFinancialEmail ||
      institution?.financialContactEmail ||
      subscription.billingDetails?.email ||
      institution?.billingContact?.email ||
      institution?.ownerEmail ||
      user?.email;

    const customerId = institution?.stripeCustomerId || (subscription as any)?.stripeCustomerId;

    if (!targetEmail && !customerId) {
      setInvoices([]);
      return;
    }

    setIsLoadingInvoices(true);
    setInvoiceError(null);

    try {
      const res = await fetch('/api/billing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          customerId,
          tenantUid: institution?.id || user?.uid,
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.invoices)) {
        // Merge with any institution invoices from Firestore to ensure complete coverage
        const localInvs: Invoice[] = [
          ...(Array.isArray((institution as any)?.invoices) ? (institution as any).invoices : []),
          ...(Array.isArray((subscription as any)?.invoices) ? (subscription as any).invoices : []),
        ];
        const combined = [...data.invoices];
        for (const loc of localInvs) {
          if (loc && loc.id && !combined.some((i) => i.id === loc.id || (loc.invoiceNumber && i.invoiceNumber === loc.invoiceNumber))) {
            combined.push(loc);
          }
        }
        combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setInvoices(combined);
      } else if (data.error) {
        setInvoiceError(data.error);
      }
    } catch (err: any) {
      console.warn('Note fetching invoices:', err);
      setInvoiceError('Não foi possível carregar as faturas.');
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  // Helper to identify strictly voided invoices
  const isInvoiceVoided = (inv: Invoice): boolean => {
    if (!inv) return false;
    const s = (inv.status || '').toUpperCase();
    if (s === 'VOID' || s === 'VOIDED' || s === 'CANCELED' || s === 'CANCELLED') return true;
    const voidedList = (institution as any)?.voidedInvoiceIds || [];
    if (inv.id && voidedList.includes(inv.id)) return true;
    if (inv.invoiceNumber && voidedList.includes(inv.invoiceNumber)) return true;
    return false;
  };

  // Helper to identify overdue invoices
  const isInvoiceOverdue = (inv: Invoice): boolean => {
    if (!inv || isInvoiceVoided(inv)) return false;
    const s = (inv.status || '').toUpperCase();
    if (s === 'OVERDUE' || s === 'PAST_DUE' || s === 'UNCOLLECTIBLE') return true;
    if (inv.dueDate && (s === 'OPEN' || s === 'PENDING')) {
      return new Date(inv.dueDate).getTime() < Date.now();
    }
    return false;
  };

  // For tenant admin: Only show PAID, OVERDUE, or PENDING/OPEN invoices. NEVER show VOIDED invoices.
  const visibleInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (isInvoiceVoided(inv)) return false;
      const s = (inv.status || '').toUpperCase();
      return s === 'PAID' || s === 'OPEN' || s === 'PENDING' || s === 'OVERDUE' || s === 'PAST_DUE';
    });
  }, [invoices, (institution as any)?.voidedInvoiceIds]);

  // Count voided invoices to inform tenant admin
  const voidedInvoicesCount = useMemo(() => {
    return invoices.filter(isInvoiceVoided).length;
  }, [invoices, (institution as any)?.voidedInvoiceIds]);

  // Keep state synchronized whenever institution in AuthContext updates
  useEffect(() => {
    if (institution?.subscription) {
      setSubscription(institution.subscription);
    } else if (institution?.billingDetails) {
      setSubscription((prev) => ({
        ...prev,
        billingDetails: {
          fullName: institution.billingDetails?.fullName || '',
          email: institution.billingDetails?.email || institution?.billingContact?.email || institution?.ownerEmail || '',
          taxId: institution.billingDetails?.taxId || '',
          address: institution.billingDetails?.address || '',
          neighborhood: institution.billingDetails?.neighborhood || '',
          city: institution.billingDetails?.city || '',
          state: institution.billingDetails?.state || '',
          zipCode: institution.billingDetails?.zipCode || '',
          country: institution.billingDetails?.country || prev.billingDetails?.country || 'Brasil',
          countryCode: institution.billingDetails?.countryCode || prev.billingDetails?.countryCode || 'BR',
        },
      }));
    }
  }, [institution]);

  // Automatically fetch Stripe invoices on mount and whenever financial identity updates
  useEffect(() => {
    fetchStripeInvoices();
  }, [
    institution?.stripeFinancialEmail,
    institution?.financialContactEmail,
    subscription.billingDetails?.email,
    institution?.billingContact?.email,
    institution?.ownerEmail,
    institution?.stripeCustomerId,
    institution?.id,
    user?.email,
  ]);

  // Check Stripe in real-time to determine if the customer has an active paid subscription (without trial) or is in trial
  useEffect(() => {
    let isMounted = true;
    const checkStripeStatus = async () => {
      const customerId = institution?.stripeCustomerId || (subscription as any)?.stripeCustomerId;
      const email =
        institution?.stripeFinancialEmail ||
        institution?.financialContactEmail ||
        subscription.billingDetails?.email ||
        institution?.billingContact?.email ||
        institution?.ownerEmail ||
        user?.email;

      if (!customerId && !email) {
        if (isMounted) setIsVerifyingStripeStatus(false);
        return;
      }

      try {
        const res = await fetch('/api/billing/sync-subscription-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId,
            email,
            tenantUid: institution?.id || user?.uid,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success) {
            setSubscription((prev) => {
              const updatedStatus = data.status === 'ACTIVE' && !data.isTrial ? 'ACTIVE' : 'TRIAL';
              const newQty = data.quantity || data.licenseLimit || prev.quantity || prev.licenseLimit || 200;
              return {
                ...prev,
                status: updatedStatus,
                billingCycle: data.billingCycle || prev.billingCycle,
                nextRenewalDate: data.nextRenewalDate || prev.nextRenewalDate,
                quantity: newQty,
                licenseLimit: newQty,
              };
            });
          }
        }
      } catch (err) {
        console.warn('Note checking Stripe subscription status:', err);
      } finally {
        if (isMounted) {
          setIsVerifyingStripeStatus(false);
        }
      }
    };

    checkStripeStatus();
    return () => {
      isMounted = false;
    };
  }, [institution?.stripeCustomerId, institution?.stripeFinancialEmail, institution?.financialContactEmail, user?.email]);

  const activeCountryCfg = getCountryConfig(subscription.billingDetails?.country || 'Brasil');

  const activeUserCount = users.filter((u) => u.status === 'ACTIVE').length;
  const annualSavingsUsd = plan.monthlyPrice * 12 - plan.annualPrice; // $399.89

  const handlePaymentSuccess = (newSub: SubscriptionState, newInvoice: Invoice) => {
    setSubscription(newSub);
    setInvoices((prev) => [newInvoice, ...prev.filter((i) => i.id !== newInvoice.id)]);
    if (refreshProfile) {
      refreshProfile();
    }
    // Refresh Stripe invoices
    setTimeout(() => {
      fetchStripeInvoices();
    }, 1500);
  };

  const [emailSendingId, setEmailSendingId] = useState<string | null>(null);
  const [emailSentNotice, setEmailSentNotice] = useState<string | null>(null);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [portalNotice, setPortalNotice] = useState<{ type: 'error' | 'info'; message: string } | null>(null);

  // Opens Stripe Customer Portal for managing subscription, payment methods & invoices
  const handleOpenCustomerPortal = async () => {
    setIsOpeningPortal(true);
    setPortalNotice(null);

    const customerId = institution?.stripeCustomerId || (subscription as any)?.stripeCustomerId;
    const email =
      institution?.stripeFinancialEmail ||
      institution?.financialContactEmail ||
      subscription.billingDetails?.email ||
      institution?.billingContact?.email ||
      institution?.ownerEmail ||
      user?.email;

    try {
      const res = await fetch('/api/billing/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          email,
          tenantUid: institution?.id || user?.uid,
          institutionName: institution?.institutionName || institution?.name || subscription.billingDetails?.fullName,
          returnUrl: window.location.href,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.url) {
        // Redirect to Stripe Customer Portal
        window.location.href = data.url;
      } else {
        const errorMsg = data?.error || 'Não foi possível carregar o Portal do Cliente no momento.';
        setPortalNotice({
          type: 'error',
          message: errorMsg,
        });
        setTimeout(() => setPortalNotice(null), 7000);
      }
    } catch (err: any) {
      setPortalNotice({
        type: 'error',
        message: err?.message || 'Erro ao comunicar com o servidor do Portal.',
      });
      setTimeout(() => setPortalNotice(null), 7000);
    } finally {
      setIsOpeningPortal(false);
    }
  };

  // Resends the official Stripe invoice and PDF receipt to the registered financial email
  const handleSendInvoiceEmail = async (inv: Invoice) => {
    const targetEmail =
      inv.customerEmail ||
      financialEmail ||
      subscription.billingDetails?.email ||
      institution?.stripeFinancialEmail ||
      institution?.financialContactEmail ||
      institution?.ownerEmail ||
      user?.email;

    if (!targetEmail) {
      alert('Nenhum e-mail financeiro registrado para envio do comprovante.');
      return;
    }

    setEmailSendingId(inv.id);
    setEmailSentNotice(null);

    try {
      const res = await fetch('/api/billing/send-invoice-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-language': language,
        },
        body: JSON.stringify({
          to: targetEmail,
          customerName: subscription.billingDetails?.fullName || institution?.name || 'Responsável Financeiro',
          invoiceNumber: inv.invoiceNumber,
          invoiceId: inv.id,
          amount: inv.amount,
          currency: inv.currency || 'USD',
          billingCycle: inv.billingCycle,
          planName: inv.planName,
          paymentMethod: inv.paymentMethod,
          taxId: subscription.billingDetails?.taxId || '-',
          invoicePdfUrl: inv.invoicePdfUrl,
          hostedInvoiceUrl: inv.hostedInvoiceUrl,
          preferredLanguage: language,
          lang: language,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEmailSentNotice(t('billing.invoices.emailResentSuccess', { number: inv.invoiceNumber, email: targetEmail }));
        setTimeout(() => setEmailSentNotice(null), 6000);
      } else {
        alert(data.error || 'Erro ao reenviar e-mail da fatura.');
      }
    } catch (err: any) {
      alert(`Erro ao reenviar fatura: ${err?.message}`);
    } finally {
      setEmailSendingId(null);
    }
  };

  // Downloads official PDF file or opens Hosted Invoice receipt
  const handleDownloadInvoice = (inv: Invoice) => {
    // 1. If official PDF URL exists, trigger download / open in new tab
    if (inv.invoicePdfUrl) {
      window.open(inv.invoicePdfUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // 2. If Hosted Invoice URL exists, open it
    if (inv.hostedInvoiceUrl) {
      window.open(inv.hostedInvoiceUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // 3. Fallback: generate local text invoice receipt
    const countryCfg = getCountryConfig(subscription.billingDetails?.country || 'Brasil');
    const content = `=====================================================
RECIBO DE PAGAMENTO & COMPROVANTE FISCAL
=====================================================
Número da Fatura: ${inv.invoiceNumber}
Data de Emissão: ${new Date(inv.date).toLocaleDateString('pt-BR')}
Status: ${inv.status}
Moeda: ${inv.currency || 'USD'}
Valor Total: $ ${inv.amount.toFixed(2)} ${inv.currency || 'USD'}

DETALHES DA ASSINATURA:
-----------------------------------------------------
Plano: ${inv.planName}
Ciclo de Cobrança: ${inv.billingCycle === 'ANNUAL' ? 'Anual' : 'Mensal'}
Licenças: ILIMITADAS (Google Workspace Provisioning)

MÉTODO DE PAGAMENTO:
-----------------------------------------------------
Forma: ${inv.paymentMethod.replace(/\(?stripe\)?/gi, '').trim() || 'Cartão de Crédito'}
Processamento Seguro e Criptografado

DADOS DO RESPONSÁVEL FINANCEIRO:
-----------------------------------------------------
E-mail Financeiro: ${inv.customerEmail || financialEmail || 'Não informado'}
País: ${countryCfg.flag} ${countryCfg.name} (${countryCfg.region})
Razão Social / Nome: ${subscription.billingDetails?.fullName || 'Não informado'}
${countryCfg.taxIdLabel}: ${subscription.billingDetails?.taxId || 'Não informado'}
Endereço: ${subscription.billingDetails?.address || 'Não informado'}${subscription.billingDetails?.neighborhood ? `, ${subscription.billingDetails?.neighborhood}` : ''}
${countryCfg.stateLabel} / ${countryCfg.postalCodeLabel}: ${subscription.billingDetails?.state || '-'}, ${subscription.billingDetails?.zipCode || '-'}
Cidade: ${subscription.billingDetails?.city || '-'}

=====================================================
Documento emitido para controle financeiro e fiscal.`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${inv.invoiceNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const hasBillingDetails = Boolean(
    subscription.billingDetails?.fullName?.trim() || subscription.billingDetails?.taxId?.trim()
  );
  const hasPaymentMethod = Boolean(
    subscription.paymentMethod?.last4 &&
    subscription.paymentMethod.last4.trim() !== '' &&
    subscription.paymentMethod.last4.toUpperCase() !== 'TRIAL' &&
    !subscription.paymentMethod.brand?.toLowerCase().includes('trial') &&
    !subscription.paymentMethod.brand?.toLowerCase().includes('sem cartão') &&
    !subscription.paymentMethod.brand?.toLowerCase().includes('stripe') &&
    /^\d{4}$/.test(subscription.paymentMethod.last4.trim())
  );

  // For SuperAdmin: Show the Global System Billing Dashboard by default
  if (effectiveIsSuperAdmin && superAdminViewMode === 'GLOBAL_DASHBOARD') {
    return (
      <SuperAdminBillingDashboard
        tenants={tenants}
        onSwitchToMyOrg={() => setSuperAdminViewMode('MY_ORGANIZATION')}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* SuperAdmin return to global dashboard banner */}
      {effectiveIsSuperAdmin && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-[#163300] text-[#9FE870] rounded-2xl shadow-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#9FE870] shrink-0" />
            <div>
              <div className="text-xs font-black uppercase tracking-wider font-['Outfit']">
                {language === 'pt' ? 'Visão Individual de Organização (Superadmin)' : language === 'es' ? 'Vista Individual de Organización (Superadmin)' : 'Individual Organization View (SuperAdmin)'}
              </div>
              <div className="text-[11px] text-white/80">
                {language === 'pt'
                  ? 'Você está visualizando a assinatura e os dados locais desta organização específica.'
                  : language === 'es'
                  ? 'Estás visualizando la suscripción y datos locales de esta organización.'
                  : 'You are inspecting the local billing profile of this specific organization.'}
              </div>
            </div>
          </div>

          <button
            onClick={() => setSuperAdminViewMode('GLOBAL_DASHBOARD')}
            className="px-4 py-2 rounded-full bg-[#9FE870] hover:bg-[#8EE05B] text-[#163300] text-xs font-black cursor-pointer transition-all shadow-xs shrink-0 whitespace-nowrap"
          >
            {language === 'pt'
              ? '← Voltar ao Dashboard Global do Sistema'
              : language === 'es'
              ? '← Volver al Panel Global del Sistema'
              : '← Return to Global System Dashboard'}
          </button>
        </div>
      )}

      {/* Top Header Card - Wise Architecture */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#E2E6DF] shadow-xs space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#E8F7DC] text-[#163300] flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-black text-[#0E0F0C] font-['Outfit'] tracking-tight">
                  {t('billing.title')}
                </h1>
                <span className="bg-[#E8F7DC] text-[#163300] text-[10px] sm:text-xs font-black px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-[#9FE870]/40 flex items-center gap-1">
                  <Infinity className="w-3.5 h-3.5 stroke-[2.5]" /> {t('billing.unlimitedBadge')}
                </span>
              </div>
              <p className="text-xs text-[#5E605D] mt-0.5 font-medium">
                {t('billing.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              disabled={isOpeningPortal}
              onClick={handleOpenCustomerPortal}
              id="btn-open-payment-modal"
              className="h-10 sm:h-11 px-4 sm:px-6 rounded-full bg-[#9FE870] hover:bg-[#8EE05B] text-[#163300] text-xs sm:text-sm font-black transition-all inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98 disabled:opacity-60 w-full sm:w-auto whitespace-nowrap"
            >
              {isOpeningPortal ? (
                <RefreshCw className="w-4 h-4 animate-spin stroke-[2.5]" />
              ) : (
                <Zap className="w-4 h-4 stroke-[2.5]" />
              )}
              <span>{isOpeningPortal ? t('billing.openingPortalBtn') : t('billing.manageSubscriptionBtn')}</span>
            </button>
          </div>
        </div>

        {portalNotice && (
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border text-xs flex items-start gap-2.5 ${
              portalNotice.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-[#E8F7DC] border-[#9FE870] text-[#163300]'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{portalNotice.message}</p>
            </div>
          </div>
        )}
      </div>

      {/* Sub-tabs Navigation Bar */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E2E6DF] p-1.5 sm:p-2 shadow-xs">
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
          <button
            type="button"
            id="billing-tab-plan"
            onClick={() => setActiveTab('plan')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'plan'
                ? 'bg-[#163300] text-[#9FE870] shadow-xs'
                : 'text-[#5E605D] hover:text-[#0E0F0C] hover:bg-[#F4F5F0]'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'plan' ? 'text-[#9FE870]' : 'text-[#868685]'}`} />
            <span>{t('billing.tabs.currentPlan')}</span>
          </button>

          <button
            type="button"
            id="billing-tab-payment-methods"
            onClick={() => setActiveTab('payment_methods')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'payment_methods'
                ? 'bg-[#163300] text-[#9FE870] shadow-xs'
                : 'text-[#5E605D] hover:text-[#0E0F0C] hover:bg-[#F4F5F0]'
            }`}
          >
            <CreditCard className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'payment_methods' ? 'text-[#9FE870]' : 'text-[#868685]'}`} />
            <span>{t('billing.tabs.paymentMethods')}</span>
          </button>

          <button
            type="button"
            id="billing-tab-profile-taxes"
            onClick={() => setActiveTab('profile_taxes')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'profile_taxes'
                ? 'bg-[#163300] text-[#9FE870] shadow-xs'
                : 'text-[#5E605D] hover:text-[#0E0F0C] hover:bg-[#F4F5F0]'
            }`}
          >
            <Building className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'profile_taxes' ? 'text-[#9FE870]' : 'text-[#868685]'}`} />
            <span>{t('billing.tabs.profileTaxes')}</span>
          </button>

          <button
            type="button"
            id="billing-tab-additional-services"
            onClick={() => setActiveTab('additional_services')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'additional_services'
                ? 'bg-[#163300] text-[#9FE870] shadow-xs'
                : 'text-[#5E605D] hover:text-[#0E0F0C] hover:bg-[#F4F5F0]'
            }`}
          >
            <PackagePlus className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'additional_services' ? 'text-[#9FE870]' : 'text-[#868685]'}`} />
            <span>{t('billing.tabs.additionalServices')}</span>
            {(subscription.additionalServices || []).filter((s) => s.status === 'ACTIVE').length > 0 && (
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                activeTab === 'additional_services'
                  ? 'bg-[#9FE870] text-[#163300]'
                  : 'bg-[#E8F7DC] text-[#163300]'
              }`}>
                {(subscription.additionalServices || []).filter((s) => s.status === 'ACTIVE').length}
              </span>
            )}
          </button>

          <button
            type="button"
            id="billing-tab-invoices"
            onClick={() => setActiveTab('invoices')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'invoices'
                ? 'bg-[#163300] text-[#9FE870] shadow-xs'
                : 'text-[#5E605D] hover:text-[#0E0F0C] hover:bg-[#F4F5F0]'
            }`}
          >
            <Receipt className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'invoices' ? 'text-[#9FE870]' : 'text-[#868685]'}`} />
            <span>{t('billing.tabs.invoices')}</span>
            {invoices.length > 0 && (
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                activeTab === 'invoices'
                  ? 'bg-[#9FE870] text-[#163300]'
                  : 'bg-[#F4F5F0] text-[#5E605D]'
              }`}>
                {invoices.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active Sub-Tab View Container with smooth transition */}
      <div key={activeTab} className="animate-view-enter">
        {/* Tab 1: Plano Atual (Current Plan) */}
        {activeTab === 'plan' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E2E6DF] p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-6">
            {/* Official Trial Banner (Yellow/Amber if in Trial status or Verifying) */}
            {isVerifyingStripeStatus ? (
              <div className="p-4.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-950 space-y-2 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 text-amber-700 animate-spin" />
                    <span className="font-black text-xs uppercase tracking-wider text-amber-950 font-['Outfit']">
                      {t('billing.verifyingStatus')}
                    </span>
                  </div>
                  <span className="text-[11px] font-black bg-amber-200 text-amber-950 px-3 py-0.5 rounded-full border border-amber-300/80">
                    {t('billing.syncingBadge')}
                  </span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  {t('billing.validatingStatusDesc')}
                </p>
              </div>
            ) : subscription.status === 'TRIAL' ? (
              <div className="p-4.5 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 bg-amber-200/90 text-amber-950 border border-amber-400/80 shadow-2xs font-['Outfit']">
                      <Clock className="w-3.5 h-3.5 text-amber-900" />
                      <span>{t('billing.trialBadge')}</span>
                    </span>
                    <span className="text-xs text-amber-900 font-bold">
                      {subscription.billingCycle === 'ANNUAL' ? t('billing.cycleAnnual') : t('billing.cycleMonthly')}
                    </span>
                  </div>
                  <span className="text-[11px] font-black bg-amber-200 text-amber-950 px-3 py-1 rounded-full border border-amber-300/80 shadow-2xs">
                    {t('billing.trialUnlimitedBadge')}
                  </span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  {t('billing.trialDesc')}
                </p>
              </div>
            ) : (
              <div className="p-4.5 rounded-2xl bg-[#E8F7DC]/60 border border-[#9FE870]/60 text-[#163300] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#163300]" />
                    <span className="font-black text-xs uppercase tracking-wider text-[#163300] font-['Outfit']">
                      {t('billing.activeSubTitle')}
                    </span>
                  </div>
                  <span className="text-[11px] font-black bg-[#163300] text-[#9FE870] px-3 py-0.5 rounded-full shadow-2xs">
                    {subscription.billingCycle === 'ANNUAL' ? t('billing.planAnnual') : t('billing.planMonthly')}
                  </span>
                </div>
                <p className="text-xs text-[#163300]/90 leading-relaxed font-medium">
                  {t('billing.activeSubDesc')}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E2E6DF]">
              <div className="space-y-1.5">
                {subscription.status !== 'TRIAL' && (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 bg-[#E8F7DC] text-[#163300] border border-[#9FE870]/40">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#163300]" />
                      <span>{t('billing.activeSubBadge')}</span>
                    </span>
                    <span className="text-xs text-[#868685] font-semibold">
                      {subscription.billingCycle === 'ANNUAL' ? t('billing.cycleAnnual') : t('billing.cycleMonthly')}
                    </span>
                  </div>
                )}
                <h2 className="text-2xl font-black text-[#0E0F0C] font-['Outfit'] tracking-tight">
                  {getDisplayPlanName(subscription.planName)}
                </h2>
                <p className="text-xs text-[#5E605D] max-w-xl leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <div className="p-4.5 bg-[#F4F5F0] rounded-2xl border border-[#E2E6DF] text-left sm:text-right shrink-0 space-y-1">
                <p className="text-xs font-semibold text-[#5E605D]">{t('billing.currentValueLabel')}</p>
                <p className="text-2xl sm:text-3xl font-black text-[#0E0F0C] font-['Outfit'] tracking-tight">
                  {subscription.billingCycle === 'ANNUAL'
                    ? `$ 1.999,99`
                    : `$ 199,99`}
                  <span className="text-xs font-normal text-[#5E605D] block sm:inline">
                    {subscription.billingCycle === 'ANNUAL' ? t('billing.perYearUsd') : t('billing.perMonthUsd')}
                  </span>
                </p>
                <div className="pt-2 flex sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="w-full sm:w-auto px-3.5 py-1.5 rounded-full bg-[#163300] hover:bg-[#204700] text-[#9FE870] font-black text-xs transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-2xs active:scale-98"
                    title="Alterar para Plano Anual"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#9FE870] shrink-0" />
                    <span>{subscription.billingCycle === 'MONTHLY' ? (t('billing.planOptions.changeToAnnualBtn') || 'Alterar para Anual') : (t('billing.planOptions.changeToMonthlyBtn') || 'Opções de Plano')}</span>
                    {subscription.billingCycle === 'MONTHLY' && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-[#9FE870] text-[#163300] ml-0.5">
                        -17%
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Metrics Grid - Responsive 2x2 on mobile, 4 columns on xl */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
              {/* Card 1: Quantidade de Licenças */}
              <div className="p-3 sm:p-4 rounded-2xl bg-[#F4F5F0] border border-[#E2E6DF] flex flex-col justify-between min-h-[110px] sm:min-h-[125px] space-y-2">
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-[11px] sm:text-xs text-[#5E605D] font-medium leading-tight line-clamp-1">{t('billing.metrics.licenseCount')}</p>
                  <p className="text-lg sm:text-xl font-black text-[#163300] flex items-center gap-1.5 font-['Outfit']">
                    <span>{subscription.quantity ?? subscription.licenseLimit ?? 200}</span>
                    <span className="text-xs font-semibold text-[#5E605D]">licenças</span>
                  </p>
                </div>
                <div className="pt-1.5 sm:pt-2 border-t border-[#E2E6DF]">
                  <div className="text-[10px] sm:text-[11px] font-bold text-[#163300] bg-[#E8F7DC] px-1.5 sm:px-2 py-0.5 rounded-md border border-[#9FE870]/40 flex items-center justify-between gap-1 leading-snug">
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-[#163300] shrink-0" />
                      <span>{activeUserCount}/{subscription.quantity ?? subscription.licenseLimit ?? 200} em uso</span>
                    </span>
                    <span className="text-[9px] text-[#5E605D] font-medium hidden sm:inline">
                      ({Math.max(0, (subscription.quantity ?? subscription.licenseLimit ?? 200) - activeUserCount)} livres)
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Usuários Ativos */}
              <div className="p-3 sm:p-4 rounded-2xl bg-[#F4F5F0] border border-[#E2E6DF] flex flex-col justify-between min-h-[110px] sm:min-h-[125px] space-y-2">
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-[11px] sm:text-xs text-[#5E605D] font-medium leading-tight line-clamp-1">{t('billing.metrics.activeUsers')}</p>
                  <p className="text-xl sm:text-2xl font-black text-[#0E0F0C] font-['Outfit'] flex items-center gap-1.5 sm:gap-2">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#5E605D] shrink-0" />
                    <span>{activeUserCount}</span>
                  </p>
                </div>
              </div>

              {/* Card 3: Próxima Renovação */}
              <div className="p-3 sm:p-4 rounded-2xl bg-[#F4F5F0] border border-[#E2E6DF] flex flex-col justify-between min-h-[110px] sm:min-h-[125px] space-y-2">
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-[11px] sm:text-xs text-[#5E605D] font-medium leading-tight line-clamp-1">{t('billing.metrics.nextRenewal')}</p>
                  <p className="text-sm sm:text-base font-bold text-[#0E0F0C] font-['Outfit'] flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#5E605D] shrink-0" />
                    <span className="truncate">{new Date(subscription.nextRenewalDate).toLocaleDateString('pt-BR')}</span>
                  </p>
                </div>
              </div>

              {/* Card 4: Serviços Adicionais */}
              <div className="p-3 sm:p-4 rounded-2xl bg-[#F4F5F0] border border-[#E2E6DF] flex flex-col justify-between min-h-[110px] sm:min-h-[125px] space-y-2">
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-[11px] sm:text-xs text-[#5E605D] font-medium leading-tight line-clamp-1">{t('billing.metrics.additionalServices')}</p>
                  <p className="text-xl sm:text-2xl font-black text-[#0E0F0C] font-['Outfit'] flex items-center gap-1.5 sm:gap-2">
                    <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-[#163300] shrink-0" />
                    <span>{(subscription.additionalServices || []).filter((s) => s.status === 'ACTIVE').length}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Quick action to view invoices or change frequency */}
            <div className="pt-2 border-t border-[#E2E6DF] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#5E605D]">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#163300]" />
                {t('billing.autoRenewalBadge')}
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('invoices')}
                  className="w-full sm:w-auto px-4 py-2 rounded-full border border-[#D4DACF] bg-[#F4F5F0] hover:bg-[#E8F7DC] text-[#0E0F0C] hover:text-[#163300] font-bold text-xs transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>{t('billing.tabs.invoices')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenCustomerPortal}
                  disabled={isOpeningPortal}
                  className="w-full sm:w-auto px-4 py-2 rounded-full bg-[#163300] hover:bg-[#204700] text-[#9FE870] font-black text-xs transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isOpeningPortal ? t('billing.openingPortalBtn') : t('billing.manageSubscriptionBtn')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Custom Quantity Quote Card */}
          <CustomLicenseQuoteCard onOpenTicket={onOpenQuoteTicket} />
        </div>
      )}

      {/* Tab 2: Meios de Pagamento (Payment Methods) */}
      {activeTab === 'payment_methods' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E2E6DF] p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E6DF]">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#E8F7DC] text-[#163300] flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-black text-[#0E0F0C] font-['Outfit']">
                    {t('billing.cardSection.title')}
                  </h3>
                </div>
                <p className="text-xs text-[#5E605D] mt-1">
                  Gerencie cartões cadastrados e preferências de faturamento com segurança certificada PCI-DSS.
                </p>
              </div>
              <span className="text-xs text-[#163300] font-semibold flex items-center gap-1 bg-[#E8F7DC] px-3 py-1 rounded-full border border-[#9FE870]/40">
                <Lock className="w-3 h-3 text-[#163300]" /> {t('billing.cardSection.secureBadge')}
              </span>
            </div>

            {hasPaymentMethod ? (
              <div className="p-5 bg-[#F4F5F0] rounded-2xl border border-[#E2E6DF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-[#E2E6DF] flex items-center justify-center text-[#163300] shadow-2xs font-bold text-sm shrink-0">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-base font-bold text-[#0E0F0C]">
                      {subscription.paymentMethod.brand || 'Cartão'} •••• {subscription.paymentMethod.last4}
                    </p>
                    <p className="text-xs text-[#5E605D]">
                      {t('billing.cardSection.validity')} {subscription.paymentMethod.expiry} • {subscription.paymentMethod.cardholder}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#163300] pt-1">
                      <CheckCircle2 className="w-3 h-3 text-[#163300]" /> Cartão Principal de Cobrança
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isOpeningPortal}
                  onClick={handleOpenCustomerPortal}
                  className="px-4 py-2.5 bg-white hover:bg-[#E8F7DC] text-[#163300] border border-[#CBD3C5] hover:border-[#9FE870] rounded-full font-black text-xs transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-2xs shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isOpeningPortal ? t('billing.openingPortalBtn') : t('billing.cardSection.changeBtn')}</span>
                </button>
              </div>
            ) : (
              <div className="p-6 bg-[#F4F5F0] rounded-2xl border border-dashed border-[#CBD3C5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-[#E2E6DF] flex items-center justify-center text-[#868685] shrink-0">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-[#0E0F0C]">{t('billing.cardSection.noCardTitle')}</p>
                    <p className="text-xs text-[#5E605D] mt-0.5 max-w-md">
                      {subscription.status === 'TRIAL'
                        ? t('billing.cardSection.noCardTrialDesc')
                        : t('billing.cardSection.noCardActiveDesc')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isOpeningPortal}
                  onClick={handleOpenCustomerPortal}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#9FE870] hover:bg-[#8EE05B] text-[#163300] rounded-full font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs active:scale-98 disabled:opacity-60 shrink-0 whitespace-nowrap"
                >
                  {isOpeningPortal ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('billing.openingPortalBtn')}</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{t('billing.cardSection.addCardBtn')}</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="p-4 bg-[#F9FAF8] rounded-2xl border border-[#E2E6DF] flex items-start gap-3 text-xs text-[#5E605D]">
              <ShieldCheck className="w-5 h-5 text-[#163300] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-[#0E0F0C]">Processamento Seguro e Criptografado</p>
                <p className="text-[11px] leading-relaxed">
                  Os dados de pagamento são criptografados de ponta a ponta com conformidade bancária PCI-DSS Nível 1. Não armazenamos informações sensíveis de cartões em nossos servidores.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Dados Fiscais & Perfil (Billing Profile & Taxes) */}
      {activeTab === 'profile_taxes' && (
        <div className="space-y-4 sm:space-y-6">
          {(() => {
            const countryCfg = getCountryConfig(subscription.billingDetails?.country || 'Brasil');
            return (
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E2E6DF] p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E6DF]">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#E8F7DC] text-[#163300] flex items-center justify-center">
                        <Building className="w-4 h-4" />
                      </div>
                      <h3 className="text-base font-black text-[#0E0F0C] font-['Outfit']">
                        {t('billing.fiscalProfile.title')}
                      </h3>
                    </div>
                    <p className="text-xs text-[#5E605D] mt-1">
                      {t('billing.fiscalProfile.subtitle')}
                    </p>
                  </div>
                  <span className="text-xs text-[#0E0F0C] font-bold bg-[#F4F5F0] px-3 py-1.5 rounded-full border border-[#E2E6DF] flex items-center gap-1.5 shadow-2xs self-start sm:self-auto">
                    <span className="text-base">{countryCfg.flag}</span>
                    <span>{getLocalizedCountryName(countryCfg, language)}</span>
                  </span>
                </div>

                {hasBillingDetails ? (
                  <div className="p-5 bg-[#F4F5F0] rounded-2xl border border-[#E2E6DF] text-xs space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#868685] tracking-wider block">
                          {t('billing.fiscalProfile.legalName')}
                        </span>
                        <p className="font-bold text-[#0E0F0C] text-base mt-0.5">
                          {subscription.billingDetails.fullName || t('billing.fiscalProfile.notInformed')}
                        </p>
                        <p className="text-[#5E605D] flex items-center gap-1.5 mt-1">
                          <Mail className="w-3.5 h-3.5 text-[#868685]" />
                          <span className="font-medium">{subscription.billingDetails.email || t('billing.fiscalProfile.notInformed')}</span>
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#E2E6DF] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-white rounded-xl border border-[#E2E6DF]">
                        <span className="text-[#868685] text-[11px] block">{getLocalizedTaxIdLabel(countryCfg, language)}:</span>
                        <span className="font-mono font-bold text-[#0E0F0C] text-sm mt-0.5 block">
                          {subscription.billingDetails.taxId || '-'}
                        </span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-[#E2E6DF]">
                        <span className="text-[#868685] text-[11px] block">{getLocalizedStateLabel(countryCfg, language)} / {getLocalizedPostalCodeLabel(countryCfg, language)}:</span>
                        <span className="font-semibold text-[#0E0F0C] mt-0.5 block">
                          {subscription.billingDetails.state || '-'} • {subscription.billingDetails.zipCode || '-'}
                        </span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-[#E2E6DF] sm:col-span-2 lg:col-span-1">
                        <span className="text-[#868685] text-[11px] block">{t('billing.fiscalProfile.addressLabel')}</span>
                        <span className="text-[#5E605D] mt-0.5 block line-clamp-2 font-medium">
                          {subscription.billingDetails.address || '-'}
                          {subscription.billingDetails.neighborhood
                            ? `, ${subscription.billingDetails.neighborhood}`
                            : ''}
                          {subscription.billingDetails.city ? `, ${subscription.billingDetails.city}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 bg-[#F4F5F0] rounded-2xl border border-dashed border-[#CBD3C5] text-xs space-y-2">
                    <div className="flex items-start gap-3 text-[#5E605D]">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-[#0E0F0C] text-sm">{t('billing.fiscalProfile.noFiscalTitle')}</p>
                        <p className="text-xs text-[#868685] mt-1 max-w-lg leading-relaxed">
                          {t('billing.fiscalProfile.noFiscalDesc')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    id="open-fiscal-details-modal-btn"
                    type="button"
                    onClick={() => setIsFiscalModalOpen(true)}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-[#D4DACF] bg-[#F4F5F0] hover:bg-[#E8F7DC] hover:text-[#163300] hover:border-[#9FE870] text-[#0E0F0C] text-xs font-black transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-2xs active:scale-98"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{hasBillingDetails ? t('billing.fiscalProfile.editBtn') : t('billing.fiscalProfile.fillBtn')}</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Tab 4: Serviços Adicionais (Additional Services) */}
      {activeTab === 'additional_services' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E2E6DF] p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E6DF]">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#E8F7DC] text-[#163300] flex items-center justify-center">
                    <PackagePlus className="w-4 h-4 text-[#163300]" />
                  </div>
                  <h3 className="text-base font-black text-[#0E0F0C] font-['Outfit']">
                    {t('billing.contractedServices.title')}
                  </h3>
                </div>
                <p className="text-xs text-[#5E605D] mt-1">
                  Módulos e recursos extras contratados para complementar sua infraestrutura educacional.
                </p>
              </div>
              <span className="text-xs font-bold text-[#163300] bg-[#E8F7DC] px-3 py-1 rounded-full border border-[#9FE870]/40">
                {t('billing.contractedServices.activeCount', { count: (subscription.additionalServices || []).filter((s) => s.status === 'ACTIVE').length })}
              </span>
            </div>

            {(subscription.additionalServices || []).filter((s) => s.status === 'ACTIVE').length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {(subscription.additionalServices || [])
                  .filter((s) => s.status === 'ACTIVE')
                  .map((svc) => (
                    <div key={svc.id} className="p-4 bg-[#F9FAF8] rounded-2xl border border-[#E2E6DF] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0E0F0C]">{svc.name}</span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#E8F7DC] text-[#163300] border border-[#9FE870]/40">
                          {t('billing.contractedServices.activeBadge')}
                        </span>
                      </div>
                      <p className="text-xs text-[#5E605D] leading-relaxed">{svc.description}</p>
                      {svc.unitPriceUsd && (
                        <p className="text-xs font-bold text-[#163300] pt-1">
                          $ {svc.unitPriceUsd.toFixed(2)} {t('billing.contractedServices.perMonthSuffix')}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="p-8 bg-[#F4F5F0]/50 rounded-2xl border border-dashed border-[#CBD3C5] text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-white text-[#868685] mx-auto flex items-center justify-center border border-[#E2E6DF]">
                  <Layers className="w-5 h-5" />
                </div>
                <p className="font-bold text-[#0E0F0C] text-sm">{t('billing.contractedServices.emptyTitle')}</p>
                <p className="text-xs text-[#868685] max-w-md mx-auto">
                  {t('billing.contractedServices.emptyDesc')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Invoices & Receipts */}
      {activeTab === 'invoices' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E2E6DF] p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E2E6DF]">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#E8F7DC] text-[#163300] flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-black text-[#0E0F0C] font-['Outfit']">
                    {t('billing.invoices.title')}
                  </h3>
                </div>
                <p className="text-xs text-[#5E605D] mt-1 flex items-center gap-1.5 flex-wrap">
                  <span>{t('billing.invoices.linkedEmailPrefix')}</span>
                  <span className="font-semibold text-[#0E0F0C] bg-[#F4F5F0] px-2 py-0.5 rounded-md border border-[#E2E6DF]">
                    {financialEmail || t('billing.invoices.notDefinedHint')}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isLoadingInvoices ? (
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#F4F5F0] border border-[#E2E6DF]">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#163300]" />
                  </span>
                ) : (
                  <span className="text-xs text-[#5E605D] font-semibold bg-[#F4F5F0] px-3 py-1.5 rounded-full border border-[#E2E6DF]">
                    {t('billing.invoices.foundCount', { count: invoices.length })}
                  </span>
                )}
              </div>
            </div>

            {/* Email Sent Success Notice */}
            {emailSentNotice && (
              <div className="p-3 bg-[#E8F7DC] border border-[#9FE870] rounded-2xl flex items-center justify-between text-xs text-[#163300]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#163300] shrink-0" />
                  <span className="font-bold">{emailSentNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailSentNotice(null)}
                  className="text-[#163300] hover:underline font-bold text-[11px] cursor-pointer ml-2"
                >
                  {t('billing.invoices.closeNotice')}
                </button>
              </div>
            )}

            {/* Error Notice */}
            {invoiceError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-xs text-red-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{invoiceError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => fetchStripeInvoices()}
                  className="text-red-900 font-bold underline text-[11px] cursor-pointer ml-2"
                >
                  {t('billing.invoices.tryAgain')}
                </button>
              </div>
            )}

            {/* Aviso de Faturas Anuladas para o Tenant Admin */}
            {voidedInvoicesCount > 0 && (
              <div className="p-3.5 bg-[#F9FAF8] border border-[#E2E6DF] rounded-2xl flex items-start gap-3 text-xs">
                <div className="w-6 h-6 rounded-lg bg-[#E2E6DF] text-[#5E605D] flex items-center justify-center shrink-0 mt-0.5">
                  <Info className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-[#0E0F0C]">
                    {t('billing.invoices.voidedNoticeTitle', { count: voidedInvoicesCount })}
                  </p>
                  <p className="text-[#5E605D] leading-relaxed">
                    {t('billing.invoices.voidedNoticeDesc', { count: voidedInvoicesCount })}
                  </p>
                </div>
              </div>
            )}

            {isLoadingInvoices ? (
              <div className="py-16 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 animate-spin text-[#163300]" />
              </div>
            ) : visibleInvoices.length > 0 ? (
              <>
                {/* Mobile Card View (< md) */}
                <div className="md:hidden space-y-3">
                  {visibleInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3.5 bg-[#F9FAF8] rounded-2xl border border-[#E2E6DF] space-y-2.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-xs text-[#0E0F0C]">
                            {inv.invoiceNumber}
                          </span>
                          <p className="text-[11px] text-[#5E605D]">
                            {new Date(inv.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div>
                          {inv.status === 'PAID' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F7DC] text-[#163300] border border-[#9FE870]/40">
                              <CheckCircle2 className="w-2.5 h-2.5" /> {t('billing.invoices.statusPaid')}
                            </span>
                          ) : isInvoiceOverdue(inv) ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                              <AlertTriangle className="w-2.5 h-2.5 text-rose-600" /> {t('billing.invoices.statusOverdue')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                              <Clock className="w-2.5 h-2.5" /> {t('billing.invoices.statusOpen')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs py-1 border-t border-b border-[#E2E6DF]/60">
                        <div>
                          <p className="font-semibold text-[#0E0F0C]">
                            {getDisplayPlanName(inv.planName)}
                          </p>
                          <p className="text-[10px] text-[#868685]">
                            {inv.billingCycle === 'ANNUAL' ? t('billing.cycleAnnual') : t('billing.cycleMonthly')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-sm text-[#0E0F0C] font-['Outfit']">
                            $ {inv.amount.toFixed(2)} {inv.currency || 'USD'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        <button
                          type="button"
                          disabled={emailSendingId === inv.id}
                          onClick={() => handleSendInvoiceEmail(inv)}
                          className="flex-1 min-w-[120px] h-8 px-3 rounded-full border border-[#D4DACF] bg-white text-[#0E0F0C] hover:bg-[#F4F5F0] hover:border-[#CBD3C5] transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 font-bold text-xs whitespace-nowrap disabled:opacity-50 shadow-2xs"
                          title="Reenviar Comprovante por E-mail"
                        >
                          <Mail className="w-3.5 h-3.5 text-[#5E605D] shrink-0" />
                          <span>{emailSendingId === inv.id ? t('billing.invoices.sendingBtn') : t('billing.invoices.resendEmailBtn')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadInvoice(inv)}
                          className="flex-1 min-w-[120px] h-8 px-3 rounded-full border border-[#9FE870]/60 bg-[#E8F7DC] text-[#163300] hover:bg-[#9FE870]/30 transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 font-black text-xs whitespace-nowrap shadow-2xs"
                          title={inv.invoicePdfUrl ? 'Baixar PDF da Fatura' : 'Baixar Comprovante de Pagamento'}
                        >
                          <Download className="w-3.5 h-3.5 text-[#163300] shrink-0" />
                          <span>{inv.invoicePdfUrl ? t('billing.invoices.downloadPdfBtn') : t('billing.invoices.downloadReceiptBtn')}</span>
                        </button>
                        {inv.hostedInvoiceUrl && (
                          <a
                            href={inv.hostedInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full h-8 px-3 rounded-full border border-[#D4DACF] bg-white text-[#5E605D] hover:text-[#0E0F0C] hover:bg-[#F4F5F0] transition-all inline-flex items-center justify-center gap-1.5 font-bold text-xs whitespace-nowrap shadow-2xs"
                            title="Visualizar fatura e comprovante online"
                          >
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            <span>{t('billing.invoices.stripeReceiptBtn')}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View (>= md) */}
                <div className="hidden md:block overflow-x-auto w-full">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E2E6DF] text-[#868685] uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-3 font-bold whitespace-nowrap">{t('billing.invoices.tableHeaders.invoice')}</th>
                        <th className="py-3 px-3 font-bold whitespace-nowrap">{t('billing.invoices.tableHeaders.date')}</th>
                        <th className="py-3 px-3 font-bold whitespace-nowrap">{t('billing.invoices.tableHeaders.plan')}</th>
                        <th className="py-3 px-3 font-bold whitespace-nowrap">{t('billing.invoices.tableHeaders.amount')}</th>
                        <th className="py-3 px-3 font-bold whitespace-nowrap">{t('billing.invoices.tableHeaders.status')}</th>
                        <th className="py-3 px-3 font-bold text-right whitespace-nowrap">{t('billing.invoices.tableHeaders.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-[#E2E6DF]">
                      {visibleInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-[#F4F5F0]/70 transition-colors">
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-mono font-bold text-[#0E0F0C] flex items-center gap-1.5">
                              <span>{inv.invoiceNumber}</span>
                            </div>
                            {inv.customerEmail && inv.customerEmail !== financialEmail && (
                              <span className="text-[10px] text-[#868685] block mt-0.5 truncate max-w-[130px]">
                                {inv.customerEmail}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-[#5E605D] whitespace-nowrap">
                            {new Date(inv.date).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-[#0E0F0C] font-semibold block truncate max-w-[200px]" title={inv.planName}>
                              {getDisplayPlanName(inv.planName)}
                            </span>
                            <span className="text-[10px] text-[#868685] block">
                              {inv.billingCycle === 'ANNUAL' ? t('billing.cycleAnnual') : t('billing.cycleMonthly')}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-black text-[#0E0F0C] font-['Outfit'] whitespace-nowrap">
                            $ {inv.amount.toFixed(2)} {inv.currency || 'USD'}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            {inv.status === 'PAID' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F7DC] text-[#163300] border border-[#9FE870]/40">
                                <CheckCircle2 className="w-3 h-3" /> {t('billing.invoices.statusPaid')}
                              </span>
                            ) : isInvoiceOverdue(inv) ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                                <AlertTriangle className="w-3 h-3 text-rose-600" /> {t('billing.invoices.statusOverdue')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                                <Clock className="w-3 h-3" /> {t('billing.invoices.statusOpen')}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2 shrink-0">
                              <button
                                type="button"
                                disabled={emailSendingId === inv.id}
                                onClick={() => handleSendInvoiceEmail(inv)}
                                className="h-8 px-3 rounded-full border border-[#D4DACF] bg-white text-[#0E0F0C] hover:bg-[#F4F5F0] hover:border-[#CBD3C5] transition-all cursor-pointer inline-flex items-center gap-1.5 font-bold text-xs whitespace-nowrap disabled:opacity-50 shadow-2xs"
                                title="Reenviar Comprovante por E-mail"
                              >
                                <Mail className="w-3.5 h-3.5 text-[#5E605D] shrink-0" />
                                <span>{emailSendingId === inv.id ? t('billing.invoices.sendingBtn') : t('billing.invoices.resendEmailBtn')}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadInvoice(inv)}
                                className="h-8 px-3 rounded-full border border-[#9FE870]/60 bg-[#E8F7DC] text-[#163300] hover:bg-[#9FE870]/30 transition-all cursor-pointer inline-flex items-center gap-1.5 font-black text-xs whitespace-nowrap shrink-0 shadow-2xs"
                                title={inv.invoicePdfUrl ? 'Baixar PDF da Fatura' : 'Baixar Comprovante de Pagamento'}
                              >
                                <Download className="w-3.5 h-3.5 text-[#163300] shrink-0" />
                                <span>{inv.invoicePdfUrl ? t('billing.invoices.downloadPdfBtn') : t('billing.invoices.downloadReceiptBtn')}</span>
                              </button>
                              {inv.hostedInvoiceUrl && (
                                <a
                                  href={inv.hostedInvoiceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="h-8 px-3 rounded-full border border-[#D4DACF] bg-white text-[#5E605D] hover:text-[#0E0F0C] hover:bg-[#F4F5F0] transition-all inline-flex items-center gap-1.5 font-bold text-xs whitespace-nowrap shadow-2xs"
                                  title="Visualizar fatura e comprovante online"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                  <span>{t('billing.invoices.stripeReceiptBtn')}</span>
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="py-10 text-center space-y-2 border border-dashed border-[#CBD3C5] rounded-2xl bg-[#F4F5F0]/50">
                <div className="w-10 h-10 rounded-full bg-white text-[#868685] mx-auto flex items-center justify-center border border-[#E2E6DF]">
                  <Receipt className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-[#0E0F0C]">{t('billing.invoices.emptyTitle')}</p>
                <p className="text-[11px] text-[#5E605D] max-w-md mx-auto">
                  {t('billing.invoices.emptyDesc', { email: financialEmail || 'registrado' })}
                </p>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fetchStripeInvoices()}
                    className="px-3.5 py-1.5 rounded-full bg-[#163300] hover:bg-[#204700] text-[#9FE870] font-black text-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{t('billing.invoices.refreshInvoicesBtn')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenCustomerPortal}
                    disabled={isOpeningPortal}
                    className="px-3.5 py-1.5 rounded-full border border-[#D4DACF] bg-white text-[#0E0F0C] hover:bg-[#F4F5F0] font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{t('billing.invoices.stripePortalBtn')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upgrade / Change Subscription Frequency Modal */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0E0F0C]/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white rounded-2xl sm:rounded-3xl border border-[#E2E6DF] shadow-2xl p-4 sm:p-6 sm:p-7 space-y-4 sm:space-y-5 max-h-[90dvh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E6DF]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#E8F7DC] text-[#163300] flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#0E0F0C] font-['Outfit']">
                    {t('billing.planOptions.sectionTitle')}
                  </h3>
                  <p className="text-xs text-[#5E605D]">
                    {subscription.billingCycle === 'MONTHLY'
                      ? t('billing.planOptions.upgradeTitle')
                      : t('billing.planOptions.monthlyOptionTitle')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F4F5F0] hover:bg-[#E2E6DF] text-[#5E605D] hover:text-[#0E0F0C] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            {subscription.billingCycle === 'MONTHLY' ? (
              <div className="space-y-4">
                <div
                  onClick={() => {
                    setIsUpgradeModalOpen(false);
                    setSelectedCycle('ANNUAL');
                    setIsPaymentModalOpen(true);
                  }}
                  className="p-5 rounded-2xl border-2 border-[#163300] bg-[#E8F7DC]/30 hover:bg-[#E8F7DC]/50 transition-all cursor-pointer shadow-xs relative"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-[#0E0F0C] text-base font-['Outfit']">
                          {t('billing.planOptions.upgradeTitle')}
                        </span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#163300] text-[#9FE870]">
                          {t('billing.planOptions.upgradeDiscount')}
                        </span>
                      </div>
                      <p className="text-xs text-[#163300] font-semibold">
                        {t('billing.planOptions.upgradeSavings')}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-black text-[#163300] font-['Outfit']">
                        $ 1.999,99 USD
                      </p>
                      <p className="text-[11px] text-[#868685]">
                        {t('billing.planOptions.perYear')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#F4F5F0] rounded-2xl border border-[#E2E6DF] text-xs text-[#5E605D] space-y-2.5">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-[#163300] shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed text-[#0E0F0C]">
                      <strong>{t('billing.planOptions.upgradeRuleTitle')}</strong> {t('billing.planOptions.upgradeRuleDesc')}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed font-medium">
                    ⚡ <strong>{t('billing.planOptions.activationConditionsTitle')}</strong> {t('billing.planOptions.activationConditionsDesc')}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsUpgradeModalOpen(false)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-[#D4DACF] bg-white text-[#5E605D] hover:bg-[#F4F5F0] font-bold text-xs transition-all cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUpgradeModalOpen(false);
                      setSelectedCycle('ANNUAL');
                      setIsPaymentModalOpen(true);
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#163300] hover:bg-[#204700] text-[#9FE870] text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{t('billing.planOptions.migrateToAnnualBtn')}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* If currently on ANNUAL */
              (() => {
                const renewalTime = new Date(subscription.nextRenewalDate).getTime();
                const nowTime = Date.now();
                const daysUntilRenewal = Math.max(0, Math.ceil((renewalTime - nowTime) / (1000 * 60 * 60 * 24)));
                const isDowngradeAllowed = daysUntilRenewal <= 30;
                const windowOpenDate = new Date(renewalTime - 30 * 24 * 60 * 60 * 1000);
                const daysUntilWindowOpens = Math.max(0, daysUntilRenewal - 30);

                return (
                  <div className="space-y-4">
                    <div
                      onClick={() => {
                        if (isDowngradeAllowed) {
                          setIsUpgradeModalOpen(false);
                          setSelectedCycle('MONTHLY');
                          setIsPaymentModalOpen(true);
                        }
                      }}
                      className={`p-5 rounded-2xl border-2 transition-all ${
                        isDowngradeAllowed
                          ? 'border-[#163300] bg-[#F4F5F0] hover:bg-[#E8F7DC]/30 cursor-pointer shadow-xs'
                          : 'border-[#E2E6DF] bg-[#F9FAF8] opacity-90 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-[#0E0F0C] text-base font-['Outfit']">
                              {t('billing.planOptions.monthlyOptionTitle')}
                            </span>
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                isDowngradeAllowed
                                  ? 'bg-[#E8F7DC] text-[#163300] border border-[#9FE870]'
                                  : 'bg-amber-100 text-amber-900 border border-amber-300'
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              {isDowngradeAllowed ? t('billing.planOptions.windowOpenBadge') : t('billing.planOptions.lockedBadge')}
                            </span>
                          </div>
                          <p className="text-xs text-[#5E605D]">
                            {t('billing.planOptions.monthlyOptionDesc')}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xl font-black text-[#0E0F0C] font-['Outfit']">
                            $ 199,99 USD
                          </p>
                          <p className="text-[11px] text-[#868685]">
                            {t('billing.planOptions.perMonth')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {!isDowngradeAllowed ? (
                      <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-2.5">
                        <div className="flex items-start gap-2 font-bold">
                          <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                          <span>{t('billing.planOptions.contractualRuleTitle')}</span>
                        </div>
                        <p className="text-xs leading-relaxed text-amber-900">
                          {t('billing.planOptions.contractualRuleDesc')}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs border-t border-amber-200/60 text-amber-900 font-medium">
                          <div>
                            <span className="font-bold">{t('billing.planOptions.nextRenewalLabel')} </span>
                            {new Date(subscription.nextRenewalDate).toLocaleDateString('pt-BR')}
                          </div>
                          <div>
                            <span className="font-bold">{t('billing.planOptions.windowOpenLabel')} </span>
                            {windowOpenDate.toLocaleDateString('pt-BR')} {t('billing.planOptions.daysCount', { count: daysUntilWindowOpens })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-[#E8F7DC]/80 rounded-2xl border border-[#9FE870] text-xs text-[#163300] space-y-1.5">
                        <div className="flex items-center gap-2 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-[#163300]" />
                          <span>{t('billing.planOptions.windowOpenSuccessTitle', { count: daysUntilRenewal })}</span>
                        </div>
                        <p className="text-xs leading-relaxed">
                          {t('billing.planOptions.windowOpenSuccessDesc')}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsUpgradeModalOpen(false)}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-[#D4DACF] bg-white text-[#5E605D] hover:bg-[#F4F5F0] font-bold text-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Fechar
                      </button>
                      <button
                        type="button"
                        disabled={!isDowngradeAllowed}
                        onClick={() => {
                          if (isDowngradeAllowed) {
                            setIsUpgradeModalOpen(false);
                            setSelectedCycle('MONTHLY');
                            setIsPaymentModalOpen(true);
                          }
                        }}
                        className={`w-full sm:w-auto px-6 py-2.5 rounded-full text-xs font-black transition-all flex items-center justify-center gap-2 whitespace-nowrap shrink-0 ${
                          isDowngradeAllowed
                            ? 'bg-[#163300] hover:bg-[#204700] text-[#9FE870] cursor-pointer shadow-sm active:scale-98'
                            : 'bg-[#E2E6DF] text-[#868685] cursor-not-allowed opacity-70'
                        }`}
                      >
                        {isDowngradeAllowed ? (
                          <>
                            <CreditCard className="w-4 h-4" />
                            <span>{t('billing.planOptions.switchToMonthlyBtn')}</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            <span>{t('billing.planOptions.availableInBtn', { date: windowOpenDate.toLocaleDateString('pt-BR') })}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}
      </div>

      {/* Payment Modal Component */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        selectedCycle={selectedCycle}
        onChangeCycle={(cycle) => setSelectedCycle(cycle)}
        onPaymentSuccess={handlePaymentSuccess}
        currentSubscription={subscription}
        onOpenQuoteTicket={onOpenQuoteTicket}
      />

      {/* Fiscal Details & Stripe Bidirectional Sync Modal */}
      <FiscalDetailsModal
        isOpen={isFiscalModalOpen}
        onClose={() => setIsFiscalModalOpen(false)}
        currentBillingDetails={subscription.billingDetails}
        onSuccess={(updatedDetails) => {
          setSubscription((prev) => ({
            ...prev,
            billingDetails: updatedDetails,
          }));
          refreshProfile();
        }}
      />
    </div>
  );
};
