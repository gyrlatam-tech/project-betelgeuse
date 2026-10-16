import React, { useState } from 'react';
import {
  Users2,
  UserPlus,
  Mail,
  Shield,
  Plus,
  Trash2,
  CheckCircle2,
  Users,
  Search,
  Lock,
  Globe,
} from 'lucide-react';
import { GoogleGroup, WorkspaceUser } from '../types';

interface GroupsViewProps {
  groups: GoogleGroup[];
  users: WorkspaceUser[];
  onCreateGroup: (newGroup: GoogleGroup) => void;
  onAddMemberToGroup: (groupId: string, userEmail: string) => void;
  onRemoveMemberFromGroup: (groupId: string, userEmail: string) => void;
}

export const GroupsView: React.FC<GroupsViewProps> = ({
  groups,
  users,
  onCreateGroup,
  onAddMemberToGroup,
  onRemoveMemberFromGroup,
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.id || '');
  const [isCreatingGroup, setIsCreatingGroup] = useState<boolean>(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupEmailPrefix, setNewGroupEmailPrefix] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupPermission, setNewGroupPermission] = useState<GoogleGroup['permissionLevel']>('TEAM_ONLY');

  const [selectedUserToAdd, setSelectedUserToAdd] = useState<string>('');

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !newGroupEmailPrefix.trim()) return;

    const newGroup: GoogleGroup = {
      id: `grp-${Date.now()}`,
      name: newGroupName.trim(),
      email: `${newGroupEmailPrefix.trim().toLowerCase()}@skoolia.com`,
      description: newGroupDesc.trim() || 'Lista de distribuição corporativa skoolia',
      directMembersCount: 0,
      aliases: [],
      permissionLevel: newGroupPermission,
      allowExternalMembers: false,
      members: [],
    };

    onCreateGroup(newGroup);
    setNewGroupName('');
    setNewGroupEmailPrefix('');
    setNewGroupDesc('');
    setIsCreatingGroup(false);
    setSelectedGroupId(newGroup.id);
  };

  const handleAddMember = () => {
    if (!selectedGroup || !selectedUserToAdd) return;
    onAddMemberToGroup(selectedGroup.id, selectedUserToAdd);
    setSelectedUserToAdd('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0d121c] p-5 rounded-2xl border border-[#192434]">
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-white font-['Outfit'] flex items-center gap-2.5">
            <Users2 className="w-5 h-5 text-[#1ce783]" />
            <span>Grupos & Listas de E-mail Google Workspace</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gerencie listas de distribuição, grupos de segurança e permissões de envio corporativo.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingGroup(true)}
          className="flex items-center gap-2 bg-[#1ce783] hover:bg-[#00ed82] active:scale-95 text-[#05140b] px-4 py-2 rounded-full font-bold text-xs transition-all shadow-[0_0_15px_rgba(28,231,131,0.3)] cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Criar Grupo Google</span>
        </button>
      </div>

      {/* Grid: Groups Sidebar + Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Groups List */}
        <div className="bg-[#0d121c] p-4 rounded-2xl border border-[#192434] space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 mb-2 font-['Outfit']">
            Grupos Ativos ({groups.length})
          </div>

          <div className="space-y-1.5">
            {groups.map((grp) => {
              const isSelected = grp.id === selectedGroupId;

              return (
                <div
                  key={grp.id}
                  onClick={() => setSelectedGroupId(grp.id)}
                  className={`p-3.5 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#141d2a] border border-[#1ce783]/50 text-white shadow-[0_0_12px_rgba(28,231,131,0.15)]'
                      : 'bg-[#121824] border border-[#1a2536] text-slate-300 hover:bg-[#182233]'
                  }`}
                >
                  <div className="truncate min-w-0 pr-2">
                    <p className="text-xs font-bold truncate text-white">{grp.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{grp.email}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#182333] text-slate-300 border border-[#233147] shrink-0">
                    {grp.members.length} membros
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Group Details & Members Management */}
        {selectedGroup && (
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#0d121c] p-6 rounded-2xl border border-[#192434] space-y-6">
              {/* Top Details */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#182333]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-[#1ce783]/15 text-[#1ce783] text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-[#1ce783]/30">
                      Grupo Google
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{selectedGroup.email}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white font-['Outfit'] mt-1">
                    {selectedGroup.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedGroup.description}</p>
                </div>

                <div className="flex items-center gap-2 bg-[#121824] px-3 py-1.5 rounded-xl border border-[#1b2636] text-xs">
                  <Lock className="w-3.5 h-3.5 text-[#1ce783]" />
                  <span className="text-slate-300 font-medium">Permissão:</span>
                  <span className="font-bold text-white">{selectedGroup.permissionLevel}</span>
                </div>
              </div>

              {/* Add Member Form */}
              <div className="bg-[#121824] p-4 rounded-xl border border-[#1c283a] space-y-3">
                <p className="text-xs font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#1ce783]" />
                  <span>Adicionar Membro ao Grupo</span>
                </p>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedUserToAdd}
                    onChange={(e) => setSelectedUserToAdd(e.target.value)}
                    className="flex-1 bg-[#151f2e] text-xs text-white px-3.5 py-2 rounded-xl border border-[#233147] focus:border-[#1ce783] focus:outline-none cursor-pointer"
                  >
                    <option value="">Selecione um colaborador cadastrado...</option>
                    {users
                      .filter((u) => !selectedGroup.members.includes(u.primaryEmail))
                      .map((u) => (
                        <option key={u.id} value={u.primaryEmail}>
                          {u.name.fullName} ({u.primaryEmail})
                        </option>
                      ))}
                  </select>

                  <button
                    onClick={handleAddMember}
                    disabled={!selectedUserToAdd}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      selectedUserToAdd
                        ? 'bg-[#1ce783] text-black hover:bg-[#00ed82] cursor-pointer'
                        : 'bg-[#182333] text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>Adicionar</span>
                  </button>
                </div>
              </div>

              {/* Members List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                  Membros Inscritos ({selectedGroup.members.length})
                </h4>

                {selectedGroup.members.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-4 bg-[#101622] rounded-xl text-center">
                    Nenhum membro inscrito neste grupo ainda.
                  </p>
                ) : (
                  <div className="divide-y divide-[#151f2e] bg-[#0b0e14] rounded-xl border border-[#1a2536] overflow-hidden">
                    {selectedGroup.members.map((memberEmail) => {
                      const matchedUser = users.find((u) => u.primaryEmail === memberEmail);

                      return (
                        <div
                          key={memberEmail}
                          className="p-3 flex items-center justify-between hover:bg-[#121824] transition-colors text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-[#1ce783]/20 text-[#1ce783] flex items-center justify-center font-bold text-[10px]">
                              {matchedUser ? matchedUser.name.givenName[0] : 'G'}
                            </div>
                            <div>
                              <p className="font-bold text-white">
                                {matchedUser ? matchedUser.name.fullName : memberEmail.split('@')[0]}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">{memberEmail}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => onRemoveMemberFromGroup(selectedGroup.id, memberEmail)}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Remover do grupo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal to create Group */}
      {isCreatingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0e141f] border border-[#212f45] rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
              <Users2 className="w-5 h-5 text-[#1ce783]" />
              <span>Novo Grupo Google Workspace</span>
            </h3>

            <form onSubmit={handleCreateGroup} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nome do Grupo <span className="text-[#1ce783]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Ex: Engenharia de Nuvem"
                  className="w-full bg-[#131b27] text-white px-3.5 py-2.5 rounded-xl border border-[#233147] focus:border-[#1ce783] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Endereço de E-mail do Grupo <span className="text-[#1ce783]">*</span>
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    required
                    value={newGroupEmailPrefix}
                    onChange={(e) => setNewGroupEmailPrefix(e.target.value)}
                    placeholder="cloud-eng"
                    className="flex-1 bg-[#131b27] text-white px-3.5 py-2.5 rounded-xl border border-[#233147] focus:border-[#1ce783] focus:outline-none font-mono"
                  />
                  <span className="bg-[#131b27] px-3 py-2.5 rounded-xl border border-[#233147] text-slate-400 font-mono">
                    @skoolia.com
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Permissão de Acesso</label>
                <select
                  value={newGroupPermission}
                  onChange={(e) => setNewGroupPermission(e.target.value as GoogleGroup['permissionLevel'])}
                  className="w-full bg-[#131b27] text-white px-3 py-2.5 rounded-xl border border-[#233147] focus:border-[#1ce783] focus:outline-none cursor-pointer font-semibold"
                >
                  <option value="TEAM_ONLY">Apenas Membros da Equipe</option>
                  <option value="ANNOUNCEMENT_ONLY">Apenas Comunicados / Somente Leitura</option>
                  <option value="PUBLIC">Público (Recebe emails externos)</option>
                  <option value="RESTRICTED">Restrito (Apenas Administradores)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="Finalidade desta lista..."
                  className="w-full bg-[#131b27] text-white px-3.5 py-2 rounded-xl border border-[#233147] focus:border-[#1ce783] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingGroup(false)}
                  className="px-4 py-2 rounded-full text-slate-400 hover:text-white bg-[#141b27]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#1ce783] hover:bg-[#00ed82] text-black font-bold shadow-[0_0_12px_rgba(28,231,131,0.3)]"
                >
                  Criar Grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
