export interface CountryBillingConfig {
  code: string;
  name: string;
  flag: string;
  region: 'América do Norte' | 'América Central' | 'América do Sul' | 'Caribe';
  taxIdLabel: string;
  taxIdPlaceholder: string;
  taxIdHelp?: string;
  stateLabel: string;
  statePlaceholder: string;
  postalCodeLabel: string;
  postalCodePlaceholder: string;
  addressPlaceholder: string;
  cityPlaceholder: string;
  hasNeighborhoodField?: boolean; // For Bairro / Colonia (BR, MX, etc.)
  neighborhoodLabel?: string;
}

export const AMERICAS_COUNTRIES: CountryBillingConfig[] = [
  // América do Sul
  {
    code: 'BR',
    name: 'Brasil',
    flag: '🇧🇷',
    region: 'América do Sul',
    taxIdLabel: 'CNPJ ou CPF',
    taxIdPlaceholder: '00.000.000/0001-00 ou 000.000.000-00',
    taxIdHelp: 'Identificação fiscal para registro do recibo comercial',
    stateLabel: 'Estado (UF)',
    statePlaceholder: 'SP, RJ, MG, etc.',
    postalCodeLabel: 'CEP',
    postalCodePlaceholder: '00000-000',
    addressPlaceholder: 'Av. Paulista, 1000 - Andar 5, Sala 502',
    cityPlaceholder: 'São Paulo',
    hasNeighborhoodField: true,
    neighborhoodLabel: 'Bairro',
  },
  {
    code: 'AR',
    name: 'Argentina',
    flag: '🇦🇷',
    region: 'América do Sul',
    taxIdLabel: 'CUIT ou CUIL',
    taxIdPlaceholder: '20-12345678-9 / 30-12345678-9',
    taxIdHelp: 'Clave Única de Identificación Tributaria',
    stateLabel: 'Provincia',
    statePlaceholder: 'Buenos Aires, Córdoba, Santa Fe...',
    postalCodeLabel: 'Código Postal (CPA)',
    postalCodePlaceholder: 'C1024CWN ou 1425',
    addressPlaceholder: 'Av. Corrientes 1234, Piso 4',
    cityPlaceholder: 'Ciudad Autónoma de Buenos Aires',
  },
  {
    code: 'BO',
    name: 'Bolívia',
    flag: '🇧🇴',
    region: 'América do Sul',
    taxIdLabel: 'NIT (Número de Identificación Tributaria)',
    taxIdPlaceholder: '1020304050',
    stateLabel: 'Departamento',
    statePlaceholder: 'La Paz, Santa Cruz, Cochabamba...',
    postalCodeLabel: 'Código Postal',
    postalCodePlaceholder: '0000',
    addressPlaceholder: 'Av. 16 de Julio 1440, Edificio Hoy',
    cityPlaceholder: 'La Paz',
  },
  {
    code: 'CL',
    name: 'Chile',
    flag: '🇨🇱',
    region: 'América do Sul',
    taxIdLabel: 'RUT (Rol Único Tributario)',
    taxIdPlaceholder: '76.123.456-K',
    taxIdHelp: 'RUT de la empresa o persona natural',
    stateLabel: 'Región / Comuna',
    statePlaceholder: 'Región Metropolitana / Las Condes',
    postalCodeLabel: 'Código Postal',
    postalCodePlaceholder: '7550000',
    addressPlaceholder: 'Av. Apoquindo 4501, Of. 801',
    cityPlaceholder: 'Santiago',
    hasNeighborhoodField: true,
    neighborhoodLabel: 'Comuna',
  },
  {
    code: 'CO',
    name: 'Colômbia',
    flag: '🇨🇴',
    region: 'América do Sul',
    taxIdLabel: 'NIT ou Cédula de Ciudadanía',
    taxIdPlaceholder: '900.123.456-1',
    taxIdHelp: 'Número de Identificación Tributaria con dígito de verificación',
    stateLabel: 'Departamento',
    statePlaceholder: 'Cundinamarca, Antioquia, Valle...',
    postalCodeLabel: 'Código Postal',
    postalCodePlaceholder: '110111',
    addressPlaceholder: 'Calle 93B #13-45, Of. 402',
    cityPlaceholder: 'Bogotá D.C.',
    hasNeighborhoodField: true,
    neighborhoodLabel: 'Barrio / Localidad',
  },
  {
    code: 'EC',
    name: 'Equador',
    flag: '🇪🇨',
    region: 'América do Sul',
    taxIdLabel: 'RUC ou Cédula de Identidad',
    taxIdPlaceholder: '1790012345001',
    stateLabel: 'Provincia',
    statePlaceholder: 'Pichincha, Guayas, Azuay...',
    postalCodeLabel: 'Código Postal',
    postalCodePlaceholder: '170515',
    addressPlaceholder: 'Av. Amazonas N24-196 y Luis Cordero',
    cityPlaceholder: 'Quito',
  },
  {
    code: 'GY',
    name: 'Guiana',
    flag: '🇬🇾',
    region: 'América do Sul',
    taxIdLabel: 'TIN (Taxpayer Identification Number)',
    taxIdPlaceholder: '123-456-789',
    stateLabel: 'Region / District',
    statePlaceholder: 'Demerara-Mahaica...',
    postalCodeLabel: 'Postal Code',
    postalCodePlaceholder: '00000',
    addressPlaceholder: '123 Main Street',
    cityPlaceholder: 'Georgetown',
  },
  {
    code: 'PY',
    name: 'Paraguai',
    flag: '🇵🇾',
    region: 'América do Sul',
    taxIdLabel: 'RUC (Registro Único de Contribuyentes)',
    taxIdPlaceholder: '80012345-6',
    stateLabel: 'Departamento',
    statePlaceholder: 'Central, Alto Paraná, Asunción...',
    postalCodeLabel: 'Código Postal',
    postalCodePlaceholder: '1209',
    addressPlaceholder: 'Av. Aviadores del Chaco 2050',
    cityPlaceholder: 'Asunción',
  },
  {
    code: 'PE',
    name: 'Peru',
    flag: '🇵🇪',
    region: 'América do Sul',
    taxIdLabel: 'RUC ou DNI',
    taxIdPlaceholder: '20123456789 (Empresa) ou 10123456789',
    taxIdHelp: 'Registro Único de Contribuyentes para registro do recibo',
    stateLabel: 'Departamento / Región',
    statePlaceholder: 'Lima, Arequipa, Cusco...',
    postalCodeLabel: 'Código Postal',
    postalCodePlaceholder: '15046',
    addressPlaceholder: 'Av. República de Panamá 3505, Piso 10',
    cityPlaceholder: 'Lima',
    hasNeighborhoodField: true,
    neighborhoodLabel: 'Distrito',
  },
  {
    code: 'SR',
    name: 'Suriname',
    flag: '🇸🇷',
    region: 'América do Sul',
    taxIdLabel: 'FIN / Tax ID',
    taxIdPlaceholder: '12345678',
    stateLabel: 'Distrikt',
    statePlaceholder: 'Paramaribo, Wanica...',
    postalCodeLabel: 'Postal Code',
    postalCodePlaceholder: '0000',
    addressPlaceholder: 'Waterkant 12',
    cityPlaceholder: 'Paramaribo',
  },
  {
    code: 'UY',
    name: 'Uruguai',
    flag: '🇺🇾',
    region: 'América do Sul',
    taxIdLabel: 'RUT ou Cédula de Identidad',
    taxIdPlaceholder: '211234560018',
    taxIdHelp: 'Registro Único Tributario DGI',
    stateLabel: 'Departamento',
    statePlaceholder: 'Montevideo, Canelones, Maldonado...',
    postalCodeLabel: 'Código Postal',
    postalCodePlaceholder: '11100',
    addressPlaceholder: 'Rincón 487, Piso 3',
    cityPlaceholder: 'Montevideo',
  },
  {
    code: 'VE',
    name: 'Venezuela',
    flag: '🇻🇪',
    region: 'América do Sul',
    taxIdLabel: 'RIF (Registro de Información Fiscal)',
    taxIdPlaceholder: 'J-12345678-9 / V-12345678-9',
    stateLabel: 'Estado',
    statePlaceholder: 'Miranda, Distrito Capital, Carabobo...',
    postalCodeLabel: 'Código Postal',
    postalCodePlaceholder: '1060',
    addressPlaceholder: 'Av. Francisco de Miranda, Torre Cavendes',
    cityPlaceholder: 'Caracas',
  },

  // América do Norte
  {
    code: 'US',
    name: 'Estados Unidos',
    flag: '🇺🇸',
    region: 'América do Norte',
    taxIdLabel: 'EIN ou SSN (Tax ID)',
    taxIdPlaceholder: '12-3456789 (EIN) or 000-00-0000 (SSN)',
    taxIdHelp: 'Employer Identification Number or Social Security Number',
    stateLabel: 'State',
    statePlaceholder: 'CA, NY, TX, FL, WA...',
    postalCodeLabel: 'ZIP Code',
    postalCodePlaceholder: '90210 or 10001-1234',
    addressPlaceholder: '100 Market St, Suite 400',
    cityPlaceholder: 'San Francisco',
  },
  {
    code: 'CA',
    name: 'Canadá',
    flag: '🇨🇦',
    region: 'América do Norte',
    taxIdLabel: 'Business Number / GST/HST #',
    taxIdPlaceholder: '123456789 RT0001',
    taxIdHelp: 'Canada Revenue Agency Business Number',
    stateLabel: 'Province / Territory',
    statePlaceholder: 'Ontario (ON), Quebec (QC), BC...',
    postalCodeLabel: 'Postal Code',
    postalCodePlaceholder: 'M5V 2T6',
    addressPlaceholder: '200 Bay Street, Suite 1500',
    cityPlaceholder: 'Toronto',
  },
  {
    code: 'MX',
    name: 'México',
    flag: '🇲🇽',
    region: 'América do Norte',
    taxIdLabel: 'RFC (Registro Federal de Contribuyentes)',
    taxIdPlaceholder: 'ABC010203XYZ (Persona Moral) o ABCD800101XYZ',
    taxIdHelp: 'Clave de Registro Federal de Contribuyentes del SAT',
    stateLabel: 'Estado',
    statePlaceholder: 'CDMX, Jalisco, Nuevo León...',
    postalCodeLabel: 'Código Postal (C.P.)',
    postalCodePlaceholder: '06600',
    addressPlaceholder: 'Paseo de la Reforma 222, Piso 12',
    cityPlaceholder: 'Ciudad de México',
    hasNeighborhoodField: true,
    neighborhoodLabel: 'Colonia / Alcaldía',
  },

  // América Central
  {
    code: 'BZ',
    name: 'Belize',
    flag: '🇧🇿',
    region: 'América Central',
    taxIdLabel: 'TIN (Tax Identification Number)',
    taxIdPlaceholder: '123456',
    stateLabel: 'District',
    statePlaceholder: 'Belize District, Cayo...',
    postalCodeLabel: 'Postal Code',
    postalCodePlaceholder: '00000',
    addressPlaceholder: 'Albert Street #45',
    cityPlaceholder: 'Belize City',
  },
  {
    code: 'CR',
    name: 'Costa Rica',
    flag: '🇨🇷',
    region: 'América Central',
    taxIdLabel: 'Cédula Jurídica ou Física',
    taxIdPlaceholder: '3-101-123456 (Jurídica) o 1-1234-5678',
    taxIdHelp: 'Identificación tributaria Ministerio de Hacienda',
    stateLabel: 'Provincia',
    statePlaceholder: 'San José, Alajuela, Heredia...',
    postalCodeLabel: 'Código Postal',
    postalCodePlaceholder: '10101',
    addressPlaceholder: 'De la Fuente de la Hispanidad 200m Este',
    cityPlaceholder: 'San José',
    hasNeighborhoodField: true,
    neighborhoodLabel: 'Cantón / Distrito',
  },
  {
    code: 'SV',
    name: 'El Salvador',
    flag: '🇸🇻',
    region: 'América Central',
    taxIdLabel: 'NIT ou NRC',
    taxIdPlaceholder: '0614-010190-102-3 / NRC 123456-7',
    stateLabel: 'Departamento',
    statePlaceholder: 'San Salvador, La Libertad, Santa Ana...',
    postalCodeLabel: 'Código Postal',
    postalCodePlaceholder: '1101',
    addressPlaceholder: 'Boulevard Los Próceres, Edificio Torre Roble',
    cityPlaceholder: 'San Salvador',
  },
  {
    code: 'GT',
    name: 'Guatemala',
    flag: '🇬🇹',
    region: 'América Central',
    taxIdLabel: 'NIT (Número de Identificación Tributaria)',
    taxIdPlaceholder: '1234567-8',
    taxIdHelp: 'NIT registrado en la SAT',
    stateLabel: 'Departamento',
    statePlaceholder: 'Guatemala, Quetzaltenango, Sacatepéquez...',
    postalCodeLabel: 'Código Postal',
    postalCodePlaceholder: '01010',
    addressPlaceholder: 'Avenida La Reforma 9-55, Zona 10, Edificio Reforma 10',
    cityPlaceholder: 'Ciudad de Guatemala',
    hasNeighborhoodField: true,
    neighborhoodLabel: 'Zona',
  },
  {
    code: 'HN',
    name: 'Honduras',
    flag: '🇭🇳',
    region: 'América Central',
    taxIdLabel: 'RTN (Registro Tributario Nacional)',
    taxIdPlaceholder: '08011990123456',
    taxIdHelp: 'RTN emitido por el SAR',
    stateLabel: 'Departamento',
    statePlaceholder: 'Francisco Morazán, Cortés...',
    postalCodeLabel: 'Código Postal',
    postalCodePlaceholder: '11101',
    addressPlaceholder: 'Boulevard Morazán, Torre Alianza',
    cityPlaceholder: 'Tegucigalpa',
  },
  {
    code: 'NI',
    name: 'Nicarágua',
    flag: '🇳🇮',
    region: 'América Central',
    taxIdLabel: 'RUC (Registro Único de Contribuyente)',
    taxIdPlaceholder: 'J0310000123456',
    stateLabel: 'Departamento',
    statePlaceholder: 'Managua, León, Granada...',
    postalCodeLabel: 'Código Postal',
    postalCodePlaceholder: '12066',
    addressPlaceholder: 'Rotonda Jean Paul Genie 500m Abajo',
    cityPlaceholder: 'Managua',
  },
  {
    code: 'PA',
    name: 'Panamá',
    flag: '🇵🇦',
    region: 'América Central',
    taxIdLabel: 'RUC e DV (Dígito Verificador)',
    taxIdPlaceholder: '155678901-2-2020 DV 45',
    taxIdHelp: 'RUC registrado ante la DGI de Panamá',
    stateLabel: 'Provincia',
    statePlaceholder: 'Panamá, Colón, Chiriquí...',
    postalCodeLabel: 'Código Postal',
    postalCodePlaceholder: '0801',
    addressPlaceholder: 'Calle 50, Edificio Global Bank Tower, Piso 25',
    cityPlaceholder: 'Ciudad de Panamá',
    hasNeighborhoodField: true,
    neighborhoodLabel: 'Corregimiento',
  },

  // Caribe
  {
    code: 'AG',
    name: 'Antígua e Barbuda',
    flag: '🇦🇬',
    region: 'Caribe',
    taxIdLabel: 'TIN / ABST Number',
    taxIdPlaceholder: '12345678',
    stateLabel: 'Parish',
    statePlaceholder: 'Saint John, Saint Peter...',
    postalCodeLabel: 'Postal Code',
    postalCodePlaceholder: '00000',
    addressPlaceholder: 'High Street #10',
    cityPlaceholder: "St. John's",
  },
  {
    code: 'BS',
    name: 'Bahamas',
    flag: '🇧🇸',
    region: 'Caribe',
    taxIdLabel: 'TIN / NIB Number',
    taxIdPlaceholder: '10012345',
    stateLabel: 'Island / District',
    statePlaceholder: 'New Providence, Grand Bahama...',
    postalCodeLabel: 'Postal Code',
    postalCodePlaceholder: 'N-4833',
    addressPlaceholder: 'East Bay Street, Ocean Centre',
    cityPlaceholder: 'Nassau',
  },
  {
    code: 'BB',
    name: 'Barbados',
    flag: '🇧🇧',
    region: 'Caribe',
    taxIdLabel: 'TAMIS / TIN Number',
    taxIdPlaceholder: '1234567890',
    stateLabel: 'Parish',
    statePlaceholder: 'Saint Michael, Christ Church...',
    postalCodeLabel: 'Postal Code',
    postalCodePlaceholder: 'BB11000',
    addressPlaceholder: 'Broad Street #24',
    cityPlaceholder: 'Bridgetown',
  },
  {
    code: 'CU',
    name: 'Cuba',
    flag: '🇨🇺',
    region: 'Caribe',
    taxIdLabel: 'NIT / Código ONAT',
    taxIdPlaceholder: '12345678901',
    stateLabel: 'Provincia',
    statePlaceholder: 'La Habana, Santiago de Cuba...',
    postalCodeLabel: 'Código Postal',
    postalCodePlaceholder: '10400',
    addressPlaceholder: 'Calle 23 esq. L, Vedado',
    cityPlaceholder: 'La Habana',
  },
  {
    code: 'DM',
    name: 'Dominica',
    flag: '🇩🇲',
    region: 'Caribe',
    taxIdLabel: 'TIN (Tax Identification Number)',
    taxIdPlaceholder: '123456',
    stateLabel: 'Parish',
    statePlaceholder: 'Saint George, Saint Paul...',
    postalCodeLabel: 'Postal Code',
    postalCodePlaceholder: '00109',
    addressPlaceholder: 'Great George Street',
    cityPlaceholder: 'Roseau',
  },
  {
    code: 'GD',
    name: 'Granada',
    flag: '🇬🇩',
    region: 'Caribe',
    taxIdLabel: 'TIN',
    taxIdPlaceholder: '123456',
    stateLabel: 'Parish',
    statePlaceholder: 'Saint George, Saint David...',
    postalCodeLabel: 'Postal Code',
    postalCodePlaceholder: '00000',
    addressPlaceholder: 'Grand Anse Commercial Centre',
    cityPlaceholder: "St. George's",
  },
  {
    code: 'HT',
    name: 'Haiti',
    flag: '🇭🇹',
    region: 'Caribe',
    taxIdLabel: 'NIF (Numéro d’Immatriculation Fiscale)',
    taxIdPlaceholder: '000-123-456-7',
    stateLabel: 'Département',
    statePlaceholder: 'Ouest, Nord, Artibonite...',
    postalCodeLabel: 'Code Postal',
    postalCodePlaceholder: 'HT6110',
    addressPlaceholder: 'Rue Pan Américaine, Pétion-Ville',
    cityPlaceholder: 'Port-au-Prince',
  },
  {
    code: 'JM',
    name: 'Jamaica',
    flag: '🇯🇲',
    region: 'Caribe',
    taxIdLabel: 'TRN (Taxpayer Registration Number)',
    taxIdPlaceholder: '123-456-789',
    taxIdHelp: '9-digit Taxpayer Registration Number',
    stateLabel: 'Parish',
    statePlaceholder: 'Kingston, Saint Andrew, Saint James...',
    postalCodeLabel: 'Postal Code',
    postalCodePlaceholder: 'JMAKN05',
    addressPlaceholder: 'Knutsford Boulevard, New Kingston',
    cityPlaceholder: 'Kingston',
  },
  {
    code: 'PR',
    name: 'Porto Rico',
    flag: '🇵🇷',
    region: 'Caribe',
    taxIdLabel: 'EIN ou Seguro Social (Hacienda)',
    taxIdPlaceholder: '66-1234567 o 000-00-0000',
    taxIdHelp: 'Número de Identificación Patronal o Registro de Comerciante',
    stateLabel: 'Municipio',
    statePlaceholder: 'San Juan, Guaynabo, Bayamón, Ponce...',
    postalCodeLabel: 'Código Postal (ZIP)',
    postalCodePlaceholder: '00907',
    addressPlaceholder: 'Av. Ponce de León 268, Suite 1000',
    cityPlaceholder: 'San Juan',
    hasNeighborhoodField: true,
    neighborhoodLabel: 'Urbanización / Barrio',
  },
  {
    code: 'DO',
    name: 'República Dominicana',
    flag: '🇩🇴',
    region: 'Caribe',
    taxIdLabel: 'RNC ou Cédula de Identidad',
    taxIdPlaceholder: '1-31-12345-6 (RNC) o 001-1234567-8',
    taxIdHelp: 'Registro Nacional del Contribuyente para facturación DGII',
    stateLabel: 'Provincia / Distrito',
    statePlaceholder: 'Distrito Nacional, Santo Domingo, Santiago...',
    postalCodeLabel: 'Código Postal',
    postalCodePlaceholder: '10108',
    addressPlaceholder: 'Av. Winston Churchill, Torre Acrópolis, Piso 15',
    cityPlaceholder: 'Santo Domingo',
    hasNeighborhoodField: true,
    neighborhoodLabel: 'Sector',
  },
  {
    code: 'LC',
    name: 'Santa Lúcia',
    flag: '🇱🇨',
    region: 'Caribe',
    taxIdLabel: 'TIN',
    taxIdPlaceholder: '12345678',
    stateLabel: 'District',
    statePlaceholder: 'Castries, Gros Islet...',
    postalCodeLabel: 'Postal Code',
    postalCodePlaceholder: 'LC04 101',
    addressPlaceholder: 'Rodney Bay Commercial Center',
    cityPlaceholder: 'Castries',
  },
  {
    code: 'KN',
    name: 'São Cristóvão e Névis',
    flag: '🇰🇳',
    region: 'Caribe',
    taxIdLabel: 'TIN',
    taxIdPlaceholder: '123456',
    stateLabel: 'Parish',
    statePlaceholder: 'Saint George Basseterre...',
    postalCodeLabel: 'Postal Code',
    postalCodePlaceholder: 'KN0101',
    addressPlaceholder: 'Fort Street #15',
    cityPlaceholder: 'Basseterre',
  },
  {
    code: 'VC',
    name: 'São Vicente e Granadinas',
    flag: '🇻🇨',
    region: 'Caribe',
    taxIdLabel: 'TIN',
    taxIdPlaceholder: '123456',
    stateLabel: 'Parish',
    statePlaceholder: 'Saint George, Charlotte...',
    postalCodeLabel: 'Postal Code',
    postalCodePlaceholder: 'VC0100',
    addressPlaceholder: 'Granby Street',
    cityPlaceholder: 'Kingstown',
  },
  {
    code: 'TT',
    name: 'Trinidad e Tobago',
    flag: '🇹🇹',
    region: 'Caribe',
    taxIdLabel: 'BIR Number (Board of Inland Revenue)',
    taxIdPlaceholder: '123456789-0',
    stateLabel: 'Region / Borough',
    statePlaceholder: 'Port of Spain, San Fernando, Chaguanas...',
    postalCodeLabel: 'Postal Code',
    postalCodePlaceholder: '000000',
    addressPlaceholder: 'Independence Square #40',
    cityPlaceholder: 'Port of Spain',
  },
];

export const getCountryConfig = (countryNameOrCode: string): CountryBillingConfig => {
  const normalized = countryNameOrCode?.trim().toLowerCase();
  const match = AMERICAS_COUNTRIES.find(
    (c) =>
      c.code.toLowerCase() === normalized ||
      c.name.toLowerCase() === normalized ||
      (normalized === 'brazil' && c.code === 'BR') ||
      (normalized === 'united states' && c.code === 'US') ||
      (normalized === 'usa' && c.code === 'US') ||
      (normalized === 'mexico' && c.code === 'MX') ||
      (normalized === 'colombia' && c.code === 'CO') ||
      (normalized === 'panama' && c.code === 'PA') ||
      (normalized === 'peru' && c.code === 'PE')
  );

  return match || AMERICAS_COUNTRIES[0]; // default to Brasil
};

export const COUNTRY_NAMES_I18N: Record<string, { pt: string; es: string; en: string }> = {
  BR: { pt: 'Brasil', es: 'Brasil', en: 'Brazil' },
  AR: { pt: 'Argentina', es: 'Argentina', en: 'Argentina' },
  BO: { pt: 'Bolívia', es: 'Bolivia', en: 'Bolivia' },
  CL: { pt: 'Chile', es: 'Chile', en: 'Chile' },
  CO: { pt: 'Colômbia', es: 'Colombia', en: 'Colombia' },
  EC: { pt: 'Equador', es: 'Ecuador', en: 'Ecuador' },
  GY: { pt: 'Guiana', es: 'Guyana', en: 'Guyana' },
  PY: { pt: 'Paraguai', es: 'Paraguay', en: 'Paraguay' },
  PE: { pt: 'Peru', es: 'Perú', en: 'Peru' },
  SR: { pt: 'Suriname', es: 'Surinam', en: 'Suriname' },
  UY: { pt: 'Uruguai', es: 'Uruguay', en: 'Uruguay' },
  VE: { pt: 'Venezuela', es: 'Venezuela', en: 'Venezuela' },
  US: { pt: 'Estados Unidos', es: 'Estados Unidos', en: 'United States' },
  MX: { pt: 'México', es: 'México', en: 'Mexico' },
  CA: { pt: 'Canadá', es: 'Canadá', en: 'Canada' },
  BZ: { pt: 'Belize', es: 'Belice', en: 'Belize' },
  CR: { pt: 'Costa Rica', es: 'Costa Rica', en: 'Costa Rica' },
  PA: { pt: 'Panamá', es: 'Panamá', en: 'Panama' },
  GT: { pt: 'Guatemala', es: 'Guatemala', en: 'Guatemala' },
  HN: { pt: 'Honduras', es: 'Honduras', en: 'Honduras' },
  SV: { pt: 'El Salvador', es: 'El Salvador', en: 'El Salvador' },
  NI: { pt: 'Nicarágua', es: 'Nicaragua', en: 'Nicaragua' },
  DO: { pt: 'República Dominicana', es: 'República Dominicana', en: 'Dominican Republic' },
  PR: { pt: 'Porto Rico', es: 'Puerto Rico', en: 'Puerto Rico' },
  JM: { pt: 'Jamaica', es: 'Jamaica', en: 'Jamaica' },
  TT: { pt: 'Trinidad e Tobago', es: 'Trinidad y Tobago', en: 'Trinidad and Tobago' },
  BS: { pt: 'Bahamas', es: 'Bahamas', en: 'Bahamas' },
  BB: { pt: 'Barbados', es: 'Barbados', en: 'Barbados' },
  AG: { pt: 'Antígua e Barbuda', es: 'Antigua y Barbuda', en: 'Antigua and Barbuda' },
  CU: { pt: 'Cuba', es: 'Cuba', en: 'Cuba' },
  DM: { pt: 'Dominica', es: 'Dominica', en: 'Dominica' },
  GD: { pt: 'Granada', es: 'Granada', en: 'Grenada' },
  HT: { pt: 'Haiti', es: 'Haití', en: 'Haiti' },
  LC: { pt: 'Santa Lúcia', es: 'Santa Lucía', en: 'Saint Lucia' },
  KN: { pt: 'São Cristóvão e Neves', es: 'San Cristóbal y Nieves', en: 'Saint Kitts and Nevis' },
  VC: { pt: 'São Vicente e Granadinas', es: 'San Vicente y las Granadinas', en: 'Saint Vincent and the Grenadines' },
};

export const TAX_ID_I18N: Record<string, { pt: string; es: string; en: string }> = {
  BR: { pt: 'CNPJ ou CPF', es: 'CNPJ o CPF', en: 'CNPJ or CPF' },
  AR: { pt: 'CUIT ou CUIL', es: 'CUIT o CUIL', en: 'CUIT or CUIL (Tax ID)' },
  BO: { pt: 'NIT (Identificação Tributária)', es: 'NIT (Identificación Tributaria)', en: 'NIT (Tax ID)' },
  CL: { pt: 'RUT (Identificação Tributária)', es: 'RUT (Rol Único Tributario)', en: 'RUT (Tax ID)' },
  CO: { pt: 'NIT ou Cédula de Cidadania', es: 'NIT o Cédula de Ciudadanía', en: 'NIT or Citizen ID' },
  EC: { pt: 'RUC ou Cédula de Identidade', es: 'RUC o Cédula de Identidad', en: 'RUC or Citizen ID' },
  GY: { pt: 'TIN (Identificação Fiscal)', es: 'TIN (Identificación Fiscal)', en: 'TIN (Taxpayer ID)' },
  PY: { pt: 'RUC (Identificação de Contribuinte)', es: 'RUC (Registro de Contribuyentes)', en: 'RUC (Tax ID)' },
  PE: { pt: 'RUC ou DNI', es: 'RUC o DNI', en: 'RUC or National ID (DNI)' },
  SR: { pt: 'FIN (Identificação Fiscal)', es: 'FIN (Identificación Fiscal)', en: 'FIN / Tax ID' },
  UY: { pt: 'RUT ou Cédula de Identidade', es: 'RUT o Cédula de Identidad', en: 'RUT or Citizen ID' },
  VE: { pt: 'RIF (Identificação Fiscal)', es: 'RIF (Registro de Información Fiscal)', en: 'RIF (Tax ID)' },
  US: { pt: 'EIN ou SSN (Tax ID)', es: 'EIN o SSN (Tax ID)', en: 'EIN or SSN (Tax ID)' },
  CA: { pt: 'Número de Empresa / GST/HST #', es: 'Número de Empresa / GST/HST #', en: 'Business Number / GST/HST #' },
  MX: { pt: 'RFC (Identificação de Contribuinte)', es: 'RFC (Registro Federal de Contribuyentes)', en: 'RFC (Tax ID / SAT)' },
  BZ: { pt: 'TIN (Identificação Fiscal)', es: 'TIN (Identificación Fiscal)', en: 'TIN (Tax ID)' },
  CR: { pt: 'Cédula Jurídica ou Física', es: 'Cédula Jurídica o Física', en: 'Corporate or Personal Tax ID' },
  SV: { pt: 'NIT ou DUI', es: 'NIT o DUI', en: 'NIT or DUI' },
  GT: { pt: 'NIT (Identificação Tributária)', es: 'NIT (Identificación Tributaria)', en: 'NIT (Tax ID)' },
  HN: { pt: 'RTN (Identificação Tributária)', es: 'RTN (Registro Tributario Nacional)', en: 'RTN (Tax ID)' },
  NI: { pt: 'RUC (Identificação Tributária)', es: 'RUC (Registro de Contribuyentes)', en: 'RUC (Tax ID)' },
  PA: { pt: 'RUC (Identificação de Contribuinte)', es: 'RUC (Registro Único de Contribuyente)', en: 'RUC (Tax ID)' },
  DO: { pt: 'RNC ou Cédula', es: 'RNC o Cédula', en: 'RNC or National ID' },
  PR: { pt: 'EIN ou Seguro Social (Tax ID)', es: 'EIN o Seguro Social (Tax ID)', en: 'EIN or Social Security (Tax ID)' },
  JM: { pt: 'TRN (Registro de Contribuinte)', es: 'TRN (Registro de Contribuyente)', en: 'TRN (Taxpayer Registration Number)' },
  TT: { pt: 'Número BIR', es: 'Número BIR', en: 'BIR Number' },
  BS: { pt: 'TIN (Identificação Fiscal)', es: 'TIN (Identificación Fiscal)', en: 'TIN (Tax ID)' },
  BB: { pt: 'TAMIS TIN', es: 'TAMIS TIN', en: 'TAMIS TIN' },
  AG: { pt: 'ABSTIN / TIN', es: 'ABSTIN / TIN', en: 'ABSTIN / TIN' },
  CU: { pt: 'NIT (Identificação Tributária)', es: 'NIT (Identificación Tributaria)', en: 'NIT (Tax ID)' },
  DM: { pt: 'TIN (Identificação Fiscal)', es: 'TIN (Identificación Fiscal)', en: 'TIN (Tax ID)' },
  GD: { pt: 'TIN (Identificação Fiscal)', es: 'TIN (Identificación Fiscal)', en: 'TIN (Tax ID)' },
  HT: { pt: 'NIF (Identificação Fiscal)', es: 'NIF (Identificación Fiscal)', en: 'NIF (Tax ID)' },
  LC: { pt: 'NIC / TIN', es: 'NIC / TIN', en: 'NIC / TIN' },
  KN: { pt: 'SKN TIN', es: 'SKN TIN', en: 'SKN TIN' },
  VC: { pt: 'TIN (Identificação Fiscal)', es: 'TIN (Identificación Fiscal)', en: 'TIN (Tax ID)' },
};

export const STATE_LABELS_I18N: Record<string, { pt: string; es: string; en: string }> = {
  BR: { pt: 'Estado (UF)', es: 'Estado (UF)', en: 'State (UF)' },
  US: { pt: 'Estado', es: 'Estado', en: 'State' },
  CA: { pt: 'Província / Território', es: 'Provincia / Territorio', en: 'Province / Territory' },
  AR: { pt: 'Província', es: 'Provincia', en: 'Province' },
  CO: { pt: 'Departamento', es: 'Departamento', en: 'Department' },
  BO: { pt: 'Departamento', es: 'Departamento', en: 'Department' },
  UY: { pt: 'Departamento', es: 'Departamento', en: 'Department' },
  PY: { pt: 'Departamento', es: 'Departamento', en: 'Department' },
  CL: { pt: 'Região', es: 'Región', en: 'Region' },
  MX: { pt: 'Estado', es: 'Estado', en: 'State' },
  EC: { pt: 'Província', es: 'Provincia', en: 'Province' },
  PE: { pt: 'Departamento / Região', es: 'Departamento / Región', en: 'Department / Region' },
  VE: { pt: 'Estado', es: 'Estado', en: 'State' },
  PA: { pt: 'Província', es: 'Provincia', en: 'Province' },
  CR: { pt: 'Província', es: 'Provincia', en: 'Province' },
  GT: { pt: 'Departamento', es: 'Departamento', en: 'Department' },
  HN: { pt: 'Departamento', es: 'Departamento', en: 'Department' },
  SV: { pt: 'Departamento', es: 'Departamento', en: 'Department' },
  NI: { pt: 'Departamento', es: 'Departamento', en: 'Department' },
  DO: { pt: 'Província', es: 'Provincia', en: 'Province' },
};

export const POSTAL_CODE_LABELS_I18N: Record<string, { pt: string; es: string; en: string }> = {
  BR: { pt: 'CEP', es: 'Código Postal (CEP)', en: 'Postal Code (CEP)' },
  US: { pt: 'ZIP Code', es: 'Código Postal (ZIP)', en: 'ZIP Code' },
  CA: { pt: 'Código Postal', es: 'Código Postal', en: 'Postal Code' },
  AR: { pt: 'Código Postal (CPA)', es: 'Código Postal (CPA)', en: 'Postal Code (CPA)' },
  MX: { pt: 'Código Postal (C.P.)', es: 'Código Postal (C.P.)', en: 'Postal Code (ZIP)' },
  CO: { pt: 'Código Postal', es: 'Código Postal', en: 'Postal Code' },
  CL: { pt: 'Código Postal', es: 'Código Postal', en: 'Postal Code' },
  PE: { pt: 'Código Postal', es: 'Código Postal', en: 'Postal Code' },
};

export const NEIGHBORHOOD_LABELS_I18N: Record<string, { pt: string; es: string; en: string }> = {
  BR: { pt: 'Bairro', es: 'Barrio', en: 'Neighborhood' },
  CO: { pt: 'Bairro / Setor', es: 'Barrio / Localidad', en: 'Neighborhood / District' },
  MX: { pt: 'Bairro / Colônia', es: 'Colonia / Alcaldía', en: 'Neighborhood / District' },
  CL: { pt: 'Comuna / Bairro', es: 'Comuna', en: 'Commune / District' },
  PE: { pt: 'Distrito', es: 'Distrito', en: 'District' },
  AR: { pt: 'Bairro', es: 'Barrio', en: 'Neighborhood / District' },
  US: { pt: 'Bairro / Distrito', es: 'Distrito / Vecindario', en: 'District / Neighborhood' },
};

export function getLocalizedCountryName(country: CountryBillingConfig, lang?: string): string {
  const custom = COUNTRY_NAMES_I18N[country.code];
  if (custom) {
    const l = (lang || 'pt').toLowerCase().startsWith('es')
      ? 'es'
      : (lang || 'pt').toLowerCase().startsWith('en')
      ? 'en'
      : 'pt';
    return custom[l] || custom.pt || country.name;
  }
  return country.name;
}

export function getLocalizedTaxIdLabel(country: CountryBillingConfig, lang?: string): string {
  const l = (lang || 'pt').toLowerCase().startsWith('es')
    ? 'es'
    : (lang || 'pt').toLowerCase().startsWith('en')
    ? 'en'
    : 'pt';

  const custom = TAX_ID_I18N[country.code];
  if (custom) {
    return custom[l] || custom.pt || country.taxIdLabel;
  }

  if (l === 'es') {
    return country.taxIdLabel.replace(/\bou\b/g, 'o');
  }
  if (l === 'en') {
    return country.taxIdLabel.replace(/\bou\b/g, 'or');
  }
  return country.taxIdLabel;
}

export function getLocalizedStateLabel(country: CountryBillingConfig, lang?: string): string {
  const l = (lang || 'pt').toLowerCase().startsWith('es')
    ? 'es'
    : (lang || 'pt').toLowerCase().startsWith('en')
    ? 'en'
    : 'pt';

  const custom = STATE_LABELS_I18N[country.code];
  if (custom) {
    return custom[l] || custom.pt;
  }

  if (l === 'en') {
    if (country.code === 'US') return 'State';
    if (country.code === 'CA') return 'Province / Territory';
    if (country.code === 'BR') return 'State (UF)';
    return 'State / Province';
  }

  if (l === 'es') {
    if (country.code === 'BR') return 'Estado (UF)';
    if (country.code === 'AR') return 'Provincia';
    if (country.code === 'CO' || country.code === 'BO') return 'Departamento';
    if (country.code === 'CL') return 'Región';
    if (country.code === 'MX') return 'Estado';
    return country.stateLabel || 'Estado / Provincia';
  }

  return country.stateLabel || 'Estado (UF)';
}

export function getLocalizedPostalCodeLabel(country: CountryBillingConfig, lang?: string): string {
  const l = (lang || 'pt').toLowerCase().startsWith('es')
    ? 'es'
    : (lang || 'pt').toLowerCase().startsWith('en')
    ? 'en'
    : 'pt';

  const custom = POSTAL_CODE_LABELS_I18N[country.code];
  if (custom) {
    return custom[l] || custom.pt;
  }

  if (l === 'en') {
    if (country.code === 'US') return 'ZIP Code';
    if (country.code === 'BR') return 'Postal Code (CEP)';
    return 'Postal Code';
  }

  if (l === 'es') {
    if (country.code === 'BR') return 'Código Postal (CEP)';
    if (country.code === 'AR') return 'Código Postal (CPA)';
    if (country.code === 'US') return 'Código Postal (ZIP)';
    return 'Código Postal';
  }

  return country.postalCodeLabel || 'CEP / Código Postal';
}

export function getLocalizedNeighborhoodLabel(country: CountryBillingConfig, lang?: string): string {
  const l = (lang || 'pt').toLowerCase().startsWith('es')
    ? 'es'
    : (lang || 'pt').toLowerCase().startsWith('en')
    ? 'en'
    : 'pt';

  const custom = NEIGHBORHOOD_LABELS_I18N[country.code];
  if (custom) {
    return custom[l] || custom.pt;
  }

  if (l === 'en') {
    return 'Neighborhood / District';
  }

  if (l === 'es') {
    if (country.code === 'CL') return 'Comuna';
    if (country.code === 'MX') return 'Colonia / Alcaldía';
    if (country.code === 'CO') return 'Barrio / Localidad';
    return 'Barrio / Distrito';
  }

  return country.neighborhoodLabel || 'Bairro / Distrito';
}

export function getLocalizedTaxIdHelp(country: CountryBillingConfig, lang?: string): string {
  const l = (lang || 'pt').toLowerCase().startsWith('es')
    ? 'es'
    : (lang || 'pt').toLowerCase().startsWith('en')
    ? 'en'
    : 'pt';

  if (l === 'en') {
    return 'For official commercial invoice and tax receipt issuance';
  }
  if (l === 'es') {
    return 'Para emisión de factura oficial y comprobante fiscal';
  }
  return country.taxIdHelp || 'Para emissão de fatura e comprovante fiscal';
}

export function getLocalizedPlaceholders(country: CountryBillingConfig, lang?: string): {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  neighborhood: string;
} {
  const l = (lang || 'pt').toLowerCase().startsWith('es')
    ? 'es'
    : (lang || 'pt').toLowerCase().startsWith('en')
    ? 'en'
    : 'pt';

  // Country specific realistic native samples
  switch (country.code) {
    case 'CO':
      return {
        address: 'Calle 93B #13-45, Of. 402',
        city: 'Bogotá D.C.',
        state: 'Cundinamarca',
        postalCode: '110111',
        neighborhood: 'Chapinero / Chicó',
      };
    case 'BR':
      return {
        address: 'Av. Paulista, 1000 - Andar 5, Sala 502',
        city: 'São Paulo',
        state: 'SP',
        postalCode: '01310-100',
        neighborhood: 'Bela Vista',
      };
    case 'US':
      return {
        address: '100 Market St, Suite 400',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        neighborhood: 'Downtown / Financial District',
      };
    case 'MX':
      return {
        address: 'Paseo de la Reforma 222, Piso 12',
        city: 'Ciudad de México',
        state: 'CDMX',
        postalCode: '06600',
        neighborhood: 'Juárez / Cuauhtémoc',
      };
    case 'AR':
      return {
        address: 'Av. Corrientes 1234, Piso 4',
        city: 'Buenos Aires',
        state: 'Buenos Aires',
        postalCode: 'C1024CWN',
        neighborhood: 'San Nicolás / Recoleta',
      };
    case 'CL':
      return {
        address: 'Av. Apoquindo 4501, Of. 801',
        city: 'Santiago',
        state: 'Región Metropolitana',
        postalCode: '7550000',
        neighborhood: 'Las Condes / Providencia',
      };
    case 'PE':
      return {
        address: 'Av. República de Panamá 3505, Piso 10',
        city: 'Lima',
        state: 'Lima',
        postalCode: '15046',
        neighborhood: 'San Isidro / Miraflores',
      };
    case 'CA':
      return {
        address: '200 Bay Street, Suite 1500',
        city: 'Toronto',
        state: 'ON',
        postalCode: 'M5V 2T6',
        neighborhood: 'Financial District',
      };
    default:
      return {
        address: country.addressPlaceholder || (l === 'en' ? '123 Business Way, Suite 100' : l === 'es' ? 'Av. Principal 123' : 'Av. Principal, 100'),
        city: country.cityPlaceholder || (l === 'en' ? 'City Name' : l === 'es' ? 'Ciudad' : 'Cidade'),
        state: country.statePlaceholder || (l === 'en' ? 'State / Province' : l === 'es' ? 'Provincia / Estado' : 'Estado / UF'),
        postalCode: country.postalCodePlaceholder || '00000',
        neighborhood: country.neighborhoodLabel ? (l === 'en' ? 'Central District' : l === 'es' ? 'Sector Centro' : 'Centro') : '',
      };
  }
}

export function getLocalizedRegion(region: string, lang?: string): string {
  const l = (lang || 'pt').toLowerCase().startsWith('es')
    ? 'es'
    : (lang || 'pt').toLowerCase().startsWith('en')
    ? 'en'
    : 'pt';

  const map: Record<string, { en: string; es: string; pt: string }> = {
    'América do Norte': { en: 'North America', es: 'América del Norte', pt: 'América do Norte' },
    'América Central': { en: 'Central America', es: 'América Central', pt: 'América Central' },
    'América do Sul': { en: 'South America', es: 'América del Sur', pt: 'América do Sul' },
    'Caribe': { en: 'Caribbean', es: 'Caribe', pt: 'Caribe' },
  };

  return map[region]?.[l] || region;
}

