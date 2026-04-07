import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const tickersStr = searchParams.get('tickers');
  
  if (!tickersStr) {
      return NextResponse.json({ prices: {} });
  }

  const tickers = tickersStr.split(',').map(t => t.trim().toUpperCase());
  
  const basePrices: Record<string, number> = {
    'PETR4': 38.50,
    'VALE3': 60.10,
    'ITUB4': 34.20,
    'BBDC4': 13.80,
    'ABEV3': 12.00,
    'WEGE3': 38.90,
    'RENT3': 50.30,
    'MGLU3': 1.80,
    'KNRI11': 160.00,
    'HGLG11': 163.50,
    'XPML11': 118.20,
    'VISC11': 120.40,
    'AAPL': 170.50,
    'MSFT': 420.30,
    'GOOGL': 140.00,
    'AMZN': 175.20,
    'NVDA': 880.50,
    'VNQ': 85.00,
    'O': 52.40,
    'SPG': 145.00
  };

  const currentPrices: Record<string, number> = {};

  tickers.forEach(ticker => {
    const basePrice = basePrices[ticker] || 50.00; // default generic base
    // Variation +/- 0.5%
    const variation = 1 + ((Math.random() - 0.5) * 0.01);
    currentPrices[ticker] = parseFloat((basePrice * variation).toFixed(2));
  });

  return NextResponse.json({ prices: currentPrices });
}
