export const ALLOWED_CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Saúde',
  'Educação',
  'Entretenimento',
  'Moradia',
  'Vestuário',
  'Investimentos',
  'Outros'
] as const;

export type Category = (typeof ALLOWED_CATEGORIES)[number];

export const KEYWORD_MAP: Record<string, Category> = {
  // Alimentação
  'IFOOD': 'Alimentação',
  'UBER EATS': 'Alimentação',
  'RESTAURANTE': 'Alimentação',
  'MERCADO': 'Alimentação',
  'SUPERMERCADO': 'Alimentação',
  'PADARIA': 'Alimentação',
  'CONVENIENCIA': 'Alimentação',
  'LANCHONETE': 'Alimentação',
  'MCDONALDS': 'Alimentação',
  'BURGER KING': 'Alimentação',
  'CAFETERIA': 'Alimentação',
  'PAO DE ACUCAR': 'Alimentação',
  'CARREFOUR': 'Alimentação',
  'ASSAI': 'Alimentação',
  'HORTIFRUTI': 'Alimentação',

  // Transporte
  'UBER': 'Transporte',
  '99APP': 'Transporte',
  'POSTO': 'Transporte',
  'COMBUSTIVEL': 'Transporte',
  'SHELL': 'Transporte',
  'IPIRANGA': 'Transporte',
  'PEDAGIO': 'Transporte',
  'ESTACIONAMENTO': 'Transporte',
  'METRO': 'Transporte',
  'CPTM': 'Transporte',
  'LATAM': 'Transporte',
  'GOL': 'Transporte',
  'AZUL': 'Transporte',
  'LOCALIZA': 'Transporte',

  // Saúde
  'FARMACIA': 'Saúde',
  'DROGASIL': 'Saúde',
  'DROGARAIA': 'Saúde',
  'PAGUEMENOS': 'Saúde',
  'HOSPITAL': 'Saúde',
  'CLINICA': 'Saúde',
  'LABORATORIO': 'Saúde',
  'MEDICO': 'Saúde',
  'DENTISTA': 'Saúde',
  'ACADEMIA': 'Saúde',
  'SMARTFIT': 'Saúde',

  // Educação
  'COLEGIO': 'Educação',
  'ESCOLA': 'Educação',
  'FACULDADE': 'Educação',
  'UNIVERSIDADE': 'Educação',
  'CURSO': 'Educação',
  'LIVRARIA': 'Educação',
  'UDEMY': 'Educação',
  'COURSERA': 'Educação',
  'ALURA': 'Educação',

  // Entretenimento
  'NETFLIX': 'Entretenimento',
  'SPOTIFY': 'Entretenimento',
  'DISNEY PLUS': 'Entretenimento',
  'HBO': 'Entretenimento',
  'CINEMA': 'Entretenimento',
  'SHOW': 'Entretenimento',
  'INGRESSO': 'Entretenimento',
  'STEAM': 'Entretenimento',
  'PLAYSTATION': 'Entretenimento',
  'XBOX': 'Entretenimento',
  'BAR': 'Entretenimento',
  'PUB': 'Entretenimento',

  // Moradia
  'ALUGUEL': 'Moradia',
  'CONDOMINIO': 'Moradia',
  'LUZ': 'Moradia',
  'ENEL': 'Moradia',
  'CPFL': 'Moradia',
  'AGUA': 'Moradia',
  'SABESP': 'Moradia',
  'GAS': 'Moradia',
  'INTERNET': 'Moradia',
  'VIVO': 'Moradia',
  'CLARO': 'Moradia',
  'TIM': 'Moradia',
  'NET': 'Moradia',
  'MOVIES': 'Moradia',

  // Vestuário
  'ZARA': 'Vestuário',
  'RENNER': 'Vestuário',
  'C&A': 'Vestuário',
  'RIACHUELO': 'Vestuário',
  'AREZZO': 'Vestuário',
  'CENTAURO': 'Vestuário',
  'DECATHLON': 'Vestuário',
  'NIKE': 'Vestuário',
  'ADIDAS': 'Vestuário',

  // Investimentos
  'CORRETORA': 'Investimentos',
  'XP INVESTIMENTOS': 'Investimentos',
  'BTG PACTUAL': 'Investimentos',
  'INTER DTVM': 'Investimentos',
  'NU INVEST': 'Investimentos',
  'TESOURO DIRETO': 'Investimentos',
  'B3': 'Investimentos',
  'DIVIDENDOS': 'Investimentos',
  'JUROS S/ CAPITAL': 'Investimentos',
  'RENDIMENTO': 'Investimentos'
};

export function getCategoryByKeyword(description: string): Category {
  const upperDesc = description.toUpperCase();
  for (const [keyword, category] of Object.entries(KEYWORD_MAP)) {
    if (upperDesc.includes(keyword)) {
      return category;
    }
  }
  return 'Outros';
}
