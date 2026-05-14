import { OrderStatus, UserRole } from '@prisma/client';
import { canTransition, allowedTransitions } from './order-transitions.util';

describe('canTransition', () => {
  it('system can confirm a pending order', () => {
    expect(canTransition(OrderStatus.pending, OrderStatus.confirmed, 'system')).toBe(true);
  });

  it('user cannot confirm an order', () => {
    expect(canTransition(OrderStatus.pending, OrderStatus.confirmed, UserRole.user)).toBe(false);
  });

  it('user can cancel a pending order', () => {
    expect(canTransition(OrderStatus.pending, OrderStatus.cancelled, UserRole.user)).toBe(true);
  });

  it('user can cancel a confirmed order', () => {
    expect(canTransition(OrderStatus.confirmed, OrderStatus.cancelled, UserRole.user)).toBe(true);
  });

  it('user cannot cancel a processing order', () => {
    expect(canTransition(OrderStatus.processing, OrderStatus.cancelled, UserRole.user)).toBe(false);
  });

  it('staff can move confirmed → processing', () => {
    expect(canTransition(OrderStatus.confirmed, OrderStatus.processing, UserRole.staff)).toBe(true);
  });

  it('staff can move processing → shipped', () => {
    expect(canTransition(OrderStatus.processing, OrderStatus.shipped, UserRole.staff)).toBe(true);
  });

  it('staff can move shipped → delivered', () => {
    expect(canTransition(OrderStatus.shipped, OrderStatus.delivered, UserRole.staff)).toBe(true);
  });

  it('nobody can transition from delivered', () => {
    for (const actor of ['system', UserRole.user, UserRole.staff, UserRole.admin] as const) {
      expect(canTransition(OrderStatus.delivered, OrderStatus.cancelled, actor)).toBe(false);
    }
  });

  it('staff can refund a cancelled order', () => {
    expect(canTransition(OrderStatus.cancelled, OrderStatus.refunded, UserRole.staff)).toBe(true);
  });

  it('user cannot refund a cancelled order', () => {
    expect(canTransition(OrderStatus.cancelled, OrderStatus.refunded, UserRole.user)).toBe(false);
  });

  it('nobody can transition from refunded', () => {
    expect(canTransition(OrderStatus.refunded, OrderStatus.cancelled, UserRole.admin)).toBe(false);
  });

  it('skipping steps is not allowed (confirmed → delivered)', () => {
    expect(canTransition(OrderStatus.confirmed, OrderStatus.delivered, UserRole.staff)).toBe(false);
  });
});

describe('allowedTransitions', () => {
  it('staff can only cancel from pending (confirm is system-only)', () => {
    const transitions = allowedTransitions(OrderStatus.pending, UserRole.staff);
    expect(transitions).toEqual([OrderStatus.cancelled]);
  });

  it('system gets only confirmed from pending', () => {
    expect(allowedTransitions(OrderStatus.pending, 'system')).toEqual([OrderStatus.confirmed]);
  });

  it('user gets only cancelled from pending', () => {
    expect(allowedTransitions(OrderStatus.pending, UserRole.user)).toEqual([OrderStatus.cancelled]);
  });

  it('returns empty array from delivered for any actor', () => {
    expect(allowedTransitions(OrderStatus.delivered, UserRole.admin)).toEqual([]);
  });
});
