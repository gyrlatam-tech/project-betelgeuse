import { WorkspaceUser, OrgUnit, GoogleGroup, LicenseInventory, AuditLogEntry, WorkspaceDomain } from './types';

export const INITIAL_DOMAINS: WorkspaceDomain[] = [];

export const INITIAL_ORG_UNITS: OrgUnit[] = [
  {
    id: 'ou-root',
    name: 'Unidade Raiz',
    path: '/',
    parentPath: '',
    description: 'Unidade Organizacional Raiz',
    userCount: 0,
    policies: {
      externalDriveSharing: true,
      require2SV: false,
      allowYoutubeUploads: true,
      sessionLengthHours: 24,
    },
  },
];

export const INITIAL_USERS: WorkspaceUser[] = [];

export const INITIAL_GROUPS: GoogleGroup[] = [];

export const INITIAL_LICENSES: LicenseInventory[] = [
  {
    sku: 'Google Workspace Enterprise Plus',
    totalSeats: 0,
    assignedSeats: 0,
    color: '#1ce783',
    monthlyCostUsd: 36.0,
    features: ['Armazenamento ilimitado / 5TB por usuário', 'Google Meet com 1000 participantes e gravação', 'Prevenção contra perda de dados (DLP)', 'Google Vault para e-Discovery e auditoria', 'Criptografia S/MIME corporativa'],
  },
  {
    sku: 'Google Workspace Business Standard',
    totalSeats: 0,
    assignedSeats: 0,
    color: '#00d166',
    monthlyCostUsd: 14.4,
    features: ['2 TB de armazenamento por usuário', 'Google Meet até 150 participantes com gravação', 'Drives compartilhados com controle de permissão', 'Controles de segurança padrão'],
  },
  {
    sku: 'Google Workspace Business Starter',
    totalSeats: 0,
    assignedSeats: 0,
    color: '#34d399',
    monthlyCostUsd: 7.2,
    features: ['30 GB de armazenamento por usuário', 'Google Meet até 100 participantes', 'Email corporativo personalizado'],
  },
  {
    sku: 'Cloud Identity Free',
    totalSeats: 0,
    assignedSeats: 0,
    color: '#94a3b8',
    monthlyCostUsd: 0.0,
    features: ['Gerenciamento de identidade e logon único (SSO)', 'Gerenciamento de dispositivos móveis (MDM)', 'Autenticação multifator (MFA/2SV)'],
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];

