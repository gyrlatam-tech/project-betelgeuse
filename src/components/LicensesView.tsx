import React, { useState, useEffect } from 'react';
import {
  Search,
  UserPlus,
  FileSpreadsheet,
  MoreVertical,
  KeyRound,
  Trash2,
  Lock,
  Unlock,
  ShieldCheck,
  Users,
  CheckSquare,
  Square,
  Sparkles,
  Edit3,
} from 'lucide-react';
import { WorkspaceUser } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { CustomLicenseQuoteCard } from './CustomLicenseQuoteCard';

interface LicensesViewProps {
  users: WorkspaceUser[];
  onOpenCreateUser: () => void;
  onOpenBatchImport: () => void;
  onExportCsv: (selectedUsers?: WorkspaceUser[]) => void;
  onSelectUserForEdit?: (user: WorkspaceUser) => void;
  onToggleUserStatus?: (user: WorkspaceUser) => void;
  onResetUserPassword?: (user: WorkspaceUser) => void;
  onDeleteUser?: (user: WorkspaceUser) => void;
  onOpenQuoteTicket?: () => void;
}

export const LicensesView: React.FC<LicensesViewProps> = ({
  users,
  onOpenCreateUser,
  onOpenBatchImport,
  onExportCsv,
  onSelectUserForEdit,
  onToggleUserStatus,
  onResetUserPassword,
  onDeleteUser,
  onOpenQuoteTicket,
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top?: number; bottom?: number; right: number } | null>(null);

  const handleToggleMenu = (e: React.MouseEvent<HTMLButtonElement>, targetUser: WorkspaceUser) => {
    e.stopPropagation();
    if (activeMenuUserId === targetUser.id) {
      setActiveMenuUserId(null);
      setMenuPosition(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const menuEstimatedHeight = 220;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < menuEstimatedHeight && rect.top > menuEstimatedHeight;

    if (openUpwards) {
      setMenuPosition({
        bottom: window.innerHeight - rect.top + 6,
        right: Math.max(16, window.innerWidth - rect.right),
      });
    } else {
      setMenuPosition({
        top: rect.bottom + 6,
        right: Math.max(16, window.innerWidth - rect.right),
      });
    }
    setActiveMenuUserId(targetUser.id);
  };

  useEffect(() => {
    if (!activeMenuUserId) return;
    const handleClose = () => {
      setActiveMenuUserId(null);
      setMenuPosition(null);
    };
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    return () => {
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, [activeMenuUserId]);

  // Filter users based on search and status
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.name.fullName.toLowerCase().includes(q) ||
      u.primaryEmail.toLowerCase().includes(q) ||
      u.jobTitle.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q) ||
      u.licenses.some((lic) => lic.toLowerCase().includes(q));

    let matchesStatus = true;
    if (statusFilter === 'ACTIVE') matchesStatus = u.status === 'ACTIVE';
    if (statusFilter === 'SUSPENDED') matchesStatus = u.status === 'SUSPENDED';

    return matchesSearch && matchesStatus;
  });

  const handleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map((u) => u.id));
    }
  };

  const handleToggleSelectUser = (id: string) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter((uid) => uid !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  const selectedUsers = users.filter((u) => selectedUserIds.includes(u.id));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header & Action Controls */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#E2E6DF] shadow-xs space-y-3.5 sm:space-y-5">
        {/* Row 1: Title and Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E8F7DC] text-[#163300] flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-[#0E0F0C] font-['Outfit'] tracking-tight">
                {t('licenses.title')}
              </h1>
              <span className="bg-[#E8F7DC] text-[#163300] text-xs font-black px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-[#9FE870]/40">
                Workspace Standard Unlimited: {users.length} {users.length === 1 ? 'conta ativa' : 'contas ativas'} (Licenças Ilimitadas)
              </span>
            </div>
          </div>

          {/* Action Buttons Group */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto shrink-0">
            {/* Import Button */}
            <button
              type="button"
              onClick={onOpenBatchImport}
              id="btn-import-users-licenses"
              className="h-10 sm:h-11 px-3 sm:px-5 rounded-full border border-[#D4DACF] bg-white hover:bg-[#F4F5F0] text-[#0E0F0C] text-xs sm:text-sm font-bold transition-all inline-flex items-center justify-center gap-1.5 sm:gap-2 shadow-2xs cursor-pointer active:scale-98 whitespace-nowrap"
              title={t('licenses.importCsvTitle')}
            >
              <FileSpreadsheet className="w-4 h-4 text-[#5E605D] shrink-0" />
              <span className="truncate">{t('licenses.importCsv')}</span>
            </button>

            {/* Create New User Button */}
            <button
              type="button"
              onClick={onOpenCreateUser}
              id="btn-create-user-licenses"
              className="h-10 sm:h-11 px-3 sm:px-6 rounded-full bg-[#9FE870] hover:bg-[#8EE05B] text-[#163300] text-xs sm:text-sm font-black transition-all inline-flex items-center justify-center gap-1.5 sm:gap-2 shadow-xs cursor-pointer active:scale-98 whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4 stroke-[2.5] shrink-0" />
              <span className="truncate">{t('licenses.createUserBtn')}</span>
            </button>
          </div>
        </div>

        {/* Row 2: Search Bar & Quick Status Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-3.5 sm:pt-4 border-t border-[#E2E6DF]">
          {/* Search Bar */}
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 text-[#868685] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              id="input-licenses-search"
              placeholder={t('licenses.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 sm:h-11 bg-[#F4F5F0] border border-[#E2E6DF] pl-11 pr-10 rounded-full text-xs sm:text-sm text-[#0E0F0C] placeholder-[#868685] focus:outline-none focus:border-[#163300] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#868685] hover:text-[#0E0F0C] cursor-pointer px-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: t('licenses.filterAll', { count: users.length }) },
              {
                id: 'ACTIVE',
                label: t('licenses.filterActive', {
                  count: users.filter((u) => u.status === 'ACTIVE').length,
                }),
              },
              {
                id: 'SUSPENDED',
                label: t('licenses.filterSuspended', {
                  count: users.filter((u) => u.status === 'SUSPENDED').length,
                }),
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
                className={`h-10 px-4 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer inline-flex items-center tabular-nums btn-press ${
                  statusFilter === tab.id
                    ? 'bg-[#163300] text-[#9FE870] shadow-xs'
                    : 'bg-[#F4F5F0] text-[#5E605D] hover:bg-[#E2E6DF]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk Selection Bar */}
      {selectedUserIds.length > 0 && (
        <div className="bg-[#E8F7DC] border border-[#9FE870]/60 px-5 py-3 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#163300] font-black">
            <CheckSquare className="w-4 h-4 text-[#163300]" />
            <span>{t('licenses.selectedUsers', { count: selectedUserIds.length })}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onExportCsv(selectedUsers)}
              className="bg-white border border-[#D4DACF] hover:bg-[#F4F5F0] text-[#0E0F0C] font-bold px-4 py-1.5 rounded-full transition-all cursor-pointer shadow-2xs"
            >
              {t('licenses.exportSelected')}
            </button>
            <button
              onClick={() => setSelectedUserIds([])}
              className="text-[#5E605D] hover:text-[#0E0F0C] font-semibold underline px-2 cursor-pointer"
            >
              {t('licenses.clearSelection')}
            </button>
          </div>
        </div>
      )}

      {/* Mobile View (< md screens): Distinct Responsive Card List with clear spacing and user separation */}
      <div className="md:hidden space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E6DF] py-12 text-center text-[#868685] space-y-2 px-4 shadow-2xs">
            <Users className="w-8 h-8 mx-auto text-[#CBD3C5]" />
            <p className="font-bold text-[#0E0F0C]">{t('licenses.noUsersFound')}</p>
          </div>
        ) : (
          filteredUsers.map((user, idx) => {
            const isSelected = selectedUserIds.includes(user.id);
            const userLimitGb =
              typeof user.storageLimitGb === 'number' && user.storageLimitGb > 0
                ? user.storageLimitGb
                : 15;
            const ratio = user.storageUsageGb / userLimitGb;
            const formattedLimit =
              userLimitGb >= 1000
                ? `${Number((userLimitGb >= 1024 ? userLimitGb / 1024 : userLimitGb / 1000).toFixed(1))}TB`
                : `${userLimitGb}GB`;

            return (
              <React.Fragment key={user.id}>
                {/* Visual Separator between user cards */}
                {idx > 0 && (
                  <div className="relative py-1 flex items-center justify-center">
                    <div className="w-full border-t border-[#D5DACF]/60" />
                    <span className="absolute px-2.5 py-0.5 bg-[#F4F5F0] text-[10px] font-semibold text-[#868685] uppercase tracking-wider rounded-full border border-[#E2E6DF]">
                      {t('common.user') || 'Usuário'} #{idx + 1}
                    </span>
                  </div>
                )}

                <div
                  className={`p-4 rounded-2xl border transition-all space-y-3.5 shadow-xs ${
                    isSelected
                      ? 'bg-[#E8F7DC]/50 border-[#9FE870] ring-2 ring-[#9FE870]'
                      : 'bg-white border-[#D5DACF] hover:border-[#CBD3C5]'
                  }`}
                >
                  {/* Top Row: Select, Avatar, Info & Status */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleSelectUser(user.id)}
                        className="p-1 -m-1 text-[#868685] hover:text-[#0E0F0C] cursor-pointer shrink-0"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#163300]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>

                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-full bg-[#E8F7DC] text-[#163300] flex items-center justify-center font-black text-xs border border-[#9FE870]/40 shadow-2xs">
                          {user.name?.givenName?.[0] || user.primaryEmail?.[0]?.toUpperCase() || 'U'}
                          {user.name?.familyName?.[0] || ''}
                        </div>
                        {user.role === 'SUPER_ADMIN' && (
                          <div
                            className="absolute -bottom-1 -right-1 bg-[#9FE870] text-[#163300] rounded-full p-0.5 shadow-2xs"
                            title={t('common.superAdmin')}
                          >
                            <ShieldCheck className="w-2.5 h-2.5 stroke-[2.5]" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-[#0E0F0C] text-sm truncate">
                            {user.name?.fullName || user.primaryEmail}
                          </span>
                          {user.role === 'SUPER_ADMIN' && (
                            <span className="bg-[#163300] text-[#9FE870] text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full tracking-wider">
                              {t('common.admin')}
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[11px] text-[#5E605D] truncate">
                          {user.primaryEmail}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {user.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-[#E8F7DC] text-[#163300] border border-[#9FE870]/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#163300] animate-pulse"></span>
                          {t('common.active')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 text-rose-800 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                          {t('common.suspended')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadata Row: Role, Department/Job, Gemini Badge */}
                  {(user.jobTitle || user.department || user.licenses.length > 0) && (
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                      {user.jobTitle && (
                        <span className="px-2 py-0.5 rounded-md bg-[#F4F5F0] text-[#0E0F0C] font-semibold border border-[#E2E6DF] truncate max-w-[180px]">
                          {user.jobTitle}
                        </span>
                      )}
                      {user.department && (
                        <span className="px-2 py-0.5 rounded-md bg-[#F4F5F0] text-[#5E605D] border border-[#E2E6DF] truncate max-w-[160px]">
                          {user.department}
                        </span>
                      )}
                      {user.licenses.includes('Gemini for Google Workspace') && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E8F7DC] text-[#163300] font-bold border border-[#9FE870]/50">
                          <Sparkles className="w-2.5 h-2.5 text-[#163300]" />
                          <span>Gemini IA</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Drive Storage Progress */}
                  <div className="space-y-1.5 bg-[#F4F5F0] p-2.5 rounded-xl border border-[#E2E6DF]/70">
                    <div className="flex items-center justify-between text-[10px] text-[#5E605D]">
                      <span className="font-bold">{t('dashboard.driveStorage')}</span>
                      <span className="font-mono font-bold">
                        {user.storageUsageGb === 0
                          ? '0 bytes'
                          : user.storageUsageGb < 1
                          ? `${Math.round(user.storageUsageGb * 1024)} MB`
                          : `${user.storageUsageGb.toFixed(2)} GB`}
                        {' '}/ {formattedLimit}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#E2E6DF] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          ratio > 0.8 ? 'bg-amber-500' : 'bg-[#163300]'
                        }`}
                        style={{
                          width: `${
                            user.storageUsageGb === 0
                              ? 0
                              : Math.min(100, Math.max(3, ratio * 100))
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Mobile Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-[#F4F5F0]">
                    {onSelectUserForEdit && (
                      <button
                        type="button"
                        onClick={() => onSelectUserForEdit(user)}
                        className="flex-1 py-2 px-3 rounded-full border border-[#D4DACF] bg-white hover:bg-[#F4F5F0] text-[#0E0F0C] text-xs font-bold transition-all cursor-pointer text-center whitespace-nowrap shadow-2xs active:scale-[0.98]"
                      >
                        {t('common.edit')}
                      </button>
                    )}

                    {onResetUserPassword && (
                      <button
                        type="button"
                        onClick={() => onResetUserPassword(user)}
                        className="py-2 px-3 rounded-full border border-[#D4DACF] bg-white hover:bg-[#F4F5F0] text-[#0E0F0C] text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shadow-2xs active:scale-[0.98]"
                        title={t('licenses.actionsMenu.resetPassword')}
                      >
                        <KeyRound className="w-3.5 h-3.5 text-[#5E605D]" />
                        <span>{t('licenses.actionsMenu.resetPassword')}</span>
                      </button>
                    )}

                    {onToggleUserStatus && (
                      <button
                        type="button"
                        onClick={() => onToggleUserStatus(user)}
                        className="p-2 rounded-full border border-[#D4DACF] bg-white hover:bg-[#F4F5F0] text-[#0E0F0C] transition-all cursor-pointer shrink-0 shadow-2xs active:scale-[0.98]"
                        title={
                          user.status === 'ACTIVE'
                            ? t('licenses.actionsMenu.suspendUser')
                            : t('licenses.actionsMenu.reactivateUser')
                        }
                      >
                        {user.status === 'ACTIVE' ? (
                          <Lock className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5 text-[#163300]" />
                        )}
                      </button>
                    )}

                    {onDeleteUser && (
                      <button
                        type="button"
                        onClick={() => onDeleteUser(user)}
                        className="p-2 rounded-full border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 transition-all cursor-pointer shrink-0 shadow-2xs active:scale-[0.98]"
                        title={t('licenses.actionsMenu.deleteUser')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}

        {/* Mobile Total Counter Footer */}
        {filteredUsers.length > 0 && (
          <div className="p-3 bg-white rounded-2xl border border-[#E2E6DF] text-center text-xs text-[#5E605D] shadow-2xs">
            <span>
              {t('common.total')}: <strong className="text-[#0E0F0C]">{filteredUsers.length}</strong> {t('common.users')}
            </span>
          </div>
        )}
      </div>

      {/* Desktop Table (md screens and up) */}
      <div className="hidden md:block bg-white rounded-2xl sm:rounded-3xl border border-[#E2E6DF] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#F4F5F0] border-b border-[#E2E6DF] text-[#868685] font-black uppercase text-[10px] tracking-wider font-['Outfit']">
                <th className="py-3.5 px-4 w-10 text-center">
                  <button
                    onClick={handleSelectAll}
                    className="text-[#868685] hover:text-[#0E0F0C] cursor-pointer"
                  >
                    {selectedUserIds.length > 0 &&
                    selectedUserIds.length === filteredUsers.length ? (
                      <CheckSquare className="w-4 h-4 text-[#163300]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">{t('dashboard.userTableHeaders.user')}</th>
                <th className="py-3.5 px-4">{t('dashboard.userTableHeaders.status')}</th>
                <th className="py-3.5 px-4">{t('dashboard.driveStorage')}</th>
                <th className="py-3.5 px-4 text-right">{t('dashboard.userTableHeaders.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E6DF]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#868685] space-y-2">
                    <Users className="w-8 h-8 mx-auto text-[#CBD3C5]" />
                    <p className="font-bold text-[#0E0F0C]">{t('licenses.noUsersFound')}</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = selectedUserIds.includes(user.id);
                  const isMenuOpen = activeMenuUserId === user.id;

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-[#F4F5F0]/70 transition-colors ${
                        isSelected ? 'bg-[#E8F7DC]/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleSelectUser(user.id)}
                          className="text-[#868685] hover:text-[#0E0F0C] cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#163300]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-9 h-9 rounded-full bg-[#E8F7DC] text-[#163300] flex items-center justify-center font-black text-xs shrink-0">
                              {user.name?.givenName?.[0] || user.primaryEmail?.[0]?.toUpperCase() || 'U'}
                              {user.name?.familyName?.[0] || ''}
                            </div>
                            {user.role === 'SUPER_ADMIN' && (
                              <div
                                className="absolute -bottom-1 -right-1 bg-[#9FE870] text-[#163300] rounded-full p-0.5"
                                title={t('common.superAdmin')}
                              >
                                <ShieldCheck className="w-3 h-3 stroke-[2.5]" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#0E0F0C] truncate">
                                {user.name?.fullName || user.primaryEmail}
                              </span>
                              {user.role === 'SUPER_ADMIN' && (
                                <span className="bg-[#163300] text-[#9FE870] text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                                  {t('common.admin')}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#5E605D]">
                              <span className="font-mono text-[#5E605D] truncate">
                                {user.primaryEmail}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {user.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#E8F7DC] text-[#163300] border border-[#9FE870]/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#163300] animate-pulse"></span>
                            {t('common.active')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-800 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                            {t('common.suspended')}
                          </span>
                        )}
                      </td>

                      {/* Armazenamento */}
                      <td className="py-3.5 px-4 min-w-[130px]">
                        {(() => {
                          const userLimitGb =
                            typeof user.storageLimitGb === 'number' && user.storageLimitGb > 0
                              ? user.storageLimitGb
                              : 15;
                          const ratio = user.storageUsageGb / userLimitGb;
                          const formattedLimit =
                            userLimitGb >= 1000
                              ? `${Number((userLimitGb >= 1024 ? userLimitGb / 1024 : userLimitGb / 1000).toFixed(1))}TB`
                              : `${userLimitGb}GB`;
                          return (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-[#5E605D] font-bold font-mono">
                                  {user.storageUsageGb === 0
                                    ? '0 bytes'
                                    : user.storageUsageGb < 1
                                    ? `${Math.round(user.storageUsageGb * 1024)} MB`
                                    : `${user.storageUsageGb.toFixed(2)} GB`}
                                </span>
                                <span className="text-[#868685] text-[10px]">
                                  / {formattedLimit}
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-[#E2E6DF] rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    ratio > 0.8 ? 'bg-amber-500' : 'bg-[#163300]'
                                  }`}
                                  style={{
                                    width: `${
                                      user.storageUsageGb === 0
                                        ? 0
                                        : Math.min(100, Math.max(3, ratio * 100))
                                    }%`,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Editar Usuário */}
                          {onSelectUserForEdit && (
                            <button
                              onClick={() => onSelectUserForEdit(user)}
                              className="px-3 py-1 rounded-full border border-[#D4DACF] hover:bg-[#F4F5F0] text-[#0E0F0C] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                            >
                              {t('common.edit')}
                            </button>
                          )}

                          {/* More Options Button */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleMenu(e, user)}
                            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                              isMenuOpen
                                ? 'bg-[#163300] text-[#9FE870]'
                                : 'text-[#868685] hover:text-[#0E0F0C] hover:bg-[#F4F5F0]'
                            }`}
                            title={t('common.actions') || 'Ações'}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="p-4 bg-[#F4F5F0] border-t border-[#E2E6DF] flex items-center justify-between text-xs text-[#5E605D]">
          <span>
            {t('common.total')}: <strong className="text-[#0E0F0C]">{filteredUsers.length}</strong> {t('common.users')}
          </span>
        </div>
      </div>

      {/* Custom Quantity Quote Card */}
      <CustomLicenseQuoteCard onOpenTicket={onOpenQuoteTicket} />

      {/* Global Fixed Actions Dropdown Menu (immune to table overflow clipping) */}
      {(() => {
        if (!activeMenuUserId || !menuPosition) return null;
        const activeUser = users.find((u) => u.id === activeMenuUserId);
        if (!activeUser) return null;

        return (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/5"
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuUserId(null);
                setMenuPosition(null);
              }}
            />
            <div
              style={{
                position: 'fixed',
                top: menuPosition.top !== undefined ? `${menuPosition.top}px` : undefined,
                bottom: menuPosition.bottom !== undefined ? `${menuPosition.bottom}px` : undefined,
                right: `${menuPosition.right}px`,
              }}
              className="w-56 bg-white rounded-2xl shadow-2xl border border-[#E2E6DF] py-2 z-50 text-left text-xs divide-y divide-[#E2E6DF] animate-in fade-in zoom-in-95 duration-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3.5 py-2 bg-[#F4F5F0]/80 rounded-t-2xl">
                <p className="font-bold text-[#0E0F0C] truncate text-xs">{activeUser.name.fullName}</p>
                <p className="text-[11px] text-[#868685] font-mono truncate">{activeUser.primaryEmail}</p>
              </div>

              <div className="py-1">
                {onSelectUserForEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenuUserId(null);
                      setMenuPosition(null);
                      onSelectUserForEdit(activeUser);
                    }}
                    className="w-full px-3.5 py-2 text-left text-[#0E0F0C] hover:bg-[#F4F5F0] flex items-center gap-2.5 transition-colors cursor-pointer font-medium"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#5E605D]" />
                    <span>{t('common.edit') || 'Editar Usuário'}</span>
                  </button>
                )}

                {onResetUserPassword && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenuUserId(null);
                      setMenuPosition(null);
                      onResetUserPassword(activeUser);
                    }}
                    className="w-full px-3.5 py-2 text-left text-[#0E0F0C] hover:bg-[#F4F5F0] flex items-center gap-2.5 transition-colors cursor-pointer font-medium"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-[#5E605D]" />
                    <span>{t('licenses.actionsMenu.resetPassword')}</span>
                  </button>
                )}

                {onToggleUserStatus && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenuUserId(null);
                      setMenuPosition(null);
                      onToggleUserStatus(activeUser);
                    }}
                    className="w-full px-3.5 py-2 text-left text-[#0E0F0C] hover:bg-[#F4F5F0] flex items-center gap-2.5 transition-colors cursor-pointer font-medium"
                  >
                    {activeUser.status === 'ACTIVE' ? (
                      <>
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>{t('licenses.actionsMenu.suspendUser')}</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-[#163300]" />
                        <span>{t('licenses.actionsMenu.reactivateUser')}</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {onDeleteUser && (
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenuUserId(null);
                      setMenuPosition(null);
                      onDeleteUser(activeUser);
                    }}
                    className="w-full px-3.5 py-2 text-left text-rose-700 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>{t('licenses.actionsMenu.deleteUser')}</span>
                  </button>
                </div>
              )}
            </div>
          </>
        );
      })()}
    </div>
  );
};
