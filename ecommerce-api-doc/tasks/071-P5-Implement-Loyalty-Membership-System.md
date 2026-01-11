# TASK-00036: Implement Loyalty Points & Membership System

## 📋 Metadata

- **Task ID**: TASK-00036
- **Độ ưu tiên**: 🟡 TRUNG BÌNH (Phase 2/3 - Growth)
- **Phụ thuộc**: TASK-00006 (User Entity), TASK-00010 (Order Entity)
- **Liên quan**: TASK-00037 (Coupon Engine), TASK-00038 (Referral Program)
- **Thời gian ước tính**: 10-12 giờ
- **Phase**: Phase 2-3 - Retention & Growth

---

## 🎯 MỤC TIÊU

Xây dựng hệ thống loyalty points và membership tiers để tăng customer retention, encourage repeat purchases, và reward loyal customers.

### Mục tiêu cụ thể:

1. ✅ Tạo membership tier system (Bronze, Silver, Gold, Platinum)
2. ✅ Points earning system (per purchase, reviews, referrals)
3. ✅ Points spending system (convert to discount)
4. ✅ Points expiration management
5. ✅ Membership benefits (free shipping, extra discounts)
6. ✅ Automatic tier upgrades based on points
7. ✅ Points history tracking

---

## 📊 DATABASE SCHEMA

### MembershipTier Entity

```typescript
@Entity("membership_tiers")
export class MembershipTier {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  @Index()
  name: string; // Bronze, Silver, Gold, Platinum

  @Column()
  @IsInt()
  @Min(0)
  minPoints: number; // Minimum points needed

  @Column({ type: "json" })
  benefits: {
    discountPercent: number; // Extra % discount
    freeShipping: boolean;
    earningMultiplier: number; // Earn points faster (1x, 1.5x, 2x)
    prioritySupport: boolean;
    exclusiveDeals: boolean;
  };

  @Column({ length: 20 })
  color: string; // For UI display (#CD7F32, #C0C0C0, #FFD700, #E5E4E2)

  @Column({ nullable: true, length: 255 })
  icon: string; // Icon URL

  @Column({ type: "text", nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => UserMembership, (membership) => membership.tier)
  userMemberships: UserMembership[];
}
```

### UserMembership Entity

```typescript
@Entity("user_memberships")
@Index(["userId"], { unique: true }) // 1 user = 1 membership
export class UserMembership {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "uuid" })
  @Index()
  userId: string;

  @Column()
  @Index()
  tierId: number;

  @Column({ default: 0 })
  @IsInt()
  @Min(0)
  totalPoints: number; // Lifetime points earned

  @Column({ default: 0 })
  @IsInt()
  @Min(0)
  availablePoints: number; // Current balance (can spend)

  @Column({ default: 0 })
  @IsInt()
  @Min(0)
  tierPoints: number; // Points for tier calculation (resets yearly)

  @Column({ type: "date" })
  tierStartDate: Date; // Tier calculation period start

  @Column({ type: "date", nullable: true })
  tierEndDate: Date; // Tier expires after 1 year

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => MembershipTier)
  @JoinColumn({ name: "tierId" })
  tier: MembershipTier;

  @OneToMany(() => LoyaltyTransaction, (transaction) => transaction.user)
  transactions: LoyaltyTransaction[];
}
```

### LoyaltyTransaction Entity

```typescript
export enum TransactionType {
  EARN_ORDER = "earn_order", // From purchase
  EARN_REVIEW = "earn_review", // From writing review
  EARN_REFERRAL = "earn_referral", // From referring friend
  EARN_BONUS = "earn_bonus", // Promotional bonus
  SPEND_ORDER = "spend_order", // Used in order
  EXPIRE = "expire", // Points expired
  REFUND = "refund", // Order refunded
  ADMIN_ADJUST = "admin_adjust", // Manual adjustment
}

@Entity("loyalty_transactions")
@Index(["userId", "createdAt"])
export class LoyaltyTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "uuid" })
  @Index()
  userId: string;

  @Column({ type: "enum", enum: TransactionType })
  @Index()
  type: TransactionType;

  @Column()
  @IsInt()
  points: number; // Positive for earn, negative for spend

  @Column({ nullable: true })
  referenceType: string; // Order, Review, Referral

  @Column({ nullable: true })
  referenceId: number;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "date", nullable: true })
  expiryDate: Date; // Points expire after 1 year

  @Column({ default: false })
  isExpired: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => UserMembership, (membership) => membership.transactions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user: UserMembership;
}
```

---

## 🔧 DTOs

### CreateMembershipTierDto

```typescript
export class CreateMembershipTierDto {
  @IsString()
  @Length(1, 50)
  @ApiProperty({ example: "Gold" })
  name: string;

  @IsInt()
  @Min(0)
  @ApiProperty({ example: 10000 })
  minPoints: number;

  @IsObject()
  @ApiProperty({
    example: {
      discountPercent: 5,
      freeShipping: true,
      earningMultiplier: 1.5,
      prioritySupport: true,
      exclusiveDeals: true,
    },
  })
  benefits: any;

  @IsString()
  @ApiProperty({ example: "#FFD700" })
  color: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  icon?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  description?: string;
}
```

### EarnPointsDto

```typescript
export class EarnPointsDto {
  @IsUUID()
  @ApiProperty()
  userId: string;

  @IsInt()
  @Min(1)
  @ApiProperty({ example: 100 })
  points: number;

  @IsEnum(TransactionType)
  @ApiProperty({ enum: TransactionType })
  type: TransactionType;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  referenceType?: string;

  @IsInt()
  @IsOptional()
  @ApiProperty({ required: false })
  referenceId?: number;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  description?: string;
}
```

### SpendPointsDto

```typescript
export class SpendPointsDto {
  @IsInt()
  @Min(1)
  @ApiProperty({ example: 500, description: "Points to spend" })
  points: number;

  @IsInt()
  @ApiProperty({ example: 123, description: "Order ID" })
  orderId: number;
}
```

---

## 🛣️ API ENDPOINTS

### Customer Endpoints

```typescript
// Get my membership info
GET /api/loyalty/my-membership
Response: {
  success: true,
  data: {
    tier: MembershipTier,
    totalPoints: 5000,
    availablePoints: 2500,
    pointsToNextTier: 5000,
    nextTier: MembershipTier
  }
}

// Get points history
GET /api/loyalty/transactions
Query: { page, limit, type? }
Response: {
  success: true,
  data: {
    transactions: LoyaltyTransaction[],
    pagination: { ... }
  }
}

// Redeem points
POST /api/loyalty/redeem
Body: { points: 500, orderId: 123 }
Response: {
  success: true,
  data: {
    discountAmount: 50, // 500 points = $50
    newBalance: 2000
  }
}

// Get tiers info
GET /api/loyalty/tiers
Response: { success: true, data: MembershipTier[] }
```

### Admin Endpoints

```typescript
// Create/Update tier
POST /api/admin/loyalty/tiers
Body: CreateMembershipTierDto
Response: { success: true, data: MembershipTier }

// Award bonus points
POST /api/admin/loyalty/award-points
Body: { userId, points, description }
Response: { success: true }

// View user membership
GET /api/admin/loyalty/users/:userId
Response: { success: true, data: UserMembership }

// Loyalty analytics
GET /api/admin/loyalty/analytics
Response: {
  success: true,
  data: {
    totalMembers: 1000,
    tierDistribution: { Bronze: 500, Silver: 300, Gold: 150, Platinum: 50 },
    pointsIssued: 500000,
    pointsRedeemed: 200000
  }
}
```

---

## 💼 BUSINESS LOGIC

### 1. Points Earning Rules

```typescript
class LoyaltyService {
  // Calculate points from order
  async calculateOrderPoints(order: Order): Promise<number> {
    const membership = await this.getMembership(order.userId);
    const basePoints = Math.floor(order.total); // $1 = 1 point

    // Apply tier multiplier
    const multiplier = membership.tier.benefits.earningMultiplier;
    const totalPoints = Math.floor(basePoints * multiplier);

    return totalPoints;
  }

  // Award points after order completion
  async awardOrderPoints(orderId: number): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException("Order not delivered yet");
    }

    // Check if points already awarded
    const existing = await this.transactionRepository.findOne({
      where: {
        referenceType: "Order",
        referenceId: orderId,
        type: TransactionType.EARN_ORDER,
      },
    });

    if (existing) {
      throw new BadRequestException("Points already awarded");
    }

    const points = await this.calculateOrderPoints(order);

    await this.earnPoints({
      userId: order.userId,
      points,
      type: TransactionType.EARN_ORDER,
      referenceType: "Order",
      referenceId: orderId,
      description: `Earned from order #${order.orderNumber}`,
    });
  }

  // Award points for review
  async awardReviewPoints(reviewId: number): Promise<void> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    const REVIEW_POINTS = 50; // Fixed 50 points per review

    await this.earnPoints({
      userId: review.userId,
      points: REVIEW_POINTS,
      type: TransactionType.EARN_REVIEW,
      referenceType: "Review",
      referenceId: reviewId,
      description: "Earned from writing review",
    });
  }
}
```

### 2. Tier Upgrade Logic

```typescript
async checkAndUpgradeTier(userId: string): Promise<void> {
  const membership = await this.membershipRepository.findOne({
    where: { userId },
    relations: ['tier'],
  });

  // Get all tiers sorted by minPoints
  const tiers = await this.tierRepository.find({
    order: { minPoints: 'DESC' },
  });

  // Find appropriate tier
  const newTier = tiers.find(
    (tier) => membership.tierPoints >= tier.minPoints,
  );

  if (newTier && newTier.id !== membership.tierId) {
    // Upgrade tier
    await this.membershipRepository.update(
      { id: membership.id },
      {
        tierId: newTier.id,
        tierStartDate: new Date(),
        tierEndDate: new Date(
          new Date().setFullYear(new Date().getFullYear() + 1),
        ),
      },
    );

    // Send congratulations email
    await this.emailService.sendTierUpgradeNotification(
      membership.user,
      newTier,
    );
  }
}
```

### 3. Points Expiration

```typescript
@Cron('0 0 * * *') // Run daily at midnight
async expirePoints(): Promise<void> {
  const today = new Date();

  // Find expiring transactions
  const expiringTransactions = await this.transactionRepository.find({
    where: {
      expiryDate: LessThanOrEqual(today),
      isExpired: false,
      points: MoreThan(0), // Only earned points expire
    },
  });

  for (const transaction of expiringTransactions) {
    // Mark as expired
    await this.transactionRepository.update(
      { id: transaction.id },
      { isExpired: true },
    );

    // Deduct from available points
    await this.membershipRepository.decrement(
      { userId: transaction.userId },
      'availablePoints',
      transaction.points,
    );

    // Create expiry record
    await this.transactionRepository.save({
      userId: transaction.userId,
      type: TransactionType.EXPIRE,
      points: -transaction.points,
      description: `Points expired from ${transaction.description}`,
    });

    // Send notification
    await this.notificationService.send({
      userId: transaction.userId,
      type: NotificationType.POINTS_EXPIRED,
      message: `${transaction.points} points expired`,
    });
  }
}
```

### 4. Points Redemption

```typescript
async redeemPoints(
  userId: string,
  points: number,
  orderId: number,
): Promise<number> {
  const membership = await this.membershipRepository.findOne({
    where: { userId },
  });

  if (membership.availablePoints < points) {
    throw new BadRequestException('Insufficient points');
  }

  const POINTS_TO_DOLLAR_RATIO = 10; // 10 points = $1
  const discountAmount = points / POINTS_TO_DOLLAR_RATIO;

  // Deduct points
  await this.membershipRepository.decrement(
    { userId },
    'availablePoints',
    points,
  );

  // Record transaction
  await this.transactionRepository.save({
    userId,
    type: TransactionType.SPEND_ORDER,
    points: -points,
    referenceType: 'Order',
    referenceId: orderId,
    description: `Redeemed ${points} points for $${discountAmount} discount`,
  });

  return discountAmount;
}
```

---

## 🎨 DEFAULT TIER CONFIGURATION

```typescript
const DEFAULT_TIERS = [
  {
    name: "Bronze",
    minPoints: 0,
    benefits: {
      discountPercent: 0,
      freeShipping: false,
      earningMultiplier: 1,
      prioritySupport: false,
      exclusiveDeals: false,
    },
    color: "#CD7F32",
    description: "Welcome tier for new members",
  },
  {
    name: "Silver",
    minPoints: 5000,
    benefits: {
      discountPercent: 2,
      freeShipping: false,
      earningMultiplier: 1.2,
      prioritySupport: false,
      exclusiveDeals: false,
    },
    color: "#C0C0C0",
    description: "Earn 20% more points on purchases",
  },
  {
    name: "Gold",
    minPoints: 15000,
    benefits: {
      discountPercent: 5,
      freeShipping: true,
      earningMultiplier: 1.5,
      prioritySupport: true,
      exclusiveDeals: true,
    },
    color: "#FFD700",
    description: "Free shipping + 5% extra discount",
  },
  {
    name: "Platinum",
    minPoints: 50000,
    benefits: {
      discountPercent: 10,
      freeShipping: true,
      earningMultiplier: 2,
      prioritySupport: true,
      exclusiveDeals: true,
    },
    color: "#E5E4E2",
    description: "VIP benefits + double points earning",
  },
];
```

---

## ✅ ACCEPTANCE CRITERIA

1. ✅ 4 membership tiers: Bronze, Silver, Gold, Platinum
2. ✅ Earn 1 point per $1 spent
3. ✅ Tier multipliers increase earning rate
4. ✅ 50 points for writing review
5. ✅ 10 points = $1 discount when redeemed
6. ✅ Points expire after 1 year
7. ✅ Auto tier upgrade based on points
8. ✅ Full transaction history
9. ✅ Email notifications for tier upgrades & expirations
10. ✅ Admin can award bonus points

---

## 🧪 TESTING CHECKLIST

- [ ] Unit test: Calculate order points with multiplier
- [ ] Unit test: Award review points
- [ ] Unit test: Redeem points
- [ ] Unit test: Tier upgrade logic
- [ ] Unit test: Points expiration
- [ ] Integration test: Full loyalty flow
- [ ] E2E test: Earn and spend points

---

**Status:** ⏳ Not Started  
**Phase:** 2-3 - Growth & Retention
