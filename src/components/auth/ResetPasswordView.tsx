import React, { useState, useEffect } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { verifyFirebaseResetCode, confirmFirebasePasswordReset } from '../../lib/firebase';
import { SkooliaTwinOGlyph, SkooliaLogo } from '../SkooliaLoader';
import { GoogleEducationPartnerBadge } from './GoogleEducationPartnerBadge';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSelector } from '../LanguageSelector';

interface ResetPasswordViewProps {
  oobCode: string;
  initialEmail?: string;
  onSuccess: (email: string, newPassword?: string) => void;
  onCancel: () => void;
}

export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({
  oobCode,
  initialEmail = '',
  onSuccess,
  onCancel,
}) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState(initialEmail);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  useEffect(() => {
    if (oobCode) {
      verifyCode(oobCode);
    }
  }, [oobCode]);

  const verifyCode = async (code: string) => {
    setIsVerifying(true);
    try {
      const detectedEmail = await verifyFirebaseResetCode(code, initialEmail || email);
      if (detectedEmail && detectedEmail.includes('@')) {
        setEmail(detectedEmail);
      }
    } catch {
      // Non-blocking fallback for pre-filled email
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 6) {
      setErrorMsg(t('resetPassword.minCharactersError'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg(t('resetPassword.passwordMismatchError'));
      return;
    }

    setIsSubmitting(true);
    try {
      await confirmFirebasePasswordReset(oobCode || 'direct_reset', newPassword, email);
      setIsSuccess(true);
    } catch (err: any) {
      console.warn('Note ao redefinir senha:', err?.message || err);
      const raw = err?.message || '';
      if (
        raw.includes('auth/invalid-action-code') ||
        raw.includes('INVALID_OOB_CODE') ||
        raw.includes('EXPIRED_OOB_CODE') ||
        raw.includes('invalid')
      ) {
        setErrorMsg(t('resetPassword.expiredLinkError'));
      } else {
        setErrorMsg(raw || t('resetPassword.genericError'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 font-['Plus_Jakarta_Sans']">
      <div className="w-full max-w-md mx-auto pt-6 flex flex-col items-center">
        {/* Top Bar with Language Selector */}
        <div className="w-full flex items-center justify-between mb-4 px-1">
          <SkooliaLogo size="md" />
          <LanguageSelector variant="auth" />
        </div>

        {/* Main Card */}
        <div className="w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80 p-6 sm:p-8 transition-all">
          {isSuccess ? (
            <div className="text-center space-y-5 py-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#00c868] border border-emerald-200 flex items-center justify-center mx-auto shadow-2xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-900 font-['Outfit']">
                  {t('resetPassword.successTitle')}
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {t('resetPassword.successSubtitle')}
                </p>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => onSuccess(email, newPassword)}
                  className="w-full h-12 rounded-xl bg-[#00c868] hover:bg-[#00b05b] text-white font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{t('resetPassword.accessButton')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="text-center space-y-1 pb-1">
                <h1 className="text-xl font-bold text-slate-900 font-['Outfit']">
                  {t('resetPassword.title')}
                </h1>
                <p className="text-xs text-slate-500">
                  {t('resetPassword.subtitle')}
                </p>
                {email && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#00c868]" />
                    <span>{email}</span>
                  </div>
                )}
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMsg}</span>
                </div>
              )}

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t('resetPassword.newPasswordLabel')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('resetPassword.newPasswordPlaceholder')}
                    className="w-full h-11 pl-4 pr-11 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00c868]/20 focus:border-[#00c868] bg-slate-50/50 hover:bg-white focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t('resetPassword.confirmPasswordLabel')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                    className="w-full h-11 pl-4 pr-11 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00c868]/20 focus:border-[#00c868] bg-slate-50/50 hover:bg-white focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="text-[11px] flex items-center gap-2 text-slate-500 font-medium">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        newPassword.length < 6
                          ? 'w-1/3 bg-rose-500'
                          : newPassword.length < 9
                          ? 'w-2/3 bg-amber-500'
                          : 'w-full bg-[#00c868]'
                      }`}
                    />
                  </div>
                  <span>
                    {newPassword.length < 6
                      ? t('resetPassword.strengthWeak')
                      : newPassword.length < 9
                      ? t('resetPassword.strengthMedium')
                      : t('resetPassword.strengthStrong')}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || isVerifying}
                className="w-full h-12 rounded-xl bg-[#00c868] hover:bg-[#00b05b] text-white font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <SkooliaTwinOGlyph size="xs" />
                    <span>{t('resetPassword.saving')}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>{t('resetPassword.saveButton')}</span>
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium hover:underline cursor-pointer"
                >
                  {t('resetPassword.backToLogin')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Footer Partner Badge */}
      <div className="mt-8 mb-4">
        <GoogleEducationPartnerBadge />
      </div>
    </div>
  );
};
