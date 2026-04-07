export const formatBRL = (v: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export const formatUSD = (v: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

export const formatPct = (v: number, decimals = 2): string =>
  `${v >= 0 ? '+' : ''}${v.toFixed(decimals)}%`;

export const formatCompact = (v: number): string => {
  if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000)     return `R$ ${(v / 1_000).toFixed(1)}k`;
  return formatBRL(v);
};

export const formatDate = (d: string): string =>
  new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');

export const formatDateTime = (d: string): string =>
  new Date(d).toLocaleString('pt-BR');
