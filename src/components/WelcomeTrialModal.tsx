import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Infinity,
  CheckCircle2,
  Globe,
  Users,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  X,
  CalendarCheck,
} from 'lucide-react';

interface WelcomeTrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  institutionName?: string;
}

export const WelcomeTrialModal: React.FC<WelcomeTrialModalProps> = ({
  isOpen,
  onClose,
  institutionName,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Trigger a rich celebration confetti burst with Wise inspired colors
      const end = Date.now() + 1200;
      const colors = ['#9fe870', '#163300', '#2563eb', '#f59e0b', '#10b981'];

      (function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors,
          zIndex: 9999,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors,
          zIndex: 9999,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();

      // Additional center burst
      setTimeout(() => {
        confetti({
          particleCount: 60,
          spread: 100,
          origin: { y: 0.55 },
          colors,
          zIndex: 9999,
        });
      }, 200);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const features = [
    {
      icon: <Infinity className="w-4 h-4 text-[#163300]" />,
      title: 'Licenças Ilimitadas',
      description: 'Provisione alunos, professores e equipe sem restrições de quantidade.',
    },
    {
      icon: <Globe className="w-4 h-4 text-[#163300]" />,
      title: 'Domínios Institucionais',
      description: 'Cadastre seus domínios com verificação DNS e tokens automáticos.',
    },
    {
      icon: <Users className="w-4 h-4 text-[#163300]" />,
      title: 'Importação em Lote',
      description: 'Crie centenas de contas de uma só vez através de planilhas CSV.',
    },
    {
      icon: <CreditCard className="w-4 h-4 text-[#163300]" />,
      title: 'Flexibilidade de Pagamento',
      description: 'Opções de faturamento mensal ou anual com total liberdade e controle.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E0F0C]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#E2E6DF] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
        {/* Top Decorative Header - Wise Forest Green Canvas */}
        <div className="relative bg-[#163300] p-7 text-white text-left overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#9FE870]/15 rounded-full blur-2xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-3.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#9FE870]/20 border border-[#9FE870]/40 text-[#9FE870] text-xs font-black tracking-wider uppercase font-['Outfit']">
              <Sparkles className="w-3.5 h-3.5" />
              Período de Avaliação Ativado
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-white text-xs font-semibold">
              <CalendarCheck className="w-3.5 h-3.5 text-[#9FE870]" />
              30 Dias Grátis
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black font-['Outfit'] tracking-tight text-white">
            Boas-vindas ao skoolia! 🎉
          </h2>
          <p className="text-xs sm:text-sm text-white/80 mt-1.5 leading-relaxed font-normal">
            {institutionName ? (
              <>
                O ambiente da <strong className="text-[#9FE870] font-bold">{institutionName}</strong> está pronto com acesso total ao período de teste oficial.
              </>
            ) : (
              'Seu painel administrativo institucional está liberado com acesso completo ao período de teste oficial.'
            )}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 bg-[#F4F5F0]">
          <div className="rounded-2xl bg-white border border-[#E2E6DF] p-4 flex items-start gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-full bg-[#E8F7DC] text-[#163300] flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="text-left text-xs">
              <h4 className="font-bold text-[#0E0F0C] text-sm">Trial com Licenças Ilimitadas</h4>
              <p className="text-[#5E605D] mt-0.5 leading-relaxed">
                Durante o período de 30 dias, você poderá criar contas, atribuir licenças e configurar seu domínio sem nenhuma restrição ou cobrança imediata.
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {features.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-white border border-[#E2E6DF] flex items-start gap-2.5 text-left shadow-2xs"
              >
                <div className="w-7 h-7 rounded-full bg-[#E8F7DC] flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0E0F0C]">{item.title}</p>
                  <p className="text-[11px] text-[#5E605D] leading-tight mt-0.5">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Action Button - Wise Lime Pill */}
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-4 px-6 rounded-full bg-[#9FE870] hover:bg-[#8EE05B] text-[#163300] text-sm font-black shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
            >
              <span>Começar a Explorar o Painel</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
            <p className="text-[11px] text-[#868685] text-center mt-2.5 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#163300]" />
              Este aviso não será exibido novamente nos seus próximos acessos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

