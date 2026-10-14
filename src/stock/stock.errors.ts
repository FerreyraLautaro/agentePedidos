export class InsufficientStockError extends Error {
  constructor(readonly productIds: string[]) {
    super(`Insufficient stock for products: ${productIds.join(', ')}`);
    this.name = 'InsufficientStockError';
  }
}
