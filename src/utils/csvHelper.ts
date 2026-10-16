import { WorkspaceUser } from '../types';
import * as XLSX from 'xlsx';
import { normalizeRecoveryPhone } from './phoneFormatter';

export function generateSharedBatchPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const year = new Date().getFullYear();
  return `Workspace@${year}#${rand}`;
}

export function generateSampleCsv(domain = 'example.com'): string {
  const targetDomain = domain && domain.includes('.') ? domain : 'example.com';

  const headers = [
    'First Name [Required]',
    'Last Name [Required]',
    'Email Address [Required]',
    'Password [Required]',
    'Secondary Email [Optional]',
    'Recovery Phone [Optional]',
    'Change Password at Next Sign-In [Optional]',
  ];

  // Exactly 1 sample row with generic English names and example.com
  const sampleRow1 = [
    'John',
    'Doe',
    `john.doe@${targetDomain}`,
    'Workspace@2026#Ab34',
    'john.doe.personal@gmail.com',
    '+1 555-019-2834',
    'True',
  ];

  return [headers.join(','), sampleRow1.map((f) => `"${f}"`).join(',')].join('\n');
}

export function exportUsersToGoogleAdminCsv(users: WorkspaceUser[]): string {
  const headers = [
    'First Name [Required]',
    'Last Name [Required]',
    'Email Address [Required]',
    'Password [Required]',
    'Secondary Email [Optional]',
    'Recovery Phone [Optional]',
    'Change Password at Next Sign-In [Optional]',
  ];

  const rows = users.map((u) => [
    `"${u.name?.givenName || ''}"`,
    `"${u.name?.familyName || ''}"`,
    `"${u.primaryEmail}"`,
    `"********"`,
    `"${u.secondaryEmail || ''}"`,
    `"${u.recoveryPhone || ''}"`,
    `"${u.mustChangePasswordAtNextLogin ? 'True' : 'False'}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export interface ParsedCsvUser {
  givenName: string;
  familyName: string;
  primaryEmail: string;
  password?: string;
  orgUnitPath: string;
  secondaryEmail?: string;
  recoveryPhone?: string;
  jobTitle?: string;
  department?: string;
  employeeId?: string;
  mustChangePasswordAtNextLogin?: boolean;
}

function splitCsvLine(line: string): string[] {
  const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(line)) && matches.length < 30) {
    let val = match[1] || '';
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1).replace(/""/g, '"');
    }
    matches.push(val.trim());
    if (regex.lastIndex >= line.length) break;
  }
  return matches;
}

export function parseGoogleAdminCsv(csvText: string, sharedBatchPassword?: string): ParsedCsvUser[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const rawHeaders = splitCsvLine(lines[0]);
  const headers = rawHeaders.map((h) => h.toLowerCase());

  const findCol = (keywords: string[]): number => {
    return headers.findIndex((h) => keywords.some((kw) => h.includes(kw.toLowerCase())));
  };

  const fnIdx = findCol(['first name', 'nome', 'given name']);
  const lnIdx = findCol(['last name', 'sobrenome', 'family name']);
  const emailIdx = findCol(['email address', 'email', 'e-mail']);
  const pwdIdx = findCol(['password', 'senha']);
  const secEmailIdx = findCol(['secondary email', 'recovery email', 'e-mail de recuperação', 'email secundario']);
  const phoneIdx = findCol(['recovery phone', 'telefone', 'phone', 'celular']);
  const ouIdx = findCol(['org unit', 'unidade organizacional', 'ou path']);
  const changePwdIdx = findCol(['change password', 'trocar senha', 'alterar senha', 'must change']);
  const deptIdx = findCol(['department', 'departamento', 'setor']);
  const titleIdx = findCol(['job title', 'cargo', 'função', 'funcao']);
  const empIdIdx = findCol(['employee id', 'matrícula', 'matricula', 'id do']);

  const results: ParsedCsvUser[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const matches = splitCsvLine(line);

    const email = (emailIdx !== -1 ? matches[emailIdx] : matches[2]) || '';
    if (!email || !email.includes('@')) {
      continue;
    }

    const emailDomain = (email.split('@')[1] || '').trim();

    const givenName =
      (fnIdx !== -1 ? matches[fnIdx] : matches[0]) ||
      email.split('@')[0]?.split('.')[0] ||
      'User';

    const familyName =
      (lnIdx !== -1 ? matches[lnIdx] : matches[1]) ||
      email.split('@')[0]?.split('.')[1] ||
      'Workspace';

    // Shared batch password has priority to guarantee all imported users share the exact same temporary password
    const rawPassword = pwdIdx !== -1 ? matches[pwdIdx] : matches[3];
    const password =
      sharedBatchPassword ||
      (rawPassword && rawPassword.trim().length >= 8
        ? rawPassword.trim()
        : `Workspace@${new Date().getFullYear()}#9482`);

    let orgUnitPath = (ouIdx !== -1 ? matches[ouIdx] : '') || '/';
    if (!orgUnitPath.startsWith('/')) {
      orgUnitPath = `/${orgUnitPath}`;
    }

    const secondaryEmail =
      (secEmailIdx !== -1 ? matches[secEmailIdx] : matches.length > 4 ? matches[4] : '') || '';
    const rawRecoveryPhone =
      (phoneIdx !== -1 ? matches[phoneIdx] : matches.length > 5 ? matches[5] : '') || '';
    const recoveryPhone = normalizeRecoveryPhone(rawRecoveryPhone) || '';
    const jobTitle = (titleIdx !== -1 ? matches[titleIdx] : '') || 'Colaborador';
    const department = (deptIdx !== -1 ? matches[deptIdx] : '') || 'Geral';
    const employeeId =
      (empIdIdx !== -1 ? matches[empIdIdx] : '') ||
      `COLAB-${Math.floor(1000 + Math.random() * 9000)}`;

    const rawMustChange =
      changePwdIdx !== -1
        ? matches[changePwdIdx]
        : matches.length > 6
        ? matches[6]
        : 'True';
    const mustChangePassword =
      rawMustChange && rawMustChange.toLowerCase() === 'false' ? false : true;

    results.push({
      givenName,
      familyName,
      primaryEmail: email,
      password,
      orgUnitPath: orgUnitPath.startsWith('/') ? orgUnitPath : `/${orgUnitPath}`,
      secondaryEmail,
      recoveryPhone,
      jobTitle,
      department,
      employeeId,
      mustChangePasswordAtNextLogin: mustChangePassword,
    });
  }

  return results;
}

export async function parseSpreadsheetFile(
  file: File,
  sharedBatchPassword?: string
): Promise<ParsedCsvUser[]> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return [];
    const worksheet = workbook.Sheets[firstSheetName];
    const csvText = XLSX.utils.sheet_to_csv(worksheet);
    return parseGoogleAdminCsv(csvText, sharedBatchPassword);
  } else {
    const text = await file.text();
    return parseGoogleAdminCsv(text, sharedBatchPassword);
  }
}
