import { OrderStatus, UserRole } from '@prisma/client';

export type OrderActor = 'system' | UserRole;

interface AllowedTransition {
  to: OrderStatus;
  actors: OrderActor[];
}

// Encodes the Order lifecycle from CONTEXT.md:
// pending ──(system)──► confirmed
// confirmed ──(staff/admin)──► processing ──► shipped ──► delivered
// pending/confirmed ──(user/staff/admin)──► cancelled ──(staff/admin)──► refunded
const TRANSITION_MAP: Record<OrderStatus, AllowedTransition[]> = {
  [OrderStatus.pending]: [
    { to: OrderStatus.confirmed, actors: ['system'] },
    { to: OrderStatus.cancelled, actors: [UserRole.user, UserRole.staff, UserRole.admin] },
  ],
  [OrderStatus.confirmed]: [
    { to: OrderStatus.processing, actors: [UserRole.staff, UserRole.admin] },
    { to: OrderStatus.cancelled, actors: [UserRole.user, UserRole.staff, UserRole.admin] },
  ],
  [OrderStatus.processing]: [
    { to: OrderStatus.shipped, actors: [UserRole.staff, UserRole.admin] },
    { to: OrderStatus.cancelled, actors: [UserRole.staff, UserRole.admin] },
  ],
  [OrderStatus.shipped]: [{ to: OrderStatus.delivered, actors: [UserRole.staff, UserRole.admin] }],
  [OrderStatus.delivered]: [],
  [OrderStatus.cancelled]: [{ to: OrderStatus.refunded, actors: [UserRole.staff, UserRole.admin] }],
  [OrderStatus.refunded]: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus, actor: OrderActor): boolean {
  return TRANSITION_MAP[from].some((t) => t.to === to && t.actors.includes(actor));
}

export function allowedTransitions(from: OrderStatus, actor: OrderActor): OrderStatus[] {
  return TRANSITION_MAP[from].filter((t) => t.actors.includes(actor)).map((t) => t.to);
}
