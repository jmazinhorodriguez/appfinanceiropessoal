// apps/web/lib/utils/order-calculator.ts

export function calculateNewAvgPrice(
  currentQty: number,
  currentAvg: number,
  newQty: number,
  newPrice: number
): number {
  if (currentQty + newQty === 0) return 0;
  return ((currentQty * currentAvg) + (newQty * newPrice)) / (currentQty + newQty);
}

export function calculateTotalCost(qty: number, price: number): number {
  return qty * price;
}

export function estimateFees(total: number, exchange: string = 'B3'): { emolumentos: number; corretagem: number; total: number } {
  // Simulando taxas da B3 (aprox 0.03% total entre liquidação e emolumentos)
  const emolumentos = exchange === 'B3' ? total * 0.0003 : 0;
  const corretagem = 0; // Simulando corretagem zero
  return {
    emolumentos,
    corretagem,
    total: emolumentos + corretagem
  };
}

export function calculateExposureIncrease(currentValue: number, newValue: number): number {
  if (currentValue === 0) return 100;
  return (newValue / currentValue) * 100;
}
