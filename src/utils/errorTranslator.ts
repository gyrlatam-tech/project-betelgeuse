/**
 * Utilities for localizing Google Workspace, API, and validation errors
 * according to the active application language (pt, es, en).
 */

export function translateWorkspaceError(
  rawError: string | undefined | null,
  lang: string = 'pt'
): string {
  if (!rawError) {
    if (lang === 'pt') return 'Erro desconhecido ao processar conta.';
    if (lang === 'es') return 'Error desconocido al procesar la cuenta.';
    return 'Unknown error processing account.';
  }

  const err = String(rawError).trim();
  const lower = err.toLowerCase();

  // 1. Recovery Phone Errors (e.g. "Invalid recovery phone.", "Invalid phone number", "Invalid recovery phone number")
  if (
    lower.includes('recovery phone') ||
    lower.includes('recoveryphone') ||
    lower.includes('phone number') ||
    lower.includes('invalid phone') ||
    (lower.includes('telefone') && lower.includes('inv'))
  ) {
    if (lang === 'pt') {
      return 'Telefone de recuperação inválido (necessário formato internacional E.164 com +, ex: +5511999999999).';
    }
    if (lang === 'es') {
      return 'Teléfono de recuperación inválido (debe incluir formato internacional con +, ej: +34... / +52...).';
    }
    return 'Invalid recovery phone number (must be international E.164 format with +, e.g. +1...).';
  }

  // 2. Recovery Email Errors
  if (
    lower.includes('recovery email') ||
    lower.includes('recoveryemail') ||
    (lower.includes('email de recuperação') && lower.includes('inv'))
  ) {
    if (lang === 'pt') return 'E-mail de recuperação inválido.';
    if (lang === 'es') return 'Correo de recuperación inválido.';
    return 'Invalid recovery email address.';
  }

  // 3. User / Entity already exists
  if (
    lower.includes('already exists') ||
    lower.includes('entity already exists') ||
    lower.includes('duplicate') ||
    lower.includes('já cadastrada') ||
    lower.includes('já existe') ||
    lower.includes('ya existe')
  ) {
    if (lang === 'pt') return 'Esta conta de e-mail já existe no Google Workspace.';
    if (lang === 'es') return 'Esta cuenta de correo ya existe en Google Workspace.';
    return 'This account already exists in Google Workspace.';
  }

  // 4. Password validation issues
  if (lower.includes('password') || lower.includes('senha') || lower.includes('contraseña')) {
    if (
      lower.includes('weak') ||
      lower.includes('short') ||
      lower.includes('length') ||
      lower.includes('8') ||
      lower.includes('curta') ||
      lower.includes('fraca')
    ) {
      if (lang === 'pt') return 'Senha temporária muito curta ou fraca (mínimo de 8 caracteres).';
      if (lang === 'es') return 'Contraseña temporal demasiado corta o débil (mínimo 8 caracteres).';
      return 'Temporary password is too short (minimum 8 characters).';
    }
    if (lang === 'pt') return 'A senha fornecida não atende aos requisitos de segurança do Google Workspace.';
    if (lang === 'es') return 'La contraseña no cumple con los requisitos de seguridad de Google Workspace.';
    return 'Password does not meet Google Workspace security requirements.';
  }

  // 5. Domain not verified or not found
  if (
    (lower.includes('domain') || lower.includes('domínio') || lower.includes('dominio')) &&
    (lower.includes('not verified') ||
      lower.includes('not found') ||
      lower.includes('não está verificado') ||
      lower.includes('no verificado') ||
      lower.includes('não pertence') ||
      lower.includes('no pertenece'))
  ) {
    if (lang === 'pt') return 'O domínio deste e-mail não está verificado para este tenant no Google Workspace.';
    if (lang === 'es') return 'El dominio de este correo no está verificado para este tenant en Google Workspace.';
    return 'Domain is not verified for this tenant in Google Workspace.';
  }

  // 6. Name field requirements
  if (lower.includes('given name') || lower.includes('givenname') || lower.includes('primeiro nome')) {
    if (lang === 'pt') return 'Primeiro nome é obrigatório para criação da conta.';
    if (lang === 'es') return 'El nombre de pila es obligatorio para crear la cuenta.';
    return 'First name is required.';
  }
  if (lower.includes('family name') || lower.includes('familyname') || lower.includes('sobrenome')) {
    if (lang === 'pt') return 'Sobrenome é obrigatório para criação da conta.';
    if (lang === 'es') return 'El apellido es obligatorio para crear la cuenta.';
    return 'Last name is required.';
  }

  // 7. Invalid Primary Email
  if (
    (lower.includes('email') || lower.includes('e-mail') || lower.includes('correo')) &&
    (lower.includes('invalid') || lower.includes('inválido') || lower.includes('mal formatado'))
  ) {
    if (lang === 'pt') return 'Endereço de e-mail institucional inválido ou mal formatado.';
    if (lang === 'es') return 'Dirección de correo institucional inválida o con formato erróneo.';
    return 'Invalid institutional email address format.';
  }

  // 8. Quota & Rate Limits
  if (lower.includes('quota') || lower.includes('rate limit') || lower.includes('limite de requisições')) {
    if (lang === 'pt') return 'Limite temporário de requisições do Google Workspace atingido. Tente novamente em instantes.';
    if (lang === 'es') return 'Límite temporal de solicitudes de Google Workspace alcanzado. Intente nuevamente en instantes.';
    return 'Google Workspace rate limit reached. Please retry in a few moments.';
  }

  // 9. Permissions & Authentication
  if (
    lower.includes('permission') ||
    lower.includes('unauthorized') ||
    lower.includes('forbidden') ||
    lower.includes('insufficient') ||
    lower.includes('permissão') ||
    lower.includes('permiso')
  ) {
    if (lang === 'pt') return 'Permissões insuficientes na conta de serviço do Google Workspace (verifique Delegação de Domínio).';
    if (lang === 'es') return 'Permisos insuficientes en la cuenta de servicio de Google Workspace.';
    return 'Insufficient permissions in Google Workspace service account.';
  }

  // Return original error if no pattern matched
  return err;
}
