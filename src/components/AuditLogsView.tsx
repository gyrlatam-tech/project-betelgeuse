import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  Shield,
  Clock,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { AuditLogEntry } from '../types';
import { downloadCsv } from '../utils/csvHelper';

interface AuditLogsViewProps {
  logs: AuditLogEntry[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs }) => {
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [searchLog, setSearchLog] = useState<string>('');

  const filteredLogs = logs.filter((log) => {
    const matchAction = filterAction === 'ALL' || log.action === filterAction;
    const matchSearch =
      searchLog === '' ||
      log.actorEmail.toLowerCase().includes(searchLog.toLowerCase()) ||
      log.targetResource.toLowerCase().includes(searchLog.toLowerCase()) ||
      log.details.toLowerCase().includes(searchLog.toLowerCase());
    return matchAction && matchSearch;
  });

  const handleExportLogsCsv = () => {
    const headers = ['ID,Timestamp,Actor Email,Action,Target Resource,Details,IP Address,Severity'];
    const rows = filteredLogs.map(
      (l) =>
        `"${l.id}","${l.timestamp}","${l.actorEmail}","${l.action}","${l.targetResource}","${l.details}","${l.ipAddress}","${l.severity}"`
    );
    downloadCsv('google_workspace_skoolia_audit_logs.csv', [headers, ...rows].join('\n'));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0d121c] p-5 rounded-2xl border border-[#192434]">
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-white font-['Outfit'] flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-[#1ce783]" />
            <span>Logs de Auditoria & Trilha de Eventos Workspace</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Registro imutável de todas as ações de criação, modificação de contas e permissões no skoolia.
          </p>
        </div>

        <button
          onClick={handleExportLogsCsv}
          className="flex items-center gap-2 bg-[#172233] hover:bg-[#202e43] text-slate-200 hover:text-white px-4 py-2 rounded-full font-bold text-xs border border-[#27384e] transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-[#1ce783]" />
          <span>Exportar Relatório</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0d121c] p-4 rounded-2xl border border-[#192434]">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchLog}
            onChange={(e) => setSearchLog(e.target.value)}
            placeholder="Filtrar por administrador, email alvo ou detalhes..."
            className="w-full bg-[#121824] text-xs text-white pl-9 pr-4 py-2 rounded-xl border border-[#1f2b3e] focus:border-[#1ce783] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-[#121824] text-xs text-slate-200 px-3 py-2 rounded-xl border border-[#1f2b3e] focus:border-[#1ce783] focus:outline-none cursor-pointer"
          >
            <option value="ALL">Todas as Ações</option>
            <option value="USER_CREATED">Criação de Conta</option>
            <option value="USER_SUSPENDED">Suspensão de Conta</option>
            <option value="USER_ACTIVATED">Reativação de Conta</option>
            <option value="PASSWORD_RESET">Redefinição de Senha</option>
            <option value="LICENSE_ASSIGNED">Atribuição de Licença</option>
            <option value="POLICY_UPDATED">Alteração de Políticas OU</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#0d121c] rounded-2xl border border-[#192434] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#101622] text-slate-400 border-b border-[#182333] font-semibold">
                <th className="py-3 px-4">Horário</th>
                <th className="py-3 px-4">Ação</th>
                <th className="py-3 px-4">Recurso / Alvo</th>
                <th className="py-3 px-4">Detalhes da Operação</th>
                <th className="py-3 px-4">Administrador</th>
                <th className="py-3 px-4">Origem / IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#151f2e]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Nenhum registro de log encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#121824] transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString([], {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.action === 'USER_CREATED'
                            ? 'bg-[#1ce783]/20 text-[#1ce783]'
                            : log.action === 'USER_SUSPENDED'
                            ? 'bg-amber-500/20 text-amber-300'
                            : log.action === 'USER_DELETED'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-white font-mono text-[11px]">
                      {log.targetResource}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs">{log.details}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {log.actorEmail}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[10px] whitespace-nowrap">
                      {log.ipAddress}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
