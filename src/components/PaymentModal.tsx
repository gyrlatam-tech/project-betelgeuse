import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  CreditCard,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Building,
  Mail,
  User,
  MapPin,
  FileText,
  Download,
  Infinity,
  HelpCircle,
  Globe2,
  ChevronDown,
  Coins,
  BadgePercent,
  ReceiptText,
  Check,
} from 'lucide-react';
import type {
  BillingCycle,
  BillingDetails,
  CreditCardInfo,
  SubscriptionPlan,
  SubscriptionState,
  Invoice,
} from '../types';
import {
  AMERICAS_COUNTRIES,
  getCountryConfig,
  getLocalizedCountryName,
  getLocalizedTaxIdLabel,
  getLocalizedTaxIdHelp,
  getLocalizedStateLabel,
  getLocalizedPostalCodeLabel,
  getLocalizedNeighborhoodLabel,
  getLocalizedPlaceholders,
  type CountryBillingConfig,
} from '../data/americasCountries';
import { SUBSCRIPTION_PRODUCTS } from '../data/currencyData';
import { SkooliaTwinOGlyph } from './SkooliaLoader';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { saveInstitutionBilling } from '../lib/firebase';
import { CustomLicenseQuoteCard } from './CustomLicenseQuoteCard';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCycle: BillingCycle;
  onChangeCycle: (cycle: BillingCycle) => void;
  onPaymentSuccess: (
    subscription: SubscriptionState,
    newInvoice: Invoice
  ) => void;
  currentSubscription?: SubscriptionState;
  onOpenQuoteTicket?: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  selectedCycle,
  onChangeCycle,
  onPaymentSuccess,
  currentSubscription,
  onOpenQuoteTicket,
}) => {
  const { t, language } = useLanguage();

  // Plan Definition
  const plan: SubscriptionPlan = {
    id: selectedCycle === 'ANNUAL' ? 'plan-standard-unlimited-annual' : 'plan-standard-unlimited-monthly',
    name: selectedCycle === 'ANNUAL' ? 'Workspace Standard Unlimited - Annual' : 'Workspace Standard Unlimited - Monthly',
    description: selectedCycle === 'ANNUAL'
      ? 'Plano Anual com licenças ilimitadas Google Workspace, gerenciamento multi-domínio e suporte prioritário.'
      : 'Plano Mensal com licenças ilimitadas Google Workspace, provisionamento e sincronização contínua.',
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

  const baseAmountUsd = selectedCycle === 'ANNUAL' ? plan.annualPrice : plan.monthlyPrice;
  const annualSavingsUsd = plan.monthlyPrice * 12 - plan.annualPrice; // $2399.88 - $1999.99 = $399.89

  const { user, institution, refreshProfile } = useAuth();

  // Business Rules Calculations for Plan Changes
  const isCurrentAnnual = currentSubscription?.billingCycle === 'ANNUAL';
  const renewalTime = currentSubscription?.nextRenewalDate ? new Date(currentSubscription.nextRenewalDate).getTime() : 0;
  const nowTime = Date.now();
  const daysUntilAnnualRenewal = renewalTime ? Math.max(0, Math.ceil((renewalTime - nowTime) / (1000 * 60 * 60 * 24))) : 999;
  const isDowngradeBlocked = selectedCycle === 'MONTHLY' && isCurrentAnnual && daysUntilAnnualRenewal > 30;
  const windowOpenDate = renewalTime ? new Date(renewalTime - 30 * 24 * 60 * 60 * 1000) : new Date();
  const daysUntilWindowOpens = Math.max(0, daysUntilAnnualRenewal - 30);
  const isUpgradeImmediate = selectedCycle === 'ANNUAL' && currentSubscription?.billingCycle === 'MONTHLY';

  // Country State
  const initialCountryConfig = getCountryConfig(
    currentSubscription?.billingDetails?.country ||
      institution?.billingDetails?.country ||
      institution?.country ||
      'Brasil'
  );
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(
    currentSubscription?.billingDetails?.countryCode ||
      institution?.billingDetails?.countryCode ||
      institution?.countryCode ||
      initialCountryConfig.code
  );
  const activeCountryConfig: CountryBillingConfig =
    AMERICAS_COUNTRIES.find((c) => c.code === selectedCountryCode) || initialCountryConfig;
  const placeholders = getLocalizedPlaceholders(activeCountryConfig, language);

  // Billing Details Form State - Starts blank unless tenant has already saved data in the database
  const savedBilling = currentSubscription?.billingDetails || institution?.billingDetails;
  const [billingDetails, setBillingDetails] = useState<BillingDetails>({
    fullName: savedBilling?.fullName || '',
    email: savedBilling?.email || '',
    taxId: savedBilling?.taxId || '',
    address: savedBilling?.address || '',
    neighborhood: savedBilling?.neighborhood || '',
    city: savedBilling?.city || '',
    state: savedBilling?.state || '',
    zipCode: savedBilling?.zipCode || '',
    country: savedBilling?.country || activeCountryConfig.name,
    countryCode: savedBilling?.countryCode || activeCountryConfig.code,
  });

  // Keep state in sync if institution details load or change
  useEffect(() => {
    const src = currentSubscription?.billingDetails || institution?.billingDetails;
    if (src && (src.fullName || src.taxId || src.email || src.address)) {
      setBillingDetails((prev) => ({
        fullName: prev.fullName || src.fullName || '',
        email: prev.email || src.email || '',
        taxId: prev.taxId || src.taxId || '',
        address: prev.address || src.address || '',
        neighborhood: prev.neighborhood || src.neighborhood || '',
        city: prev.city || src.city || '',
        state: prev.state || src.state || '',
        zipCode: prev.zipCode || src.zipCode || '',
        country: prev.country || src.country || activeCountryConfig.name,
        countryCode: prev.countryCode || src.countryCode || activeCountryConfig.code,
      }));
      if (src.countryCode) {
        setSelectedCountryCode(src.countryCode);
      }
    }
  }, [currentSubscription, institution]);

  // Steps / View States: 'FORM' | 'PROCESSING' | 'SUCCESS' | 'ERROR'
  const [modalState, setModalState] = useState<'FORM' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('FORM');
  const [errorMessage, setErrorMessage] = useState('');
  const [processingStatusText, setProcessingStatusText] = useState('Iniciando processamento seguro...');
  const [completedTransaction, setCompletedTransaction] = useState<{
    txId: string;
    invoiceNumber: string;
    date: string;
    amount: number;
    formattedAmount: string;
    currency: string;
    currencySymbol: string;
    cycle: BillingCycle;
    last4: string;
    brand: string;
    countryName: string;
    taxIdLabel: string;
    taxName: string;
    taxAmount: number;
    formattedTaxAmount: string;
    exchangeRate: number;
    basePriceUsd: number;
    productId: string;
  } | null>(null);

  // When country dropdown changes, keep country metadata in sync
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setSelectedCountryCode(code);
    const newConfig = AMERICAS_COUNTRIES.find((c) => c.code === code);
    if (newConfig) {
      setBillingDetails((prev) => ({
        ...prev,
        country: newConfig.name,
        countryCode: newConfig.code,
      }));
    }
  };

  // Credit Card Form State - Starts completely blank
  const [rawCardNumber, setRawCardNumber] = useState<string>('');
  const [isCardFocused, setIsCardFocused] = useState<boolean>(false);
  const [cardInfo, setCardInfo] = useState<CreditCardInfo>({
    cardNumber: '',
    cardholderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvc: '',
    brand: 'generic',
  });

  const [saveCardForFuture, setSaveCardForFuture] = useState(true);
  const [stripeConfig, setStripeConfig] = useState<{
    isConfigured: boolean;
    isTestMode: boolean;
    message?: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/billing/config')
      .then((res) => res.json())
      .then((data) => {
        setStripeConfig(data);
      })
      .catch(() => {});
  }, []);

  if (!isOpen) return null;

  // Group countries by Americas Region
  const regions = [
    'América do Sul',
    'América do Norte',
    'América Central',
    'Caribe',
  ] as const;

  // Detect card brand automatically
  const detectBrand = (num: string): 'visa' | 'mastercard' | 'amex' | 'elo' | 'hipercard' | 'generic' => {
    const clean = num.replace(/\s+/g, '');
    if (clean.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return 'mastercard';
    if (/^3[47]/.test(clean)) return 'amex';
    if (/^(4011|438935|451416|4576|504175|5067|5090|627780|636297|636368)/.test(clean)) return 'elo';
    if (/^(606282|3841)/.test(clean)) return 'hipercard';
    return 'generic';
  };

  const formatMaskedCard = (raw: string): string => {
    const clean = raw.replace(/\D/g, '');
    if (clean.length === 0) return '';
    if (clean.length <= 4) return clean;
    const last4 = clean.slice(-4);
    const maskedLength = clean.length - 4;
    const masked = '•'.repeat(maskedLength) + last4;
    return masked.replace(/(.{4})/g, '$1 ').trim();
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 19);
    setRawCardNumber(digitsOnly);
    const brand = detectBrand(digitsOnly);
    const formatted = digitsOnly.replace(/(.{4})/g, '$1 ').trim();
    setCardInfo((prev) => ({
      ...prev,
      cardNumber: formatted,
      brand,
    }));
  };

  const handleCardFocus = () => {
    setIsCardFocused(true);
  };

  const handleCardBlur = () => {
    setIsCardFocused(false);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.substring(0, 4);
    if (val.length >= 2) {
      const month = val.substring(0, 2);
      const year = val.substring(2);
      setCardInfo((prev) => ({
        ...prev,
        expiryMonth: month,
        expiryYear: year,
      }));
    } else {
      setCardInfo((prev) => ({ ...prev, expiryMonth: val, expiryYear: '' }));
    }
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 4);
    setCardInfo((prev) => ({ ...prev, cvc: val }));
  };

  // Direct Official Hosted Checkout Handler
  const handleOfficialCheckout = async () => {
    if (!billingDetails.fullName || !billingDetails.email || !billingDetails.taxId) {
      setErrorMessage(
        t('modals.fiscalDetails.requiredFieldsError', {
          taxIdLabel: getLocalizedTaxIdLabel(activeCountryConfig, language),
        })
      );
      setModalState('ERROR');
      return;
    }

    setModalState('PROCESSING');
    setProcessingStatusText(
      `Iniciando checkout seguro oficial ($ ${baseAmountUsd.toFixed(2)} USD)...`
    );

    try {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-language': language,
        },
        body: JSON.stringify({
          billingCycle: selectedCycle,
          countryCode: selectedCountryCode,
          currency: 'USD',
          amount: baseAmountUsd,
          baseAmountUsd,
          tenantUid: user?.uid,
          institutionName: institution?.institutionName || billingDetails.fullName,
          currentBillingCycle: currentSubscription?.billingCycle || 'MONTHLY',
          currentRenewalDate: currentSubscription?.nextRenewalDate,
          preferredLanguage: language,
          lang: language,
          billingDetails: {
            ...billingDetails,
            country: activeCountryConfig.name,
            countryCode: activeCountryConfig.code,
          },
          successUrl: `${window.location.origin}?session_id={CHECKOUT_SESSION_ID}&payment_status=success&lang=${encodeURIComponent(
            language
          )}`,
          cancelUrl: `${window.location.origin}?payment_status=cancelled&lang=${encodeURIComponent(language)}`,
        }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Direct navigation to official secure checkout
        window.location.href = data.url;
        return;
      } else {
        setErrorMessage(data?.error || 'Não foi possível iniciar a sessão de pagamento seguro.');
        setModalState('ERROR');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro de conexão ao processar pagamento.');
      setModalState('ERROR');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDowngradeBlocked) {
      setErrorMessage(
        `A alteração do plano Anual para o plano Mensal só pode ser realizada nos últimos 30 dias que antecedem a renovação anual. Sua janela abrirá em ${windowOpenDate.toLocaleDateString('pt-BR')} (faltam ${daysUntilWindowOpens} dias).`
      );
      setModalState('ERROR');
      return;
    }
    await handleOfficialCheckout();
  };

  const handleDownloadInvoice = () => {
    if (!completedTransaction) return;
    const content = `=====================================================
RECIBO COMERCIAL & INVOICE INTERNACIONAL OFICIAL
=====================================================
Número da Fatura: ${completedTransaction.invoiceNumber}
ID da Transação: ${completedTransaction.txId}
Data de Emissão: ${completedTransaction.date}
Status: PAGO COM SUCESSO

DECLARAÇÃO LEGAL & SEDE DA EMPRESA:
-----------------------------------------------------
Empresa Emissora: InternetByMOL LLC
Sede e Endereço: 3101 North Central Avenue, Phoenix, 85012, Estados Unidos
E-mail de Atendimento: help@skoolia.net
Natureza do Serviço: Assinatura de Software e Ferramentas Cloud (SaaS)
Observação Legal: A InternetByMOL LLC é uma empresa americana sediada em Phoenix (EUA)
e não emite Nota Fiscal eletrônica ou documento
fiscal local para cada país além deste recibo e invoice comercial oficial.
Caso necessite de uma fatura discriminada com dados adicionais dos
serviços prestados, entre em contato com nosso suporte corporativo.

DETALHES DA CONVERSÃO & PREÇO:
-----------------------------------------------------
Plano: ${plan.name}
Ciclo de Cobrança: ${completedTransaction.cycle === 'ANNUAL' ? 'Anual' : 'Mensal'}
Preço Base em Dólares: $ ${completedTransaction.basePriceUsd.toFixed(2)} USD
Moeda de Cobrança: ${completedTransaction.currency} (${completedTransaction.currencySymbol})
Taxa de Câmbio Aplicada: 1 USD = ${completedTransaction.exchangeRate} ${completedTransaction.currency}
Imposto Calculado (${completedTransaction.taxName}): ${completedTransaction.formattedTaxAmount}
VALOR TOTAL PAGO: ${completedTransaction.formattedAmount}

DADOS DO TOMADOR / FATURAMENTO:
-----------------------------------------------------
País: ${completedTransaction.countryName}
Razão Social / Nome: ${billingDetails.fullName}
E-mail: ${billingDetails.email}
${completedTransaction.taxIdLabel}: ${billingDetails.taxId}
Endereço: ${billingDetails.address}${billingDetails.neighborhood ? `, ${billingDetails.neighborhood}` : ''}
Localidade: ${billingDetails.city} - ${billingDetails.state}, ${billingDetails.zipCode}

MÉTODO DE PAGAMENTO:
-----------------------------------------------------
Forma: Cartão de Crédito/Débito (${completedTransaction.brand} final ${completedTransaction.last4})
Processamento: Transmissão Criptografada e Segura

=====================================================
Obrigado por utilizar a plataforma de gestão Workspace!`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${completedTransaction.invoiceNumber}-recibo-${completedTransaction.currency}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0E0F0C]/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl border border-[#E2E6DF] overflow-hidden flex flex-col max-h-[94dvh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4.5 border-b border-[#E2E6DF] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 rounded-full bg-[#E8F7DC] text-[#163300] flex items-center justify-center font-black shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#0E0F0C] font-['Outfit'] flex items-center gap-2 flex-wrap">
                <span>Finalizar Assinatura</span>
                <span className="text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full bg-[#E8F7DC] text-[#163300] border border-[#9FE870]/40 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Pagamento Criptografado
                </span>
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#5E605D] hover:text-[#0E0F0C] hover:bg-[#F4F5F0] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content depending on state */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* STATE 1: PROCESSING */}
          {modalState === 'PROCESSING' && (
            <div className="py-16 text-center space-y-6 max-w-md mx-auto animate-in fade-in duration-200">
              <div className="relative py-2 flex items-center justify-center">
                <SkooliaTwinOGlyph size="lg" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-[#0E0F0C] font-['Outfit']">
                  Processando seu Pagamento
                </h3>
                <p className="text-xs sm:text-sm text-[#5E605D] leading-relaxed font-semibold">
                  {processingStatusText}
                </p>
              </div>
              <div className="p-3 bg-[#F4F5F0] rounded-2xl border border-[#E2E6DF] text-xs text-[#5E605D] flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#163300]" />
                <span>Transmissão criptografada de ponta a ponta e faturamento regionalizado</span>
              </div>
            </div>
          )}

          {/* STATE 2: SUCCESS */}
          {modalState === 'SUCCESS' && completedTransaction && (
            <div className="py-6 space-y-6 max-w-lg mx-auto text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-[#E8F7DC] text-[#163300] rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-[#163300] bg-[#E8F7DC] px-3 py-1 rounded-full border border-[#9FE870]/40">
                  Assinatura Ativada com Sucesso
                </span>
                <h3 className="text-2xl font-black text-[#0E0F0C] font-['Outfit'] pt-2">
                  Boas-vindas ao {plan.name}!
                </h3>
                <p className="text-xs sm:text-sm text-[#5E605D]">
                  Cobrança efetuada em <strong>{completedTransaction.currency}</strong> com <strong>Licenças Ilimitadas</strong> liberadas para todas as contas e domínios em <strong>{completedTransaction.countryName}</strong>.
                </p>
              </div>

              {/* Receipt Summary Card */}
              <div className="p-5 bg-[#F4F5F0] rounded-3xl border border-[#E2E6DF] text-left space-y-3 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E6DF] text-xs text-[#5E605D]">
                  <span>Fatura #{completedTransaction.invoiceNumber}</span>
                  <span className="font-mono">{completedTransaction.date}</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-[#0E0F0C]">
                    <span>Plano Contratado:</span>
                    <span>{plan.name} ({completedTransaction.cycle === 'ANNUAL' ? 'Anual' : 'Mensal'})</span>
                  </div>

                  <div className="flex justify-between text-[#5E605D]">
                    <span>Preço Base USD:</span>
                    <span>$ {completedTransaction.basePriceUsd.toFixed(2)} USD</span>
                  </div>

                  <div className="flex justify-between text-[#5E605D]">
                    <span>Câmbio Aplicado:</span>
                    <span>1 USD = {completedTransaction.exchangeRate} {completedTransaction.currency}</span>
                  </div>

                  {completedTransaction.taxAmount > 0 && (
                    <div className="flex justify-between text-[#5E605D]">
                      <span>{completedTransaction.taxName}:</span>
                      <span className="text-[#163300] font-bold">+{completedTransaction.formattedTaxAmount}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm font-black text-[#0E0F0C] pt-2 border-t border-[#E2E6DF]">
                    <span>Total Cobrado na Moeda Local:</span>
                    <span className="text-[#163300] font-['Outfit'] text-base font-black">
                      {completedTransaction.formattedAmount}
                    </span>
                  </div>

                  <div className="flex justify-between text-[#5E605D] pt-1 text-[11px]">
                    <span>Método de Pagamento:</span>
                    <span>{completedTransaction.brand} •••• {completedTransaction.last4}</span>
                  </div>
                </div>

                {/* Legal notice in receipt */}
                <div className="pt-3 border-t border-[#E2E6DF] text-[10px] text-[#5E605D] leading-relaxed">
                  <strong>Nota Legal:</strong> A InternetByMOL LLC é uma empresa americana sediada em Phoenix (3101 North Central Avenue, Phoenix, 85012, Estados Unidos, help@skoolia.net) e não emite nota fiscal eletrônica local além do recibo oficial. Fatura detalhada disponível sob solicitação.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadInvoice}
                  className="w-full sm:flex-1 py-3 px-4 rounded-full border border-[#E2E6DF] bg-white hover:bg-[#F4F5F0] text-[#0E0F0C] text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Download className="w-4 h-4 text-[#163300]" />
                  <span>Baixar Recibo (Invoice)</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:flex-1 py-3 px-4 rounded-full bg-[#00c868] hover:bg-[#00b35c] text-white text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Concluir e Acessar Painel</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STATE 4: ERROR */}
          {modalState === 'ERROR' && (
            <div className="py-8 space-y-6 max-w-md mx-auto text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <AlertCircle className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-[#0E0F0C] font-['Outfit']">
                  Falha no Processamento
                </h3>
                <p className="text-xs sm:text-sm text-rose-800 leading-relaxed bg-rose-50 border border-rose-200 p-3.5 rounded-2xl text-left font-semibold">
                  {errorMessage}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalState('FORM')}
                  className="flex-1 py-3 px-4 rounded-full bg-[#00c868] hover:bg-[#00b35c] text-white text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tentar Novamente</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 rounded-full border border-[#E2E6DF] bg-[#F4F5F0] hover:bg-[#E2E6DF] text-[#0E0F0C] text-xs font-black transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* STATE 5: MAIN CHECKOUT FORM */}
          {modalState === 'FORM' && (
            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Plan Summary & Highlights */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Plan Card */}
                  <div className="p-6 rounded-3xl bg-[#163300] text-white space-y-4 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#9FE870]/20 text-[#9FE870] border border-[#9FE870]/30">
                        Acesso Completo
                      </span>
                      <span className="text-xs text-white/70 flex items-center gap-1">
                        <Infinity className="w-3.5 h-3.5 text-[#9FE870]" /> Licenças Ilimitadas
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-black font-['Outfit']">{plan.name}</h3>
                      <p className="text-xs text-white/80 mt-1 leading-relaxed">
                        {plan.description}
                      </p>
                    </div>

                    {/* Cycle Toggle inside Card */}
                    <div className="bg-[#102400] p-1 rounded-full flex items-center text-xs border border-white/10">
                      <button
                        type="button"
                        onClick={() => onChangeCycle('MONTHLY')}
                        className={`flex-1 py-1.5 px-3 rounded-full font-bold transition-all text-center cursor-pointer ${
                          selectedCycle === 'MONTHLY'
                            ? 'bg-[#9FE870] text-[#163300] shadow-xs'
                            : 'text-white/70 hover:text-white'
                        }`}
                      >
                        Mensal ($ 199,99)
                      </button>
                      <button
                        type="button"
                        onClick={() => onChangeCycle('ANNUAL')}
                        className={`flex-1 py-1.5 px-3 rounded-full font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                          selectedCycle === 'ANNUAL'
                            ? 'bg-[#9FE870] text-[#163300] shadow-xs'
                            : 'text-white/80 hover:text-white'
                        }`}
                      >
                        <span>Anual</span>
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded-full tracking-tight ${
                            selectedCycle === 'ANNUAL'
                              ? 'bg-[#163300] text-[#9FE870]'
                              : 'bg-[#9FE870] text-[#163300]'
                          }`}
                        >
                          -17%
                        </span>
                      </button>
                    </div>

                    {/* Info Box: Global Payment with local options at checkout */}
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-1 text-xs text-white/80">
                      <p className="font-bold text-[#9FE870] flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5" /> Faturamento em Dólares (USD)
                      </p>
                      <p className="text-[11px] text-white/60 leading-relaxed">
                        A conversão cambial e os métodos de pagamento locais do seu país serão apresentados diretamente na página de pagamento seguro.
                      </p>
                    </div>

                    {/* Price display */}
                    <div className="pt-2 border-t border-white/10 flex items-baseline justify-between">
                      <span className="text-xs text-white/60">Total a pagar:</span>
                      <div className="text-right">
                        <span className="text-2xl font-black font-['Outfit'] text-white">
                          {selectedCycle === 'ANNUAL' ? '$ 1.999,99 USD' : '$ 199,99 USD'}
                        </span>
                        <span className="text-[11px] text-white/60 block">
                          {selectedCycle === 'ANNUAL' ? 'cobrado anualmente' : 'cobrado mensalmente'}
                        </span>
                      </div>
                    </div>

                    {selectedCycle === 'ANNUAL' && (
                      <div className="p-2.5 bg-[#9FE870]/15 rounded-2xl border border-[#9FE870]/30 text-xs text-[#9FE870] flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#9FE870] shrink-0" />
                        <span>
                          Economia anual de <strong>$ 399,89 USD</strong> em relação ao mensal.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Billing Info & Payment Method Form */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Section 1: Country & Regional Billing Details */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#5E605D] flex items-center gap-1.5 font-['Outfit']">
                        <User className="w-3.5 h-3.5" /> {t('modals.fiscalDetails.title')}
                      </h4>
                      <span className="text-[11px] text-[#163300] bg-[#E8F7DC] px-2.5 py-0.5 rounded-full border border-[#9FE870]/40 font-black flex items-center gap-1">
                        <Globe2 className="w-3 h-3" /> {activeCountryConfig.flag} {getLocalizedCountryName(activeCountryConfig, language)}
                      </span>
                    </div>

                    {/* Country Selector Dropdown covering ALL Americas */}
                    <div>
                      <label className="block text-[11px] font-black text-[#0E0F0C] mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Globe2 className="w-3.5 h-3.5 text-[#163300]" /> {t('modals.fiscalDetails.countryJurisdictionLabel')} *
                        </span>
                        <span className="text-[10px] text-[#5E605D] font-normal">
                          {AMERICAS_COUNTRIES.length} {language === 'en' ? 'countries available' : language === 'es' ? 'países disponibles' : 'países disponíveis'}
                        </span>
                      </label>
                      <div className="relative">
                        <select
                          id="select-billing-country"
                          value={selectedCountryCode}
                          onChange={handleCountryChange}
                          className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-[#E2E6DF] text-xs font-bold bg-[#F4F5F0] text-[#0E0F0C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9FE870] focus:border-[#163300] transition-all cursor-pointer appearance-none shadow-2xs"
                        >
                          {regions.map((regionGroup) => {
                            const countriesInRegion = AMERICAS_COUNTRIES.filter(
                              (c) => c.region === regionGroup
                            );
                            if (countriesInRegion.length === 0) return null;
                            return (
                              <optgroup key={regionGroup} label={`── ${regionGroup} ──`}>
                                {countriesInRegion.map((country) => (
                                  <option key={country.code} value={country.code}>
                                    {country.flag} {getLocalizedCountryName(country, language)}
                                  </option>
                                ))}
                              </optgroup>
                            );
                          })}
                        </select>
                        <ChevronDown className="w-4 h-4 text-[#5E605D] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Dynamic Country-Specific Fields Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Name / Company */}
                      <div>
                        <label className="block text-[11px] font-black text-[#0E0F0C] mb-1">
                          {t('modals.fiscalDetails.legalName')} *
                        </label>
                        <input
                          type="text"
                          required
                          value={billingDetails.fullName}
                          onChange={(e) =>
                            setBillingDetails({ ...billingDetails, fullName: e.target.value })
                          }
                          placeholder={t('modals.fiscalDetails.legalNamePlaceholder')}
                          className="w-full px-3 py-2.5 rounded-xl border border-[#E2E6DF] bg-[#F4F5F0] focus:bg-white text-xs font-semibold text-[#0E0F0C] focus:outline-none focus:ring-2 focus:ring-[#9FE870] focus:border-[#163300]"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-[11px] font-black text-[#0E0F0C] mb-1">
                          {t('modals.fiscalDetails.billingEmail')} *
                        </label>
                        <input
                          type="email"
                          required
                          value={billingDetails.email}
                          onChange={(e) =>
                            setBillingDetails({ ...billingDetails, email: e.target.value })
                          }
                          placeholder={t('modals.fiscalDetails.billingEmailPlaceholder')}
                          className="w-full px-3 py-2.5 rounded-xl border border-[#E2E6DF] bg-[#F4F5F0] focus:bg-white text-xs font-semibold text-[#0E0F0C] focus:outline-none focus:ring-2 focus:ring-[#9FE870] focus:border-[#163300]"
                        />
                      </div>

                      {/* Tax ID (CPF/CNPJ/RFC/RUT/CUIT/EIN/NIT) */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-black text-[#0E0F0C] mb-1 flex items-center justify-between">
                          <span>{getLocalizedTaxIdLabel(activeCountryConfig, language)} *</span>
                          <span className="text-[10px] text-[#163300] font-bold">
                            {getLocalizedTaxIdHelp(activeCountryConfig, language)}
                          </span>
                        </label>
                        <input
                          type="text"
                          required
                          value={billingDetails.taxId}
                          onChange={(e) =>
                            setBillingDetails({ ...billingDetails, taxId: e.target.value })
                          }
                          placeholder={activeCountryConfig.taxIdPlaceholder || '00.000.000/0001-00'}
                          className="w-full px-3 py-2.5 rounded-xl border border-[#E2E6DF] bg-[#F4F5F0] focus:bg-white text-xs font-mono font-bold text-[#0E0F0C] focus:outline-none focus:ring-2 focus:ring-[#9FE870] focus:border-[#163300]"
                        />
                      </div>

                      {/* Address */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-black text-[#0E0F0C] mb-1">
                          {t('modals.fiscalDetails.address')} *
                        </label>
                        <input
                          type="text"
                          required
                          value={billingDetails.address}
                          onChange={(e) =>
                            setBillingDetails({ ...billingDetails, address: e.target.value })
                          }
                          placeholder={placeholders.address}
                          className="w-full px-3 py-2.5 rounded-xl border border-[#E2E6DF] bg-[#F4F5F0] focus:bg-white text-xs font-semibold text-[#0E0F0C] focus:outline-none focus:ring-2 focus:ring-[#9FE870] focus:border-[#163300]"
                        />
                      </div>

                      {/* Optional Neighborhood / Bairro / Colonia */}
                      {activeCountryConfig.hasNeighborhoodField && (
                        <div>
                          <label className="block text-[11px] font-black text-[#0E0F0C] mb-1">
                            {getLocalizedNeighborhoodLabel(activeCountryConfig, language)}
                          </label>
                          <input
                            type="text"
                            value={billingDetails.neighborhood || ''}
                            onChange={(e) =>
                              setBillingDetails({ ...billingDetails, neighborhood: e.target.value })
                            }
                            placeholder={placeholders.neighborhood}
                            className="w-full px-3 py-2.5 rounded-xl border border-[#E2E6DF] bg-[#F4F5F0] focus:bg-white text-xs font-semibold text-[#0E0F0C] focus:outline-none focus:ring-2 focus:ring-[#9FE870] focus:border-[#163300]"
                          />
                        </div>
                      )}

                      {/* City */}
                      <div>
                        <label className="block text-[11px] font-black text-[#0E0F0C] mb-1">
                          {t('modals.fiscalDetails.city')} *
                        </label>
                        <input
                          type="text"
                          required
                          value={billingDetails.city}
                          onChange={(e) =>
                            setBillingDetails({ ...billingDetails, city: e.target.value })
                          }
                          placeholder={placeholders.city}
                          className="w-full px-3 py-2.5 rounded-xl border border-[#E2E6DF] bg-[#F4F5F0] focus:bg-white text-xs font-semibold text-[#0E0F0C] focus:outline-none focus:ring-2 focus:ring-[#9FE870] focus:border-[#163300]"
                        />
                      </div>

                      {/* State / Province */}
                      <div>
                        <label className="block text-[11px] font-black text-[#0E0F0C] mb-1">
                          {getLocalizedStateLabel(activeCountryConfig, language)} *
                        </label>
                        <input
                          type="text"
                          required
                          value={billingDetails.state}
                          onChange={(e) =>
                            setBillingDetails({ ...billingDetails, state: e.target.value })
                          }
                          placeholder={placeholders.state}
                          className="w-full px-3 py-2.5 rounded-xl border border-[#E2E6DF] bg-[#F4F5F0] focus:bg-white text-xs font-semibold text-[#0E0F0C] focus:outline-none focus:ring-2 focus:ring-[#9FE870] focus:border-[#163300]"
                        />
                      </div>

                      {/* Postal Code / CEP / ZIP */}
                      <div>
                        <label className="block text-[11px] font-black text-[#0E0F0C] mb-1">
                          {getLocalizedPostalCodeLabel(activeCountryConfig, language)} *
                        </label>
                        <input
                          type="text"
                          required
                          value={billingDetails.zipCode}
                          onChange={(e) =>
                            setBillingDetails({ ...billingDetails, zipCode: e.target.value })
                          }
                          placeholder={placeholders.postalCode}
                          className="w-full px-3 py-2.5 rounded-xl border border-[#E2E6DF] bg-[#F4F5F0] focus:bg-white text-xs font-mono font-bold text-[#0E0F0C] focus:outline-none focus:ring-2 focus:ring-[#9FE870] focus:border-[#163300]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Legal Disclaimer: US Company InternetByMOL LLC */}
                  <div className="p-3.5 bg-[#F4F5F0] rounded-2xl border border-[#E2E6DF] text-[11px] text-[#5E605D] space-y-1">
                    <p className="font-black text-[#0E0F0C] flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-[#5E605D]" />
                      <span>Nota Fiscal &amp; Faturamento Internacional:</span>
                    </p>
                    <p className="text-[10.5px] leading-relaxed text-[#5E605D]">
                      A <strong>InternetByMOL LLC</strong> é uma empresa americana sediada em <strong>Phoenix (EUA)</strong> (3101 North Central Avenue, Phoenix, 85012, Estados Unidos) e por isso <strong>NÃO gera nota fiscal eletrônica</strong> ou correspondente documento fiscal para cada país além do recibo comercial oficial. Os clientes podem entrar em contato com o suporte corporativo através do e-mail <strong>help@skoolia.net</strong> para receber uma fatura detalhada dos serviços.
                    </p>
                  </div>

                  {/* Plan Change Notices */}
                  {isUpgradeImmediate && (
                    <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-amber-950">
                        <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                        <span>Upgrade Imediato para Ciclo Anual:</span>
                      </p>
                      <p className="leading-relaxed">
                        A alteração do plano Mensal para o Anual ocorre <strong>imediatamente</strong>. Após a confirmação do pagamento de $ 1.999,99 USD/ano, o seu plano mensal anterior será encerrado e o novo plano anual entrará em vigor com validade de 12 meses, <strong>sem reembolso proporcional</strong> do ciclo residual.
                      </p>
                    </div>
                  )}

                  {isDowngradeBlocked && (
                    <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-[11px] text-rose-900 space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-rose-950">
                        <Lock className="w-3.5 h-3.5 text-rose-700" />
                        <span>Alteração para Plano Mensal Bloqueada:</span>
                      </p>
                      <p className="leading-relaxed">
                        Por regra contratual, a mudança do plano Anual para o plano Mensal só pode ser feita nos <strong>últimos 30 dias que antecedem a renovação anual</strong>.
                      </p>
                      <div className="pt-1 font-semibold text-rose-950">
                        Próxima renovação: {new Date(renewalTime).toLocaleDateString('pt-BR')} • Janela abre em {windowOpenDate.toLocaleDateString('pt-BR')} (faltam {daysUntilWindowOpens} dias).
                      </div>
                    </div>
                  )}

                  {/* Single Official Green Action Button */}
                  <div className="pt-2 space-y-3">
                    <button
                      type="submit"
                      id="btn-confirm-subscription"
                      disabled={isDowngradeBlocked}
                      className={`w-full py-4 px-6 rounded-full font-black text-sm transition-all flex items-center justify-center gap-2 ${
                        isDowngradeBlocked
                          ? 'bg-[#E2E6DF] text-[#868685] cursor-not-allowed opacity-70'
                          : 'bg-[#00c868] hover:bg-[#00b35c] text-white shadow-md hover:shadow-lg cursor-pointer active:scale-[0.99]'
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                      <span>
                        {isDowngradeBlocked
                          ? `Disponível em ${windowOpenDate.toLocaleDateString('pt-BR')} (30 dias antes)`
                          : `Finalizar Assinatura Segura • ${
                              selectedCycle === 'ANNUAL' ? '$ 1.999,99 USD / ano' : '$ 199,99 USD / mês'
                            }`}
                      </span>
                      {!isDowngradeBlocked && <ArrowRight className="w-4 h-4" />}
                    </button>

                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-[#5E605D] text-center">
                      <span className="flex items-center gap-1 font-bold text-[#163300]">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#163300]" />
                        Criptografia 256-bit
                      </span>
                      <span>•</span>
                      <span>Ambiente Seguro Certificado</span>
                      <span>•</span>
                      <span>Autenticação Bancária 3D Secure</span>
                    </div>

                    <p className="text-[11px] text-[#5E605D] text-center">
                      Faturamento oficial em <strong>USD</strong> • Pagamentos locais disponíveis no checkout oficial
                    </p>

                    <CustomLicenseQuoteCard
                      compact
                      onOpenTicket={() => {
                        onClose();
                        onOpenQuoteTicket?.();
                      }}
                      className="mt-4"
                    />
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
