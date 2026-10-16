import { Language } from '../i18n';

export interface ContractClause {
  number: string;
  title: string;
  content: string;
  subclauses?: {
    number: string;
    title?: string;
    content: string;
  }[];
}

export interface ContractItem {
  id: string;
  slug: string;
  category: 'primary' | 'privacy' | 'sla' | 'compliance' | 'security' | 'licensing';
  isPrincipal?: boolean;
  effectiveDate: string;
  version: string;
  readingTime: string;
  title: string;
  subtitle: string;
  summary: string;
  badge: string;
  keyPoints: string[];
  clauses: ContractClause[];
}

export interface ContractsContent {
  pageTitle: string;
  pageSubtitle: string;
  badgeOfficial: string;
  badgeVersion: string;
  searchPlaceholder: string;
  filterAll: string;
  viewContractBtn: string;
  backToContractsBtn: string;
  printBtn: string;
  copyLinkBtn: string;
  linkCopiedToast: string;
  tableOfContentsTitle: string;
  effectiveDateLabel: string;
  versionLabel: string;
  readingTimeLabel: string;
  certifiedBadge: string;
  acceptDeclarationText: string;
  modalCloseTooltip: string;
  contracts: ContractItem[];
}

export const CONTRACTS_DATA: Record<Language, ContractsContent> = {
  pt: {
    pageTitle: 'Central de Contratos e Termos Legais',
    pageSubtitle:
      'Consulte os acordos oficiais, termos de serviço, políticas de privacidade e padrões de conformidade que regem o ecossistema Skoolia e a prestação de serviços Google Workspace for Education.',
    badgeOfficial: 'Documentação Jurídica Oficial',
    badgeVersion: 'Versão Vigente 2026.1',
    searchPlaceholder: 'Buscar cláusula, termo ou política...',
    filterAll: 'Todos os Contratos',
    viewContractBtn: 'Acessar Contrato Completo',
    backToContractsBtn: 'Voltar aos Contratos',
    printBtn: 'Imprimir / Salvar PDF',
    copyLinkBtn: 'Copiar Link Direto',
    linkCopiedToast: 'Link do contrato copiado para a área de transferência!',
    tableOfContentsTitle: 'Índice de Cláusulas',
    effectiveDateLabel: 'Data de Vigência',
    versionLabel: 'Versão',
    readingTimeLabel: 'Tempo Estimado',
    certifiedBadge: 'Google Cloud & for Education Partner Certified',
    acceptDeclarationText:
      'Este documento possui validade jurídica e aplica-se a todas as instituições de ensino, administradores de TI e usuários finais sob a governança da plataforma Skoolia.',
    modalCloseTooltip: 'Fechar documento',
    contracts: [
      {
        id: 'terms-of-service',
        slug: 'terms-of-service',
        category: 'primary',
        isPrincipal: true,
        effectiveDate: '01 de Janeiro de 2026',
        version: 'v4.2 - Universal',
        readingTime: '12 min de leitura',
        title: 'Termos de Serviço Universal Skoolia',
        subtitle: 'Estrutura Institucional, Gestão de Workspace e Operação Educacional',
        summary:
          'Contrato principal que define a natureza da Skoolia como plataforma parceira Google Workspace for Education, detalhando nossas atribuições, responsabilidades de provisionamento e obrigações mútuas.',
        badge: 'Contrato Principal',
        keyPoints: [
          'Definição completa da Skoolia e sua atuação como Parceira Google for Education',
          'Orquestração de DNS, verificação TXT/MX e segurança SPF/DKIM/DMARC',
          'Automação de provisionamento de contas de alunos e professores via API DWD',
          'Governança multi-tenant com segregação lógica de dados e conformidade legal',
        ],
        clauses: [
          {
            number: '1',
            title: 'Objeto do Contrato e Natureza Jurídica da Skoolia',
            content:
              'A Skoolia é uma plataforma tecnológica especializada em governança, provisionamento e gestão de nuvem educacional para redes de ensino, escolas, faculdades e universidades. Atuando como Parceira Autorizada Google Cloud e Google Workspace for Education, a Skoolia fornece a infraestrutura de software intermediária que permite às instituições de ensino configurar, orquestrar e monitorar seu ambiente digital Google for Education com total conformidade pedagógica, técnica e jurídica.',
            subclauses: [
              {
                number: '1.1',
                title: 'Escopo Operacional',
                content:
                  'A Skoolia não substitui os serviços fundamentais fornecidos pela Google LLC, mas potencializa, automatiza e governa a administração do Google Workspace for Education através de APIs oficiais, orquestração de identidades, automação de fluxo de matrícula e gestão centralizada de múltiplos domínios.',
              },
              {
                number: '1.2',
                title: 'Qualificação das Partes',
                content:
                  'O presente contrato é celebrado entre a Skoolia / InternetByMOL LLC (com sede em 3101 North Central Avenue, Phoenix, 85012, Estados Unidos, e-mail de contato help@skoolia.net) e a Instituição de Ensino contratante (representada por seus mantenedores, diretores ou administradores de TI formalmente credenciados).',
              },
            ],
          },
          {
            number: '2',
            title: 'Como a Skoolia Atua na Sua Instituição',
            content:
              'A atuação da Skoolia engloba cinco pilares estruturantes para garantir que a instituição opere com máxima eficiência, segurança cibernética e conformidade com as diretrizes do Google for Education:',
            subclauses: [
              {
                number: '2.1',
                title: 'Orquestração de Domínios e Configuração de DNS',
                content:
                  'A Skoolia gerencia a validação de titularidade de domínios institucionais perante a Google, orientando e monitorando os registros de zona DNS (registros TXT de verificação, servidores MX para roteamento seguro de e-mails institucionais, além de parâmetros criptográficos SPF, DKIM e DMARC contra spoofing e phishing acadêmico).',
              },
              {
                number: '2.2',
                title: 'Provisionamento e Ciclo de Vida de Identidades',
                content:
                  'Através da integração com o Google Workspace Admin SDK mediante Delegação em Todo o Domínio (Domain-Wide Delegation - DWD) e Contas de Serviço (Service Accounts) autenticadas, a Skoolia automatiza o ciclo completo de vida dos usuários: criação em lote de contas de alunos, docentes e colaboradores, alocação em Unidades Organizacionais (OUs), redefinição segura de senhas temporárias e suspensão imediata de acessos em casos de desligamento institucional.',
              },
              {
                number: '2.3',
                title: 'Arquitetura Multi-Tenant com Estrito Isolamento',
                content:
                  'Cada instituição de ensino opera em ambiente multi-tenant com estrita segregação lógica de banco de dados, chaves de criptografia e credenciais administrativas. Nenhuma instituição tem acesso ou visibilidade sobre dados, diretórios ou comunicações de outras instituições cadastradas na plataforma.',
              },
              {
                number: '2.4',
                title: 'Gestão Inteligente de Licenças e Armazenamento',
                content:
                  'A Skoolia monitora e orquestra a distribuição de cotas do pool de armazenamento no Google Drive (baseline de 100 TB compartilhado e cotas individuais) e gerencia a transição e atribuição de licenças (Google Workspace for Education Fundamentals, Standard, Teaching and Learning Upgrade e Education Plus).',
              },
              {
                number: '2.5',
                title: 'Suporte Técnico e Resolução Especializada',
                content:
                  'Disponibilização de suporte técnico N2 e N3 com engenheiros certificados em Google Cloud, prestando assistência em sincronização, migração de dados de correio eletrônico, liberação de serviços pedagógicos e auditoria de segurança.',
              },
            ],
          },
          {
            number: '3',
            title: 'Responsabilidades da Instituição Contratante',
            content:
              'Para que a Skoolia execute com excelência seus serviços, a Instituição de Ensino compromete-se a:',
            subclauses: [
              {
                number: '3.1',
                title: 'Titularidade e Autoridade sobre o Domínio',
                content:
                  'Garantir que detém a titularidade legal ou autorização expressa para utilizar o domínio institucional cadastrado na plataforma (ex.: nomedaescola.edu.br), assumindo total responsabilidade pelas alterações realizadas na zona DNS.',
              },
              {
                number: '3.2',
                title: 'Veracidade dos Dados e Consentimentos Legais',
                content:
                  'Fornecer informações cadastrais fidedignas dos usuários a serem provisionados e assegurar a coleta dos devidos consentimentos legais de pais ou responsáveis legais quando se tratar de alunos menores de idade, em conformidade com as legislações de proteção à infância.',
              },
              {
                number: '3.3',
                title: 'Guarda de Credenciais de Acesso',
                content:
                  'Manter em sigilo absoluto as credenciais de administradores institucionais e habilitar, obrigatoriamente, a verificação em duas etapas (2SV) em todas as contas com privilégios de gestão.',
              },
            ],
          },
          {
            number: '4',
            title: 'Nível de Serviço, Disponibilidade e Continuidade',
            content:
              'A Skoolia compromete-se a manter a disponibilidade de sua interface de governança em 99,9% do tempo mensal. A disponibilidade dos serviços de e-mail, videoconferência (Meet) e armazenamento (Drive) segue os acordos de nível de serviço globais fornecidos diretamente pela Google LLC.',
          },
          {
            number: '5',
            title: 'Propriedade Intelectual e Dados Acadêmicos',
            content:
              'Todos os dados, arquivos, materiais didáticos, tarefas, notas e informações de alunos e professores inseridos no Google Workspace pertencem exclusiva e integralmente à Instituição de Ensino e aos seus respectivos autores. A Skoolia não adquire qualquer direito de propriedade ou titularidade sobre tais conteúdos, utilizando-os unicamente para a execução estrita dos serviços contratados.',
          },
          {
            number: '6',
            title: 'Vigência, Rescisão e Descarte de Dados',
            content:
              'O presente contrato vigora por prazo indeterminado a partir do aceite digital ou celebração de proposta comercial. Em caso de rescisão, a Instituição poderá solicitar a exportação de seus logs e registros administrativos. Após 30 (trinta) dias do encerramento formal, todas as chaves de integração e credenciais de serviço vinculadas serão revogadas e permanentemente eliminadas.',
          },
          {
            number: '7',
            title: 'Foro de Eleição e Legislação Aplicável',
            content:
              'Este contrato é regido pelas leis da República Federativa do Brasil, elegendo-se o foro da comarca da sede da Skoolia para dirimir eventuais controvérsias, com renúncia expressa a qualquer outro, por mais privilegiado que seja.',
          },
        ],
      },
      {
        id: 'privacy-policy',
        slug: 'privacy-policy',
        category: 'privacy',
        effectiveDate: '01 de Janeiro de 2026',
        version: 'v3.8 - Educacional',
        readingTime: '9 min de leitura',
        title: 'Política de Privacidade e Proteção de Dados Educacionais',
        subtitle: 'Conformidade Rigorosa com LGPD, GDPR, FERPA e COPPA',
        summary:
          'Diretrizes de privacidade aplicadas ao tratamento de dados de estudantes, docentes e administradores, garantindo sigilo absoluto, ausência de publicidade direcionada e segurança de nível bancário.',
        badge: 'Privacidade & LGPD',
        keyPoints: [
          'Proibição absoluta de venda, aluguel ou monetização de dados de estudantes',
          'Ausência total de anúncios direcionados ou rastreamento comportamental',
          'Criptografia de ponta a ponta (TLS 1.3 em trânsito e AES-256 em repouso)',
          'Garantia do exercício dos direitos dos titulares (acesso, correção e exclusão)',
        ],
        clauses: [
          {
            number: '1',
            title: 'Compromisso com a Privacidade da Comunidade Educacional',
            content:
              'A Skoolia reconhece a sensibilidade ímpar dos dados tratados no ambiente escolar e acadêmico. Nossa plataforma foi concebida segundo os princípios de Privacy by Design e Privacy by Default, assegurando que o tratamento de dados pessoais ocorra unicamente para viabilizar as atividades educacionais e administrativas da instituição contratante.',
          },
          {
            number: '2',
            title: 'Quais Dados Coletamos e Tratamos',
            content:
              'Coletamos apenas o volume estritamente necessário para o provisionamento e governança do ambiente Google Workspace for Education:',
            subclauses: [
              {
                number: '2.1',
                title: 'Dados Cadastrais Básicos',
                content:
                  'Nome completo, endereço de e-mail institucional gerado, matrícula ou identificador acadêmico, série/turma/unidade organizacional e cargo/função (aluno, professor, coordenador, suporte técnico).',
              },
              {
                number: '2.2',
                title: 'Logs de Auditoria e Conexão',
                content:
                  'Endereço IP de acesso ao painel de gestão, carimbo de data/hora de provisionamentos, registros de alterações de status de conta e dados de sincronização técnica com o Google Workspace.',
              },
            ],
          },
          {
            number: '3',
            title: 'Proibições Expressas e Proteção a Menores',
            content:
              'A Skoolia declara formalmente que: (I) JAMAIS vende, licencia, compartilha ou aluga dados pessoais de alunos ou professores a terceiros para qualquer finalidade; (II) NÃO constrói perfis de comportamento com fins publicitários; (III) NÃO veicula anúncios publicitários em sua plataforma ou nos serviços Google for Education gerenciados.',
          },
          {
            number: '4',
            title: 'Medidas de Segurança da Informação',
            content:
              'Todos os dados trafegam exclusivamente sob protocolo seguro TLS 1.3 com chaves criptográficas modernas. Os dados em repouso nos bancos de dados estruturados são criptografados com padrão AES-256. Nossos servidores e contêineres operam em data centers certificados ISO 27001, SOC 1/2/3 e PCI-DSS.',
          },
          {
            number: '5',
            title: 'Direitos dos Titulares de Dados',
            content:
              'Em conformidade com a LGPD e o GDPR, os titulares de dados (ou seus responsáveis legais) podem solicitar à instituição de ensino contratante o acesso, confirmação de tratamento, correção de dados incompletos e exclusão de registros. A Skoolia disponibiliza ferramentas automatizadas para que os administradores escolares atendam prontamente a tais requisições.',
          },
          {
            number: '6',
            title: 'Conformidade com a Política de Dados de Usuário das APIs do Google e Uso Limitado (Limited Use)',
            content:
              'O uso e a transferência pela Skoolia de informações recebidas das APIs do Google para qualquer outro aplicativo obedecerão rigorosamente à Política de Dados do Usuário dos Serviços de API do Google, incluindo os requisitos de Uso Limitado (Google API Services User Data Policy, including Limited Use requirements).',
            subclauses: [
              {
                number: '6.1',
                title: 'Finalidade Específica e Restrita',
                content:
                  'A Skoolia acessa dados autorizados do Google Workspace (diretório de usuários, unidades organizacionais, verificação de domínios e armazenamento) única e exclusivamente para fornecer as funcionalidades administrativas de governança escolar requisitadas pelo administrador da instituição.',
              },
              {
                number: '6.2',
                title: 'Proibição de Transferência Comercial e Publicidade',
                content:
                  'Os dados obtidos por meio das APIs do Google NÃO são vendidos, alugados ou transferidos a terceiros. Não utilizamos dados do Google Workspace para veiculação de anúncios direcionados, criação de perfis comportamentais ou treinamento de modelos de inteligência artificial de uso geral.',
              },
              {
                number: '6.3',
                title: 'Restrição Estrita de Acesso Humano',
                content:
                  'Nenhum colaborador humano da Skoolia tem permissão para ler dados de usuários do Google Workspace, exceto se houver consentimento expresso e prévio do administrador para suporte técnico resolutivo ou cumprimento de ordem judicial específica.',
              },
            ],
          },
          {
            number: '7',
            title: 'Retenção, Exclusão de Dados, Revogação OAuth e Contato',
            content:
              'Os dados sincronizados são mantidos unicamente enquanto a conta da instituição de ensino estiver ativa na plataforma. Administradores podem solicitar a exclusão completa e definitiva de seus registros a qualquer momento pelo e-mail help@skoolia.net ou cancelando seu ambiente no painel de controle; a exclusão é processada em até 30 dias. A instituição pode revogar o acesso do aplicativo OAuth a qualquer momento através do painel de segurança do Google (https://myaccount.google.com/permissions). Entidade responsável: InternetByMOL LLC, 3101 North Central Avenue, Phoenix, 85012, Estados Unidos. E-mail de suporte: help@skoolia.net.',
          },
        ],
      },
      {
        id: 'sla',
        slug: 'sla',
        category: 'sla',
        effectiveDate: '01 de Janeiro de 2026',
        version: 'v2.5 - Suporte & Disponibilidade',
        readingTime: '6 min de leitura',
        title: 'Acordo de Nível de Serviço (SLA) e Suporte Técnico',
        subtitle: 'Garantia de 99,9% de Uptime e Tempos de Resposta Ágeis',
        summary:
          'Termos contratuais de disponibilidade técnica da plataforma, classificação de chamados de suporte por severidade, janelas de manutenção e políticas de compensação.',
        badge: 'SLA 99.9%',
        keyPoints: [
          'Garantia contratual de disponibilidade de 99,9% da plataforma Skoolia',
          'Atendimento a incidentes críticos (P1) em menos de 1 hora, 24 horas por dia',
          'Engenheiros especialistas em Google Cloud e Google Workspace for Education',
          'Notificação prévia com 48 horas de antecedência para manutenções programadas',
        ],
        clauses: [
          {
            number: '1',
            title: 'Métrica de Disponibilidade Mensal (Uptime)',
            content:
              'A Skoolia garante que a plataforma de gestão estará disponível para acesso pelos administradores em no mínimo 99,9% do tempo durante cada mês civil, excluindo-se as janelas de manutenção preventiva devidamente comunicadas.',
          },
          {
            number: '2',
            title: 'Classificação de Incidentes e Prazos de Resposta',
            content:
              'Os chamados abertos pelo canal de suporte técnico da Skoolia são classificados em três níveis de severidade operacional:',
            subclauses: [
              {
                number: '2.1',
                title: 'Severidade 1 - Crítica (P1)',
                content:
                  'Indisponibilidade generalizada do sistema, impossibilidade total de acesso às contas ou falha catastrófica no provisionamento institucional. Tempo de primeira resposta: até 1 (uma) hora, atendimento ininterrupto 24/7.',
              },
              {
                number: '2.2',
                title: 'Severidade 2 - Alta (P2)',
                content:
                  'Falha parcial de funcionalidade que impacta processos administrativos importantes sem impedir o funcionamento geral das salas de aula virtuais. Tempo de resposta: até 4 (quatro) horas úteis.',
              },
              {
                number: '2.3',
                title: 'Severidade 3 - Normal (P3)',
                content:
                  'Dúvidas operacionais, pedidos de orientação em configurações de DNS ou solicitações rotineiras de suporte. Tempo de resposta: até 8 (oito) horas úteis.',
              },
            ],
          },
          {
            number: '3',
            title: 'Janelas de Manutenção Programada',
            content:
              'Eventuais manutenções estruturais no painel Skoolia serão realizadas preferencialmente durante horários de menor impacto acadêmico (madrugadas e finais de semana), com aviso prévio mínimo de 48 (quarenta e oito) horas aos administradores cadastrados.',
          },
        ],
      },
      {
        id: 'dpa',
        slug: 'dpa',
        category: 'compliance',
        effectiveDate: '01 de Janeiro de 2026',
        version: 'v3.1 - Operador de Dados',
        readingTime: '8 min de leitura',
        title: 'Acordo de Processamento de Dados (DPA)',
        subtitle: 'Definição de Papéis: Instituição como Controladora e Skoolia como Operadora',
        summary:
          'Documento jurídico que regulamenta a relação de tratamento de dados pessoais conforme a LGPD e o GDPR, formalizando as obrigações de segurança, sub-operadores e deveres de auditoria.',
        badge: 'DPA / LGPD',
        keyPoints: [
          'Instituição de Ensino atua como Controladora titular das decisões sobre os dados',
          'A Skoolia atua estritamente como Operadora sob instruções documentadas',
          'Sub-processadores homologados restritos à infraestrutura Google Cloud Platform',
          'Notificação formal de eventuais incidentes de segurança em até 48 horas',
        ],
        clauses: [
          {
            number: '1',
            title: 'Definição dos Papéis Contratuais de Tratamento',
            content:
              'Nos termos do artigo 5º da LGPD e do artigo 28 do GDPR, fica expressamente convencionado que a Instituição de Ensino é a Controladora dos dados pessoais de seus alunos, responsáveis e colaboradores. A Skoolia atua exclusivamente como Operadora, realizando o processamento desses dados exclusivamente em nome e segundo as diretrizes emanadas da Controladora.',
          },
          {
            number: '2',
            title: 'Obrigações da Skoolia como Operadora',
            content:
              'A Skoolia compromete-se a: (a) Processar dados apenas para os fins descritos no contrato principal; (b) Assegurar que seus colaboradores autorizados estejam sujeitos a dever rígido de confidencialidade; (c) Adotar medidas técnicas e organizacionais adequadas para garantir nível de segurança compatível com o risco.',
          },
          {
            number: '3',
            title: 'Sub-processadores Autorizados',
            content:
              'A Instituição autoriza genericamente a contratação dos seguintes sub-operadores essenciais à operação: Google LLC / Google Cloud Platform (hospedagem, computação em nuvem e serviços de correio/armazenamento). Qualquer alteração relevante de sub-operador será previamente comunicada.',
          },
          {
            number: '4',
            title: 'Notificação de Incidentes de Segurança',
            content:
              'Na hipótese improvável de violação de segurança que resulte em acesso não autorizado ou perda de dados pessoais, a Skoolia notificará a Controladora no prazo máximo de 48 (quarenta e oito) horas após a confirmação do evento, prestando todas as informações cabíveis para comunicação às autoridades.',
          },
        ],
      },
      {
        id: 'acceptable-use',
        slug: 'acceptable-use',
        category: 'security',
        effectiveDate: '01 de Janeiro de 2026',
        version: 'v2.2 - Uso Ético e Acadêmico',
        readingTime: '5 min de leitura',
        title: 'Política de Uso Aceitável (AUP)',
        subtitle: 'Diretrizes de Integridade Digital, Segurança e Convivência Escolar',
        summary:
          'Regras de conduta e padrões de uso das contas educacionais gerenciadas pela Skoolia, proibindo fraudes, abusos de rede, distribuição de malware e desrespeito acadêmico.',
        badge: 'Uso Aceitável',
        keyPoints: [
          'Finalidade estritamente pedagógica, acadêmica e administrativa das contas',
          'Proibição absoluta de envio de mensagens em massa não autorizadas (spam) e phishing',
          'Vedação de armazenamento de materiais ilícitos ou violadores de direitos autorais',
          'Obrigatoriedade de preservação do ambiente saudável e respeitoso entre estudantes',
        ],
        clauses: [
          {
            number: '1',
            title: 'Finalidade das Contas e Ferramentas Educacionais',
            content:
              'As contas de e-mail e aplicações do Google Workspace for Education provisionadas por meio da Skoolia destinam-se única e exclusivamente a fins didáticos, pedagógicos, de pesquisa científica e de gestão institucional escolar.',
          },
          {
            number: '2',
            title: 'Atividades Estritamente Proibidas',
            content:
              'É expressamente vedado a qualquer usuário: (a) Enviar e-mails em massa não solicitados (SPAM) ou participar de esquemas de disseminação de boatos/correntes; (b) Praticar engenharia social, phishing ou tentativa de obter senhas de colegas ou professores; (c) Armazenar ou trafegar conteúdos ofensivos, de ódio, violência ou materiais que violem a legislação de proteção a menores; (d) Utilizar os recursos ilimitados ou pools de armazenamento para fins comerciais privados alheios à instituição.',
          },
          {
            number: '3',
            title: 'Consequências e Sanções Administrativas',
            content:
              'A violação destas diretrizes autoriza a instituição de ensino e os administradores da Skoolia a suspenderem cautelarmente o acesso da conta infratora, sem prejuízo da aplicação das penalidades regimentais internas da escola e comunicações aos órgãos competentes.',
          },
        ],
      },
    ],
  },
  en: {
    pageTitle: 'Contracts & Legal Agreements Center',
    pageSubtitle:
      'Review the official legal agreements, terms of service, privacy policies, and compliance frameworks governing the Skoolia ecosystem and Google Workspace for Education services.',
    badgeOfficial: 'Official Legal Documentation',
    badgeVersion: 'Current Version 2026.1',
    searchPlaceholder: 'Search clause, term, or policy...',
    filterAll: 'All Agreements',
    viewContractBtn: 'View Full Agreement',
    backToContractsBtn: 'Back to Agreements',
    printBtn: 'Print / Save as PDF',
    copyLinkBtn: 'Copy Direct Link',
    linkCopiedToast: 'Agreement link copied to clipboard!',
    tableOfContentsTitle: 'Table of Contents',
    effectiveDateLabel: 'Effective Date',
    versionLabel: 'Version',
    readingTimeLabel: 'Estimated Time',
    certifiedBadge: 'Google Cloud & for Education Partner Certified',
    acceptDeclarationText:
      'This document carries legal standing and binds educational institutions, IT administrators, and end-users operating under the Skoolia platform governance.',
    modalCloseTooltip: 'Close document',
    contracts: [
      {
        id: 'terms-of-service',
        slug: 'terms-of-service',
        category: 'primary',
        isPrincipal: true,
        effectiveDate: 'January 1, 2026',
        version: 'v4.2 - Universal',
        readingTime: '12 min read',
        title: 'Universal Terms of Service',
        subtitle: 'Institutional Framework, Workspace Governance & Cloud Operations',
        summary:
          'Core master agreement defining Skoolia as an authorized Google Workspace for Education partner platform, detailing operational scopes, identity provisioning, and mutual responsibilities.',
        badge: 'Master Agreement',
        keyPoints: [
          'Full legal definition of Skoolia and its role as an authorized Google for Education Partner',
          'Automated DNS orchestration, TXT verification, and SPF/DKIM/DMARC email security',
          'Automated student and staff identity lifecycle provisioning via Google Admin SDK DWD',
          'Multi-tenant logical database isolation, institutional data segregation, and compliance',
        ],
        clauses: [
          {
            number: '1',
            title: 'Subject Matter and Legal Nature of Skoolia',
            content:
              'Skoolia is a specialized cloud technology platform providing automated governance, identity lifecycle provisioning, and administrative orchestration for schools, universities, and educational districts. Acting as an Authorized Google Cloud and Google Workspace for Education Partner, Skoolia supplies the proprietary software infrastructure enabling academic institutions to deploy, configure, and monitor their Google for Education tenants with full legal and technical compliance.',
            subclauses: [
              {
                number: '1.1',
                title: 'Operational Scope',
                content:
                  'Skoolia does not replace the core cloud applications supplied by Google LLC. Instead, it augments, automates, and governs Google Workspace administration via certified APIs, identity workflows, enrollment synchronizations, and unified multi-domain management.',
              },
              {
                number: '1.2',
                title: 'Contracting Parties',
                content:
                  'This Agreement is entered into between Skoolia / InternetByMOL LLC (headquartered at 3101 North Central Avenue, Phoenix, 85012, United States, contact email help@skoolia.net) and the contracting Educational Institution (represented by authorized trustees, executive directors, or designated IT administrators).',
              },
            ],
          },
          {
            number: '2',
            title: 'How Skoolia Operates within Your Institution',
            content:
              'Skoolia operations are built on five foundational pillars designed to ensure institutional efficiency, cybersecurity, and adherence to Google for Education standards:',
            subclauses: [
              {
                number: '2.1',
                title: 'Domain Orchestration & DNS Configuration',
                content:
                  'Skoolia manages domain ownership validation with Google, orchestrating DNS zone records including TXT verification tokens, Google mail exchange (MX) routes, and cryptographic email authentication mechanisms (SPF, DKIM, DMARC) to prevent academic spoofing.',
              },
              {
                number: '2.2',
                title: 'Automated Identity Lifecycle Management',
                content:
                  'Leveraging authenticated Domain-Wide Delegation (DWD) Service Accounts integrated with the Google Admin SDK, Skoolia automates batch account provisioning, student Organizational Unit (OU) placement, secure temporary credential delivery, and prompt access revocation upon student withdrawal.',
              },
              {
                number: '2.3',
                title: 'Multi-Tenant Architecture with Strict Isolation',
                content:
                  'Each educational institution operates within an isolated tenant environment with strict logical segregation of databases, audit records, and API credentials. No institution can ever view or access records belonging to another school.',
              },
              {
                number: '2.4',
                title: 'Storage Pools & Licensing Governance',
                content:
                  'Skoolia monitors and allocates shared Drive storage quotas (100 TB institutional baseline) and manages Google Workspace for Education license assignments (Fundamentals, Standard, Teaching and Learning Upgrade, and Education Plus).',
              },
              {
                number: '2.5',
                title: 'Tier-2 and Tier-3 Technical Engineering Support',
                content:
                  'Provision of specialized technical support staffed by Google Cloud certified engineers assisting with domain propagation, directory migrations, service policies, and security audits.',
              },
            ],
          },
          {
            number: '3',
            title: 'Institutional Customer Responsibilities',
            content:
              'To guarantee seamless delivery of services, the Educational Institution agrees to:',
            subclauses: [
              {
                number: '3.1',
                title: 'Domain Ownership & DNS Control',
                content:
                  'Hold verified ownership or authorized control over all registered institutional domain names, assuming full accountability for DNS record entries made via their registrar.',
              },
              {
                number: '3.2',
                title: 'Data Accuracy & Parental Consent',
                content:
                  'Provide accurate roster information and secure requisite parental or guardian consents for student minors in compliance with applicable child privacy laws.',
              },
              {
                number: '3.3',
                title: 'Credential Protection & 2-Step Verification',
                content:
                  'Maintain strict secrecy of administrator credentials and mandate 2-Step Verification (2SV) across all accounts possessing administrative privileges.',
              },
            ],
          },
          {
            number: '4',
            title: 'Service Levels, Availability & Uptime',
            content:
              'Skoolia warrants a monthly availability of 99.9% for its management portal. Underlying Google Workspace core communication and storage applications are governed directly by Google LLC Service Level Agreements.',
          },
          {
            number: '5',
            title: 'Intellectual Property and Academic Data Ownership',
            content:
              'All academic data, files, assignments, curricula, student grades, and institutional records remain the sole and exclusive intellectual property of the Educational Institution. Skoolia acquires zero proprietary rights or commercial licenses over customer content.',
          },
          {
            number: '6',
            title: 'Term, Termination and Secure Data Disposal',
            content:
              'This Agreement remains effective from digital execution until terminated by either party. Upon contract conclusion, customer audit logs may be exported, and all service account integrations and associated keys are permanently purged within 30 days.',
          },
          {
            number: '7',
            title: 'Governing Law and Dispute Resolution',
            content:
              'This Agreement shall be governed by and construed in accordance with applicable laws, submitting any unresolved disputes to competent courts having commercial jurisdiction.',
          },
        ],
      },
      {
        id: 'privacy-policy',
        slug: 'privacy-policy',
        category: 'privacy',
        effectiveDate: 'January 1, 2026',
        version: 'v3.8 - Educational',
        readingTime: '9 min read',
        title: 'Privacy & Educational Data Protection Policy',
        subtitle: 'Strict Compliance with FERPA, COPPA, GDPR, and LGPD',
        summary:
          'Privacy standards applied to the handling of student, faculty, and administrative data, assuring zero commercial exploitation, no behavioral profiling, and banking-grade encryption.',
        badge: 'Privacy & FERPA',
        keyPoints: [
          'Absolute prohibition against selling, renting, or monetizing student data',
          'Zero targeted advertising, behavioral tracking, or consumer commercial profiling',
          'End-to-end data encryption (TLS 1.3 in transit and AES-256 at rest)',
          'Support for individual rights: access, rectification, portability, and deletion',
        ],
        clauses: [
          {
            number: '1',
            title: 'Commitment to Educational Privacy',
            content:
              'Skoolia was architected on principles of Privacy by Design and Default. Student and educator personal data are processed strictly to fulfill educational, academic, and administrative functions requested by the contracting school.',
          },
          {
            number: '2',
            title: 'Information We Collect and Process',
            content:
              'We collect only the minimum necessary data to provision and govern Google Workspace for Education environments:',
            subclauses: [
              {
                number: '2.1',
                title: 'Basic Directory Data',
                content:
                  'Full name, school email address, academic student/faculty ID, assigned grade/class Organizational Unit, and role (student, teacher, administrator).',
              },
              {
                number: '2.2',
                title: 'System & Audit Logs',
                content:
                  'Administrative IP address, timestamped user provisioning events, credential reset logs, and technical API synchronization telemetry.',
              },
            ],
          },
          {
            number: '3',
            title: 'Express Prohibitions & Protection of Minors',
            content:
              'Skoolia explicitly affirms that it: (I) NEVER sells, rents, or leases student personal information to third parties; (II) NEVER constructs behavioral profiles for commercial or advertising purposes; (III) NEVER displays behavioral ads inside school workspaces.',
          },
          {
            number: '4',
            title: 'Information Security Protocols',
            content:
              'All data in transit is protected using TLS 1.3 encryption. Data at rest is encrypted using military-grade AES-256 standards. Our cloud container infrastructure runs in facilities certified for ISO 27001, SOC 2 Type II, and PCI-DSS compliance.',
          },
          {
            number: '5',
            title: 'Data Subject Rights',
            content:
              'Parents, legal guardians, and adult students may exercise their legal rights of access, correction, and record deletion through their educational institution, which Skoolia supports through automated data export and erasure tools.',
          },
          {
            number: '6',
            title: 'Compliance with Google API Services User Data Policy & Limited Use Requirements',
            content:
              "Skoolia's use and transfer of information received from Google APIs to any other app will adhere to Google API Services User Data Policy, including the Limited Use requirements.",
            subclauses: [
              {
                number: '6.1',
                title: 'Strict Purpose Limitation',
                content:
                  'Skoolia accesses authorized Google Workspace data (user directory, organizational units, domain verification, and storage allocations) solely to deliver and optimize administrative educational governance features requested by the institution administrator.',
              },
              {
                number: '6.2',
                title: 'No Advertising or Generalized AI Model Training',
                content:
                  'Data obtained via Google APIs is never sold, rented, or transferred to third parties. We do not use Google Workspace data for targeted advertising, consumer behavioral profiling, or training generalized artificial intelligence or machine learning models.',
              },
              {
                number: '6.3',
                title: 'Human Access Restrictions',
                content:
                  'No human employee or contractor at Skoolia reads Google Workspace user data unless explicit affirmative consent has been granted in writing by the school administrator for technical troubleshooting, or if strictly required by lawful court order.',
              },
            ],
          },
          {
            number: '7',
            title: 'Data Retention, Deletion, OAuth Revocation, and Contact',
            content:
              'Synchronized data is retained solely for the active duration of the educational institution’s tenant on Skoolia. Administrators may request full deletion of their organization’s data at any time by contacting help@skoolia.net or terminating their tenant; data is permanently deleted within 30 days. Administrators may also revoke OAuth access at any time via the Google Account Permissions dashboard (https://myaccount.google.com/permissions). Operating entity: InternetByMOL LLC, 3101 North Central Avenue, Phoenix, 85012, United States. Support: help@skoolia.net.',
          },
        ],
      },
      {
        id: 'sla',
        slug: 'sla',
        category: 'sla',
        effectiveDate: 'January 1, 2026',
        version: 'v2.5 - Uptime & Support',
        readingTime: '6 min read',
        title: 'Service Level Agreement (SLA) & Technical Support',
        subtitle: '99.9% Uptime Commitment with Rapid Incident Response Matrices',
        summary:
          'Contractual commitments governing portal availability, incident severity categorization, response timeframes, maintenance windows, and uptime service credits.',
        badge: '99.9% Uptime SLA',
        keyPoints: [
          'Contractual 99.9% monthly availability for the Skoolia management platform',
          'Severity 1 (Critical) incidents addressed within 1 hour, around the clock 24/7',
          'Dedicated support staffed by certified Google Cloud and Workspace specialists',
          'Advance notification of at least 48 hours for scheduled preventative maintenance',
        ],
        clauses: [
          {
            number: '1',
            title: 'Monthly Uptime Commitment',
            content:
              'Skoolia commits to maintaining minimum 99.9% monthly uptime for its tenant governance portal during each calendar month, excluding scheduled preventative maintenance windows.',
          },
          {
            number: '2',
            title: 'Incident Classification & Target Response Times',
            content:
              'Customer support tickets are triaged into three strict operational severity levels:',
            subclauses: [
              {
                number: '2.1',
                title: 'Severity 1 - Critical (P1)',
                content:
                  'Total system outage or complete failure of student account provisioning. Initial response time: under 1 hour, active 24/7/365.',
              },
              {
                number: '2.2',
                title: 'Severity 2 - High (P2)',
                content:
                  'Partial degradation impacting significant administrative workflows without halting virtual classroom access. Initial response time: under 4 business hours.',
              },
              {
                number: '2.3',
                title: 'Severity 3 - Normal (P3)',
                content:
                  'General operational questions, DNS assistance, or routine service requests. Initial response time: under 8 business hours.',
              },
            ],
          },
          {
            number: '3',
            title: 'Scheduled Maintenance Windows',
            content:
              'Essential infrastructure upgrades are performed during off-peak weekend or night hours, accompanied by at least 48 hours advance notice to registered school IT managers.',
          },
        ],
      },
      {
        id: 'dpa',
        slug: 'dpa',
        category: 'compliance',
        effectiveDate: 'January 1, 2026',
        version: 'v3.1 - Data Processor',
        readingTime: '8 min read',
        title: 'Data Processing Agreement (DPA)',
        subtitle: 'Roles Definition: School as Data Controller, Skoolia as Data Processor',
        summary:
          'Legally mandated agreement defining data processing boundaries under GDPR and privacy acts, covering sub-processors, security compliance, and audit support.',
        badge: 'DPA / GDPR',
        keyPoints: [
          'Educational Institution acts as Sole Data Controller directing processing actions',
          'Skoolia acts strictly as Data Processor executing customer-approved commands',
          'Sub-processors restricted strictly to verified Google Cloud Platform facilities',
          'Mandatory security breach notifications transmitted within 48 hours of confirmation',
        ],
        clauses: [
          {
            number: '1',
            title: 'Contractual Roles and Processing Boundaries',
            content:
              'Under GDPR Article 28 and equivalent data protection regulations, the Educational Institution is the Data Controller. Skoolia acts solely as the Data Processor, handling institutional personal data only upon documented instructions from the Controller.',
          },
          {
            number: '2',
            title: 'Processor Obligations',
            content:
              'Skoolia covenants to: (a) Process data solely for agreed educational provisioning; (b) Enforce strict non-disclosure obligations on all personnel; (c) Maintain industry-standard technical safeguards against unauthorized processing.',
          },
          {
            number: '3',
            title: 'Authorized Sub-Processors',
            content:
              'The Controller authorizes the engagement of essential infrastructure providers, specifically Google LLC / Google Cloud Platform. Material changes to sub-processors will be notified in advance.',
          },
          {
            number: '4',
            title: 'Security Breach Incident Notification',
            content:
              'In the event of a confirmed security incident impacting customer personal data, Skoolia will notify the Controller within 48 hours, detailing remediation steps and supporting regulatory disclosures.',
          },
        ],
      },
      {
        id: 'acceptable-use',
        slug: 'acceptable-use',
        category: 'security',
        effectiveDate: 'January 1, 2026',
        version: 'v2.2 - Academic Integrity',
        readingTime: '5 min read',
        title: 'Acceptable Use Policy (AUP)',
        subtitle: 'Digital Citizenship, Campus Safety, and Account Integrity Guidelines',
        summary:
          'Standards of responsible digital conduct across institutional accounts managed by Skoolia, forbidding spam, unauthorized bulk messaging, network abuse, and harassment.',
        badge: 'Acceptable Use',
        keyPoints: [
          'Accounts reserved exclusively for educational, curricular, and institutional purposes',
          'Prohibition against unsolicited bulk communications (SPAM), phishing, and malware',
          'Zero tolerance for copyright infringement, hate speech, or illicit digital content',
          'Mandatory preservation of a safe, respectful, and productive virtual classroom',
        ],
        clauses: [
          {
            number: '1',
            title: 'Educational Purpose of Accounts',
            content:
              'All Google Workspace accounts and associated services provisioned via Skoolia are provided strictly for teaching, learning, academic research, and accredited school administration.',
          },
          {
            number: '2',
            title: 'Prohibited Network Activities',
            content:
              'Users are prohibited from: (a) Transmitting unsolicited mass marketing or chain emails; (b) Engaging in social engineering, password harvesting, or unauthorized privilege escalation; (c) Storing or distributing defamatory, harassing, or sexually explicit material; (d) Consuming institutional cloud storage for private commercial endeavors.',
          },
          {
            number: '3',
            title: 'Administrative Sanctions',
            content:
              'Violations of this policy may lead to temporary account suspension by school administrators or Skoolia security systems, pending institutional disciplinary reviews.',
          },
        ],
      },
    ],
  },
  es: {
    pageTitle: 'Centro de Contratos y Términos Legales',
    pageSubtitle:
      'Consulte los acuerdos oficiales, términos de servicio, políticas de privacidad y marcos de cumplimiento que rigen el ecosistema Skoolia y los servicios de Google Workspace for Education.',
    badgeOfficial: 'Documentación Jurídica Oficial',
    badgeVersion: 'Versión Vigente 2026.1',
    searchPlaceholder: 'Buscar cláusula, término o política...',
    filterAll: 'Todos los Contratos',
    viewContractBtn: 'Ver Contrato Completo',
    backToContractsBtn: 'Volver a los Contratos',
    printBtn: 'Imprimir / Guardar en PDF',
    copyLinkBtn: 'Copiar Enlace Directo',
    linkCopiedToast: '¡Enlace del contrato copiado al portapapeles!',
    tableOfContentsTitle: 'Índice de Cláusulas',
    effectiveDateLabel: 'Fecha de Entrada en Vigor',
    versionLabel: 'Versión',
    readingTimeLabel: 'Tiempo Estimado',
    certifiedBadge: 'Google Cloud & for Education Partner Certified',
    acceptDeclarationText:
      'Este documento tiene validez legal vinculante y rige para todas las instituciones educativas, administradores de TI y usuarios finales bajo la plataforma Skoolia.',
    modalCloseTooltip: 'Cerrar documento',
    contracts: [
      {
        id: 'terms-of-service',
        slug: 'terms-of-service',
        category: 'primary',
        isPrincipal: true,
        effectiveDate: '01 de Enero de 2026',
        version: 'v4.2 - Universal',
        readingTime: '12 min de lectura',
        title: 'Términos de Servicio Universal Skoolia',
        subtitle: 'Estructura Institucional, Gestión de Workspace y Operación Educativa',
        summary:
          'Contrato maestro que define a Skoolia como plataforma partner autorizada de Google Workspace for Education, detallando el alcance de sus servicios, aprovisionamiento de identidades y compromisos mutuos.',
        badge: 'Contrato Principal',
        keyPoints: [
          'Definición legal de Skoolia y su papel como Partner Autorizado Google for Education',
          'Orquestación de DNS, verificación TXT/MX y seguridad de correo SPF/DKIM/DMARC',
          'Aprovisionamiento automatizado de cuentas de alumnos y profesores vía API DWD',
          'Aislamiento multi-tenant estricto de bases de datos y segregación institucional',
        ],
        clauses: [
          {
            number: '1',
            title: 'Objeto del Contrato y Naturaleza de Skoolia',
            content:
              'Skoolia es una plataforma de tecnología en la nube especializada en gobernanza, aprovisionamiento de identidades y administración educativa para colegios, universidades y redes escolares. En calidad de Partner Autorizado Google Cloud y Google Workspace for Education, Skoolia provee el software que permite a las instituciones orquestar, configurar y supervisar su entorno digital Google for Education con total seguridad y cumplimiento pedagógico.',
            subclauses: [
              {
                number: '1.1',
                title: 'Alcance Operativo',
                content:
                  'Skoolia no reemplaza las aplicaciones fundamentales provistas por Google LLC, sino que automatiza, escala y gobierna la administración de Google Workspace mediante APIs certificadas, aprovisionamiento masivo y gestión unificada de dominios.',
              },
              {
                number: '1.2',
                title: 'Partes Contratantes',
                content:
                  'El presente acuerdo se suscribe entre Skoolia / InternetByMOL LLC (con sede en 3101 North Central Avenue, Phoenix, 85012, Estados Unidos, correo de contacto help@skoolia.net) y la Institución Educativa contratante (representada por sus directores, representantes legales o administradores de TI acreditados).',
              },
            ],
          },
          {
            number: '2',
            title: 'Cómo Opera Skoolia en su Institución',
            content:
              'La actuación de Skoolia se articula en cinco ejes esenciales para garantizar máxima operatividad, ciberseguridad y rigor técnico:',
            subclauses: [
              {
                number: '2.1',
                title: 'Orquestación de Dominios y Configuración DNS',
                content:
                  'Skoolia administra la validación de dominios institucionales ante Google, guiando la configuración de registros TXT de propiedad, servidores MX de enrutamiento y autenticación criptográfica SPF, DKIM y DMARC contra phishing escolar.',
              },
              {
                number: '2.2',
                title: 'Aprovisionamiento de Identidades y Ciclo de Vida',
                content:
                  'Mediante el Google Admin SDK con Delegación en Todo el Dominio (DWD) y Cuentas de Servicio seguras, Skoolia automatiza el ciclo de vida de usuarios: altas masivas de estudiantes, asignación a Unidades Organizativas (OUs), restablecimiento seguro de claves y suspensión inmediata ante deserciones o egresos.',
              },
              {
                number: '2.3',
                title: 'Arquitectura Multi-Tenant con Aislamiento Estricto',
                content:
                  'Cada institución opera en un tenant aislado con segregación lógica de bases de datos y credenciales. Ninguna escuela puede visualizar datos o registros de otra entidad.',
              },
              {
                number: '2.4',
                title: 'Gobernanza de Almacenamiento y Licencias',
                content:
                  'Monitoreo del pool compartido de 100 TB en Google Drive y asignación granular de licencias (Google Workspace for Education Fundamentals, Standard, Teaching and Learning Upgrade y Education Plus).',
              },
              {
                number: '2.5',
                title: 'Soporte Técnico de Nivel Avanzado',
                content:
                  'Ingenieros certificados en Google Cloud asisten en la resolución técnica, migraciones de correo y auditorías de seguridad continua.',
              },
            ],
          },
          {
            number: '3',
            title: 'Obligaciones de la Institución Educativa',
            content:
              'Para el correcto funcionamiento de la plataforma, la Institución Educativa se compromete a:',
            subclauses: [
              {
                number: '3.1',
                title: 'Propiedad del Dominio y Registros DNS',
                content:
                  'Demostrar la propiedad o autorización de uso del dominio escolar y responder por los cambios aplicados en la zona DNS institucional.',
              },
              {
                number: '3.2',
                title: 'Veracidad de Datos y Consentimientos Legales',
                content:
                  'Entregar datos fidedignos de los alumnos y recabar los consentimientos paternos o de tutores legales para menores de edad según las leyes de protección infantil.',
              },
              {
                number: '3.3',
                title: 'Custodia de Claves y Verificación en Dos Pasos (2SV)',
                content:
                  'Custodiar con estricta confidencialidad las cuentas de administrador y habilitar 2SV en todos los perfiles de gestión.',
              },
            ],
          },
          {
            number: '4',
            title: 'Disponibilidad y Nivel de Servicio',
            content:
              'Skoolia garantiza un 99,9% de disponibilidad mensual en su panel de administración. Las aplicaciones de comunicación y almacenamiento de Google Workspace se rigen por los SLAs globales de Google LLC.',
          },
          {
            number: '5',
            title: 'Propiedad Intelectual y Titularidad de Datos',
            content:
              'Todos los archivos, calificaciones, trabajos y registros de alumnos pertenecen exclusivamente a la Institución Educativa. Skoolia no adquiere ningún derecho comercial ni de propiedad sobre dichos contenidos.',
          },
          {
            number: '6',
            title: 'Vigencia, Rescisión y Eliminación Segura',
            content:
              'El acuerdo tiene vigencia indefinida desde su aceptación. Al rescindir el servicio, se pueden exportar los registros de auditoría y todas las claves de integración se eliminan en un plazo de 30 días.',
          },
          {
            number: '7',
            title: 'Legislación Aplicable y Jurisdicción',
            content:
              'El presente contrato se rige por las leyes competentes, sometiéndose cualquier disputa a los tribunales del domicilio comercial de Skoolia.',
          },
        ],
      },
      {
        id: 'privacy-policy',
        slug: 'privacy-policy',
        category: 'privacy',
        effectiveDate: '01 de Enero de 2026',
        version: 'v3.8 - Educativa',
        readingTime: '9 min de lectura',
        title: 'Política de Privacidad y Protección de Datos Escolares',
        subtitle: 'Cumplimiento Integral con FERPA, COPPA, GDPR y Leyes Locales de Datos',
        summary:
          'Estándares de confidencialidad aplicados a los datos de alumnos, docentes y directivos: sin publicidad dirigida, sin explotación de perfiles y con cifrado de nivel bancario.',
        badge: 'Privacidad Educativa',
        keyPoints: [
          'Prohibición total de venta, cesión o monetización de datos de estudiantes',
          'Cero anuncios dirigidos y cero elaboración de perfiles comerciales',
          'Cifrado de extremo a extremo (TLS 1.3 en tránsito y AES-256 en reposo)',
          'Garantía plena para el ejercicio de derechos de acceso, rectificación y supresión',
        ],
        clauses: [
          {
            number: '1',
            title: 'Compromiso con la Privacidad Escolar',
            content:
              'Skoolia fue diseñada bajo la premisa de Privacy by Design. Los datos de la comunidad educativa se procesan únicamente para fines didácticos, académicos e institucionales.',
          },
          {
            number: '2',
            title: 'Datos Recopilados',
            content:
              'Únicamente se tratan los datos indispensables para la administración escolar: nombre completo, correo institucional, matrícula/ID académico, unidad organizativa (curso/sección) y rol institucional.',
          },
          {
            number: '3',
            title: 'Prohibiciones Expresas',
            content:
              'Skoolia declara solemnemente que JAMÁS vende datos escolares, NO crea perfiles comerciales y NO introduce anuncios publicitarios en las herramientas de los estudiantes.',
          },
          {
            number: '4',
            title: 'Seguridad de la Información',
            content:
              'Cifrado TLS 1.3 en tránsito y AES-256 en bases de datos. Los servidores operan en instalaciones Google Cloud certificadas bajo normas ISO 27001 y SOC 2.',
          },
          {
            number: '5',
            title: 'Derechos de los Titulares',
            content:
              'Padres y estudiantes pueden requerir acceso, rectificación o eliminación de sus registros a través de la institución educativa.',
          },
          {
            number: '6',
            title: 'Cumplimiento de la Política de Datos de Usuario de las API de Google y Uso Limitado (Limited Use)',
            content:
              'El uso y la transferencia por parte de Skoolia de la información recibida de las API de Google a cualquier otra aplicación se ajustarán estrictamente a la Política de Datos de Usuario de los Servicios de las API de Google, incluidos los requisitos de Uso Limitado (Google API Services User Data Policy, including Limited Use requirements).',
            subclauses: [
              {
                number: '6.1',
                title: 'Limitación Estricta de la Finalidad',
                content:
                  'Skoolia accede a los datos autorizados de Google Workspace (directorio de usuarios, unidades organizativas, verificación de dominios y cuotas de almacenamiento) única y exclusivamente para prestar las funciones de gobernanza y administración educativa solicitadas por el administrador institucional.',
              },
              {
                number: '6.2',
                title: 'Prohibición de Comercialización y Publicidad',
                content:
                  'Los datos obtenidos mediante las API de Google NUNCA se venden, alquilan ni ceden a terceros. No utilizamos datos de Google Workspace para publicidad dirigida, elaboración de perfiles comerciales ni para entrenar modelos de inteligencia artificial o aprendizaje automático de uso general.',
              },
              {
                number: '6.3',
                title: 'Restricción de Acceso Humano',
                content:
                  'Ningún empleado o colaborador humano de Skoolia tiene acceso para leer datos de usuarios de Google Workspace, salvo consentimiento afirmativo previo del administrador escolar para soporte técnico resolutivo o por requerimiento judicial vinculante.',
              },
            ],
          },
          {
            number: '7',
            title: 'Retención, Supresión de Datos, Revocación OAuth y Contacto',
            content:
              'Los datos sincronizados se conservan únicamente mientras la cuenta de la institución permanezca activa en la plataforma. Los administradores pueden solicitar la supresión total y definitiva de sus datos en cualquier momento escribiendo a help@skoolia.net o cancelando su entorno en el panel; la eliminación se ejecuta en un plazo máximo de 30 días. Los administradores pueden además revocar los permisos de la aplicación OAuth en cualquier momento desde el panel de seguridad de Google (https://myaccount.google.com/permissions). Entidad operadora: InternetByMOL LLC, 3101 North Central Avenue, Phoenix, 85012, Estados Unidos. Soporte y privacidad: help@skoolia.net.',
          },
        ],
      },
      {
        id: 'sla',
        slug: 'sla',
        category: 'sla',
        effectiveDate: '01 de Enero de 2026',
        version: 'v2.5 - Soporte y Uptime',
        readingTime: '6 min de lectura',
        title: 'Acuerdo de Nivel de Servicio (SLA) y Soporte Técnico',
        subtitle: 'Compromiso de Disponibilidad del 99,9% y Atención Prioritaria',
        summary:
          'Garantías contractuales de disponibilidad de la plataforma, clasificación de incidencias por gravedad, tiempos máximos de respuesta y mantenimiento programado.',
        badge: 'SLA 99.9%',
        keyPoints: [
          'Compromiso de disponibilidad del 99,9% mensual en el panel de control',
          'Incidencias Críticas (P1) atendidas en menos de 1 hora, 24 horas al día los 7 días',
          'Atención especializada por ingenieros certificados en Google Workspace',
          'Aviso previo de 48 horas para mantenimientos programados fuera de horario lectivo',
        ],
        clauses: [
          {
            number: '1',
            title: 'Métrica de Disponibilidad Mensual',
            content:
              'Skoolia asegura un mínimo del 99,9% de disponibilidad en su plataforma durante cada mes calendario, descontando mantenimientos preventivos previamente comunicados.',
          },
          {
            number: '2',
            title: 'Clasificación de Incidencias y Respuestas',
            content:
              'Las solicitudes de soporte se gestionan según su impacto: Severidad 1 Crítica (< 1 hora 24/7); Severidad 2 Alta (< 4 horas laborables); Severidad 3 Normal (< 8 horas laborables).',
          },
          {
            number: '3',
            title: 'Mantenimientos Programados',
            content:
              'Se ejecutan en fines de semana o noches para no interrumpir las clases, notificando a los administradores con 48 horas de anticipación.',
          },
        ],
      },
      {
        id: 'dpa',
        slug: 'dpa',
        category: 'compliance',
        effectiveDate: '01 de Enero de 2026',
        version: 'v3.1 - Encargado del Tratamiento',
        readingTime: '8 min de lectura',
        title: 'Acuerdo de Tratamiento de Datos (DPA)',
        subtitle: 'Roles: Institución como Responsable y Skoolia como Encargada',
        summary:
          'Normativa jurídica que rige el tratamiento de datos personales conforme al GDPR y leyes de privacidad, regulando sub-encargados y deberes de auditoría.',
        badge: 'DPA / Privacidad',
        keyPoints: [
          'La Institución Educativa actúa como Responsable única de las directrices de datos',
          'Skoolia actúa como Encargada bajo instrucciones documentadas de la escuela',
          'Sub-encargados limitados a la infraestructura de Google Cloud Platform',
          'Notificación de brechas de seguridad dentro de las 48 horas posteriores a su detección',
        ],
        clauses: [
          {
            number: '1',
            title: 'Roles Contractuales de Tratamiento',
            content:
              'La Institución Educativa es la Responsable del tratamiento de datos personales. Skoolia actúa en calidad de Encargada, procesando datos exclusivamente para los fines contratados.',
          },
          {
            number: '2',
            title: 'Obligaciones de la Encargada',
            content:
              'Skoolia garantiza que su personal está sujeto a estricta confidencialidad y aplica salvaguardas técnicas acordes al riesgo del entorno escolar.',
          },
          {
            number: '3',
            title: 'Sub-encargados Homologados',
            content:
              'Se autoriza la participación de Google LLC / Google Cloud Platform como proveedor de nube indispensable para el servicio.',
          },
          {
            number: '4',
            title: 'Notificación de Incidentes de Seguridad',
            content:
              'Ante cualquier incidente confirmado que vulnere datos personales, Skoolia avisará a la institución en un plazo máximo de 48 horas.',
          },
        ],
      },
      {
        id: 'acceptable-use',
        slug: 'acceptable-use',
        category: 'security',
        effectiveDate: '01 de Enero de 2026',
        version: 'v2.2 - Convivencia Digital',
        readingTime: '5 min de lectura',
        title: 'Política de Uso Aceptable (AUP)',
        subtitle: 'Pautas de Convivencia, Seguridad Digital e Integridad Académica',
        summary:
          'Pautas de uso responsable de las cuentas institucionales gestionadas mediante Skoolia: prohibición de spam, fraude, acoso escolar y descarga de contenidos no autorizados.',
        badge: 'Uso Aceptable',
        keyPoints: [
          'Uso estrictamente pedagógico, académico e institucional de las cuentas',
          'Prohibición de spam, phishing, suplantación de identidad o robo de contraseñas',
          'Veda total a materiales difamatorios, ilícitos o violadores de derechos de autor',
          'Preservación de un ambiente virtual seguro, inclusivo y libre de ciberacoso',
        ],
        clauses: [
          {
            number: '1',
            title: 'Propósito Exclusivamente Educativo',
            content:
              'Las cuentas y herramientas de Google Workspace for Education se proporcionan únicamente para fines de enseñanza, aprendizaje y administración escolar.',
          },
          {
            number: '2',
            title: 'Conductas Prohibidas',
            content:
              'Queda prohibido enviar correos masivos no deseados (spam), almacenar archivos ilícitos, acosar a compañeros o utilizar el almacenamiento para fines comerciales particulares.',
          },
          {
            number: '3',
            title: 'Sanciones Administrativas',
            content:
              'La violación de estas normas facultará a la escuela a suspender el acceso de la cuenta involucrada conforme a sus reglamentos internos.',
          },
        ],
      },
    ],
  },
};
