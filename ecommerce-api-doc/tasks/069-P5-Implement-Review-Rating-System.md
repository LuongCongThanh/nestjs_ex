# TASK-00034: Implement Review & Rating System

## 📋 Metadata

- **Task ID**: TASK-00034
- **Độ ưu tiên**: 🟡 TRUNG BÌNH (Phase 2 - Growth)
- **Phụ thuộc**: TASK-00010 (Order Entity), TASK-00008 (Product Entity)
- **Liên quan**: TASK-00035 (Q&A System)
- **Thời gian ước tính**: 8-10 giờ
- **Phase**: Phase 2 - Social Proof & Trust

---

## 🎯 MỤC TIÊU

Xây dựng hệ thống đánh giá và nhận xét sản phẩm với **verified purchase badges**, hỗ trợ hình ảnh, và voting system để tăng trust và conversion rate.

### Mục tiêu cụ thể:

1. ✅ Tạo Review entity với rating 1-5 stars
2. ✅ Chỉ cho phép verified purchases review
3. ✅ Hỗ trợ upload ảnh trong review (tối đa 5 ảnh)
4. ✅ Implement helpful voting system
5. ✅ Moderation workflow cho admin
6. ✅ Tự động request review sau 7 ngày delivered
7. ✅ Display review stats trên product page

---

## 📊 DATABASE SCHEMA

### Review Entity

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import {
  IsInt,
  Min,
  Max,
  IsString,
  IsBoolean,
  IsArray,
  IsOptional,
} from "class-validator";

@Entity("reviews")
@Index(["productId", "isActive"])
@Index(["userId"])
@Index(["orderId"])
@Index(["rating"])
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "uuid" })
  @Index()
  userId: string;

  @Column()
  @Index()
  productId: number;

  @Column()
  @Index()
  orderId: number; // Only verified purchases

  @Column({ type: "int" })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number; // 1-5 stars

  @Column({ type: "text", nullable: true })
  @IsString()
  @IsOptional()
  comment: string;

  @Column({ type: "json", default: [] })
  @IsArray()
  images: string[]; // Max 5 images

  @Column({ default: 0 })
  @IsInt()
  @Min(0)
  helpfulCount: number; // Number of "helpful" votes

  @Column({ default: 0 })
  @IsInt()
  @Min(0)
  notHelpfulCount: number; // Number of "not helpful" votes

  @Column({ default: true })
  @IsBoolean()
  isVerified: boolean; // Verified purchase badge

  @Column({ default: true })
  @IsBoolean()
  isActive: boolean; // For moderation (soft delete)

  @Column({ nullable: true })
  moderatedBy: string; // Admin who approved/rejected

  @Column({ type: "text", nullable: true })
  moderationNote: string; // Reason for rejection

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => Product, (product) => product.reviews, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "productId" })
  product: Product;

  @ManyToOne(() => Order, { onDelete: "CASCADE" })
  @JoinColumn({ name: "orderId" })
  order: Order;

  @OneToMany(() => ReviewVote, (vote) => vote.review)
  votes: ReviewVote[];
}
```

### ReviewVote Entity (For Helpful/Not Helpful)

```typescript
@Entity("review_votes")
@Index(["reviewId", "userId"], { unique: true }) // 1 user = 1 vote per review
export class ReviewVote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  reviewId: number;

  @Column({ type: "uuid" })
  @Index()
  userId: string;

  @Column({ type: "boolean" })
  isHelpful: boolean; // true = helpful, false = not helpful

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Review, (review) => review.votes, { onDelete: "CASCADE" })
  @JoinColumn({ name: "reviewId" })
  review: Review;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
}
```

### Product Entity Updates

```typescript
// Add to Product entity
@OneToMany(() => Review, (review) => review.product)
reviews: Review[];

// Computed fields (calculated on-demand or cached)
averageRating: number;
totalReviews: number;
ratingDistribution: { 5: number; 4: number; 3: number; 2: number; 1: number };
```

---

## 🔧 DTOs

### CreateReviewDto

```typescript
export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  @ApiProperty({ example: 5, description: "Rating 1-5 stars" })
  rating: number;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  @ApiProperty({ example: "Great product!", required: false })
  comment?: string;

  @IsArray()
  @IsUrl({}, { each: true })
  @ArrayMaxSize(5)
  @IsOptional()
  @ApiProperty({ type: [String], required: false, maximum: 5 })
  images?: string[];

  @IsInt()
  @ApiProperty({ example: 123, description: "Order ID for verification" })
  orderId: number;

  @IsInt()
  @ApiProperty({ example: 456, description: "Product ID" })
  productId: number;
}
```

### UpdateReviewDto

```typescript
export class UpdateReviewDto extends PartialType(
  OmitType(CreateReviewDto, ["orderId", "productId"] as const)
) {}
```

### ReviewVoteDto

```typescript
export class ReviewVoteDto {
  @IsInt()
  @ApiProperty({ example: 1, description: "Review ID" })
  reviewId: number;

  @IsBoolean()
  @ApiProperty({
    example: true,
    description: "true = helpful, false = not helpful",
  })
  isHelpful: boolean;
}
```

### ReviewFilterDto

```typescript
export class ReviewFilterDto {
  @IsInt()
  @ApiProperty({ example: 456, description: "Product ID" })
  productId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @ApiProperty({ example: 5, required: false, description: "Filter by rating" })
  rating?: number;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, description: "Show only verified purchases" })
  verifiedOnly?: boolean;

  @IsOptional()
  @IsEnum(["recent", "helpful", "rating_high", "rating_low"])
  @ApiProperty({
    enum: ["recent", "helpful", "rating_high", "rating_low"],
    required: false,
  })
  sortBy?: "recent" | "helpful" | "rating_high" | "rating_low";

  @IsOptional()
  @IsInt()
  @Min(1)
  @ApiProperty({ example: 1, required: false })
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @ApiProperty({ example: 10, required: false })
  limit?: number;
}
```

---

## 🛣️ API ENDPOINTS

### Customer Endpoints

```typescript
// Create review
POST /api/reviews
Body: CreateReviewDto
Response: { success: true, data: Review }

// Update own review
PATCH /api/reviews/:id
Body: UpdateReviewDto
Response: { success: true, data: Review }

// Delete own review
DELETE /api/reviews/:id
Response: { success: true, message: 'Review deleted' }

// Get reviews for a product
GET /api/reviews/product/:productId
Query: ReviewFilterDto
Response: {
  success: true,
  data: {
    reviews: Review[],
    pagination: { page, limit, total, totalPages },
    stats: {
      averageRating: 4.5,
      totalReviews: 150,
      distribution: { 5: 100, 4: 30, 3: 10, 2: 5, 1: 5 }
    }
  }
}

// Vote on review
POST /api/reviews/:id/vote
Body: { isHelpful: true }
Response: { success: true, data: { helpfulCount, notHelpfulCount } }

// Get user's own reviews
GET /api/reviews/my-reviews
Response: { success: true, data: Review[] }

// Check if user can review product
GET /api/reviews/can-review/:productId
Response: {
  success: true,
  data: {
    canReview: true,
    reason: 'verified_purchase' | 'already_reviewed' | 'not_purchased'
  }
}
```

### Admin Endpoints

```typescript
// Get all reviews (with filters)
GET /api/admin/reviews
Query: { status: 'pending' | 'approved' | 'rejected', page, limit }
Response: { success: true, data: Reviews[], pagination }

// Approve review
PATCH /api/admin/reviews/:id/approve
Response: { success: true, data: Review }

// Reject review
PATCH /api/admin/reviews/:id/reject
Body: { reason: string }
Response: { success: true, data: Review }

// Delete review (admin)
DELETE /api/admin/reviews/:id
Response: { success: true }
```

---

## 💼 BUSINESS LOGIC

### Review Submission Rules

1. **Verified Purchase Only**

   ```typescript
   async canUserReview(userId: string, productId: number): Promise<boolean> {
     // Check if user has purchased and received the product
     const order = await this.orderRepository.findOne({
       where: {
         userId,
         status: OrderStatus.DELIVERED,
         orderItems: { productId },
       },
     });

     if (!order) return false;

     // Check if already reviewed
     const existingReview = await this.reviewRepository.findOne({
       where: { userId, productId },
     });

     return !existingReview;
   }
   ```

2. **Auto Review Request**

   ```typescript
   // Cron job: Run daily
   @Cron('0 10 * * *') // 10 AM daily
   async sendReviewRequests() {
     const sevenDaysAgo = new Date();
     sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

     // Find delivered orders from 7 days ago without reviews
     const orders = await this.orderRepository.find({
       where: {
         status: OrderStatus.DELIVERED,
         deliveredAt: Between(sevenDaysAgo, sevenDaysAgo),
       },
       relations: ['orderItems', 'user'],
     });

     for (const order of orders) {
       for (const item of order.orderItems) {
         const hasReview = await this.reviewRepository.findOne({
           where: { userId: order.userId, productId: item.productId },
         });

         if (!hasReview) {
           await this.emailService.sendReviewRequest(order.user, item);
         }
       }
     }
   }
   ```

3. **Review Moderation**
   - Auto-approve if user has 3+ approved reviews
   - Otherwise, pending approval by admin
   - Flag reviews with inappropriate content (using profanity filter)

---

## 🎨 FEATURES

### 1. Review Stats Calculation

```typescript
async getProductReviewStats(productId: number) {
  const reviews = await this.reviewRepository.find({
    where: { productId, isActive: true },
  });

  const totalReviews = reviews.length;
  const averageRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews || 0;

  const distribution = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  };

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    distribution,
  };
}
```

### 2. Helpful Vote System

```typescript
async voteReview(
  reviewId: number,
  userId: string,
  isHelpful: boolean,
): Promise<void> {
  // Check if user already voted
  const existingVote = await this.reviewVoteRepository.findOne({
    where: { reviewId, userId },
  });

  if (existingVote) {
    // Update vote
    await this.reviewVoteRepository.update(
      { id: existingVote.id },
      { isHelpful },
    );

    // Recalculate counts
    await this.updateReviewVoteCounts(reviewId);
  } else {
    // Create new vote
    await this.reviewVoteRepository.save({
      reviewId,
      userId,
      isHelpful,
    });

    // Increment count
    if (isHelpful) {
      await this.reviewRepository.increment(
        { id: reviewId },
        'helpfulCount',
        1,
      );
    } else {
      await this.reviewRepository.increment(
        { id: reviewId },
        'notHelpfulCount',
        1,
      );
    }
  }
}
```

### 3. Image Upload

```typescript
async uploadReviewImages(files: Express.Multer.File[]): Promise<string[]> {
  if (files.length > 5) {
    throw new BadRequestException('Maximum 5 images allowed');
  }

  const uploadPromises = files.map(async (file) => {
    // Upload to S3/Cloudinary
    return await this.fileUploadService.upload(file, 'reviews');
  });

  return await Promise.all(uploadPromises);
}
```

---

## ✅ ACCEPTANCE CRITERIA

1. ✅ Users can only review products they purchased
2. ✅ Reviews show "Verified Purchase" badge
3. ✅ Support 1-5 star rating
4. ✅ Optional text comment (max 2000 chars)
5. ✅ Support up to 5 images per review
6. ✅ Users can vote reviews as helpful/not helpful
7. ✅ Reviews sorted by: Recent, Most Helpful, Highest/Lowest Rating
8. ✅ Product page shows average rating and distribution
9. ✅ Admin can approve/reject reviews
10. ✅ Auto review request sent 7 days after delivery
11. ✅ Users can edit/delete their own reviews
12. ✅ Spam/profanity filtering

---

## 🧪 TESTING CHECKLIST

- [ ] Unit test: Create review with verified purchase
- [ ] Unit test: Prevent review from non-purchaser
- [ ] Unit test: Calculate average rating correctly
- [ ] Unit test: Review vote system
- [ ] Integration test: Full review flow
- [ ] E2E test: Submit review from UI
- [ ] Performance test: Load 1000+ reviews efficiently

---

## 📚 REFERENCES

- **Related Tasks**: TASK-00035 (Q&A System), TASK-00023.5 (Image Upload)
- **Documentation**: [NestJS File Upload](https://docs.nestjs.com/techniques/file-upload)

---

**Status:** ⏳ Not Started  
**Phase:** 2 - Growth
