export interface CurrencyConfig {
  code: string; // BRL, MXN, ARS, COP, CLP, PEN, USD, CAD, etc.
  symbol: string; // R$, $, S/, C$, etc.
  name: string;
  exchangeRateToUsd: number; // 1 USD = X Local Currency
  decimalPlaces: number;
  formatLocale: string;
  defaultTaxRatePercent: number;
  taxName: string; // IVA, ISS/PIS/COFINS, GST/HST, Sales Tax, ITBIS, etc.
  taxExemptWithB2BId: boolean; // If CNPJ, RUT, RFC provided, tax can be calculated or exempted
}

export const SUBSCRIPTION_PRODUCTS = {
  ANNUAL: {
    id: 'prod_VABY5cBRFFv6On',
    basePriceUsd: 1999.99,
    interval: 'year' as const,
    name: 'Plano Ilimitado (Anual)',
  },
  MONTHLY: {
    id: 'prod_V9SfZr6D7rnhzx',
    basePriceUsd: 199.99,
    interval: 'month' as const,
    name: 'Plano Ilimitado (Mensal)',
  },
};

// Backward-compatible alias
export const STRIPE_PRODUCTS = SUBSCRIPTION_PRODUCTS;

export const COUNTRY_CURRENCY_MAP: Record<string, CurrencyConfig> = {
  BR: {
    code: 'BRL',
    symbol: 'R$',
    name: 'Real Brasileiro',
    exchangeRateToUsd: 5.76,
    decimalPlaces: 2,
    formatLocale: 'pt-BR',
    defaultTaxRatePercent: 5.65, // ISS / PIS / COFINS serviços digitais
    taxName: 'ISS / Impostos Locais',
    taxExemptWithB2BId: false,
  },
  AR: {
    code: 'ARS',
    symbol: '$',
    name: 'Peso Argentino',
    exchangeRateToUsd: 1080.0,
    decimalPlaces: 2,
    formatLocale: 'es-AR',
    defaultTaxRatePercent: 21.0,
    taxName: 'IVA Servicios Digitales (21%)',
    taxExemptWithB2BId: true,
  },
  MX: {
    code: 'MXN',
    symbol: '$',
    name: 'Peso Mexicano',
    exchangeRateToUsd: 20.35,
    decimalPlaces: 2,
    formatLocale: 'es-MX',
    defaultTaxRatePercent: 16.0,
    taxName: 'IVA (16%)',
    taxExemptWithB2BId: true,
  },
  CL: {
    code: 'CLP',
    symbol: '$',
    name: 'Peso Chileno',
    exchangeRateToUsd: 955.0,
    decimalPlaces: 0,
    formatLocale: 'es-CL',
    defaultTaxRatePercent: 19.0,
    taxName: 'IVA Servicios Digitales (19%)',
    taxExemptWithB2BId: true,
  },
  CO: {
    code: 'COP',
    symbol: '$',
    name: 'Peso Colombiano',
    exchangeRateToUsd: 4160.0,
    decimalPlaces: 0,
    formatLocale: 'es-CO',
    defaultTaxRatePercent: 19.0,
    taxName: 'IVA (19%)',
    taxExemptWithB2BId: true,
  },
  PE: {
    code: 'PEN',
    symbol: 'S/',
    name: 'Sol Peruano',
    exchangeRateToUsd: 3.76,
    decimalPlaces: 2,
    formatLocale: 'es-PE',
    defaultTaxRatePercent: 18.0,
    taxName: 'IGV (18%)',
    taxExemptWithB2BId: true,
  },
  UY: {
    code: 'UYU',
    symbol: '$U',
    name: 'Peso Uruguaio',
    exchangeRateToUsd: 42.6,
    decimalPlaces: 2,
    formatLocale: 'es-UY',
    defaultTaxRatePercent: 22.0,
    taxName: 'IVA (22%)',
    taxExemptWithB2BId: true,
  },
  PY: {
    code: 'PYG',
    symbol: '₲',
    name: 'Guarani Paraguaio',
    exchangeRateToUsd: 7890.0,
    decimalPlaces: 0,
    formatLocale: 'es-PY',
    defaultTaxRatePercent: 10.0,
    taxName: 'IVA (10%)',
    taxExemptWithB2BId: true,
  },
  BO: {
    code: 'BOB',
    symbol: 'Bs',
    name: 'Boliviano',
    exchangeRateToUsd: 6.91,
    decimalPlaces: 2,
    formatLocale: 'es-BO',
    defaultTaxRatePercent: 13.0,
    taxName: 'IVA (13%)',
    taxExemptWithB2BId: true,
  },
  CR: {
    code: 'CRC',
    symbol: '₡',
    name: 'Colón Costarriquenho',
    exchangeRateToUsd: 512.0,
    decimalPlaces: 2,
    formatLocale: 'es-CR',
    defaultTaxRatePercent: 13.0,
    taxName: 'IVA Transfronterizo (13%)',
    taxExemptWithB2BId: true,
  },
  GT: {
    code: 'GTQ',
    symbol: 'Q',
    name: 'Quetzal Guatemalteco',
    exchangeRateToUsd: 7.72,
    decimalPlaces: 2,
    formatLocale: 'es-GT',
    defaultTaxRatePercent: 12.0,
    taxName: 'IVA (12%)',
    taxExemptWithB2BId: true,
  },
  HN: {
    code: 'HNL',
    symbol: 'L',
    name: 'Lempira Hondurenha',
    exchangeRateToUsd: 25.3,
    decimalPlaces: 2,
    formatLocale: 'es-HN',
    defaultTaxRatePercent: 15.0,
    taxName: 'ISV (15%)',
    taxExemptWithB2BId: true,
  },
  NI: {
    code: 'NIO',
    symbol: 'C$',
    name: 'Córdoba Nicaraguense',
    exchangeRateToUsd: 36.85,
    decimalPlaces: 2,
    formatLocale: 'es-NI',
    defaultTaxRatePercent: 15.0,
    taxName: 'IVA (15%)',
    taxExemptWithB2BId: true,
  },
  DO: {
    code: 'DOP',
    symbol: 'RD$',
    name: 'Peso Dominicano',
    exchangeRateToUsd: 60.8,
    decimalPlaces: 2,
    formatLocale: 'es-DO',
    defaultTaxRatePercent: 18.0,
    taxName: 'ITBIS (18%)',
    taxExemptWithB2BId: true,
  },
  CA: {
    code: 'CAD',
    symbol: 'CA$',
    name: 'Dólar Canadense',
    exchangeRateToUsd: 1.43,
    decimalPlaces: 2,
    formatLocale: 'en-CA',
    defaultTaxRatePercent: 13.0, // Harmonized GST/HST average
    taxName: 'GST / HST (Canadá)',
    taxExemptWithB2BId: true,
  },
  US: {
    code: 'USD',
    symbol: '$',
    name: 'Dólar Americano',
    exchangeRateToUsd: 1.0,
    decimalPlaces: 2,
    formatLocale: 'en-US',
    defaultTaxRatePercent: 0.0, // Software SaaS B2B default
    taxName: 'Sales Tax (EUA)',
    taxExemptWithB2BId: true,
  },
  PA: {
    code: 'USD',
    symbol: '$',
    name: 'Dólar Americano (Panamá)',
    exchangeRateToUsd: 1.0,
    decimalPlaces: 2,
    formatLocale: 'es-PA',
    defaultTaxRatePercent: 7.0,
    taxName: 'ITBMS (7%)',
    taxExemptWithB2BId: true,
  },
  EC: {
    code: 'USD',
    symbol: '$',
    name: 'Dólar Americano (Equador)',
    exchangeRateToUsd: 1.0,
    decimalPlaces: 2,
    formatLocale: 'es-EC',
    defaultTaxRatePercent: 15.0,
    taxName: 'IVA (15%)',
    taxExemptWithB2BId: true,
  },
  SV: {
    code: 'USD',
    symbol: '$',
    name: 'Dólar Americano (El Salvador)',
    exchangeRateToUsd: 1.0,
    decimalPlaces: 2,
    formatLocale: 'es-SV',
    defaultTaxRatePercent: 13.0,
    taxName: 'IVA (13%)',
    taxExemptWithB2BId: true,
  },
  PR: {
    code: 'USD',
    symbol: '$',
    name: 'Dólar Americano (Porto Rico)',
    exchangeRateToUsd: 1.0,
    decimalPlaces: 2,
    formatLocale: 'es-PR',
    defaultTaxRatePercent: 11.5,
    taxName: 'IVU (11.5%)',
    taxExemptWithB2BId: true,
  },
  JM: {
    code: 'JMD',
    symbol: 'J$',
    name: 'Dólar Jamaicano',
    exchangeRateToUsd: 157.5,
    decimalPlaces: 2,
    formatLocale: 'en-JM',
    defaultTaxRatePercent: 15.0,
    taxName: 'GCT (15%)',
    taxExemptWithB2BId: true,
  },
  TT: {
    code: 'TTD',
    symbol: 'TT$',
    name: 'Dólar de Trinidad e Tobago',
    exchangeRateToUsd: 6.78,
    decimalPlaces: 2,
    formatLocale: 'en-TT',
    defaultTaxRatePercent: 12.5,
    taxName: 'VAT (12.5%)',
    taxExemptWithB2BId: true,
  },
  BS: {
    code: 'BSD',
    symbol: 'B$',
    name: 'Dólar Bahamense',
    exchangeRateToUsd: 1.0,
    decimalPlaces: 2,
    formatLocale: 'en-BS',
    defaultTaxRatePercent: 10.0,
    taxName: 'VAT (10%)',
    taxExemptWithB2BId: true,
  },
  BB: {
    code: 'BBD',
    symbol: 'Bds$',
    name: 'Dólar de Barbados',
    exchangeRateToUsd: 2.0,
    decimalPlaces: 2,
    formatLocale: 'en-BB',
    defaultTaxRatePercent: 17.5,
    taxName: 'VAT (17.5%)',
    taxExemptWithB2BId: true,
  },
};

export const getCurrencyForCountry = (countryCode: string): CurrencyConfig => {
  const codeUpper = (countryCode || 'BR').toUpperCase().trim();
  return COUNTRY_CURRENCY_MAP[codeUpper] || COUNTRY_CURRENCY_MAP['BR'] || {
    code: 'USD',
    symbol: '$',
    name: 'Dólar Americano',
    exchangeRateToUsd: 1.0,
    decimalPlaces: 2,
    formatLocale: 'en-US',
    defaultTaxRatePercent: 0,
    taxName: 'Impostos',
    taxExemptWithB2BId: true,
  };
};

export interface LocalizedPriceCalculation {
  currencyCode: string;
  currencySymbol: string;
  currencyName: string;
  exchangeRate: number;
  basePriceUsd: number;
  rawConvertedAmount: number;
  roundedAmount: number;
  formattedAmount: string;
  formattedPerMonthEquivalent?: string;
  taxRatePercent: number;
  taxName: string;
  taxAmount: number;
  formattedTaxAmount: string;
  totalWithTax: number;
  formattedTotalWithTax: string;
  isB2BExemptOrReverseCharge: boolean;
  productId: string;
  stripeProductId: string; // for backward compatibility
  billingInterval: 'month' | 'year';
}

export function calculateLocalizedPrice(
  basePriceUsd: number,
  countryCode: string,
  interval: 'month' | 'year',
  taxIdNumber: string = '',
  useLocalCurrency: boolean = true
): LocalizedPriceCalculation {
  const countryCurr = getCurrencyForCountry(countryCode);
  const prodId = interval === 'year' ? SUBSCRIPTION_PRODUCTS.ANNUAL.id : SUBSCRIPTION_PRODUCTS.MONTHLY.id;

  if (!useLocalCurrency || countryCurr.code === 'USD') {
    // USD calculations
    const baseTaxRate = countryCurr.code === 'USD' && countryCode !== 'US' ? countryCurr.defaultTaxRatePercent : 0;
    const hasTaxId = taxIdNumber.trim().length >= 6;
    const hasApplicableTax = baseTaxRate > 0;
    const isB2BExempt = hasApplicableTax && hasTaxId && countryCurr.taxExemptWithB2BId;
    const effectiveTaxRate = isB2BExempt ? 0 : baseTaxRate;
    const taxAmount = (basePriceUsd * effectiveTaxRate) / 100;
    const total = basePriceUsd + taxAmount;

    return {
      currencyCode: 'USD',
      currencySymbol: '$',
      currencyName: 'Dólar Americano',
      exchangeRate: 1.0,
      basePriceUsd,
      rawConvertedAmount: basePriceUsd,
      roundedAmount: basePriceUsd,
      formattedAmount: `$ ${basePriceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      formattedPerMonthEquivalent: interval === 'year' ? `$ ${(basePriceUsd / 12).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mês` : undefined,
      taxRatePercent: effectiveTaxRate,
      taxName: countryCurr.taxName,
      taxAmount,
      formattedTaxAmount: `$ ${taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      totalWithTax: total,
      formattedTotalWithTax: `$ ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      isB2BExemptOrReverseCharge: isB2BExempt,
      productId: prodId,
      stripeProductId: prodId,
      billingInterval: interval,
    };
  }

  // Local Currency Calculations
  const rawConverted = basePriceUsd * countryCurr.exchangeRateToUsd;
  // Format rounded according to currency decimal places
  let rounded = rawConverted;
  if (countryCurr.decimalPlaces === 0) {
    rounded = Math.round(rawConverted);
  } else {
    rounded = Number(rawConverted.toFixed(countryCurr.decimalPlaces));
  }

  const baseTaxRate = countryCurr.defaultTaxRatePercent;
  const hasTaxId = taxIdNumber.trim().length >= 6;
  const hasApplicableTax = baseTaxRate > 0;
  const isB2BExempt = hasApplicableTax && hasTaxId && countryCurr.taxExemptWithB2BId;
  const effectiveTaxRate = isB2BExempt ? 0 : baseTaxRate;
  const taxAmount = (rounded * effectiveTaxRate) / 100;
  const total = rounded + taxAmount;

  const formatOpts: Intl.NumberFormatOptions = {
    minimumFractionDigits: countryCurr.decimalPlaces,
    maximumFractionDigits: countryCurr.decimalPlaces,
  };

  const formattedAmount = `${countryCurr.symbol} ${rounded.toLocaleString(countryCurr.formatLocale, formatOpts)}`;
  const formattedPerMonthEquivalent = interval === 'year'
    ? `${countryCurr.symbol} ${(rounded / 12).toLocaleString(countryCurr.formatLocale, formatOpts)}/mês`
    : undefined;

  const formattedTaxAmount = `${countryCurr.symbol} ${taxAmount.toLocaleString(countryCurr.formatLocale, formatOpts)}`;
  const formattedTotalWithTax = `${countryCurr.symbol} ${total.toLocaleString(countryCurr.formatLocale, formatOpts)}`;

  return {
    currencyCode: countryCurr.code,
    currencySymbol: countryCurr.symbol,
    currencyName: countryCurr.name,
    exchangeRate: countryCurr.exchangeRateToUsd,
    basePriceUsd,
    rawConvertedAmount: rawConverted,
    roundedAmount: rounded,
    formattedAmount,
    formattedPerMonthEquivalent,
    taxRatePercent: effectiveTaxRate,
    taxName: countryCurr.taxName,
    taxAmount,
    formattedTaxAmount,
    totalWithTax: total,
    formattedTotalWithTax,
    isB2BExemptOrReverseCharge: isB2BExempt,
    productId: prodId,
    stripeProductId: prodId,
    billingInterval: interval,
  };
}
