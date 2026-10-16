import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Building2,
  Globe,
  CheckCircle2,
  UserCheck,
  Save,
  Mail,
  Send,
  Sparkles,
  Check,
  AlertCircle,
  RefreshCw,
  Phone,
  MapPin,
  GraduationCap,
  Users,
  Briefcase,
  CreditCard,
  Wrench,
  Lock,
  Copy,
  X,
} from 'lucide-react';
import { WorkspaceDomain, WorkspaceUser, InstitutionProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AMERICAS_COUNTRIES } from '../data/americasCountries';
import { SkooliaTwinOGlyph } from './SkooliaLoader';

interface SettingsViewProps {
  domains: WorkspaceDomain[];
  users: WorkspaceUser[];
  isSuperAdmin?: boolean;
  onSaveNotification?: () => void;
}

type SettingsTab = 'institution' | 'technical' | 'financial' | 'security' | 'resend';

export const SettingsView: React.FC<SettingsViewProps> = ({
  domains,
  users,
  isSuperAdmin = false,
  onSaveNotification,
}) => {
  const { user, institution, submitInstitutionProfile, refreshProfile } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const [activeSubTab, setActiveSubTab] = useState<SettingsTab>('institution');

  // Institution Profile Form State
  const [formData, setFormData] = useState<{
    institutionName: string;
    institutionEmail: string;
    institutionPhone: string;
    institutionAddress: string;
    country: string;
    countryCode: string;
    preferredLanguage: string;
    studentsCount: number | '';
    teachersCount: number | '';
    technicalContactName: string;
    technicalContactEmail: string;
    technicalContactPhone: string;
    financialContactName: string;
    financialContactEmail: string;
    financialContactPhone: string;
  }>({
    institutionName: '',
    institutionEmail: '',
    institutionPhone: '',
    institutionAddress: '',
    country: 'Brasil',
    countryCode: 'BR',
    preferredLanguage: language || 'pt',
    studentsCount: '',
    teachersCount: '',
    technicalContactName: '',
    technicalContactEmail: '',
    technicalContactPhone: '',
    financialContactName: '',
    financialContactEmail: '',
    financialContactPhone: '',
  });

  // Security Policies State
  const [enforce2SVGlobal, setEnforce2SVGlobal] = useState(true);
  const [blockExternalSharing, setBlockExternalSharing] = useState(true);
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState('12');

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Change account email support modal state
  const [isChangeEmailModalOpen, setIsChangeEmailModalOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Resend status and test state
  const [resendStatus, setResendStatus] = useState<any>(null);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [testEmailTo, setTestEmailTo] = useState(user?.email || 'admin@instituicao.edu');
  const [testEmailType, setTestEmailType] = useState<string>('ACCOUNT_CREATED');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResultNotice, setTestResultNotice] = useState<string | null>(null);

  // Sync state from current institution profile whenever it changes
  useEffect(() => {
    if (institution) {
      setFormData({
        institutionName: institution.institutionName || '',
        institutionEmail: institution.institutionEmail || user?.email || '',
        institutionPhone: institution.institutionPhone || '',
        institutionAddress: institution.institutionAddress || '',
        country: institution.country || 'Brasil',
        countryCode: institution.countryCode || 'BR',
        preferredLanguage: institution.preferredLanguage || language || 'pt',
        studentsCount: institution.studentsCount ?? '',
        teachersCount: institution.teachersCount ?? '',
        technicalContactName: institution.technicalContactName || user?.displayName || '',
        technicalContactEmail: institution.technicalContactEmail || user?.email || '',
        technicalContactPhone: institution.technicalContactPhone || '',
        financialContactName: institution.financialContactName || '',
        financialContactEmail: institution.financialContactEmail || '',
        financialContactPhone: institution.financialContactPhone || '',
      });
    } else if (user) {
      setFormData((prev) => ({
        ...prev,
        institutionEmail: prev.institutionEmail || user.email || '',
        technicalContactName: prev.technicalContactName || user.displayName || '',
        technicalContactEmail: prev.technicalContactEmail || user.email || '',
        preferredLanguage: prev.preferredLanguage || language || 'pt',
      }));
    }
  }, [institution, user]);

  // Keep preferred language field in sync if changed via global header dropdown
  useEffect(() => {
    if (language) {
      setFormData((prev) => ({
        ...prev,
        preferredLanguage: language,
      }));
    }
  }, [language]);

  const fetchEmailStatusAndLogs = async () => {
    try {
      const res = await fetch('/api/emails/logs');
      if (res.ok) {
        const data = await res.json();
        setEmailLogs(data.logs || []);
        setResendStatus(data.status || null);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchEmailStatusAndLogs();
    }
  }, [isSuperAdmin]);

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailTo.trim()) return;

    setIsSendingTest(true);
    setTestResultNotice(null);
    try {
      const res = await fetch('/api/emails/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-language': language,
        },
        body: JSON.stringify({
          type: testEmailType,
          to: testEmailTo.trim(),
          preferredLanguage: language,
          lang: language,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResultNotice(`E-mail de teste (${testEmailType}) disparado para ${testEmailTo}!`);
        fetchEmailStatusAndLogs();
      } else {
        setTestResultNotice(`Erro: ${data.error || 'Falha ao disparar e-mail'}`);
      }
    } catch (err: any) {
      setTestResultNotice(`Erro: ${err?.message}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  const superAdmins = users.filter((u) => u.role === 'SUPER_ADMIN');

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.institutionName.trim()) {
      setErrorMsg(t('settings.institutionRequiredError'));
      setActiveSubTab('institution');
      return;
    }

    setIsSaving(true);
    try {
      await submitInstitutionProfile({
        institutionName: formData.institutionName.trim(),
        institutionEmail: formData.institutionEmail.trim() || (user?.email || ''),
        institutionPhone: formData.institutionPhone.trim(),
        institutionAddress: formData.institutionAddress.trim(),
        country: formData.country.trim(),
        countryCode: formData.countryCode.trim(),
        preferredLanguage: formData.preferredLanguage || language || 'pt',
        studentsCount: Number(formData.studentsCount) || 0,
        teachersCount: Number(formData.teachersCount) || 0,
        technicalContactName: formData.technicalContactName.trim(),
        technicalContactEmail: formData.technicalContactEmail.trim(),
        technicalContactPhone: formData.technicalContactPhone.trim(),
        financialContactName: formData.financialContactName.trim(),
        financialContactEmail: formData.financialContactEmail.trim(),
        financialContactPhone: formData.financialContactPhone.trim(),
      });

      await refreshProfile();
      setSavedSuccess(true);
      if (onSaveNotification) onSaveNotification();
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      console.error('Erro ao salvar configurações:', err);
      setErrorMsg(err?.message || t('settings.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#E2E6DF] shadow-xs space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E8F7DC] text-[#163300] flex items-center justify-center shrink-0">
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-[#0E0F0C] font-['Outfit'] tracking-tight">
                {t('settings.title')}
              </h1>
            </div>
            <p className="text-xs text-[#5E605D] mt-1 font-medium">
              {t('settings.subtitle')}
            </p>
          </div>

          {savedSuccess && (
            <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-[#163300] bg-[#E8F7DC] px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border border-[#9FE870]/40 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-[#163300]" />
              <span>{t('settings.savedSuccess')}</span>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 sm:gap-3 text-rose-800 text-xs sm:text-sm font-semibold animate-in fade-in">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Settings Navigation Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none pt-3 border-t border-[#F4F5F0]">
          <button
            type="button"
            id="tab-settings-institution"
            onClick={() => setActiveSubTab('institution')}
            className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              activeSubTab === 'institution'
                ? 'bg-[#163300] text-[#9FE870] shadow-xs'
                : 'bg-[#F4F5F0] text-[#5E605D] hover:text-[#0E0F0C] hover:bg-[#E2E6DF]'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{t('settings.tabInstitution')}</span>
          </button>

          <button
            type="button"
            id="tab-settings-technical"
            onClick={() => setActiveSubTab('technical')}
            className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              activeSubTab === 'technical'
                ? 'bg-[#163300] text-[#9FE870] shadow-xs'
                : 'bg-[#F4F5F0] text-[#5E605D] hover:text-[#0E0F0C] hover:bg-[#E2E6DF]'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>{t('settings.tabTechnical')}</span>
          </button>

          <button
            type="button"
            id="tab-settings-financial"
            onClick={() => setActiveSubTab('financial')}
            className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              activeSubTab === 'financial'
                ? 'bg-[#163300] text-[#9FE870] shadow-xs'
                : 'bg-[#F4F5F0] text-[#5E605D] hover:text-[#0E0F0C] hover:bg-[#E2E6DF]'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>{t('settings.tabFinancial')}</span>
          </button>

          <button
            type="button"
            id="tab-settings-security"
            onClick={() => setActiveSubTab('security')}
            className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              activeSubTab === 'security'
                ? 'bg-[#163300] text-[#9FE870] shadow-xs'
                : 'bg-[#F4F5F0] text-[#5E605D] hover:text-[#0E0F0C] hover:bg-[#E2E6DF]'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>{t('settings.tabSecurity')}</span>
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              id="tab-settings-resend"
              onClick={() => setActiveSubTab('resend')}
              className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                activeSubTab === 'resend'
                  ? 'bg-[#163300] text-[#9FE870] shadow-xs'
                  : 'bg-[#F4F5F0] text-[#5E605D] hover:text-[#0E0F0C] hover:bg-[#E2E6DF]'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>{t('settings.tabResend')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveAll} className="space-y-4 sm:space-y-6">
        {/* TAB 1: DADOS DA INSTITUIÇÃO */}
        {activeSubTab === 'institution' && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
            <div className="p-4 sm:p-7 rounded-2xl sm:rounded-3xl bg-white border border-[#E2E6DF] shadow-xs space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-[#E2E6DF]">
                <div className="w-8 h-8 rounded-full bg-[#E8F7DC] text-[#163300] flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#0E0F0C] font-['Outfit']">
                    {t('settings.institutionSectionTitle')}
                  </h2>
                  <p className="text-xs text-[#5E605D]">
                    {t('settings.institutionSectionSubtitle')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Nome da Instituição */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-[#0E0F0C] mb-1.5">
                    {t('settings.institutionNameLabel')}
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-[#5E605D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={formData.institutionName}
                      onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                      placeholder={t('settings.institutionNamePlaceholder')}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E6DF] bg-[#F4F5F0] focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9FE870] focus:border-[#163300] font-semibold text-[#0E0F0C]"
                    />
                  </div>
                </div>

                {/* E-mail de Contato da Instituição */}
                <div>
                  <label className="block text-xs font-black text-[#0E0F0C] mb-1.5">
                    {t('settings.institutionEmailLabel')}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#5E605D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={formData.institutionEmail}
                      onChange={(e) => setFormData({ ...formData, institutionEmail: e.target.value })}
                      placeholder={t('settings.institutionEmailPlaceholder')}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E6DF] bg-[#F4F5F0] focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9FE870] focus:border-[#163300] font-semibold text-[#0E0F0C]"
                    />
                  </div>
                </div>

                {/* Telefone da Instituição */}
                <div>
                  <label className="block text-xs font-black text-[#0E0F0C] mb-1.5">
                    {t('settings.institutionPhoneLabel')}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#5E605D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={formData.institutionPhone}
                      onChange={(e) => setFormData({ ...formData, institutionPhone: e.target.value })}
                      placeholder={t('settings.institutionPhonePlaceholder')}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E6DF] bg-[#F4F5F0] focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9FE870] focus:border-[#163300] font-semibold text-[#0E0F0C]"
                    />
                  </div>
                </div>

                {/* País */}
                <div>
                  <label className="block text-xs font-black text-[#0E0F0C] mb-1.5">
                    {t('settings.countryLabel')}
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-[#5E605D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={formData.countryCode}
                      onChange={(e) => {
                        const sel = AMERICAS_COUNTRIES.find((c) => c.code === e.target.value);
                        setFormData({
                          ...formData,
                          countryCode: e.target.value,
                          country: sel?.name || formData.country,
                        });
                      }}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E6DF] bg-[#F4F5F0] focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9FE870] focus:border-[#163300] font-semibold text-[#0E0F0C] cursor-pointer"
                    >
                      {AMERICAS_COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Idioma Preferido para Comunicação */}
                <div>
                  <label className="block text-xs font-black text-[#0E0F0C] mb-1.5">
                    {t('settings.preferredLanguageLabel')}
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-[#5E605D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={formData.preferredLanguage || language || 'pt'}
                      onChange={(e) => {
                        const newLang = e.target.value as 'pt' | 'en' | 'es';
                        setFormData((prev) => ({
                          ...prev,
                          preferredLanguage: newLang,
                        }));
                        setLanguage(newLang);
                      }}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E6DF] bg-[#F4F5F0] focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9FE870] focus:border-[#163300] font-semibold text-[#0E0F0C] cursor-pointer"
                    >
                      <option value="pt">{t('settings.preferredLanguagePt') || 'Português (Brasil) 🇧🇷'}</option>
                      <option value="en">{t('settings.preferredLanguageEn') || 'English (United States) 🇺🇸'}</option>
                      <option value="es">{t('settings.preferredLanguageEs') || 'Español (Latinoamérica) 🇪🇸'}</option>
                    </select>
                  </div>
                  <p className="text-[11px] text-[#5E605D] mt-1 leading-snug">
                    {t('settings.preferredLanguageHelp')}
                  </p>
                </div>

                {/* Endereço Completo */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-[#0E0F0C] mb-1.5">
                    {t('settings.institutionAddressLabel')}
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-[#5E605D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={formData.institutionAddress}
                      onChange={(e) => setFormData({ ...formData, institutionAddress: e.target.value })}
                      placeholder={t('settings.institutionAddressPlaceholder')}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E6DF] bg-[#F4F5F0] focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9FE870] focus:border-[#163300] font-semibold text-[#0E0F0C]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Porte e Alunos */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E2E6DF] shadow-xs space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-[#E2E6DF]">
                <div className="w-8 h-8 rounded-full bg-[#E8F7DC] text-[#163300] flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#0E0F0C] font-['Outfit']">
                    {t('settings.institutionScaleTitle')}
                  </h2>
                  <p className="text-xs text-[#5E605D]">
                    {t('settings.institutionScaleSubtitle')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black text-[#0E0F0C] mb-1.5">
                    {t('settings.studentsCountLabel')}
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-[#5E605D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min="0"
                      value={formData.studentsCount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          studentsCount: e.target.value === '' ? '' : Number(e.target.value),
                        })
                      }
                      placeholder={t('settings.studentsCountPlaceholder')}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E6DF] bg-[#F4F5F0] focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9FE870] focus:border-[#163300] font-semibold text-[#0E0F0C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-[#0E0F0C] mb-1.5">
                    {t('settings.teachersCountLabel')}
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-[#5E605D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min="0"
                      value={formData.teachersCount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          teachersCount: e.target.value === '' ? '' : Number(e.target.value),
                        })
                      }
                      placeholder={t('settings.teachersCountPlaceholder')}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E6DF] bg-[#F4F5F0] focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9FE870] focus:border-[#163300] font-semibold text-[#0E0F0C]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CONTATO TÉCNICO */}
        {activeSubTab === 'technical' && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
            <div className="p-4 sm:p-7 rounded-2xl sm:rounded-3xl bg-white border border-[#E2E6DF] shadow-xs space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E2E6DF]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#E8F7DC] text-[#163300] flex items-center justify-center font-bold shrink-0">
                    <Wrench className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-[#0E0F0C] font-['Outfit']">
                      {t('settings.technicalContactTitle')}
                    </h2>
                    <p className="text-xs text-[#5E605D]">
                      {t('settings.technicalContactSubtitle')}
                    </p>
                  </div>
                </div>
                <span className="hidden sm:inline-block bg-[#E8F7DC] text-[#163300] border border-[#9FE870]/40 text-[11px] font-black px-3 py-1 rounded-full">
                  {t('settings.supportAndTiBadge')}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-[#0E0F0C] mb-1.5">
                    {t('settings.technicalNameLabel')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.technicalContactName}
                    onChange={(e) => setFormData({ ...formData, technicalContactName: e.target.value })}
                    placeholder={t('settings.technicalNamePlaceholder')}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E2E6DF] bg-[#F4F5F0] focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9FE870] focus:border-[#163300] font-semibold text-[#0E0F0C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#0E0F0C] mb-1.5">
                    {t('settings.technicalEmailLabel')}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#5E605D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={formData.technicalContactEmail}
                      onChange={(e) => setFormData({ ...formData, technicalContactEmail: e.target.value })}
                      placeholder={t('settings.technicalEmailPlaceholder')}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E6DF] bg-[#F4F5F0] focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9FE870] focus:border-[#163300] font-semibold text-[#0E0F0C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-[#0E0F0C] mb-1.5">
                    {t('settings.technicalPhoneLabel')}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#5E605D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={formData.technicalContactPhone}
                      onChange={(e) => setFormData({ ...formData, technicalContactPhone: e.target.value })}
                      placeholder={t('settings.technicalPhonePlaceholder')}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E6DF] bg-[#F4F5F0] focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9FE870] focus:border-[#163300] font-semibold text-[#0E0F0C]"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F4F5F0] border border-[#E2E6DF] flex items-start gap-2.5 sm:gap-3">
                <Shield className="w-4 h-4 text-[#163300] shrink-0 mt-0.5" />
                <p className="text-xs text-[#5E605D] leading-relaxed">
                  {t('settings.technicalContactNotice')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CONTATO FINANCEIRO */}
        {activeSubTab === 'financial' && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
            <div className="p-4 sm:p-7 rounded-2xl sm:rounded-3xl bg-white border border-[#E2E6DF] shadow-xs space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E2E6DF]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#E8F7DC] text-[#163300] flex items-center justify-center font-bold shrink-0">
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-[#0E0F0C] font-['Outfit']">
                      {t('settings.financialContactTitle')}
                    </h2>
                    <p className="text-xs text-[#5E605D]">
                      {t('settings.financialContactSubtitle')}
                    </p>
                  </div>
                </div>
                <span className="hidden sm:inline-block bg-[#E8F7DC] text-[#163300] border border-[#9FE870]/40 text-[11px] font-black px-3 py-1 rounded-full">
                  {t('settings.billingAndAccountsBadge')}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-[#0E0F0C] mb-1.5">
                    {t('settings.financialNameLabel')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.financialContactName}
                    onChange={(e) => setFormData({ ...formData, financialContactName: e.target.value })}
                    placeholder={t('settings.financialNamePlaceholder')}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E2E6DF] bg-[#F4F5F0] focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9FE870] focus:border-[#163300] font-semibold text-[#0E0F0C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#0E0F0C] mb-1.5">
                    {t('settings.financialEmailLabel')}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#5E605D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={formData.financialContactEmail}
                      onChange={(e) => setFormData({ ...formData, financialContactEmail: e.target.value })}
                      placeholder={t('settings.financialEmailPlaceholder')}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E6DF] bg-[#F4F5F0] focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9FE870] focus:border-[#163300] font-semibold text-[#0E0F0C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-[#0E0F0C] mb-1.5">
                    {t('settings.financialPhoneLabel')}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#5E605D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={formData.financialContactPhone}
                      onChange={(e) => setFormData({ ...formData, financialContactPhone: e.target.value })}
                      placeholder={t('settings.financialPhonePlaceholder')}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E6DF] bg-[#F4F5F0] focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9FE870] focus:border-[#163300] font-semibold text-[#0E0F0C]"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F4F5F0] border border-[#E2E6DF] flex items-start gap-2.5 sm:gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#163300] shrink-0 mt-0.5" />
                <p className="text-xs text-[#5E605D] leading-relaxed">
                  {t('settings.financialContactNotice')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SEGURANÇA */}
        {activeSubTab === 'security' && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
            <div className="p-4 sm:p-7 rounded-2xl sm:rounded-3xl bg-white border border-[#E2E6DF] shadow-xs space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E2E6DF]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#E8F7DC] text-[#163300] flex items-center justify-center font-bold shrink-0">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-[#0E0F0C] font-['Outfit']">
                      {t('settings.accountSecurityTitle')}
                    </h2>
                    <p className="text-xs text-[#5E605D]">
                      {t('settings.accountSecuritySubtitle')}
                    </p>
                  </div>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1.5 bg-[#E8F7DC] text-[#163300] border border-[#9FE870]/40 text-[11px] font-black px-3 py-1 rounded-full">
                  <Lock className="w-3.5 h-3.5" />
                  <span>{t('settings.protectedBadge')}</span>
                </span>
              </div>

              {/* Email vinculado à conta */}
              <div className="p-4 sm:p-5 rounded-2xl border border-[#E2E6DF] bg-[#F4F5F0] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <span className="text-xs font-black text-[#5E605D] uppercase tracking-wider">
                      {t('settings.accountEmailLabel')}
                    </span>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-white border border-[#E2E6DF] text-[#0E0F0C] flex items-center justify-center shadow-2xs shrink-0">
                        <Mail className="w-4 h-4 text-[#163300]" />
                      </div>
                      <span className="text-sm sm:text-base font-bold text-[#0E0F0C] font-mono break-all">
                        {user?.email || institution?.ownerEmail || '—'}
                      </span>
                    </div>
                    <p className="text-xs text-[#5E605D]">
                      {t('settings.accountEmailDesc')}
                    </p>
                  </div>

                  <button
                    type="button"
                    id="btn-change-account-email"
                    onClick={() => setIsChangeEmailModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-white hover:bg-[#E2E6DF] text-[#0E0F0C] text-xs sm:text-sm font-black border border-[#E2E6DF] shadow-xs transition-all cursor-pointer whitespace-nowrap self-start sm:self-center"
                  >
                    <Lock className="w-3.5 h-3.5 text-[#5E605D]" />
                    <span>{t('settings.changeEmailBtn')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: RESEND (Super Admin Only) */}
        {activeSubTab === 'resend' && isSuperAdmin && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
            <div className="p-4 sm:p-7 rounded-2xl sm:rounded-3xl bg-white border border-[#E2E6DF] shadow-xs space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E6DF]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#E8F7DC] text-[#163300] flex items-center justify-center font-bold shrink-0">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black text-[#0E0F0C] font-['Outfit']">
                        {t('settings.resendTitle')}
                      </h2>
                      <span className="bg-[#E8F7DC] text-[#163300] border border-[#9FE870]/40 text-[11px] font-black px-2.5 py-0.5 rounded-full">
                        Super Admin
                      </span>
                    </div>
                    <p className="text-xs text-[#5E605D]">
                      {t('settings.resendSubtitle')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={fetchEmailStatusAndLogs}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#E2E6DF] bg-[#F4F5F0] hover:bg-[#E2E6DF] text-[#0E0F0C] text-xs font-black transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t('settings.refreshLogsBtn')}</span>
                </button>
              </div>

              {/* Interactive Email Tester */}
              <div className="p-4 sm:p-5 rounded-2xl border border-[#9FE870]/50 bg-[#E8F7DC]/30 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-[#163300] uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#163300]" />
                    <span>{t('settings.testerTitle')}</span>
                  </h3>
                  {resendStatus && (
                    <span className="text-[11px] text-[#5E605D] font-mono">
                      {t('settings.fromLabel')} <strong>{resendStatus.fromEmail}</strong> ({resendStatus.configured ? t('settings.serviceActive') : t('settings.safeMode')})
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-black text-[#0E0F0C] mb-1">
                      {t('settings.emailTypeLabel')}
                    </label>
                    <select
                      value={testEmailType}
                      onChange={(e) => setTestEmailType(e.target.value)}
                      className="w-full bg-[#F4F5F0] border border-[#E2E6DF] text-xs font-semibold text-[#0E0F0C] rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                    >
                      <option value="ACCOUNT_CREATED">1. Criação de Conta</option>
                      <option value="DOMAIN_REGISTERED">2. Cadastro de Domínio</option>
                      <option value="DOMAIN_APPROVED">3. Aprovação de Domínio (Token TXT)</option>
                      <option value="PASSWORD_RESET">4. Reset de Senha</option>
                      <option value="TENANT_STATUS">5. Bloqueio / Desbloqueio</option>
                      <option value="INVOICE">6. Comprovante de Fatura</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-[#0E0F0C] mb-1">
                      {t('settings.testEmailToLabel')}
                    </label>
                    <input
                      type="email"
                      required
                      value={testEmailTo}
                      onChange={(e) => setTestEmailTo(e.target.value)}
                      placeholder={t('settings.testEmailToPlaceholder')}
                      className="w-full bg-[#F4F5F0] border border-[#E2E6DF] text-xs text-[#0E0F0C] rounded-xl px-3 py-2 focus:outline-none font-semibold"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      disabled={isSendingTest}
                      onClick={handleSendTestEmail}
                      className="w-full flex items-center justify-center gap-2 bg-[#00c868] hover:bg-[#00b35c] text-white px-4 py-2.5 rounded-full font-black text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSendingTest ? (
                        <span>{t('settings.sendingTestBtn')}</span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>{t('settings.sendTestBtn')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {testResultNotice && (
                  <div className="p-3 rounded-xl bg-white border border-[#9FE870]/60 text-xs font-bold text-[#163300] flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#163300]" />
                    <span>{testResultNotice}</span>
                  </div>
                )}
              </div>

              {/* Email Logs Audit Table */}
              {emailLogs.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-black text-[#5E605D] uppercase tracking-wider">
                    {t('settings.recentLogsTitle', { count: emailLogs.length })}
                  </h3>
                  <div className="max-h-48 overflow-y-auto border border-[#E2E6DF] rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F4F5F0] text-[#5E605D] font-black border-b border-[#E2E6DF] sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3">{t('settings.tableDateTime')}</th>
                          <th className="py-2.5 px-3">{t('settings.tableEvent')}</th>
                          <th className="py-2.5 px-3">{t('settings.tableRecipient')}</th>
                          <th className="py-2.5 px-3">{t('settings.tableSubject')}</th>
                          <th className="py-2.5 px-3">{t('settings.tableStatus')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E6DF] bg-white">
                        {emailLogs.slice(0, 10).map((log) => (
                          <tr key={log.id} className="hover:bg-[#F4F5F0]">
                            <td className="py-2.5 px-3 text-[#5E605D] font-mono text-[11px]">
                              {new Date(log.timestamp).toLocaleTimeString(language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US')}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-[#0E0F0C] text-[11px]">
                              {log.type}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[#5E605D] text-[11px]">
                              {log.to}
                            </td>
                            <td className="py-2.5 px-3 text-[#0E0F0C] truncate max-w-xs text-[11px] font-medium">
                              {log.subject}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                  log.status === 'SENT' || log.status === 'DELIVERED'
                                    ? 'bg-[#E8F7DC] text-[#163300] border border-[#9FE870]/40'
                                    : 'bg-[#F4F5F0] text-[#5E605D] border border-[#E2E6DF]'
                                }`}
                              >
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form Footer Save Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-4 border-t border-[#E2E6DF]">
          <p className="text-xs text-[#5E605D] text-center sm:text-left">
            {institution?.updatedAt
              ? `${t('settings.lastUpdatedPrefix')} ${new Date(institution.updatedAt).toLocaleString(language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US')}`
              : t('settings.footerNotice')}
          </p>

          <button
            type="submit"
            id="btn-save-settings"
            disabled={isSaving}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-[#00c868] hover:bg-[#00b35c] text-white px-6 sm:px-8 py-3 rounded-full font-black text-sm shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <SkooliaTwinOGlyph size="xs" />
                <span>{t('settings.saving')}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{t('settings.saveChanges')}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Modal de Alteração de E-mail via Suporte */}
      {isChangeEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0E0F0C]/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl border border-[#E2E6DF] space-y-4 sm:space-y-5 animate-in zoom-in-95 max-h-[90dvh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsChangeEmailModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-[#5E605D] hover:text-[#0E0F0C] hover:bg-[#F4F5F0] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-black text-[#0E0F0C] font-['Outfit']">
                {t('settings.changeEmailModalTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-[#5E605D] leading-relaxed">
                {t('settings.changeEmailModalDesc')}
              </p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F4F5F0] border border-[#E2E6DF] space-y-2.5 sm:space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="w-4 h-4 text-[#163300] shrink-0" />
                  <span className="font-mono text-xs sm:text-sm font-bold text-[#0E0F0C] truncate">
                    help@skoolia.net
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('help@skoolia.net');
                    setCopiedEmail(true);
                    setTimeout(() => setCopiedEmail(false), 3000);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full border border-[#E2E6DF] bg-white hover:bg-[#F4F5F0] text-[#0E0F0C] text-xs font-black transition-colors cursor-pointer shrink-0"
                >
                  {copiedEmail ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#163300]" />
                      <span className="text-[#163300]">{t('common.copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{t('common.copy')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-2">
              <a
                href="mailto:help@skoolia.net?subject=Solicita%C3%A7%C3%A3o%20de%20Altera%C3%A7%C3%A3o%20de%20E-mail%20da%20Conta"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#00c868] hover:bg-[#00b35c] text-white py-2.5 sm:py-3 px-4 rounded-full text-xs sm:text-sm font-black shadow-xs transition-all text-center cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{t('settings.contactSupportBtn')}</span>
              </a>

              <button
                type="button"
                onClick={() => setIsChangeEmailModalOpen(false)}
                className="px-5 py-2.5 sm:py-3 rounded-full border border-[#E2E6DF] bg-[#F4F5F0] hover:bg-[#E2E6DF] text-[#0E0F0C] text-xs sm:text-sm font-black transition-all cursor-pointer"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
