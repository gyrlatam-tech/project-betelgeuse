import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Sparkles,
  Layers,
  HardDrive,
  Globe,
  Video,
  ShieldCheck,
  CreditCard,
  RefreshCw,
  Plus,
  Minus,
  ArrowRight,
  Info,
  Building,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import type { Tenant } from '../types';

export interface AdditionalServiceItem {
  id: string;
  name: string;
  badge: string;
  badgeColor?: string;
  category: string;
  unitPriceUsd: number;
  priceSuffix: string;
  unitLabel: string;
  unitNoun: string;
  defaultQuantity: number;
  minQuantity: number;
  maxQuantity: number;
  quantityStep: number;
  description: string;
  longDescription: string;
  appliesToAllActive: boolean;
  features: string[];
  specs?: { label: string; value: string }[];
  icon: React.ComponentType<{ className?: string }>;
}

interface AdditionalServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: AdditionalServiceItem | null;
  currentTenant?: Tenant;
}

export const AdditionalServiceModal: React.FC<AdditionalServiceModalProps> = ({
  isOpen,
  onClose,
  service,
  currentTenant,
}) => {
  const { user, institution } = useAuth();
  const { t, language } = useLanguage();
  const [quantity, setQuantity] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync initial quantity when service opens
  React.useEffect(() => {
    if (service) {
      setQuantity(service.defaultQuantity || 1);
      setErrorMessage(null);
      setIsProcessing(false);
    }
  }, [service]);

  if (!isOpen || !service) return null;

  const IconComponent = service.icon;
  const totalPriceUsd = service.unitPriceUsd * quantity;

  const isUpgradeService =
    service.id === 'prod_VAwC3xtg7ekOxe' ||
    service.id === 'prod_VAwGEVkbD2LFvp' ||
    service.category === 'STORAGE_MEET' ||
    service.category === 'AI_GEMINI' ||
    (service.name && (
      service.name.toLowerCase().includes('workspace upgrade') ||
      service.name.toLowerCase().includes('storage pool') ||
      service.name.toLowerCase().includes('armazenamento 1 tb') ||
      service.name.toLowerCase().includes('gemini ai pro')
    ));

  const getQuantityLabel = () => {
    if (service.category === 'AI_GEMINI' || service.id === 'prod_VAwGEVkbD2LFvp') {
      return language === 'pt'
        ? 'Quantidade de Licenças Gemini Pro'
        : language === 'es'
        ? 'Cantidad de Licencias Gemini Pro'
        : 'Number of Gemini Pro Licenses';
    }
    if (service.category === 'STORAGE_MEET' || service.id === 'prod_VAwC3xtg7ekOxe') {
      return language === 'pt'
        ? 'Quantidade de Pools (1 TB)'
        : language === 'es'
        ? 'Cantidad de Pools (1 TB)'
        : 'Quantity of Pools (1 TB)';
    }
    return t('additionalServices.modal.selectQuantityLabel', { unit: service.unitNoun });
  };

  const getUnitRateText = () => {
    if (service.category === 'AI_GEMINI' || service.id === 'prod_VAwGEVkbD2LFvp') {
      const u = language === 'pt' ? 'licença' : language === 'es' ? 'licencia' : 'license';
      return `$ ${service.unitPriceUsd.toFixed(2)} USD / ${u}`;
    }
    if (service.category === 'STORAGE_MEET' || service.id === 'prod_VAwC3xtg7ekOxe') {
      const u = language === 'pt' ? 'pool' : language === 'es' ? 'pool' : 'pool';
      return `$ ${service.unitPriceUsd.toFixed(2)} USD / ${u}`;
    }
    return `$ ${service.unitPriceUsd.toFixed(2)} USD / ${service.unitNoun.toLowerCase()}`;
  };

  const handleIncrement = () => {
    setQuantity((prev) => Math.min(service.maxQuantity, prev + service.quantityStep));
  };

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(service.minQuantity, prev - service.quantityStep));
  };

  const handleProceedToCheckout = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const customerEmail =
        institution?.financialContactEmail ||
        institution?.stripeFinancialEmail ||
        user?.email ||
        '';

      const resolvedInstitutionName =
        (institution?.institutionName &&
        institution.institutionName !== 'Instituição Educacional' &&
        institution.institutionName !== 'Instituição de Ensino' &&
        institution.institutionName !== 'skoolia Global Administration'
          ? institution.institutionName
          : null) ||
        currentTenant?.name ||
        (user?.displayName && !user.displayName.includes('@') ? user.displayName : null) ||
        institution?.institutionName ||
        currentTenant?.name ||
        'Instituição de Ensino';

      const customerName =
        institution?.financialContactName ||
        (user?.displayName && !user.displayName.includes('@') ? user.displayName : null) ||
        resolvedInstitutionName;

      const tenantUid = institution?.ownerUid || user?.uid || currentTenant?.id || 'default-tenant';
      const countryCode = institution?.countryCode || 'BR';

      const res = await fetch('/api/billing/create-addon-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-language': language,
        },
        body: JSON.stringify({
          productId: service.id,
          serviceName: service.name,
          serviceDescription: `${service.name} - ${quantity} ${service.unitNoun}(s) para ${resolvedInstitutionName}`,
          category: service.category,
          unitPriceUsd: service.unitPriceUsd,
          quantity: quantity,
          customerEmail: customerEmail,
          customerName: customerName,
          institutionName: resolvedInstitutionName,
          tenantUid: tenantUid,
          countryCode: countryCode,
          currency: 'USD',
          preferredLanguage: language,
          lang: language,
          successUrl: `${window.location.origin}?session_id={CHECKOUT_SESSION_ID}&payment_status=success&addon_id=${encodeURIComponent(
            service.id
          )}&lang=${encodeURIComponent(language)}`,
          cancelUrl: `${window.location.origin}?payment_status=cancelled&lang=${encodeURIComponent(language)}`,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || t('additionalServices.modal.genericError'));
      }

      if (data.url) {
        // Redirect to secure payment checkout
        window.location.href = data.url;
      } else {
        throw new Error(t('additionalServices.modal.genericError'));
      }
    } catch (err: any) {
      console.error('Error redirecting to checkout:', err);
      setErrorMessage(err?.message || t('additionalServices.modal.genericError'));
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E0F0C]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="additional-service-info-modal"
        className="bg-white rounded-3xl max-w-xl w-full border border-[#E2E6DF] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150 mx-auto"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-[#E2E6DF] flex items-start justify-between bg-[#F9FAF8]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F7DC] border border-[#9FE870]/40 flex items-center justify-center text-[#163300] shrink-0 shadow-2xs">
              <IconComponent className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#163300] text-[#9FE870] font-['Outfit']">
                  {service.badge}
                </span>
                {service.appliesToAllActive && (
                  <span className="text-[10px] font-bold text-[#163300] bg-[#E8F7DC] px-2 py-0.5 rounded-full border border-[#9FE870]/40">
                    {t('additionalServices.appliesToAllBadge')}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-[#0E0F0C] font-['Outfit'] tracking-tight">
                {service.name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close') || 'Fechar'}
            className="p-2 rounded-full text-[#5E605D] hover:text-[#0E0F0C] hover:bg-[#E8EBE6] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Concise Body - Purely Purchase Focused */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Service Short Summary */}
          <div className="p-4 bg-[#F9FAF8] rounded-2xl border border-[#E2E6DF] space-y-2">
            <p className="text-xs sm:text-sm text-[#3E403D] leading-relaxed">
              {service.description}
            </p>

            {Array.isArray(service.features) && service.features.length > 0 && (
              <div className="pt-2 border-t border-[#E2E6DF]/70 space-y-1.5">
                {service.features.slice(0, 2).map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-[#0E0F0C] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#163300] shrink-0" />
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activation Notice for Upgrades (24h SLA) */}
          {isUpgradeService && (
            <div className="p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-start gap-3 text-amber-950 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <p className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                  {t('additionalServices.modal.activationNoticeTitle') || 'Prazo de Ativação Técnica: até 24 horas'}
                </p>
                <p className="text-xs text-amber-900 leading-snug">
                  {t('additionalServices.modal.activationNoticeDescShort') ||
                    'Provisionamento técnico realizado em até 24 horas após a confirmação do pagamento.'}
                </p>
              </div>
            </div>
          )}

          {/* Quantity Selector & Calculation Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#E8F7DC]/50 border border-[#9FE870]/60 space-y-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <label className="text-xs font-black uppercase tracking-wider text-[#163300] font-['Outfit'] block truncate">
                  {getQuantityLabel()}
                </label>
                <p className="text-xs text-[#163300]/80">
                  {getUnitRateText()}
                </p>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-[#9FE870]/80 shadow-2xs shrink-0">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={quantity <= service.minQuantity || isProcessing}
                  className="w-7 h-7 rounded-lg bg-[#F4F5F0] hover:bg-[#E8EBE6] disabled:opacity-40 flex items-center justify-center text-[#163300] font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <div className="px-2 min-w-10 text-center">
                  <span className="text-sm font-black text-[#0E0F0C] font-['Outfit']">
                    {quantity}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={quantity >= service.maxQuantity || isProcessing}
                  className="w-7 h-7 rounded-lg bg-[#F4F5F0] hover:bg-[#E8EBE6] disabled:opacity-40 flex items-center justify-center text-[#163300] font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Total Pricing Row */}
            <div className="pt-2.5 border-t border-[#9FE870]/40 flex items-center justify-between">
              <span className="text-xs text-[#163300] font-medium">
                {t('additionalServices.modal.monthlyBillingNote')}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-[#163300] font-['Outfit']">
                  $ {totalPriceUsd.toFixed(2)} USD
                </span>
                <span className="text-xs font-bold text-[#163300]/80">
                  {t('additionalServices.modal.perMonth')}
                </span>
              </div>
            </div>
          </div>

          {/* Institution Contact Summary */}
          <div className="px-3.5 py-2.5 bg-[#F4F5F0] rounded-xl border border-[#E2E6DF] flex items-center justify-between text-xs text-[#5E605D]">
            <div className="flex items-center gap-2 truncate">
              <Building className="w-3.5 h-3.5 text-[#163300] shrink-0" />
              <span className="truncate">
                {t('additionalServices.modal.institutionLabel')}{' '}
                <strong className="text-[#0E0F0C] font-bold">
                  {(institution?.institutionName &&
                  institution.institutionName !== 'Instituição Educacional' &&
                  institution.institutionName !== 'Instituição de Ensino' &&
                  institution.institutionName !== 'skoolia Global Administration'
                    ? institution.institutionName
                    : null) ||
                    currentTenant?.name ||
                    institution?.institutionName ||
                    'Organização Ativa'}
                </strong>
              </span>
            </div>
            <span className="font-mono text-[11px] text-[#5E605D] shrink-0 ml-2">
              {institution?.financialContactEmail || user?.email}
            </span>
          </div>

          {/* Error notice if any */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 font-medium">
              <Info className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div className="px-5 py-4 sm:px-6 sm:py-4 border-t border-[#E2E6DF] bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-[#5E605D] min-w-0 w-full sm:w-auto justify-center sm:justify-start">
            <ShieldCheck className="w-3.5 h-3.5 text-[#163300] shrink-0" />
            <span className="text-[11px] text-[#5E605D] truncate">
              {isUpgradeService
                ? (t('additionalServices.modal.upgradeFooterNote') || 'Ativação técnica em até 24h')
                : (t('additionalServices.modal.encryptedNote') || 'Processamento Criptografado & Seguro')}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-3.5 py-2 text-xs font-bold text-[#5E605D] hover:text-[#0E0F0C] hover:bg-[#F4F5F0] rounded-full transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            >
              {t('additionalServices.modal.cancelBtn')}
            </button>

            <button
              type="button"
              id="proceed-addon-checkout-btn"
              onClick={handleProceedToCheckout}
              disabled={isProcessing}
              className="px-4 sm:px-5 py-2.5 bg-[#9FE870] hover:bg-[#8EE05B] text-[#163300] rounded-full font-black text-xs transition-all shadow-xs hover:shadow-md cursor-pointer flex items-center justify-center gap-2 shrink-0 whitespace-nowrap active:scale-98 disabled:opacity-60"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#163300] shrink-0" />
                  <span className="whitespace-nowrap">{t('additionalServices.modal.processingBtn')}</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-3.5 h-3.5 text-[#163300] shrink-0" />
                  <span className="whitespace-nowrap font-black">
                    $ {totalPriceUsd.toFixed(2)} USD{t('additionalServices.modal.buttonMonthSuffix') || '/mês'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#163300] shrink-0" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
