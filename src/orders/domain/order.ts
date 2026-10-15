export type OrderStatus = 'draft' | 'confirmed' | 'cancelled';

export interface OrderLine {
  productId: string;
  quantity: number;
  unitPriceCents: number;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  lines: OrderLine[];
  idempotencyKey: string | null;
}

export class OrderRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrderRuleError';
  }
}
export class OrderNotFoundError extends Error {
  constructor(readonly orderId: string) {
    super(`Order ${orderId} not found`);
    this.name = 'OrderNotFoundError';
  }
}

export class IdempotencyKeyReuseError extends Error {
  constructor(readonly idempotencyKey: string) {
    super(`Idempotency key ${idempotencyKey} was already used for another order`);
    this.name = 'IdempotencyKeyReuseError';
  }
}


const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  draft: ['confirmed', 'cancelled'],
  confirmed: ['cancelled'],
  cancelled: [],
};

export function transition(order: Order, to: OrderStatus): Order {
  if (!ALLOWED_TRANSITIONS[order.status].includes(to)) {
    throw new OrderRuleError(`Cannot move order ${order.id} from ${order.status} to ${to}`);
  }
  if (to === 'confirmed' && order.lines.length === 0) {
    throw new OrderRuleError(`Cannot confirm order ${order.id} because it is empty`);
  }
  return { ...order, status: to };
}

export function addLine(order: Order, line: OrderLine): Order {
  assertDraft(order);
  if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
    throw new OrderRuleError('Quantity must be a positive integer');
  }
  const exists = order.lines.some((l) => l.productId === line.productId);
  const lines = exists
    ? order.lines.map((l) =>
        l.productId === line.productId
          ? { ...l, quantity: l.quantity + line.quantity, unitPriceCents: line.unitPriceCents }
          : l,
      )
    : [...order.lines, line];
  return { ...order, lines };
}

export function totalCents(order: Order): number {
  return order.lines.reduce((sum, line) => sum + line.quantity * line.unitPriceCents, 0);
}

function assertDraft(order: Order): void {
  if (order.status !== 'draft') {
    throw new OrderRuleError(`Order ${order.id} is ${order.status} and can no longer be modified`);
  }
}
