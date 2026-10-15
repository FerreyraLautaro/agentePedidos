export const STOCK_REPOSITORY = Symbol('STOCK_REPOSITORY');

export interface StockLine {
  productId: string;
  quantity: number;
}

export interface StockRepository {
  findByProductIds(productIds: string[]): Promise<StockLine[]>;
  /** All or nothing. Throws InsufficientStockError listing every product that lacks stock. */
  decrement(lines: StockLine[]): Promise<void>;
  increment(lines: StockLine[]): Promise<void>;
}
