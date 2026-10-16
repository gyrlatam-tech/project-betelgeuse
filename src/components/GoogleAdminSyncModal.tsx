import React, { useState } from 'react';
import {
  RefreshCw,
  FileSpreadsheet,
  Code2,
  Copy,
  Check,
  Download,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Zap,
} from 'lucide-react';
import { WorkspaceUser } from '../types';
import { exportUsersToGoogleAdminCsv, downloadCsv } from '../utils/csvHelper';

interface GoogleAdminSyncModalProps {
  users: WorkspaceUser[];
}

export const GoogleAdminSyncModal: React.FC<GoogleAdminSyncModalProps> = ({ users }) => {
  const [activeSubTab, setActiveSubTab] = useState<'csv' | 'json' | 'curl'>('csv');
  const [copied, setCopied] = useState(false);

  const csvOutput = exportUsersToGoogleAdminCsv(users);

  const apiJsonPayload = {
    domain: 'skoolia.com',
    syncTimestamp: new Date().toISOString(),
    totalUsersCount: users.length,
    users: users.map((u) => ({
      primaryEmail: u.primaryEmail,
      name: {
        givenName: u.name.givenName,
        familyName: u.name.familyName,
      },
      orgUnitPath: u.orgUnitPath,
      department: u.department,
      jobTitle: u.jobTitle,
      employeeId: u.employeeId,
      licenses: u.licenses,
      suspended: u.status === 'SUSPENDED',
      isEnrolledIn2SV: u.isEnrolledIn2SV,
      changePasswordAtNextLogin: u.mustChangePasswordAtNextLogin,
    })),
  };

  const curlExample = `curl -X POST https://admin.googleapis.com/admin/directory/v1/users \\
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \\
  -H "Content-Type: application/json" \\
  -d '{
    "primaryEmail": "novo.usuario@skoolia.com",
    "name": {
      "givenName": "Novo",
      "familyName": "Usuario"
    },
    "password": "skooliaTempPassword#2026",
    "changePasswordAtNextLogin": true
  }'`;

  const jsonString = JSON.stringify(apiJsonPayload, null, 2);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    downloadCsv(`google_workspace_export_${Date.now()}.csv`, csvOutput);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0d121c] p-5 rounded-2xl border border-[#192434]">
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-white font-['Outfit'] flex items-center gap-2.5">
            <RefreshCw className="w-5 h-5 text-[#1ce783]" />
            <span>Sincronização do Diretório de Usuários</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Exporte ou sincronize seus dados diretamente com o diretório institucional do Google Workspace.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-2 bg-[#1ce783] hover:bg-[#00ed82] active:scale-95 text-[#05140b] px-4 py-2 rounded-full font-bold text-xs transition-all shadow-[0_0_15px_rgba(28,231,131,0.3)] cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Baixar Planilha de Usuários (CSV)</span>
          </button>
        </div>
      </div>

      {/* Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-[#192434] pb-2">
        <button
          onClick={() => setActiveSubTab('csv')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'csv'
              ? 'bg-[#141d2a] text-[#1ce783] border border-[#1ce783]/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Planilha Oficial (CSV)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('json')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'json'
              ? 'bg-[#141d2a] text-[#1ce783] border border-[#1ce783]/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Estrutura de Dados (JSON)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('curl')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'curl'
              ? 'bg-[#141d2a] text-[#1ce783] border border-[#1ce783]/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Comando cURL / CLI</span>
        </button>
      </div>

      {/* Code / Content Viewer */}
      <div className="bg-[#0b0e14] rounded-2xl border border-[#192434] overflow-hidden shadow-2xl">
        <div className="bg-[#101622] px-4 py-3 border-b border-[#182333] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-[#1ce783]/80"></span>
            <span className="text-xs font-mono text-slate-400 ml-2">
              {activeSubTab === 'csv'
                ? 'workspace_users_export.csv'
                : activeSubTab === 'json'
                ? 'users_batch_payload.json'
                : 'workspace_sync_request.sh'}
            </span>
          </div>

          <button
            onClick={() =>
              handleCopy(
                activeSubTab === 'csv'
                  ? csvOutput
                  : activeSubTab === 'json'
                  ? jsonString
                  : curlExample
              )
            }
            className="flex items-center gap-1.5 text-xs text-[#1ce783] hover:text-white bg-[#141e2d] hover:bg-[#1d2b3f] px-3 py-1 rounded-lg border border-[#223249] transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar Código'}</span>
          </button>
        </div>

        <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-96 leading-relaxed">
          {activeSubTab === 'csv' && csvOutput}
          {activeSubTab === 'json' && jsonString}
          {activeSubTab === 'curl' && curlExample}
        </pre>
      </div>
    </div>
  );
};
