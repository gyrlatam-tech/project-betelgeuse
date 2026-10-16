import React, { useState } from 'react';
import {
  ArrowRight,
  LogOut,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { GoogleEducationPartnerBadge } from './GoogleEducationPartnerBadge';
import { AMERICAS_COUNTRIES, CountryBillingConfig } from '../../data/americasCountries';
import { SkooliaTwinOGlyph } from '../SkooliaLoader';
import { LanguageSelector } from '../LanguageSelector';
import { Language } from '../../i18n';

interface CompleteProfileViewProps {
  onSuccess?: () => void;
}

const COUNTRY_NAMES_I18N: Record<string, { pt: string; es: string; en: string }> = {
  BR: { pt: 'Brasil', es: 'Brasil', en: 'Brazil' },
  AR: { pt: 'Argentina', es: 'Argentina', en: 'Argentina' },
  BO: { pt: 'Bolívia', es: 'Bolivia', en: 'Bolivia' },
  CL: { pt: 'Chile', es: 'Chile', en: 'Chile' },
  CO: { pt: 'Colômbia', es: 'Colombia', en: 'Colombia' },
  EC: { pt: 'Equador', es: 'Ecuador', en: 'Ecuador' },
  GY: { pt: 'Guiana', es: 'Guyana', en: 'Guyana' },
  PY: { pt: 'Paraguai', es: 'Paraguay', en: 'Paraguay' },
  PE: { pt: 'Peru', es: 'Perú', en: 'Peru' },
  SR: { pt: 'Suriname', es: 'Surinam', en: 'Suriname' },
  UY: { pt: 'Uruguai', es: 'Uruguay', en: 'Uruguay' },
  VE: { pt: 'Venezuela', es: 'Venezuela', en: 'Venezuela' },
  US: { pt: 'Estados Unidos', es: 'Estados Unidos', en: 'United States' },
  MX: { pt: 'México', es: 'México', en: 'Mexico' },
  CA: { pt: 'Canadá', es: 'Canadá', en: 'Canada' },
  CR: { pt: 'Costa Rica', es: 'Costa Rica', en: 'Costa Rica' },
  PA: { pt: 'Panamá', es: 'Panamá', en: 'Panama' },
  GT: { pt: 'Guatemala', es: 'Guatemala', en: 'Guatemala' },
  HN: { pt: 'Honduras', es: 'Honduras', en: 'Honduras' },
  SV: { pt: 'El Salvador', es: 'El Salvador', en: 'El Salvador' },
  NI: { pt: 'Nicarágua', es: 'Nicaragua', en: 'Nicaragua' },
  DO: { pt: 'República Dominicana', es: 'República Dominicana', en: 'Dominican Republic' },
  PR: { pt: 'Porto Rico', es: 'Puerto Rico', en: 'Puerto Rico' },
  JM: { pt: 'Jamaica', es: 'Jamaica', en: 'Jamaica' },
  TT: { pt: 'Trinidad e Tobago', es: 'Trinidad y Tobago', en: 'Trinidad and Tobago' },
  BS: { pt: 'Bahamas', es: 'Bahamas', en: 'Bahamas' },
  BB: { pt: 'Barbados', es: 'Barbados', en: 'Barbados' },
};

function getLocalizedCountryName(country: CountryBillingConfig, lang: Language): string {
  const custom = COUNTRY_NAMES_I18N[country.code];
  if (custom) {
    return custom[lang] || custom.pt || country.name;
  }
  return country.name;
}

export const CompleteProfileView: React.FC<CompleteProfileViewProps> = ({ onSuccess }) => {
  const { user, institution, submitInstitutionProfile, logout } = useAuth();
  const { t, language } = useLanguage();

  const [formData, setFormData] = useState<{
    institutionName: string;
    institutionEmail: string;
    institutionPhone: string;
    institutionAddress: string;
    country: string;
    countryCode: string;
    technicalContactName: string;
    technicalContactEmail: string;
    technicalContactPhone: string;
    financialContactName: string;
    financialContactEmail: string;
    financialContactPhone: string;
    studentsCount: number | '';
    teachersCount: number | '';
  }>({
    // Instituição
    institutionName: institution?.institutionName || '',
    institutionEmail: institution?.institutionEmail || user?.email || '',
    institutionPhone: institution?.institutionPhone || '',
    institutionAddress: institution?.institutionAddress || '',
    country: institution?.country || 'Brasil',
    countryCode: institution?.countryCode || 'BR',
    // Responsável Técnico
    technicalContactName: institution?.technicalContactName || user?.displayName || '',
    technicalContactEmail: institution?.technicalContactEmail || user?.email || '',
    technicalContactPhone: institution?.technicalContactPhone || '',
    // Responsável Financeiro
    financialContactName: institution?.financialContactName || institution?.technicalContactName || user?.displayName || '',
    financialContactEmail: institution?.financialContactEmail || institution?.institutionEmail || user?.email || '',
    financialContactPhone: institution?.financialContactPhone || institution?.technicalContactPhone || '',
    // Porte
    studentsCount: institution?.studentsCount || '',
    teachersCount: institution?.teachersCount || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validations
    if (!formData.institutionName.trim()) {
      setErrorMsg(t('completeProfile.errors.institutionName'));
      return;
    }
    if (!formData.country.trim()) {
      setErrorMsg(t('completeProfile.errors.country'));
      return;
    }
    if (!formData.institutionEmail.trim()) {
      setErrorMsg(t('completeProfile.errors.institutionEmail'));
      return;
    }
    if (!formData.institutionPhone.trim()) {
      setErrorMsg(t('completeProfile.errors.institutionPhone'));
      return;
    }
    if (!formData.institutionAddress.trim()) {
      setErrorMsg(t('completeProfile.errors.institutionAddress'));
      return;
    }
    if (
      !formData.technicalContactName.trim() ||
      !formData.technicalContactEmail.trim() ||
      !formData.technicalContactPhone.trim()
    ) {
      setErrorMsg(t('completeProfile.errors.technicalContact'));
      return;
    }
    if (
      !formData.financialContactName.trim() ||
      !formData.financialContactEmail.trim() ||
      !formData.financialContactPhone.trim()
    ) {
      setErrorMsg(t('completeProfile.errors.financialContact'));
      return;
    }
    if (Number(formData.studentsCount) < 0 || Number(formData.teachersCount) < 0) {
      setErrorMsg(t('completeProfile.errors.countsPositive'));
      return;
    }

    setIsSubmitting(true);
    try {
      await submitInstitutionProfile(
        {
          institutionName: formData.institutionName.trim(),
          country: formData.country.trim(),
          countryCode: formData.countryCode.trim(),
          institutionEmail: formData.institutionEmail.trim(),
          institutionPhone: formData.institutionPhone.trim(),
          institutionAddress: formData.institutionAddress.trim(),
          technicalContactName: formData.technicalContactName.trim(),
          technicalContactEmail: formData.technicalContactEmail.trim(),
          technicalContactPhone: formData.technicalContactPhone.trim(),
          financialContactName: formData.financialContactName.trim(),
          financialContactEmail: formData.financialContactEmail.trim(),
          financialContactPhone: formData.financialContactPhone.trim(),
          studentsCount: Number(formData.studentsCount) || 0,
          teachersCount: Number(formData.teachersCount) || 0,
          preferredLanguage: language || 'pt',
        },
        true
      );

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Erro ao salvar dados da instituição:', err);
      setErrorMsg(err?.message || t('completeProfile.errors.saveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 font-['Plus_Jakarta_Sans']">
      <div className="flex-1 flex flex-col justify-center items-center">
        <div className="max-w-3xl mx-auto w-full">
          {/* Top Bar with Language Selector */}
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-3xl sm:text-4xl font-black text-[#163300] font-['Outfit'] tracking-tight select-none">
              skoolia
            </span>
            <LanguageSelector variant="auth" />
          </div>

          {/* Title Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
              {t('completeProfile.title')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-lg mx-auto">
              {t('completeProfile.subtitle')}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {t('completeProfile.connectedAs')}{' '}
              <strong className="text-slate-800">{user?.displayName || user?.email}</strong>
            </p>
          </div>

          {/* Form Container */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 sm:p-8">
            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm animate-in fade-in duration-200">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">{errorMsg}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 1. Dados da Instituição */}
              <div>
                <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase mb-3">
                  {t('completeProfile.institutionSection')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t('completeProfile.institutionName')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.institutionName}
                      onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                      placeholder={t('completeProfile.institutionNamePlaceholder')}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00c868]/20 focus:border-[#00c868] bg-slate-50/30 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t('completeProfile.country')} *
                    </label>
                    <select
                      required
                      value={formData.countryCode}
                      onChange={(e) => {
                        const selectedCode = e.target.value;
                        const found = AMERICAS_COUNTRIES.find((c) => c.code === selectedCode);
                        setFormData({
                          ...formData,
                          country: found ? found.name : 'Brasil',
                          countryCode: selectedCode,
                        });
                      }}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00c868]/20 focus:border-[#00c868] bg-slate-50/30 focus:bg-white cursor-pointer"
                    >
                      {AMERICAS_COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {getLocalizedCountryName(country, language)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t('completeProfile.institutionEmail')} *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.institutionEmail}
                      onChange={(e) => setFormData({ ...formData, institutionEmail: e.target.value })}
                      placeholder={t('completeProfile.institutionEmailPlaceholder')}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00c868]/20 focus:border-[#00c868] bg-slate-50/30 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t('completeProfile.institutionPhone')} *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.institutionPhone}
                      onChange={(e) => setFormData({ ...formData, institutionPhone: e.target.value })}
                      placeholder={t('completeProfile.institutionPhonePlaceholder')}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00c868]/20 focus:border-[#00c868] bg-slate-50/30 focus:bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t('completeProfile.institutionAddress')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.institutionAddress}
                      onChange={(e) => setFormData({ ...formData, institutionAddress: e.target.value })}
                      placeholder={t('completeProfile.institutionAddressPlaceholder')}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00c868]/20 focus:border-[#00c868] bg-slate-50/30 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Responsável Técnico (Seção Separada) */}
              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase mb-3">
                  {t('completeProfile.technicalContactSection')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t('completeProfile.technicalContactName')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.technicalContactName}
                      onChange={(e) => setFormData({ ...formData, technicalContactName: e.target.value })}
                      placeholder={t('completeProfile.technicalContactNamePlaceholder')}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00c868]/20 focus:border-[#00c868] bg-slate-50/30 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t('completeProfile.technicalContactEmail')} *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.technicalContactEmail}
                      onChange={(e) => setFormData({ ...formData, technicalContactEmail: e.target.value })}
                      placeholder={t('completeProfile.technicalContactEmailPlaceholder')}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00c868]/20 focus:border-[#00c868] bg-slate-50/30 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t('completeProfile.technicalContactPhone')} *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.technicalContactPhone}
                      onChange={(e) => setFormData({ ...formData, technicalContactPhone: e.target.value })}
                      placeholder={t('completeProfile.technicalContactPhonePlaceholder')}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00c868]/20 focus:border-[#00c868] bg-slate-50/30 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Responsável Financeiro (Seção Separada) */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase">
                    {t('completeProfile.financialContactSection')}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  {t('completeProfile.financialContactSubtitle')}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t('completeProfile.financialContactName')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.financialContactName}
                      onChange={(e) => setFormData({ ...formData, financialContactName: e.target.value })}
                      placeholder={t('completeProfile.financialContactNamePlaceholder')}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00c868]/20 focus:border-[#00c868] bg-slate-50/30 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t('completeProfile.financialContactEmail')} *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.financialContactEmail}
                      onChange={(e) => setFormData({ ...formData, financialContactEmail: e.target.value })}
                      placeholder={t('completeProfile.financialContactEmailPlaceholder')}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00c868]/20 focus:border-[#00c868] bg-slate-50/30 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t('completeProfile.financialContactPhone')} *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.financialContactPhone}
                      onChange={(e) => setFormData({ ...formData, financialContactPhone: e.target.value })}
                      placeholder={t('completeProfile.financialContactPhonePlaceholder')}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00c868]/20 focus:border-[#00c868] bg-slate-50/30 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Quantidade de Usuários */}
              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase mb-3">
                  {t('completeProfile.sizeSection')}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t('completeProfile.studentsCount')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder={t('completeProfile.studentsCountPlaceholder')}
                      value={formData.studentsCount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({
                          ...formData,
                          studentsCount: val === '' ? '' : Math.max(0, parseInt(val) || 0),
                        });
                      }}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-slate-50/30 focus:bg-white focus:outline-none focus:border-[#00c868] focus:ring-2 focus:ring-[#00c868]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t('completeProfile.teachersCount')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder={t('completeProfile.teachersCountPlaceholder')}
                      value={formData.teachersCount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({
                          ...formData,
                          teachersCount: val === '' ? '' : Math.max(0, parseInt(val) || 0),
                        });
                      }}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-slate-50/30 focus:bg-white focus:outline-none focus:border-[#00c868] focus:ring-2 focus:ring-[#00c868]/20"
                    />
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={logout}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {t('completeProfile.logout')}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  id="btn-complete-institution-profile"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#00c868] hover:bg-[#00b05b] text-white font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <SkooliaTwinOGlyph size="xs" />
                      <span>{t('completeProfile.saving')}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('completeProfile.submitButton')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Google Workspace Reseller Footer Badge */}
      <footer className="mt-8 pt-4">
        <GoogleEducationPartnerBadge />
      </footer>
    </div>
  );
};
