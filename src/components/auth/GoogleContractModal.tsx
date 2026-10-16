import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Lock,
  Download,
  Printer,
  ChevronRight,
  Globe,
} from 'lucide-react';
import { GoogleEducationPartnerBadge } from './GoogleEducationPartnerBadge';

export type ContractDocumentType = 'workspace-education' | 'cloud-dpa' | 'partner-agreement';

export interface GoogleContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDoc?: ContractDocumentType;
  onAcceptAll?: () => void;
}

interface ContractInfo {
  id: ContractDocumentType;
  title: string;
  badge: string;
  googleUrl: string;
  summary: string;
  fullText: string[];
}

const CONTRACT_DOCUMENTS: ContractInfo[] = [
  {
    id: 'workspace-education',
    title: 'Termos de Serviço do Google Workspace',
    badge: 'Contrato Oficial Google',
    googleUrl: 'https://workspace.google.com/terms/',
    summary:
      'Rege o uso do Google Workspace Fundamentals, Standard e Enterprise para instituições e organizações credenciadas.',
    fullText: [
      '1. SERVIÇOS E PROVISÃO DE CONTAS: O Google disponibiliza as ferramentas Google Workspace (Gmail, Drive, Classroom, Meet, Docs, Sheets, Slides, Painel de Gestão) para a Instituição sob os termos de conformidade e segurança da Google LLC.',
      '2. PRIVACIDADE E SEGURANÇA: O Google não utiliza os dados dos clientes de Contas Institucionais para fins publicitários ou de direcionamento de anúncios. A Instituição é a controladora de dados e detém total propriedade sobre o conteúdo criado e armazenado no domínio.',
      '3. CONFORMIDADE COM LEIS DE PROTEÇÃO DE DADOS E PRIVACIDADE: O serviço atende às exigências das leis LGPD (Brasil), GDPR (União Europeia), FERPA e COPPA, garantindo proteção estrita aos dados cadastrais dos usuários.',
      '4. RESPONSABILIDADES DO ADMINISTRADOR: A Instituição, através do painel de administração provido pela Skoolia (Revendedor Autorizado Google Workspace), é responsável pelo gerenciamento de Unidades Organizacionais (OUs), concessão de permissões, políticas de senhas e auditoria de acessos.',
      '5. ACORDO DE NÍVEL DE SERVIÇO (SLA): O Google garante disponibilidade de 99,9% dos serviços principais com suporte técnico direto e redundância global em nuvem.',
    ],
  },
  {
    id: 'cloud-dpa',
    title: 'Adendo sobre Processamento de Dados do Google Cloud (LGPD / GDPR)',
    badge: 'Segurança & Privacidade',
    googleUrl: 'https://cloud.google.com/terms/data-processing-addendum',
    summary:
      'Define as obrigações estritas do Google como operador de dados e da Instituição como controladora, em total consonância com a LGPD (Lei nº 13.709/2018) e GDPR.',
    fullText: [
      '1. ESCOPO E DEFINIÇÕES: Este Adendo estabelece os padrões técnicos de criptografia em trânsito (TLS 1.3) e em repouso (AES-256) aplicados a todos os dados escolares processados na infraestrutura Google Cloud.',
      '2. INSTRUÇÕES DA INSTITUIÇÃO: O Google processará os dados pessoais apenas de acordo com as instruções documentadas da Instituição de Ensino cliente, vedada qualquer transferência não autorizada.',
      '3. SEGURANÇA E AUDITORIAS INDEPENDENTES: A infraestrutura é submetida a auditorias anuais de conformidade ISO/IEC 27001, ISO/IEC 27017, ISO/IEC 27018 e relatórios SOC 1, SOC 2 e SOC 3.',
      '4. NOTIFICAÇÃO DE INCIDENTES: Compromisso formal de notificação imediata à Instituição em caso de incidentes de segurança de dados confirmados.',
      '5. EXCLUSÃO E PORTABILIDADE DE DADOS: A Instituição possui o direito inalienável de exportar ou solicitar a exclusão definitiva dos dados institucionais a qualquer momento ao término do contrato.',
    ],
  },
  {
    id: 'partner-agreement',
    title: 'Contrato de Revenda e Provisionamento Skoolia Google Workspace',
    badge: 'Skoolia Reseller SLA',
    googleUrl: 'https://cloud.google.com/terms/',
    summary:
      'Termos de fornecimento do painel de gestão centralizado Skoolia, provisionamento automatizado de domínios, migração de contas e atendimento especializado.',
    fullText: [
      '1. OBJETO DO CONTRATO: A Skoolia atua como Revendedor Autorizado Google Workspace, fornecendo intermediação técnica, provisionamento de domínios institucionais e gestão centralizada multi-tenant.',
      '2. SUPORTE TÉCNICO E CONSULTORIA: Acesso ao suporte prioritário para ativação de domínios, configuração de registros MX/TXT/SPF/DKIM e sincronização com serviços Google Workspace.',
      '3. FATURAMENTO E LICENCIAMENTO: Faturamento transparente nas moedas locais das Américas, sem custos ocultos e com condições subsidiadas pelo programa oficial Google Workspace.',
      '4. CONFIDENCIALIDADE E INTEGRIDADE: Rigoroso sigilo sobre a estrutura de dados, colaboradores e usuários da instituição cadastrada.',
    ],
  },
];

export const GoogleContractModal: React.FC<GoogleContractModalProps> = ({
  isOpen,
  onClose,
  initialDoc = 'workspace-education',
  onAcceptAll,
}) => {
  const [activeTab, setActiveTab] = useState<ContractDocumentType>(initialDoc);
  const [viewMode, setViewMode] = useState<'DOCUMENT' | 'EMBEDDED'>('DOCUMENT');

  if (!isOpen) return null;

  const currentDoc = CONTRACT_DOCUMENTS.find((d) => d.id === activeTab) || CONTRACT_DOCUMENTS[0];

  return (
    <div
      id="google-contract-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="google-contract-modal-card"
        className="bg-white rounded-3xl w-full max-w-4xl h-[90vh] max-h-[780px] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#00a855] border border-emerald-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#00a855] uppercase tracking-wider">
                  Contratos & Conformidade Google
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {currentDoc.badge}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 font-['Outfit'] tracking-tight">
                {currentDoc.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="px-6 pt-3 border-b border-slate-100 bg-white flex items-center gap-2 overflow-x-auto">
          {CONTRACT_DOCUMENTS.map((doc) => {
            const isActive = doc.id === activeTab;
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => {
                  setActiveTab(doc.id);
                  setViewMode('DOCUMENT');
                }}
                className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-[#00c868] text-[#008a46] bg-emerald-50/40'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{doc.title.split('(')[0].trim()}</span>
              </button>
            );
          })}
        </div>

        {/* Action Toolbar */}
        <div className="px-6 py-2.5 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Lock className="w-3.5 h-3.5 text-[#00c868]" />
            <span className="font-medium">Documento de Validade Jurídica Internacional</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'DOCUMENT' ? 'EMBEDDED' : 'DOCUMENT')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#00c868]" />
              <span>{viewMode === 'DOCUMENT' ? 'Abrir Página Google' : 'Visualização Texto'}</span>
            </button>

            <a
              href={currentDoc.googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00c868]/10 hover:bg-[#00c868]/20 text-[#008a46] font-semibold cursor-pointer"
            >
              <span>Abrir no Google</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          {viewMode === 'EMBEDDED' ? (
            <div className="w-full h-full min-h-[420px] rounded-2xl border border-slate-200 overflow-hidden bg-white relative">
              <iframe
                src={currentDoc.googleUrl}
                title={currentDoc.title}
                className="w-full h-full border-0"
                sandbox="allow-same-origin allow-scripts allow-popups"
              />
              <div className="absolute bottom-3 right-3 p-2 rounded-xl bg-slate-900/80 text-white text-[11px] backdrop-blur-xs flex items-center gap-2">
                <span>Visualizando site do Google Workspace</span>
                <a
                  href={currentDoc.googleUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline text-emerald-300 font-bold"
                >
                  Abrir externamente
                </a>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Summary Card */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-slate-800 text-xs sm:text-sm leading-relaxed flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#00a855] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-950 mb-1">Resumo Executivo do Acordo</h4>
                  <p className="text-emerald-900">{currentDoc.summary}</p>
                </div>
              </div>

              {/* Full Claues */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                  Cláusulas e Termos Contratuais
                </h3>

                <div className="space-y-3">
                  {currentDoc.fullText.map((clause, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-xs sm:text-sm text-slate-700 leading-relaxed font-normal"
                    >
                      {clause}
                    </div>
                  ))}
                </div>
              </div>

              {/* Google Workspace Reseller Trust Sign */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#00c868] animate-pulse" />
                  <span className="text-xs font-bold text-slate-700">
                    Acordo oficial emitido por Skoolia Inc. (Revendedor Autorizado Google Workspace)
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Revisão 2026.4
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Ao marcar a aceitação no cadastro, sua instituição concorda legalmente com estes termos.
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              Fechar
            </button>
            {onAcceptAll && (
              <button
                type="button"
                onClick={() => {
                  onAcceptAll();
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-[#00c868] hover:bg-[#00b05b] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Aceitar e Continuar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
