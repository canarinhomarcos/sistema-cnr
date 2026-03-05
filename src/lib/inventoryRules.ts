export type StockStatus = "OK" | "BAIXO" | "ZERADO" | "INCONSISTENTE";

/**
 * Retorna o status do estoque baseado na quantidade atual e no mínimo configurado.
 */
export function getStockStatus(qtd: number, minimo: number): StockStatus {
  const q = qtd || 0;
  if (q < 0) return "INCONSISTENTE";
  if (q === 0) return "ZERADO";
  if (q <= minimo) return "BAIXO";
  return "OK";
}

/**
 * Retorna a quantidade sugerida para compra baseada no status do estoque.
 */
export function getSuggestedBuyQty(qtd: number, minimo: number): number {
  const status = getStockStatus(qtd, minimo);
  
  switch (status) {
    case "BAIXO":
      return minimo - qtd;
    case "ZERADO":
      return minimo;
    case "INCONSISTENTE":
    case "OK":
    default:
      return 0;
  }
}
