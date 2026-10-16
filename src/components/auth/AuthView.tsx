import React, { useState, useEffect } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { GoogleEducationPartnerBadge } from './GoogleEducationPartnerBadge';
import { SkooliaTwinOGlyph } from '../SkooliaLoader';
import { LanguageSelector } from '../LanguageSelector';
import { TermsOfServiceModal } from './TermsOfServiceModal';

interface AuthViewProps {
  onBackToHome?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onBackToHome }) => {
  const {
    loginWithGoogleProvider,
    loginWithGooglePopupProvider,
    redirectError,
    clearRedirectError,
    isRedirecting,
    storageBlockedFallback,
  } = useAuth();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  useEffect(() => {
    if (redirectError) {
      setErrorMsg(redirectError);
    }
  }, [redirectError]);

  const homeLabel = language === 'pt' ? 'Página Inicial' : language === 'es' ? 'Página Principal' : 'Home';
  const backTitle = language === 'pt' ? 'Voltar para a página inicial' : language === 'es' ? 'Volver a la página principal' : 'Back to home';

  // Primary action: in-app popup (safe for iframes/webviews) with fallback to redirect
  const handleGoogleAuth = async () => {
    setErrorMsg('');
    clearRedirectError();
    setLoading(true);
    try {
      await loginWithGooglePopupProvider();
    } catch (err: any) {
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/cancelled-popup-request') {
        try {
          await loginWithGoogleProvider();
          return;
        } catch (redirErr: any) {
          setErrorMsg(redirErr?.message || t('auth.authFailed'));
        }
      } else if (err?.code === 'auth/popup-closed-by-user') {
        // User voluntarily dismissed popup
      } else if (err?.code === 'auth/unauthorized-domain') {
        setErrorMsg(
          language === 'pt'
            ? 'Domínio não autorizado nas configurações do Firebase Authentication.'
            : language === 'es'
            ? 'Dominio no autorizado en la configuración de Firebase Authentication.'
            : 'Unauthorized domain in Firebase Authentication settings.'
        );
      } else if (err?.code === 'auth/operation-not-allowed') {
        setErrorMsg(
          language === 'pt'
            ? 'Provedor Google não está ativado no Firebase Console.'
            : language === 'es'
            ? 'Proveedor Google no está activado en Firebase Console.'
            : 'Google provider is not enabled in Firebase Console.'
        );
      } else {
        setErrorMsg(err?.message || t('auth.authFailed'));
      }
      setLoading(false);
    }
  };

  const isAuthInProgress = loading || isRedirecting;

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between text-[#0E0F0C]">
      {/* Top Header Bar - Wise Style with Language Selector on the right */}
      <header className="w-full px-6 sm:px-12 py-5 flex items-center justify-between border-b border-[#E2E6DF]">
        <div className="flex items-center gap-4">
          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title={backTitle}
              aria-label={backTitle}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <button
            type="button"
            onClick={onBackToHome}
            className="flex items-center cursor-pointer bg-transparent border-0 p-0 text-left"
          >
            <span className="text-3xl sm:text-4xl font-black text-[#163300] font-['Outfit'] tracking-tight select-none">
              skoolia
            </span>
          </button>
        </div>

        {/* Header Right Actions: Back to Home Link & Language Selector */}
        <div className="flex items-center gap-4">
          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <span>{homeLabel}</span>
            </button>
          )}
          <LanguageSelector variant="auth" />
        </div>
      </header>

      {/* Main Centered Content */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-[440px] text-center">
          {/* Main Headline */}
          <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#0E0F0C] font-['Outfit'] tracking-tight">
            {t('auth.welcome')}
          </h1>

          <p className="text-sm sm:text-base text-[#5E605D] mt-3 mb-8 leading-relaxed max-w-sm mx-auto">
            {t('auth.subtitle')}
          </p>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm text-left animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Google Auth Button - Wise Clean Action */}
          <div className="space-y-4">
            <button
              type="button"
              id="btn-google-auth"
              onClick={handleGoogleAuth}
              disabled={isAuthInProgress}
              className="w-full h-14 px-6 rounded-full border border-[#D4DACF] hover:border-[#163300] bg-white hover:bg-[#F4F5F0] text-[#0E0F0C] font-bold text-sm sm:text-base shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-3.5 cursor-pointer disabled:opacity-50 group active:scale-[0.99]"
            >
              {isAuthInProgress ? (
                <>
                  <SkooliaTwinOGlyph size="xs" />
                  <span className="font-bold text-[#0E0F0C]">
                    {isRedirecting
                      ? (language === 'pt' ? 'Redirecionando para o Google...' : language === 'es' ? 'Redirigiendo a Google...' : 'Redirecting to Google...')
                      : t('auth.connectingGoogle')}
                  </span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                    />
                  </svg>
                  <span>{t('auth.signInWithGoogle')}</span>
                </>
              )}
            </button>
          </div>

          {/* Terms of Service Agreement Note */}
          <p className="mt-8 text-xs text-[#5E605D] leading-relaxed max-w-sm mx-auto">
            {t('auth.termsAgreement')}{' '}
            <button
              type="button"
              id="btn-open-terms-modal"
              onClick={() => setIsTermsOpen(true)}
              className="underline cursor-pointer hover:text-[#0E0F0C] transition-colors inline text-inherit bg-transparent p-0 border-0 font-medium"
            >
              {t('auth.termsOfUse')}
            </button>
            .
          </p>
        </div>
      </main>

      {/* Footer Badge */}
      <footer className="w-full py-6 px-4 flex justify-center">
        <GoogleEducationPartnerBadge />
      </footer>

      {/* Terms of Service Modal */}
      <TermsOfServiceModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
      />
    </div>
  );
};

