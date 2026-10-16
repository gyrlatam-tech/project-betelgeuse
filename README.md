# Skoolia Multi-Tenant Workspace Admin

Painel de administração multi-tenant para gerenciamento de contas, domínios, unidades organizacionais (OUs) e licenças Google Workspace com isolamento estrito entre instituições e console SuperAdmin.

---

## 🚀 Como Executar no Antigravity / Ambiente Local

### 1. Pré-requisitos
- **Node.js**: v22.0.0 ou superior
- **NPM**: v10 ou superior

### 2. Instalação de Dependências
```bash
npm install
```

### 3. Configuração de Variáveis de Ambiente
Copie o arquivo de exemplo para `.env`:
```bash
cp .env.example .env
```

Preencha as variáveis de ambiente necessárias no arquivo `.env`:
- `GEMINI_API_KEY`: Chave da API Gemini.
- `GOOGLE_WORKSPACE_ADMIN_EMAIL`: E-mail do SuperAdmin do Google Workspace a ser personificado via DWD.
- `GOOGLE_WORKSPACE_SERVICE_ACCOUNT_EMAIL`: E-mail da Service Account (ex: `...iam.gserviceaccount.com`).
- `GOOGLE_WORKSPACE_PRIVATE_KEY`: Chave privada da Service Account (formato PEM com `\n`).
- `STRIPE_SECRET_KEY` / `VITE_STRIPE_PUBLISHABLE_KEY`: Credenciais Stripe (se aplicável).
- `RESEND_API_KEY`: Envio de e-mails transacionais (se aplicável).

> **Nota sobre o Firebase**: As configurações de conexão pública com o Firestore estão presentes em `firebase-applet-config.json` e as regras de segurança em `firestore.rules`.

### 4. Executando em Modo Desenvolvimento
O projeto utiliza um servidor Express full-stack com Vite acoplado em middleware (`server.ts`):
```bash
npm run dev
```
Acesse a aplicação no navegador em: `http://localhost:3000`

### 5. Compilação e Produção
```bash
# Compilar frontend para a pasta dist
npm run build

# Executar em modo de produção
npm start
```

---

## 📁 Estrutura do Projeto

- `server.ts`: Ponto de entrada do backend Express (APIs de Workspace, Domínios, DNS, Tenants, Webhooks e Vite dev middleware).
- `server/`: Módulos de infraestrutura do backend:
  - `workspaceClient.ts`: Integração com APIs Google Workspace Directory e Site Verification via Domain-Wide Delegation.
  - `firestoreSync.ts`: Sincronizador de instituições e isolamento de domínios com o Firestore.
  - `domainStore.ts`: Auditoria de registros de domínios e propagação DNS.
  - `tenantStore.ts`: Persistência local e isolamento multi-tenant.
  - `emailService.ts`: Serviço de notificações e e-mails transacionais.
- `src/`: Aplicação frontend React + TypeScript + Tailwind CSS:
  - `src/App.tsx`: Gerenciamento de estado, rotas de abas, autenticação e isolamento multi-tenant.
  - `src/components/`: Componentes modulares (Domínios, Licenças, Usuários, Tenants, Approvals, SuperAdmin).
  - `src/services/`: Clientes de integração (Firestore, Firebase Auth, Google Workspace, Stripe).
- `.data/`: Armazenamento de cache/estado do backend em desenvolvimento.
