import type { StockLine, StockRepository } from '../stock-repository.port.js';
import { InsufficientStockError } from '../stock.errors.js';

export class InMemoryStockRepository implements StockRepository {
  private quantities = new Map<string, number>();

  constructor(initial: StockLine[] = []) {
    for (const line of initial) this.quantities.set(line.productId, line.quantity);
  }

  async findByProductIds(productIds: string[]): Promise<StockLine[]> {
    return productIds
      .filter((id) => this.quantities.has(id))
      .map((id) => ({ productId: id, quantity: this.quantities.get(id) ?? 0 }));
  }

  async decrement(lines: StockLine[]): Promise<void> {
    const merged = new Map<string, number>();
    for (const line of lines) {
      merged.set(line.productId, (merged.get(line.productId) ?? 0) + line.quantity);
    }
    const missing = [...merged]
      .filter(([id, quantity]) => (this.quantities.get(id) ?? 0) < quantity)
      .map(([id]) => id);
    if (missing.length > 0) throw new InsufficientStockError(missing);
    for (const [id, quantity] of merged) {
      this.quantities.set(id, (this.quantities.get(id) ?? 0) - quantity);
    }
  }

  async increment(lines: StockLine[]): Promise<void> {
    for (const line of lines) {
      this.quantities.set(line.productId, (this.quantities.get(line.productId) ?? 0) + line.quantity);
    }
  }

  snapshot(): Map<string, number> {
    return new Map(this.quantities);
  }

  restore(snapshot: Map<string, number>): void {
    this.quantities = new Map(snapshot);
  }
}
