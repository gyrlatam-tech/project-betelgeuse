import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Mail,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  X,
  Send,
} from 'lucide-react';
import { sendFirebasePasswordReset } from '../../lib/firebase';
import { SkooliaTwinOGlyph } from '../SkooliaLoader';

interface FirebasePasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export const FirebasePasswordResetModal: React.FC<FirebasePasswordResetModalProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setIsSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    setIsSending(true);
    try {
      await sendFirebasePasswordReset(cleanEmail);
      setSentEmail(cleanEmail);
      setIsSuccess(true);
    } catch (err: any) {
      console.warn('Note ao enviar link de recuperação:', err?.message || err);
      setErrorMsg(
        err?.message || 'Não foi possível enviar o e-mail no momento. Tente novamente mais tarde.'
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00c868]/20 border border-[#00c868]/30 flex items-center justify-center text-[#00c868]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-['Outfit'] text-white">
                Recuperar Senha
              </h2>
              <p className="text-xs text-slate-300">
                Acesso seguro à sua conta institucional
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {isSuccess ? (
            <div className="text-center space-y-4 py-2 animate-in fade-in duration-300">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#00c868] border border-emerald-200 flex items-center justify-center mx-auto shadow-2xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900 font-['Outfit']">
                  E-mail enviado!
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed px-2">
                  Enviamos as instruções para <strong className="text-slate-900">{sentEmail}</strong>. Acesse sua caixa de entrada e clique no link recebido para criar sua nova senha.
                </p>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full h-11 rounded-xl bg-[#00c868] hover:bg-[#00b05b] text-white font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Voltar para o Login</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Digite seu e-mail cadastrado. Enviaremos um link seguro para você redefinir sua senha.
              </p>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  E-mail Institucional
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@dominio.com"
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00c868]/20 focus:border-[#00c868] bg-slate-50/50 hover:bg-white focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full h-11 rounded-xl bg-[#00c868] hover:bg-[#00b05b] text-white font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <SkooliaTwinOGlyph size="xs" />
                    <span>Enviando link...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Link de Recuperação</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 text-center">
          Caso não encontre o e-mail, verifique também sua pasta de spam ou lixo eletrônico.
        </div>
      </div>
    </div>
  );
};
