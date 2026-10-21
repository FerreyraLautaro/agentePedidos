export const PRODUCT_CATALOG = Symbol('PRODUCT_CATALOG');

export interface ProductPrice {
  productId: string;
  priceCents: number;
}

export interface ProductCatalog {
  /** Returns only the products that exist; missing ids are simply absent from the result. */
  findPrices(productIds: string[]): Promise<ProductPrice[]>;
}
