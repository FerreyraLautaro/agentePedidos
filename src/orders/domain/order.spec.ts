import { describe, expect, it } from 'vitest';
import { addLine, OrderRuleError, totalCents, transition, type Order, type OrderStatus } from './order.js';

function order(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    userId: 'user-1',
    status: 'draft',
    lines: [{ productId: 'yerba', quantity: 1, unitPriceCents: 420000 }],
    idempotencyKey: null,
    ...overrides,
  };
}

describe('Order domain', () => {
  describe('addLine', () => {
    it('adds a new product as a new line', () => {
      const result = addLine(order(), { productId: 'leche', quantity: 2, unitPriceCents: 150000 });
      expect(result.lines).toHaveLength(2);
    });

    it('merges quantities of the same product and refreshes its price', () => {
      const result = addLine(order(), { productId: 'yerba', quantity: 2, unitPriceCents: 450000 });
      expect(result.lines).toEqual([{ productId: 'yerba', quantity: 3, unitPriceCents: 450000 }]);
    });

    it('does not mutate the original order', () => {
      const original = order();
      addLine(original, { productId: 'leche', quantity: 1, unitPriceCents: 150000 });
      expect(original.lines).toHaveLength(1);
    });

    it.each([0, -1, 1.5])('rejects quantity %s', (quantity) => {
      expect(() => addLine(order(), { productId: 'leche', quantity, unitPriceCents: 1 })).toThrow(OrderRuleError);
    });

    it('rejects changes to a confirmed order', () => {
      expect(() =>
        addLine(order({ status: 'confirmed' }), { productId: 'leche', quantity: 1, unitPriceCents: 1 }),
      ).toThrow(OrderRuleError);
    });
  });

  describe('transition', () => {
    it.each<[OrderStatus, OrderStatus]>([
      ['draft', 'confirmed'],
      ['draft', 'cancelled'],
      ['confirmed', 'cancelled'],
    ])('allows %s -> %s', (from, to) => {
      expect(transition(order({ status: from }), to).status).toBe(to);
    });

    it.each<[OrderStatus, OrderStatus]>([
      ['draft', 'draft'],
      ['confirmed', 'draft'],
      ['confirmed', 'confirmed'],
      ['cancelled', 'draft'],
      ['cancelled', 'confirmed'],
      ['cancelled', 'cancelled'],
    ])('rejects %s -> %s', (from, to) => {
      expect(() => transition(order({ status: from }), to)).toThrow(OrderRuleError);
    });

    it('rejects confirming an empty order', () => {
      expect(() => transition(order({ lines: [] }), 'confirmed')).toThrow('empty');
    });
  });

  it('computes the total in cents', () => {
    const result = addLine(order(), { productId: 'leche', quantity: 2, unitPriceCents: 150000 });
    expect(totalCents(result)).toBe(420000 + 2 * 150000);
  });
});
