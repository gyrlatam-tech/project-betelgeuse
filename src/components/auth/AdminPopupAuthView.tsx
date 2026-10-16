import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { SkooliaTwinOGlyph } from '../SkooliaLoader';

interface AdminPopupAuthViewProps {
  onBackToHome: () => void;
}

export const AdminPopupAuthView: React.FC<AdminPopupAuthViewProps> = ({ onBackToHome }) => {
  const { loginWithGooglePopupProvider } = useAuth();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAdminPopupAuth = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      await loginWithGooglePopupProvider();
      setLoading(false);
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg(
          language === 'pt'
            ? 'A janela de autenticação foi fechada antes de concluir o login.'
            : language === 'es'
            ? 'La ventana de autenticación se cerró antes de completar el inicio de sesión.'
            : 'Authentication popup was closed before completing login.'
        );
      } else if (err?.code === 'auth/cancelled-popup-request') {
        setErrorMsg(
          language === 'pt'
            ? 'Uma solicitação de login já está em andamento.'
            : language === 'es'
            ? 'Una solicitud de inicio de sesión ya está en curso.'
            : 'A login request is already in progress.'
        );
      } else if (err?.code === 'auth/unauthorized-domain') {
        setErrorMsg(
          language === 'pt'
            ? 'Domínio não autorizado no Firebase Console. Adicione este domínio aos Domínios Autorizados.'
            : language === 'es'
            ? 'Dominio no autorizado en Firebase Console. Agréguelo a Dominios Autorizados.'
            : 'Unauthorized domain in Firebase Console. Add it to Authorized Domains.'
        );
      } else {
        setErrorMsg(
          err?.message ||
            (language === 'pt'
              ? 'Falha ao autenticar administrador.'
              : language === 'es'
              ? 'Error al autenticar administrador.'
              : 'Failed to authenticate administrator.')
        );
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F0] flex flex-col justify-between text-[#0E0F0C]">
      {/* Top Header Bar */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-[#E2E5DC] bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <button
          type="button"
          onClick={onBackToHome}
          className="flex items-center gap-2 text-sm font-bold text-[#5E605D] hover:text-[#163300] transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>{language === 'pt' ? 'Voltar' : language === 'es' ? 'Volver' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200/80 rounded-full text-amber-900 text-xs font-semibold">
          <Lock className="w-3.5 h-3.5 text-amber-700" />
          <span>Internal Admin Portal</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md bg-white border border-[#D4DACF] rounded-3xl p-8 sm:p-10 shadow-sm text-center">
          {/* Logo & Security Badge */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#9FE870]/25 text-[#163300] mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0E0F0C] tracking-tight mb-2">
            skoolia
          </h1>
          <p className="text-sm font-bold text-[#163300] uppercase tracking-wider mb-2">
            {language === 'pt'
              ? 'Acesso Administrativo Interno'
              : language === 'es'
              ? 'Acceso Administrativo Interno'
              : 'Internal Admin Access'}
          </p>
          <p className="text-xs text-[#5E605D] leading-relaxed mb-8">
            {language === 'pt'
              ? 'Autenticação direta com Google via janela suspensa (Popup Mode).'
              : language === 'es'
              ? 'Autenticación directa con Google vía ventana emergente (Popup Mode).'
              : 'Direct Google authentication via secure popup window (Popup Mode).'}
          </p>

          {/* Error Message Banner */}
          {errorMsg && (
            <div
              role="alert"
              className="mb-6 p-3.5 rounded-2xl bg-[#FDF2F2] border border-[#F8B4B4] text-[#9B1C1C] text-xs font-medium flex items-start gap-2.5 text-left"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-[#E02424] mt-0.5" />
              <span className="flex-1 leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* Single Action Button: Google Popup */}
          <button
            type="button"
            id="btn-admin-popup-login"
            onClick={handleAdminPopupAuth}
            disabled={loading}
            className="w-full h-14 px-6 rounded-full border border-[#163300] bg-[#163300] hover:bg-[#1f4700] text-white font-bold text-sm sm:text-base shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-3.5 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
          >
            {loading ? (
              <>
                <SkooliaTwinOGlyph size="xs" />
                <span className="text-white font-bold">
                  {language === 'pt'
                    ? 'Abrindo janela de login...'
                    : language === 'es'
                    ? 'Abriendo ventana de acceso...'
                    : 'Opening login window...'}
                </span>
              </>
            ) : (
              <>
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 p-1">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.15-6.72-4.98H1.25v3.15C3.26 21.36 7.34 24 12 24Z"
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
                </div>
                <span>
                  {language === 'pt'
                    ? 'Entrar com Google (Popup)'
                    : language === 'es'
                    ? 'Iniciar con Google (Popup)'
                    : 'Sign in with Google (Popup)'}
                </span>
              </>
            )}
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-[#5E605D] select-none">
        <span>skoolia &copy; {new Date().getFullYear()} &bull; Internal Console</span>
      </footer>
    </div>
  );
};
