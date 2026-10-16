import React, { useState, useEffect } from 'react';
import {
  X,
  Building,
  Mail,
  Globe2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import type { BillingDetails } from '../types';
import {
  AMERICAS_COUNTRIES,
  getCountryConfig,
  getLocalizedCountryName,
  getLocalizedTaxIdLabel,
  getLocalizedStateLabel,
  getLocalizedPostalCodeLabel,
  getLocalizedNeighborhoodLabel,
  getLocalizedPlaceholders,
  type CountryBillingConfig,
} from '../data/americasCountries';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { saveInstitutionBilling } from '../lib/firebase';
import { ConfirmationModal } from './ConfirmationModal';

interface FiscalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBillingDetails?: BillingDetails;
  onSuccess?: (updated: BillingDetails) => void;
}

export const FiscalDetailsModal: React.FC<FiscalDetailsModalProps> = ({
  isOpen,
  onClose,
  currentBillingDetails,
  onSuccess,
}) => {
  const { user, institution, refreshProfile } = useAuth();
  const { t, language } = useLanguage();

  const savedBilling = currentBillingDetails || institution?.billingDetails;
  const initialCountry = getCountryConfig(
    savedBilling?.country || institution?.country || 'Brasil'
  );

  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(
    savedBilling?.countryCode || institution?.countryCode || initialCountry.code
  );

  const activeCountryConfig: CountryBillingConfig =
    AMERICAS_COUNTRIES.find((c) => c.code === selectedCountryCode) || initialCountry;

  const placeholders = getLocalizedPlaceholders(activeCountryConfig, language);

  const [formData, setFormData] = useState<BillingDetails>({
    fullName: savedBilling?.fullName || institution?.institutionName || '',
    email:
      savedBilling?.email ||
      institution?.stripeFinancialEmail ||
      institution?.financialContactEmail ||
      institution?.primaryContactEmail ||
      '',
    taxId: savedBilling?.taxId || '',
    address: savedBilling?.address || institution?.institutionAddress || '',
    neighborhood: savedBilling?.neighborhood || '',
    city: savedBilling?.city || '',
    state: savedBilling?.state || '',
    zipCode: savedBilling?.zipCode || '',
    country: savedBilling?.country || activeCountryConfig.name,
    countryCode: savedBilling?.countryCode || activeCountryConfig.code,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Sync state when modal opens or saved values change
  useEffect(() => {
    if (isOpen) {
      const src = currentBillingDetails || institution?.billingDetails;
      const cConfig = getCountryConfig(src?.country || institution?.country || 'Brasil');
      const cCode = src?.countryCode || institution?.countryCode || cConfig.code;
      setSelectedCountryCode(cCode);
      setFormData({
        fullName: src?.fullName || institution?.institutionName || '',
        email:
          src?.email ||
          institution?.stripeFinancialEmail ||
          institution?.financialContactEmail ||
          institution?.primaryContactEmail ||
          '',
        taxId: src?.taxId || '',
        address: src?.address || institution?.institutionAddress || '',
        neighborhood: src?.neighborhood || '',
        city: src?.city || '',
        state: src?.state || '',
        zipCode: src?.zipCode || '',
        country: src?.country || cConfig.name,
        countryCode: cCode,
      });
      setFeedback(null);
      setIsConfirmOpen(false);
    }
  }, [isOpen, currentBillingDetails, institution]);

  if (!isOpen) return null;

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setSelectedCountryCode(code);
    const newConfig = AMERICAS_COUNTRIES.find((c) => c.code === code);
    if (newConfig) {
      setFormData((prev) => ({
        ...prev,
        country: newConfig.name,
        countryCode: newConfig.code,
      }));
    }
  };

  // Validate and prompt confirmation before saving
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.taxId.trim()) {
      setFeedback({
        type: 'error',
        message: t('modals.fiscalDetails.requiredFieldsError', {
          taxIdLabel: getLocalizedTaxIdLabel(activeCountryConfig, language),
        }),
      });
      return;
    }

    setIsConfirmOpen(true);
  };

  // Execute Save and Sync with API + Firestore
  const handleExecuteSave = async () => {
    setIsConfirmOpen(false);
    setIsSaving(true);
    setFeedback(null);

    const payload: BillingDetails = {
      ...formData,
      country: activeCountryConfig.name,
      countryCode: activeCountryConfig.code,
    };

    try {
      // 1. Sync directly with payment API
      const stripeRes = await fetch('/api/billing/sync-fiscal-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantUid: user?.uid,
          institutionName: institution?.institutionName || formData.fullName,
          stripeCustomerId: institution?.stripeCustomerId,
          billingDetails: payload,
        }),
      });

      await stripeRes.json();

      // 2. Persist in Firestore
      if (user?.uid) {
        await saveInstitutionBilling(user.uid, payload);
      }

      await refreshProfile();

      if (onSuccess) {
        onSuccess(payload);
      }

      setFeedback({
        type: 'success',
        message: t('modals.fiscalDetails.successMessage'),
      });

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || t('modals.fiscalDetails.errorMessage'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      id="fiscal-details-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0E0F0C]/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="fiscal-details-modal-container"
        className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-[#E2E6DF] overflow-hidden flex flex-col max-h-[92dvh]"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4.5 border-b border-[#E2E6DF] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E8F7DC] text-[#163300] flex items-center justify-center font-black shrink-0">
              <Building className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#0E0F0C] font-['Outfit']">
                {t('modals.fiscalDetails.title')}
              </h2>
              <p className="text-xs text-[#5E605D]">
                {t('modals.fiscalDetails.subtitle')}
              </p>
            </div>
          </div>

          <button
            id="close-fiscal-details-modal-btn"
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#5E605D] hover:text-[#0E0F0C] hover:bg-[#F4F5F0] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-5">
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                feedback.type === 'success'
                  ? 'bg-[#E8F7DC] text-[#163300] border-[#9FE870]'
                  : feedback.type === 'error'
                  ? 'bg-rose-50 text-rose-900 border-rose-200'
                  : 'bg-blue-50 text-blue-900 border-blue-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div className="font-medium leading-relaxed">{feedback.message}</div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Country Selector */}
            <div>
              <label className="block text-xs font-bold text-[#0E0F0C] mb-1.5 flex items-center justify-between">
                <span>{t('modals.fiscalDetails.countryJurisdictionLabel')}</span>
                <span className="text-[11px] text-[#5E605D] flex items-center gap-1">
                  <span>{activeCountryConfig.flag}</span>
                  <span>{getLocalizedCountryName(activeCountryConfig, language)}</span>
                </span>
              </label>
              <div className="relative">
                <select
                  id="fiscal-country-select"
                  value={selectedCountryCode}
                  onChange={handleCountryChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#CBD3C5] focus:border-[#163300] focus:ring-1 focus:ring-[#163300] rounded-xl text-xs text-[#0E0F0C] outline-hidden appearance-none font-medium pr-10 cursor-pointer"
                >
                  {AMERICAS_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {getLocalizedCountryName(c, language)} ({c.code}) - {getLocalizedTaxIdLabel(c, language)}
                    </option>
                  ))}
                </select>
                <Globe2 className="w-4 h-4 text-[#868685] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Entity Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0E0F0C] mb-1">
                  {t('modals.fiscalDetails.legalName')} <span className="text-rose-500">*</span>
                </label>
                <input
                  id="fiscal-fullname-input"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder={t('modals.fiscalDetails.legalNamePlaceholder')}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#CBD3C5] focus:border-[#163300] focus:ring-1 focus:ring-[#163300] rounded-xl text-xs text-[#0E0F0C] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E0F0C] mb-1">
                  {t('modals.fiscalDetails.billingEmail')} <span className="text-rose-500">*</span>
                </label>
                <input
                  id="fiscal-email-input"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t('modals.fiscalDetails.billingEmailPlaceholder')}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#CBD3C5] focus:border-[#163300] focus:ring-1 focus:ring-[#163300] rounded-xl text-xs text-[#0E0F0C] outline-hidden"
                />
              </div>
            </div>

            {/* Tax ID & Postal Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0E0F0C] mb-1">
                  {getLocalizedTaxIdLabel(activeCountryConfig, language)} <span className="text-rose-500">*</span>
                </label>
                <input
                  id="fiscal-taxid-input"
                  type="text"
                  required
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  placeholder={activeCountryConfig.taxIdPlaceholder || '00.000.000/0001-00'}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#CBD3C5] focus:border-[#163300] focus:ring-1 focus:ring-[#163300] rounded-xl text-xs text-[#0E0F0C] outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E0F0C] mb-1">
                  {getLocalizedPostalCodeLabel(activeCountryConfig, language)}
                </label>
                <input
                  id="fiscal-zipcode-input"
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder={placeholders.postalCode}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#CBD3C5] focus:border-[#163300] focus:ring-1 focus:ring-[#163300] rounded-xl text-xs text-[#0E0F0C] outline-hidden"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-bold text-[#0E0F0C] mb-1">
                {t('modals.fiscalDetails.address')}
              </label>
              <input
                id="fiscal-address-input"
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder={placeholders.address}
                className="w-full px-3.5 py-2.5 bg-white border border-[#CBD3C5] focus:border-[#163300] focus:ring-1 focus:ring-[#163300] rounded-xl text-xs text-[#0E0F0C] outline-hidden"
              />
            </div>

            {/* Neighborhood, City, State */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0E0F0C] mb-1">
                  {getLocalizedNeighborhoodLabel(activeCountryConfig, language)}
                </label>
                <input
                  id="fiscal-neighborhood-input"
                  type="text"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  placeholder={placeholders.neighborhood}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#CBD3C5] focus:border-[#163300] focus:ring-1 focus:ring-[#163300] rounded-xl text-xs text-[#0E0F0C] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E0F0C] mb-1">
                  {t('modals.fiscalDetails.city')}
                </label>
                <input
                  id="fiscal-city-input"
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder={placeholders.city}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#CBD3C5] focus:border-[#163300] focus:ring-1 focus:ring-[#163300] rounded-xl text-xs text-[#0E0F0C] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E0F0C] mb-1">
                  {getLocalizedStateLabel(activeCountryConfig, language)}
                </label>
                <input
                  id="fiscal-state-input"
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder={placeholders.state}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#CBD3C5] focus:border-[#163300] focus:ring-1 focus:ring-[#163300] rounded-xl text-xs text-[#0E0F0C] outline-hidden uppercase"
                />
              </div>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-[#E2E6DF] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
            <button
              id="cancel-fiscal-details-btn"
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-[#D4DACF] text-xs font-bold text-[#5E605D] hover:bg-[#F4F5F0] hover:text-[#0E0F0C] transition-colors cursor-pointer text-center"
            >
              {t('modals.fiscalDetails.cancelButton')}
            </button>

            <button
              id="save-and-sync-stripe-fiscal-btn"
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#9FE870] hover:bg-[#8EE05B] text-[#163300] text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-98 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t('modals.fiscalDetails.savingButton')}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t('modals.fiscalDetails.saveButton')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <ConfirmationModal
        isOpen={isConfirmOpen}
        title={t('modals.fiscalDetails.confirmTitle')}
        message={t('modals.fiscalDetails.confirmMessage')}
        targetResource={`${formData.fullName} • ${formData.taxId} (${getLocalizedCountryName(activeCountryConfig, language)})`}
        confirmLabel={t('modals.fiscalDetails.confirmButton')}
        cancelLabel={t('modals.fiscalDetails.confirmBackButton')}
        isDestructive={false}
        onConfirm={handleExecuteSave}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
};
