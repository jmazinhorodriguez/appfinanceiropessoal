import { PortfolioAsset, InvestmentTransaction, Dividend } from '@/types/database';

export function analyzePortfolio(assets: PortfolioAsset[], transactions: InvestmentTransaction[], dividends: Dividend[]) {
  const totalCost = assets.reduce((acc, a) => acc + (a.quantity * a.avg_price), 0);
  const totalValue = assets.reduce((acc, a) => acc + (a.quantity * (a.current_price || a.avg_price)), 0);
  const totalProfit = totalValue - totalCost;
  const totalReturnPct = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

  const byAssetType = assets.reduce((acc: Record<string, number>, a) => {
    acc[a.asset_type] = (acc[a.asset_type] || 0) + (a.quantity * (a.current_price || a.avg_price));
    return acc;
  }, {});

  const bySector = assets.reduce((acc: Record<string, number>, a) => {
    const s = a.sector || 'Outros';
    acc[s] = (acc[s] || 0) + (a.quantity * (a.current_price || a.avg_price));
    return acc;
  }, {});

  const byExchange = assets.reduce((acc: Record<string, number>, a) => {
    acc[a.exchange] = (acc[a.exchange] || 0) + (a.quantity * (a.current_price || a.avg_price));
    return acc;
  }, {});

  const totalDividends = dividends.reduce((acc, d) => acc + (d.net_amount || 0), 0);
  const dividendYield = totalValue > 0 ? (totalDividends / totalValue) * 100 : 0;

  // Hopfield Network Mock: detect recurring market patterns
  const marketPatternDetected = "Ação de ouro (GOLD11) está negativamente correlacionada com Ibovespa recente.";

  // Calculate Health Score
  let score = 0;
  if (Object.keys(byAssetType).length >= 3) score += 30; // Diversification by type
  if (byExchange['B3'] && (byExchange['NYSE'] || byExchange['NASDAQ'])) score += 30; // Geopolitical diversification
  if (Object.keys(bySector).length >= 4) score += 20; // Sector diversification
  if (dividendYield >= 2) score += 20; // Income generation
  if (score === 0) score = 10;

  const recommendations = [];
  if (score < 50) recommendations.push("Considere adicionar ETFs ou fundos imobiliários para diversificar exposição.");
  if (!byExchange['NYSE'] && !byExchange['NASDAQ']) recommendations.push("Falta exposição internacional para proteção cambial.");

  return {
    totalValue,
    totalCost,
    totalProfit,
    totalReturnPct,
    byAssetType,
    bySector,
    byExchange,
    dividendYield,
    score,
    recommendations,
    marketPatternDetected
  };
}
