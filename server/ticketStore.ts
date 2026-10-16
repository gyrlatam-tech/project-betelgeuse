import fs from 'fs';
import path from 'path';

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
  category: string;
  priority: string;
  status: string;
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
  slaTargetHours?: number;
  preferredLanguage?: 'en' | 'es' | 'pt';
}

const DATA_DIR = path.join(process.cwd(), '.data');
const TICKETS_FILE = path.join(DATA_DIR, 'support_tickets.json');

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('[TicketStore] Error creating .data directory:', err);
  }
}

export function getAllTickets(): SupportTicket[] {
  ensureDataDir();
  try {
    if (!fs.existsSync(TICKETS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(TICKETS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[TicketStore] Error reading support_tickets.json:', err);
    return [];
  }
}

export function saveTicket(ticket: SupportTicket): SupportTicket {
  ensureDataDir();
  try {
    const tickets = getAllTickets();
    const existingIndex = tickets.findIndex((t) => t.id === ticket.id || t.protocol === ticket.protocol);
    if (existingIndex >= 0) {
      tickets[existingIndex] = {
        ...tickets[existingIndex],
        ...ticket,
        updatedAt: ticket.updatedAt || new Date().toISOString(),
      };
    } else {
      tickets.unshift(ticket);
    }
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2), 'utf-8');
    return ticket;
  } catch (err) {
    console.warn('[TicketStore] Error writing support_tickets.json:', err);
    return ticket;
  }
}

export function deleteTicket(idOrProtocol: string): boolean {
  ensureDataDir();
  try {
    const tickets = getAllTickets();
    const filtered = tickets.filter((t) => t.id !== idOrProtocol && t.protocol !== idOrProtocol);
    if (filtered.length !== tickets.length) {
      fs.writeFileSync(TICKETS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[TicketStore] Error deleting ticket:', err);
    return false;
  }
}
