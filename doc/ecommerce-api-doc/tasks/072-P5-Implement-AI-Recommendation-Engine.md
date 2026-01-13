# TASK-00037: Implement AI Product Recommendation Engine

## 📋 Metadata

- **Task ID**: TASK-00037
- **Độ ưu tiên**: 🔴 CAO (Phase 3 - Scale & AI)
- **Phụ thuộc**: TASK-00008 (Product Entity), TASK-00010 (Order Entity)
- **Liên quan**: TASK-00038 (Product View Tracking), TASK-00039 (Search Analytics)
- **Thời gian ước tính**: 16-20 giờ
- **Phase**: Phase 3 - Personalization & AI

---

## 🎯 MỤC TIÊU

Xây dựng AI recommendation engine để cá nhân hóa trải nghiệm mua sắm, tăng cross-sell/upsell, và improve conversion rate thông qua intelligent product suggestions.

### Mục tiêu cụ thể:

1. ✅ Track product views và user behavior
2. ✅ Implement collaborative filtering (user-based & item-based)
3. ✅ Implement content-based filtering
4. ✅ "Recently Viewed" products
5. ✅ "Customers Also Bought" recommendations
6. ✅ "Similar Products" suggestions
7. ✅ Personalized homepage recommendations
8. ✅ Real-time recommendation API

---

## 📊 DATABASE SCHEMA

### ProductView Entity

```typescript
@Entity("product_views")
@Index(["productId", "viewedAt"])
@Index(["userId", "viewedAt"])
@Index(["sessionId", "viewedAt"])
export class ProductView {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  productId: number;

  @Column({ type: "uuid", nullable: true })
  @Index()
  userId: string; // Null for anonymous users

  @Column({ nullable: true })
  @Index()
  sessionId: string; // For anonymous tracking

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ type: "text", nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  referrer: string;

  @Column({ type: "int", default: 0 })
  timeSpent: number; // Seconds spent on product page

  @Column({ default: false })
  addedToCart: boolean;

  @Column({ default: false })
  purchased: boolean;

  @CreateDateColumn()
  @Index()
  viewedAt: Date;

  @ManyToOne(() => Product, { onDelete: "CASCADE" })
  @JoinColumn({ name: "productId" })
  product: Product;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "userId" })
  user: User;
}
```

### ProductRecommendation Entity

```typescript
export enum RecommendationType {
  COLLABORATIVE = "collaborative", // Based on similar users
  CONTENT_BASED = "content_based", // Based on product similarity
  TRENDING = "trending", // Popular products
  PERSONALIZED = "personalized", // ML-based personalization
  ALSO_BOUGHT = "also_bought", // Frequently bought together
  SIMILAR = "similar", // Similar products
}

@Entity("product_recommendations")
@Index(["userId", "generatedAt"])
@Index(["productId", "score"])
export class ProductRecommendation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "uuid" })
  @Index()
  userId: string;

  @Column()
  @Index()
  productId: number;

  @Column({ type: "decimal", precision: 5, scale: 4 })
  score: number; // 0-1, confidence score

  @Column({ type: "enum", enum: RecommendationType })
  @Index()
  algorithm: RecommendationType;

  @Column({ type: "json", nullable: true })
  metadata: any; // Algorithm-specific data

  @Column({ nullable: true })
  clickedAt: Date;

  @Column({ default: false })
  purchased: boolean;

  @CreateDateColumn()
  @Index()
  generatedAt: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => Product, { onDelete: "CASCADE" })
  @JoinColumn({ name: "productId" })
  product: Product;
}
```

### ProductSimilarity Entity (Pre-computed)

```typescript
@Entity("product_similarities")
@Index(["productId", "score"])
@Index(["similarProductId"])
export class ProductSimilarity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  productId: number;

  @Column()
  @Index()
  similarProductId: number;

  @Column({ type: "decimal", precision: 5, scale: 4 })
  score: number; // Similarity score 0-1

  @Column({ type: "enum", enum: ["category", "attributes", "behavior"] })
  similarityType: string;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Product, { onDelete: "CASCADE" })
  @JoinColumn({ name: "productId" })
  product: Product;

  @ManyToOne(() => Product, { onDelete: "CASCADE" })
  @JoinColumn({ name: "similarProductId" })
  similarProduct: Product;
}
```

---

## 🔧 DTOs

### TrackViewDto

```typescript
export class TrackViewDto {
  @IsInt()
  @ApiProperty({ example: 123 })
  productId: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  sessionId?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  referrer?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @ApiProperty({ required: false })
  timeSpent?: number;
}
```

### GetRecommendationsDto

```typescript
export class GetRecommendationsDto {
  @IsOptional()
  @IsEnum(RecommendationType)
  @ApiProperty({ enum: RecommendationType, required: false })
  type?: RecommendationType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @ApiProperty({ example: 10, required: false })
  limit?: number = 10;

  @IsOptional()
  @IsInt()
  @ApiProperty({
    example: 123,
    required: false,
    description: "Seed product for similar items",
  })
  productId?: number;
}
```

---

## 🛣️ API ENDPOINTS

```typescript
// Track product view
POST /api/recommendations/track-view
Body: TrackViewDto
Response: { success: true }

// Get personalized recommendations for user
GET /api/recommendations/for-you
Query: { limit: 10 }
Response: {
  success: true,
  data: {
    recommendations: Product[],
    algorithm: 'personalized'
  }
}

// Get recently viewed products
GET /api/recommendations/recently-viewed
Query: { limit: 10 }
Response: { success: true, data: Product[] }

// Get similar products
GET /api/recommendations/similar/:productId
Query: { limit: 10 }
Response: { success: true, data: Product[] }

// Get frequently bought together
GET /api/recommendations/also-bought/:productId
Query: { limit: 5 }
Response: { success: true, data: Product[] }

// Get trending products
GET /api/recommendations/trending
Query: { category?, limit: 10 }
Response: { success: true, data: Product[] }

// Track click on recommendation
POST /api/recommendations/:id/click
Response: { success: true }
```

---

## 💼 RECOMMENDATION ALGORITHMS

### 1. Collaborative Filtering (User-Based)

```typescript
class CollaborativeFilteringService {
  // Find users with similar purchase history
  async findSimilarUsers(
    userId: string,
    limit: number = 10
  ): Promise<string[]> {
    // Get user's purchased products
    const userProducts = await this.orderItemRepository
      .createQueryBuilder("oi")
      .select("DISTINCT oi.productId")
      .innerJoin("oi.order", "o")
      .where("o.userId = :userId", { userId })
      .andWhere("o.status = :status", { status: OrderStatus.DELIVERED })
      .getRawMany();

    const productIds = userProducts.map((p) => p.productId);

    if (productIds.length === 0) return [];

    // Find users who bought similar products
    const similarUsers = await this.orderItemRepository
      .createQueryBuilder("oi")
      .select("o.userId", "userId")
      .addSelect("COUNT(DISTINCT oi.productId)", "commonProducts")
      .innerJoin("oi.order", "o")
      .where("oi.productId IN (:...productIds)", { productIds })
      .andWhere("o.userId != :userId", { userId })
      .andWhere("o.status = :status", { status: OrderStatus.DELIVERED })
      .groupBy("o.userId")
      .orderBy("commonProducts", "DESC")
      .limit(limit)
      .getRawMany();

    return similarUsers.map((u) => u.userId);
  }

  // Recommend products that similar users bought
  async getCollaborativeRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<Product[]> {
    const similarUsers = await this.findSimilarUsers(userId);

    if (similarUsers.length === 0) {
      return this.getTrendingProducts(limit);
    }

    // Get user's already purchased products
    const userProductIds = await this.getUserPurchasedProductIds(userId);

    // Find products bought by similar users but not by current user
    const recommendations = await this.productRepository
      .createQueryBuilder("p")
      .select("p.*, COUNT(*) as frequency")
      .innerJoin("p.orderItems", "oi")
      .innerJoin("oi.order", "o")
      .where("o.userId IN (:...similarUsers)", { similarUsers })
      .andWhere("p.id NOT IN (:...userProductIds)", {
        userProductIds: userProductIds.length > 0 ? userProductIds : [0],
      })
      .andWhere("p.isActive = :isActive", { isActive: true })
      .groupBy("p.id")
      .orderBy("frequency", "DESC")
      .limit(limit)
      .getMany();

    return recommendations;
  }
}
```

### 2. Content-Based Filtering

```typescript
class ContentBasedFilteringService {
  // Find products similar by category & attributes
  async findSimilarProducts(
    productId: number,
    limit: number = 10
  ): Promise<Product[]> {
    const sourceProduct = await this.productRepository.findOne({
      where: { id: productId },
      relations: ["category"],
    });

    if (!sourceProduct) return [];

    // Check pre-computed similarities first
    const preComputed = await this.similarityRepository.find({
      where: { productId },
      order: { score: "DESC" },
      take: limit,
      relations: ["similarProduct"],
    });

    if (preComputed.length > 0) {
      return preComputed.map((s) => s.similarProduct);
    }

    // Fallback: Find by category & price range
    const priceRange = sourceProduct.price * 0.3; // ±30%

    return await this.productRepository.find({
      where: {
        categoryId: sourceProduct.categoryId,
        id: Not(productId),
        isActive: true,
        price: Between(
          sourceProduct.price - priceRange,
          sourceProduct.price + priceRange
        ),
      },
      take: limit,
      order: { isFeatured: "DESC", createdAt: "DESC" },
    });
  }

  // Pre-compute product similarities (Cron job)
  @Cron("0 2 * * *") // 2 AM daily
  async computeProductSimilarities(): Promise<void> {
    const products = await this.productRepository.find({
      where: { isActive: true },
      relations: ["category"],
    });

    for (const product of products) {
      // Find similar by category
      const categoryMatches = products.filter(
        (p) => p.id !== product.id && p.categoryId === product.categoryId
      );

      // Calculate similarity scores
      for (const match of categoryMatches.slice(0, 20)) {
        let score = 0.5; // Base score for same category

        // Price similarity (closer = higher score)
        const priceDiff = Math.abs(product.price - match.price);
        const priceScore = 1 - priceDiff / Math.max(product.price, match.price);
        score += priceScore * 0.3;

        // Name similarity (simple word overlap)
        const productWords = new Set(product.name.toLowerCase().split(" "));
        const matchWords = new Set(match.name.toLowerCase().split(" "));
        const overlap = [...productWords].filter((w) =>
          matchWords.has(w)
        ).length;
        const nameScore =
          overlap / Math.max(productWords.size, matchWords.size);
        score += nameScore * 0.2;

        score = Math.min(score, 1); // Cap at 1

        // Save similarity
        await this.similarityRepository.upsert(
          {
            productId: product.id,
            similarProductId: match.id,
            score,
            similarityType: "category",
          },
          ["productId", "similarProductId"]
        );
      }
    }
  }
}
```

### 3. Frequently Bought Together

```typescript
async getFrequentlyBoughtTogether(
  productId: number,
  limit: number = 5,
): Promise<Product[]> {
  // Find products that appear in the same orders
  const relatedProducts = await this.orderItemRepository
    .createQueryBuilder('oi1')
    .select('oi2.productId', 'productId')
    .addSelect('COUNT(*)', 'frequency')
    .innerJoin(
      'order_items',
      'oi2',
      'oi1.orderId = oi2.orderId AND oi1.productId != oi2.productId',
    )
    .where('oi1.productId = :productId', { productId })
    .groupBy('oi2.productId')
    .orderBy('frequency', 'DESC')
    .limit(limit)
    .getRawMany();

  const productIds = relatedProducts.map((r) => r.productId);

  if (productIds.length === 0) return [];

  return await this.productRepository.findByIds(productIds, {
    where: { isActive: true },
  });
}
```

### 4. Recently Viewed

```typescript
async getRecentlyViewedProducts(
  userId: string,
  sessionId: string,
  limit: number = 10,
): Promise<Product[]> {
  const views = await this.productViewRepository.find({
    where: [
      { userId },
      { sessionId },
    ],
    order: { viewedAt: 'DESC' },
    take: limit,
    relations: ['product'],
  });

  // Remove duplicates
  const uniqueProducts = new Map<number, Product>();
  for (const view of views) {
    if (!uniqueProducts.has(view.productId)) {
      uniqueProducts.set(view.productId, view.product);
    }
  }

  return Array.from(uniqueProducts.values());
}
```

### 5. Trending Products

```typescript
async getTrendingProducts(
  categoryId?: number,
  limit: number = 10,
): Promise<Product[]> {
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);

  const query = this.productRepository
    .createQueryBuilder('p')
    .select('p.*')
    .addSelect('COUNT(DISTINCT pv.id)', 'viewCount')
    .addSelect('COUNT(DISTINCT oi.id)', 'purchaseCount')
    .leftJoin('p.productViews', 'pv', 'pv.viewedAt > :date', { date: last7Days })
    .leftJoin('p.orderItems', 'oi')
    .leftJoin('oi.order', 'o', 'o.createdAt > :date AND o.status != :cancelled', {
      date: last7Days,
      cancelled: OrderStatus.CANCELLED,
    })
    .where('p.isActive = :isActive', { isActive: true });

  if (categoryId) {
    query.andWhere('p.categoryId = :categoryId', { categoryId });
  }

  return await query
    .groupBy('p.id')
    .orderBy('purchaseCount', 'DESC')
    .addOrderBy('viewCount', 'DESC')
    .limit(limit)
    .getMany();
}
```

---

## 🎨 FEATURES

### 1. Personalized Homepage

```typescript
async getPersonalizedHomepage(userId: string): Promise<any> {
  return {
    forYou: await this.getCollaborativeRecommendations(userId, 10),
    trending: await this.getTrendingProducts(null, 10),
    recentlyViewed: await this.getRecentlyViewedProducts(userId, null, 10),
    newArrivals: await this.getNewArrivals(10),
  };
}
```

### 2. Real-time Scoring

```typescript
async scoreRecommendation(
  userId: string,
  productId: number,
): Promise<number> {
  let score = 0;

  // Factor 1: Category affinity (30%)
  const userCategories = await this.getUserPreferredCategories(userId);
  const product = await this.productRepository.findOne({
    where: { id: productId },
  });
  if (userCategories.includes(product.categoryId)) {
    score += 0.3;
  }

  // Factor 2: Price range fit (20%)
  const userAvgPrice = await this.getUserAverageOrderValue(userId);
  const priceDiff = Math.abs(product.price - userAvgPrice);
  const priceScore = 1 - priceDiff / userAvgPrice;
  score += priceScore * 0.2;

  // Factor 3: Popularity (20%)
  const popularityScore = await this.getProductPopularityScore(productId);
  score += popularityScore * 0.2;

  // Factor 4: Recency (15%)
  const daysSinceRelease =
    (Date.now() - product.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const recencyScore = Math.max(0, 1 - daysSinceRelease / 365);
  score += recencyScore * 0.15;

  // Factor 5: Stock availability (15%)
  const stockScore = product.stock > 0 ? 1 : 0;
  score += stockScore * 0.15;

  return Math.min(score, 1);
}
```

---

## ✅ ACCEPTANCE CRITERIA

1. ✅ Track every product view with user/session
2. ✅ "Recently Viewed" shows last 10 unique products
3. ✅ "For You" recommendations based on purchase history
4. ✅ "Similar Products" based on category & attributes
5. ✅ "Frequently Bought Together" from order data
6. ✅ "Trending" products updated daily
7. ✅ Personalized homepage sections
8. ✅ Real-time API response < 200ms
9. ✅ Pre-compute similarities nightly
10. ✅ Track recommendation click-through rate

---

## 🧪 TESTING CHECKLIST

- [ ] Unit test: Collaborative filtering algorithm
- [ ] Unit test: Content-based filtering
- [ ] Unit test: Similarity calculation
- [ ] Unit test: Frequently bought together
- [ ] Performance test: Recommendation API < 200ms
- [ ] Integration test: Full recommendation flow
- [ ] A/B test: Measure conversion impact

---

## 📈 METRICS TO TRACK

- Click-through rate (CTR) on recommendations
- Conversion rate from recommendations
- Revenue from recommended products
- Average order value impact
- Algorithm performance comparison

---

**Status:** ⏳ Not Started  
**Phase:** 3 - Scale & AI  
**Expected Impact:** +25-40% in cross-sell revenue
