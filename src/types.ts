export type WorkspaceLicense =
  | 'workspace Standard unlimited'
  | 'Google Workspace Standard Unlimited'
  | 'Google Workspace Fundamentals'
  | 'Google Workspace for Education Fundamentals'
  | 'Google Workspace Enterprise Plus'
  | 'Google Workspace Business Standard'
  | 'Google Workspace Business Starter'
  | 'Google Workspace Frontline'
  | 'Cloud Identity Free'
  | 'Gemini for Google Workspace';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_INVITE' | 'ARCHIVED';

export type UserRole = 'SUPER_ADMIN' | 'USER_ADMIN' | 'SERVICES_ADMIN' | 'STANDARD_USER';

export interface WorkspaceUser {
  id: string;
  primaryEmail: string;
  name: {
    givenName: string;
    familyName: string;
    fullName: string;
  };
  aliases?: string[];
  secondaryEmail?: string;
  recoveryPhone?: string;
  orgUnitPath: string; // e.g., "/Tecnologia/Engenharia"
  department: string;
  jobTitle: string;
  employeeId?: string;
  status: UserStatus;
  role: UserRole;
  licenses: WorkspaceLicense[];
  isEnrolledIn2SV: boolean; // 2-Step Verification
  isEnforcedIn2SV: boolean;
  mustChangePasswordAtNextLogin: boolean;
  storageUsageGb: number;
  storageLimitGb: number;
  driveUsageGb?: number;
  gmailUsageGb?: number;
  photosUsageGb?: number;
  lastLoginTime: string;
  creationTime: string;
  avatarColor?: string;
  suspendedReason?: string;
}

export interface OrgUnit {
  id: string;
  name: string;
  path: string;
  parentPath: string;
  description: string;
  userCount: number;
  policies: {
    externalDriveSharing: boolean;
    require2SV: boolean;
    allowYoutubeUploads: boolean;
    sessionLengthHours: number;
  };
}

export interface GoogleGroup {
  id: string;
  email: string;
  name: string;
  description: string;
  directMembersCount: number;
  aliases: string[];
  permissionLevel: 'PUBLIC' | 'TEAM_ONLY' | 'ANNOUNCEMENT_ONLY' | 'RESTRICTED';
  allowExternalMembers: boolean;
  members: string[]; // user emails
}

export interface LicenseInventory {
  sku: WorkspaceLicense;
  totalSeats: number;
  assignedSeats: number;
  color: string;
  monthlyCostUsd: number;
  features: string[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorEmail: string;
  action: 'USER_CREATED' | 'USER_SUSPENDED' | 'USER_ACTIVATED' | 'USER_DELETED' | 'PASSWORD_RESET' | 'LICENSE_ASSIGNED' | 'LICENSE_REMOVED' | 'OU_CHANGED' | 'GROUP_CREATED' | 'POLICY_UPDATED';
  targetResource: string;
  details: string;
  ipAddress: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  primaryContactEmail: string;
  financialContactEmail?: string;
  allowedDomains: string[];
  rootOrgUnitPath: string; // e.g. "/Tenants/Escola-Sao-Paulo"
  contractedSeats: {
    sku: WorkspaceLicense;
    allocatedSeats: number;
  }[];
  monthlyBudgetUsd: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
  suspendedReason?: string;
  invoices?: Invoice[];
  voidedInvoiceIds?: string[];
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  trialEndsAt?: string;
  createdAt: string;
  logoUrl?: string;
  preferredLanguage?: 'pt' | 'en' | 'es' | string;
  isProfileComplete?: boolean;
  institutionPhone?: string;
  institutionAddress?: string;
  technicalContactName?: string;
  technicalContactPhone?: string;
  financialContactName?: string;
  financialContactPhone?: string;
}

export interface ServiceAccountStatus {
  isConfigured: boolean;
  adminEmail: string;
  clientEmail: string;
  hasPrivateKey: boolean;
  lastConnectedAt?: string;
  mode: 'LIVE_WORKSPACE' | 'SANDBOX_SIMULATED';
  errorMessage?: string;
}

export type DomainState =
  | 'NOT_STARTED'
  | 'PENDING_APPROVAL'
  | 'DOMAIN_INSERTED'
  | 'TOKEN_ISSUED'
  | 'PENDING_DNS'
  | 'VERIFIED_PENDING_PROPAGATION'
  | 'VERIFIED'
  | 'FAILED'
  | 'CONFIG_ERROR'
  | 'PROPAGATION_TIMEOUT'
  | 'REMOVED';

export interface StateTransition {
  from: DomainState;
  to: DomainState;
  timestamp: string;
  details?: any;
}

export interface DomainAuditRecord {
  domainName: string;
  tenantId?: string;
  institutionName?: string;
  submittedByEmail?: string;
  state: DomainState;
  token?: string;
  canonicalResourceId?: string;
  adminNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  verifiedAt?: string;
  unverifiedAt?: string;
  stateTransitions: StateTransition[];
  dnsCheck?: {
    lastCheckedAt: string;
    foundTxtRecords: string[];
    foundMxRecords?: string[];
    tokenMatched: boolean;
    mxMatched?: boolean;
    spfMatched?: boolean;
  };
  siteVerification?: {
    lastCheckedAt: string;
    canonicalId?: string;
    owners: string[];
    adminOwnerPresent: boolean;
  };
  directory?: {
    lastCheckedAt: string;
    verified: boolean;
    isPrimary?: boolean;
    creationTime?: string;
  };
  operatorAction?: {
    timestamp: string;
    result: 'ACCEPTED_IMMEDIATELY' | 'ASKED_NEW_TXT' | 'OTHER';
    notes?: string;
  };
  lastRawError?: any;
  attempts: number;
  createdAt: string;
  updatedAt: string;
}

export interface PreflightResponse {
  ok: boolean;
  adminEmail: string;
  serviceAccountEmail: string;
  directoryDwd: {
    ok: boolean;
    status: number | string;
    error?: any;
  };
  siteVerificationDwd?: {
    ok: boolean;
    status: number | string;
    error?: any;
  };
  actionableGuidance?: string;
  timestamp: string;
}

export interface CustomDnsRecord {
  id: string;
  type: string;
  host: string;
  value: string;
  priority?: string | number;
  description?: string;
}

export interface WorkspaceDomain {
  domainName: string;
  tenantId?: string;
  isPrimary: boolean;
  verified: boolean;
  state?: DomainState;
  auditRecord?: DomainAuditRecord;
  mxConfigured: boolean;
  spfConfigured: boolean;
  dkimConfigured: boolean;
  verificationTxtToken?: string;
  adminNotes?: string;
  submittedAt?: string;
  txtHost?: string;
  mxRecordServer?: string;
  mxRecordHost?: string;
  mxRecordPriority?: number | string;
  spfRecordValue?: string;
  spfRecordHost?: string;
  customDnsRecords?: CustomDnsRecord[];
  dnsInstructions?: string;
}

export type BillingCycle = 'MONTHLY' | 'ANNUAL';

export interface BillingDetails {
  fullName: string;
  email: string;
  taxId: string; // CPF, CNPJ, RFC, EIN, RUT, NIT, etc.
  address: string;
  neighborhood?: string; // Bairro / Colonia / Comuna / Sector
  city: string;
  state: string; // Estado / Provincia / Departamento / State
  zipCode: string; // CEP / Código Postal / ZIP Code
  country: string;
  countryCode?: string;
}

export interface CreditCardInfo {
  cardNumber: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
  brand?: 'visa' | 'mastercard' | 'amex' | 'elo' | 'hipercard' | 'generic';
  last4?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  isUnlimitedLicenses: boolean;
  licenseLimit?: number;
  features: string[];
}

export interface AdditionalContractedService {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'ACTIVE' | 'PENDING' | 'CANCELED';
  quantity?: number;
  unitPriceUsd?: number;
  activatedAt: string;
}

export interface SubscriptionState {
  planId: string;
  planName: string;
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIAL';
  billingCycle: BillingCycle;
  currentPrice: number;
  isUnlimitedLicenses: boolean;
  licenseLimit?: number;
  quantity?: number;
  startDate: string;
  nextRenewalDate: string;
  paymentMethod: {
    brand: string;
    last4: string;
    expiry: string;
    cardholder: string;
  };
  billingDetails: BillingDetails;
  additionalServices?: AdditionalContractedService[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  amount: number;
  currency: string;
  status: 'PAID' | 'PENDING' | 'FAILED' | 'VOID' | 'DRAFT' | 'OPEN' | 'OVERDUE' | 'PAST_DUE';
  billingCycle: BillingCycle;
  planName: string;
  paymentMethod: string;
  pdfUrl?: string;
  invoicePdfUrl?: string | null;
  hostedInvoiceUrl?: string | null;
  customerEmail?: string;
  items: {
    description: string;
    quantity: string | number;
    amount: number;
  }[];
}

export interface InstitutionProfile {
  id?: string;
  ownerUid: string;
  ownerEmail: string;
  name?: string;
  primaryContactEmail?: string;
  billingContact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  // Dados da Instituição
  institutionName: string;
  institutionEmail: string;
  institutionPhone: string;
  institutionAddress: string;
  country?: string;
  countryCode?: string;
  // Responsável Técnico
  technicalContactName: string;
  technicalContactEmail: string;
  technicalContactPhone: string;
  // Responsável Financeiro
  financialContactName: string;
  financialContactEmail: string;
  financialContactPhone: string;
  // Métricas / Porte
  studentsCount: number;
  teachersCount: number;
  // Faturamento & Assinatura do Tenant
  billingDetails?: BillingDetails;
  subscription?: SubscriptionState;
  invoices?: Invoice[];
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeFinancialEmail?: string;
  hasSeenWelcomeTrial?: boolean;
  status?: 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
  allowedDomains?: string[];
  suspendedReason?: string;
  preferredLanguage?: 'pt' | 'en' | 'es' | string;
  role?: 'SUPER_ADMIN' | 'TENANT_ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface AuthUserState {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  institutionProfile?: InstitutionProfile | null;
  isProfileComplete: boolean;
}

export type EmailTemplateType =
  | 'ACCOUNT_CREATED'
  | 'DOMAIN_REGISTERED'
  | 'DOMAIN_APPROVED'
  | 'PASSWORD_RESET'
  | 'WORKSPACE_PASSWORD_RESET'
  | 'TENANT_STATUS'
  | 'INVOICE'
  | 'TRIAL_WELCOME'
  | 'DOMAIN_VERIFIED'
  | 'TICKET_OPENED'
  | 'TICKET_REPLIED'
  | 'SUPERADMIN_NEW_TICKET'
  | 'SUPERADMIN_NEW_TENANT';

export interface EmailTemplateVariable {
  key: string;
  label: string;
  description: string;
  sampleValue: string;
}

export interface EmailTemplate {
  id: string;
  type: EmailTemplateType;
  name: string;
  description: string;
  category: string;
  subject: string;
  preheader: string;
  badgeText: string;
  badgeColor: string;
  title: string;
  bodyHtml: string;
  ctaText: string;
  ctaUrl: string;
  footerNote: string;
  supportedVariables: EmailTemplateVariable[];
  updatedAt: string;
  isCustomized?: boolean;
}

export interface EmailLogEntry {
  id: string;
  timestamp: string;
  type: EmailTemplateType | string;
  to: string;
  subject: string;
  status: 'SENT' | 'DELIVERED' | 'SIMULATED' | 'FAILED' | 'PENDING';
  resendId?: string;
  errorMessage?: string;
}

export interface EmailServiceStatus {
  isConfigured: boolean;
  fromEmail: string;
  totalSent: number;
  totalSimulated: number;
  totalFailed: number;
}

export type TicketStatus = 'NEW' | 'IN_PROGRESS' | 'WAITING_USER' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TicketCategory =
  | 'DOMAINS_DNS'
  | 'BILLING_LICENSES'
  | 'CUSTOM_LICENSE_QUOTE'
  | 'WORKSPACE_PROVISIONING'
  | 'ADDITIONAL_SERVICES'
  | 'SECURITY_ACCESS'
  | 'GENERAL_QUESTION';

export interface TicketMessage {
  id: string;
  senderName: string;
  senderEmail: string;
  senderRole: 'USER' | 'SUPPORT_AGENT' | 'SYSTEM';
  avatarUrl?: string;
  content: string;
  timestamp: string;
  attachments?: {
    name: string;
    size: string;
  }[];
}

export interface SupportTicket {
  id: string;
  protocol: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  requesterName: string;
  requesterEmail: string;
  institutionName?: string;
  tenantId?: string;
  assignedAgent?: {
    name: string;
    role: string;
    avatarUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  messages: TicketMessage[];
  slaTargetHours: number;
  preferredLanguage?: string;
}


