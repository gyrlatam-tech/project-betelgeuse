import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    try {
      window.location.reload();
    } catch {
      window.location.href = '/';
    }
  };

  private handleGoHome = () => {
    try {
      window.location.href = '/';
    } catch {}
  };

  public render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Erro inesperado ao carregar a interface.';
      return (
        <div className="min-h-screen bg-[#f4f5f0] flex flex-col items-center justify-center p-4 sm:p-6 text-[#0E0F0C]">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-200/80 text-center space-y-6">
            {/* Logo */}
            <div className="flex justify-center">
              <span className="text-3xl font-black text-[#163300] font-['Outfit'] tracking-tight">
                skoolia
              </span>
            </div>

            {/* Warning Icon */}
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-7 h-7" />
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-slate-900">
                Ocorreu uma instabilidade momentânea
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                A aplicação encontrou um erro ao processar os recursos da página. Clique abaixo para recarregar o sistema com segurança.
              </p>
            </div>

            {/* Error Message Box */}
            <div className="text-left bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-mono break-words max-h-32 overflow-y-auto">
              <p className="font-semibold text-rose-600 mb-1">Detalhe:</p>
              {errorMessage}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl text-xs font-black text-white bg-[#00c868] hover:bg-[#00a855] shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <RefreshCw className="w-4 h-4 shrink-0" />
                <span>Recarregar Aplicativo</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <Home className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Página Inicial</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
