import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  WorkspaceUser,
  WorkspaceLicense,
  UserStatus,
} from '../types';
import {
  MoreVertical,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Lock,
  Unlock,
  KeyRound,
  FolderInput,
  Trash2,
  CheckSquare,
  Square,
  HardDrive,
  Mail,
  UserCheck,
  UserX,
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  ExternalLink,
} from 'lucide-react';

interface UsersTableProps {
  users: WorkspaceUser[];
  searchQuery: string;
  onOpenCreateUser: () => void;
  onOpenBatchImport: () => void;
  onSelectUserForEdit: (user: WorkspaceUser) => void;
  onToggleUserStatus: (user: WorkspaceUser) => void;
  onResetUserPassword: (user: WorkspaceUser) => void;
  onToggleGeminiLicense: (user: WorkspaceUser) => void;
  onDeleteUser: (user: WorkspaceUser) => void;
  onExportCsv: (selectedUsers?: WorkspaceUser[]) => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  searchQuery,
  onOpenCreateUser,
  onOpenBatchImport,
  onSelectUserForEdit,
  onToggleUserStatus,
  onResetUserPassword,
  onToggleGeminiLicense,
  onDeleteUser,
  onExportCsv,
}) => {
  const { t } = useLanguage();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [licenseFilter, setLicenseFilter] = useState<string>('ALL');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);

  // Filter logic
  const filteredUsers = users.filter((u) => {
    // Search query
    const matchSearch =
      searchQuery === '' ||
      u.name.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.primaryEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    let matchStatus = true;
    if (statusFilter === 'ACTIVE') matchStatus = u.status === 'ACTIVE';
    if (statusFilter === 'SUSPENDED') matchStatus = u.status === 'SUSPENDED';
    if (statusFilter === 'NO_2SV') matchStatus = !u.isEnrolledIn2SV;
    if (statusFilter === 'ADMINS') matchStatus = u.role === 'SUPER_ADMIN' || u.role === 'USER_ADMIN' || u.role === 'SERVICES_ADMIN';
    if (statusFilter === 'GEMINI') matchStatus = u.licenses.includes('Gemini for Google Workspace');

    // License filter
    const matchLicense =
      licenseFilter === 'ALL' || u.licenses.includes(licenseFilter as WorkspaceLicense);

    return matchSearch && matchStatus && matchLicense;
  });

  const handleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map((u) => u.id));
    }
  };

  const handleToggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedUsers = users.filter((u) => selectedUserIds.includes(u.id));

  return (
    <div className="space-y-4">
      {/* Top Controls & Filter Tabs */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#0d121c] p-4 rounded-2xl border border-[#192434]">
        {/* skoolia Style Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'Todos os Usuários' },
            { id: 'ACTIVE', label: 'Ativos' },
            { id: 'SUSPENDED', label: 'Suspensos' },
            { id: 'GEMINI', label: 'Com Gemini IA' },
            { id: 'NO_2SV', label: 'Sem 2FA (Alerta)' },
            { id: 'ADMINS', label: 'Administradores' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#1ce783] text-[#05140b] font-bold shadow-[0_0_12px_rgba(28,231,131,0.25)]'
                  : 'bg-[#121824] text-slate-300 hover:text-white hover:bg-[#182233] border border-[#1f2b3e]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Export CSV CTA */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={() => onExportCsv(selectedUserIds.length > 0 ? selectedUsers : undefined)}
            className="flex items-center gap-1.5 bg-[#141e2d] hover:bg-[#1c293d] text-slate-200 hover:text-white px-3.5 py-1.5 rounded-xl border border-[#23334a] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            title="Exportar no formato oficial de usuários CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#1ce783]" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Bulk Action Bar (when users are selected) */}
      {selectedUserIds.length > 0 && (
        <div className="bg-gradient-to-r from-[#141d2a] via-[#101722] to-[#141d2a] border border-[#1ce783]/50 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-[0_0_20px_rgba(28,231,131,0.15)] animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <span className="bg-[#1ce783] text-black font-black text-xs px-2.5 py-1 rounded-full">
              {selectedUserIds.length} selecionado(s)
            </span>
            <span className="text-xs text-slate-300 font-medium">Ações em massa para Google Workspace:</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onExportCsv(selectedUsers)}
              className="px-3 py-1.5 rounded-lg bg-[#1a2536] hover:bg-[#223147] text-xs font-semibold text-slate-200 transition-colors whitespace-nowrap shrink-0"
            >
              Exportar Selecionados
            </button>
            <button
              onClick={() => setSelectedUserIds([])}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 whitespace-nowrap shrink-0"
            >
              Desmarcar todos
            </button>
          </div>
        </div>
      )}

      {/* Main Users Table */}
      <div className="bg-[#0d121c] rounded-2xl border border-[#192434] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#101622] text-slate-400 border-b border-[#182333] select-none font-semibold">
                <th className="py-3.5 px-4 w-10">
                  <button
                    onClick={handleSelectAll}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    {selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-[#1ce783]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">Usuário & Email Workspace</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Armazenamento</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#151e2d]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-full bg-[#141b27] text-slate-400 flex items-center justify-center mx-auto">
                        <Search className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-slate-300">Nenhum usuário encontrado</p>
                      <p className="text-xs text-slate-400">Tente ajustar seus termos de busca ou filtros selecionados.</p>
                      <button
                        onClick={onOpenCreateUser}
                        className="bg-[#1ce783] text-black font-bold px-4 py-1.5 rounded-full text-xs hover:bg-[#00ed82] whitespace-nowrap shrink-0"
                      >
                        + Criar Novo Usuário
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => {
                  const isSelected = selectedUserIds.includes(user.id);
                  const isMenuOpen = activeMenuUserId === user.id;
                  const openUpwards = index >= Math.max(0, filteredUsers.length - 2);
                  const storageLimit =
                    typeof user.storageLimitGb === 'number' && user.storageLimitGb > 0
                      ? user.storageLimitGb
                      : 15;
                  const storagePercent = Math.min(100, Math.round((user.storageUsageGb / storageLimit) * 100));

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-[#121926] transition-colors group ${
                        isSelected ? 'bg-[#141f2e]/80' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleSelectUser(user.id)}
                          className="text-slate-500 hover:text-[#1ce783] cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#1ce783]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* User Info & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {/* skoolia Neon Ring Avatar */}
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center font-black text-xs text-black shrink-0 relative shadow"
                            style={{ backgroundColor: user.avatarColor || '#1ce783' }}
                          >
                            {user.name.givenName[0]}
                            {user.name.familyName[0]}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs lg:text-sm group-hover:text-[#1ce783] transition-colors">
                                {user.name.fullName}
                              </span>
                              {user.role === 'SUPER_ADMIN' && (
                                <span className="bg-[#1ce783]/20 text-[#1ce783] text-[9px] font-black px-1.5 py-0.5 rounded border border-[#1ce783]/40">
                                  ADMIN INSTITUCIONAL
                                </span>
                              )}
                              {user.role === 'SERVICES_ADMIN' && (
                                <span className="bg-blue-500/20 text-blue-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-blue-500/40">
                                  ADMIN SERVIÇOS
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono tracking-tight flex items-center gap-1.5 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{user.primaryEmail}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {user.status === 'ACTIVE' && (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-300 px-2.5 py-1 rounded-full font-bold text-[10px] border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Ativo
                          </span>
                        )}
                        {user.status === 'SUSPENDED' && (
                          <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-300 px-2.5 py-1 rounded-full font-bold text-[10px] border border-amber-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            Suspenso
                          </span>
                        )}
                        {user.status === 'PENDING_INVITE' && (
                          <span className="inline-flex items-center gap-1 bg-slate-700/40 text-slate-300 px-2.5 py-1 rounded-full font-bold text-[10px] border border-slate-600">
                            Pendente 1º Login
                          </span>
                        )}
                      </td>

                      {/* Storage Progress */}
                      <td className="py-3 px-4">
                        <div className="w-28 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span>
                              {user.storageUsageGb === 0
                                ? '0 bytes'
                                : user.storageUsageGb < 1
                                ? `${Math.round(user.storageUsageGb * 1024)} MB`
                                : `${user.storageUsageGb.toFixed(2)} GB`}
                            </span>
                            <span>
                              {storageLimit >= 1000
                                ? `${Number((storageLimit >= 1024 ? storageLimit / 1024 : storageLimit / 1000).toFixed(1))}TB`
                                : `${storageLimit}GB`}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-[#182333] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                storagePercent > 85 ? 'bg-amber-400' : 'bg-[#1ce783]'
                              }`}
                              style={{ width: `${user.storageUsageGb === 0 ? 0 : Math.max(3, storagePercent)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Actions Menu */}
                      <td className="py-3 px-4 text-right relative">
                        <div className="inline-block text-left">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuUserId(isMenuOpen ? null : user.id);
                            }}
                            className="p-1.5 rounded-lg bg-[#141c28] hover:bg-[#1d283a] text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Dropdown Menu */}
                          {isMenuOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuUserId(null);
                                }}
                              />
                              <div
                                className={`absolute right-0 ${
                                  openUpwards ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                                } w-52 bg-[#0e141f] border border-[#202d42] rounded-xl shadow-2xl z-50 py-1.5 divide-y divide-[#172233] text-xs animate-in fade-in zoom-in-95 duration-100`}
                              >
                                <div className="px-3 py-2 bg-[#121927]">
                                  <p className="font-bold text-white truncate">{user.name.fullName}</p>
                                  <p className="text-[10px] text-slate-400 font-mono truncate">{user.primaryEmail}</p>
                                </div>

                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      onSelectUserForEdit(user);
                                      setActiveMenuUserId(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-slate-200 hover:bg-[#162132] hover:text-[#1ce783] flex items-center gap-2 transition-colors cursor-pointer"
                                  >
                                    <UserCheck className="w-3.5 h-3.5 text-[#1ce783]" />
                                    <span>Editar Dados & Cargo</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      onResetUserPassword(user);
                                      setActiveMenuUserId(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-slate-200 hover:bg-[#162132] hover:text-amber-300 flex items-center gap-2 transition-colors cursor-pointer"
                                  >
                                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                                    <span>{t('modals.editUser.resetPasswordBtn') || 'Redefinir Senha'}</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      onToggleGeminiLicense(user);
                                      setActiveMenuUserId(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-slate-200 hover:bg-[#162132] hover:text-[#1ce783] flex items-center gap-2 transition-colors cursor-pointer"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-[#1ce783]" />
                                    <span>
                                      {user.licenses.includes('Gemini for Google Workspace')
                                        ? 'Remover Gemini IA'
                                        : 'Atribuir Gemini IA'}
                                    </span>
                                  </button>
                                </div>

                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      onToggleUserStatus(user);
                                      setActiveMenuUserId(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-slate-200 hover:bg-[#162132] flex items-center gap-2 transition-colors cursor-pointer"
                                  >
                                    {user.status === 'ACTIVE' ? (
                                      <>
                                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                                        <span className="text-amber-300">Suspender Usuário</span>
                                      </>
                                    ) : (
                                      <>
                                        <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                                        <span className="text-emerald-300">Reativar Conta</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Stats */}
        <div className="bg-[#101622] px-4 py-3 border-t border-[#182333] flex items-center justify-between text-xs text-slate-400">
          <div>
            Exibindo <span className="font-bold text-white">{filteredUsers.length}</span> de <span className="font-bold text-white">{users.length}</span> contas cadastradas
          </div>
        </div>
      </div>
    </div>
  );
};
