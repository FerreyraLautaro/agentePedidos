import type { ProductCatalog, ProductPrice } from '../product-catalog.port.js';

export class InMemoryProductCatalog implements ProductCatalog {
  private prices = new Map<string, number>();

  constructor(initial: ProductPrice[] = []) {
    for (const { productId, priceCents } of initial) this.prices.set(productId, priceCents);
  }

  async findPrices(productIds: string[]): Promise<ProductPrice[]> {
    return productIds
      .filter((id) => this.prices.has(id))
      .map((id) => ({ productId: id, priceCents: this.prices.get(id) ?? 0 }));
  }
}
