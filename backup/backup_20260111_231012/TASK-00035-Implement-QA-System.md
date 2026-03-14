# TASK-00035: Implement Q&A System

## 📋 Metadata

- **Task ID**: TASK-00035
- **Độ ưu tiên**: 🟡 TRUNG BÌNH (Phase 2 - Growth)
- **Phụ thuộc**: TASK-00008 (Product Entity), TASK-00006 (User Entity)
- **Liên quan**: TASK-00034 (Review System)
- **Thời gian ước tính**: 6-8 giờ
- **Phase**: Phase 2 - Social Proof & Trust

---

## 🎯 MỤC TIÊU

Xây dựng hệ thống hỏi đáp (Q&A) cho sản phẩm, cho phép khách hàng đặt câu hỏi và nhận câu trả lời từ người bán hoặc người dùng khác, giúp tăng trust và giảm customer support load.

### Mục tiêu cụ thể:

1. ✅ Tạo ProductQuestion & ProductAnswer entities
2. ✅ User có thể đặt câu hỏi về sản phẩm
3. ✅ Seller/Admin có thể trả lời với badge "Official Answer"
4. ✅ Other users cũng có thể trả lời
5. ✅ Helpful voting system cho answers
6. ✅ Display Q&A trên product page
7. ✅ Email notification khi có câu trả lời mới

---

## 📊 DATABASE SCHEMA

### ProductQuestion Entity

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { IsString, IsInt, Min, IsBoolean } from "class-validator";

@Entity("product_questions")
@Index(["productId", "isActive"])
@Index(["userId"])
export class ProductQuestion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  productId: number;

  @Column({ type: "uuid" })
  @Index()
  userId: string;

  @Column({ type: "text" })
  @IsString()
  question: string;

  @Column({ default: 0 })
  @IsInt()
  @Min(0)
  answersCount: number;

  @Column({ default: 0 })
  @IsInt()
  @Min(0)
  helpfulCount: number;

  @Column({ default: true })
  @IsBoolean()
  isActive: boolean; // For moderation

  @Column({ default: false })
  @IsBoolean()
  hasOfficialAnswer: boolean; // Seller answered

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Product, (product) => product.questions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "productId" })
  product: Product;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @OneToMany(() => ProductAnswer, (answer) => answer.question, {
    cascade: true,
  })
  answers: ProductAnswer[];

  @OneToMany(() => QuestionVote, (vote) => vote.question)
  votes: QuestionVote[];
}
```

### ProductAnswer Entity

```typescript
@Entity("product_answers")
@Index(["questionId", "isActive"])
@Index(["userId"])
export class ProductAnswer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  questionId: number;

  @Column({ type: "uuid" })
  @Index()
  userId: string;

  @Column({ type: "text" })
  @IsString()
  answer: string;

  @Column({ default: 0 })
  @IsInt()
  @Min(0)
  helpfulCount: number;

  @Column({ default: 0 })
  @IsInt()
  @Min(0)
  notHelpfulCount: number;

  @Column({ default: false })
  @IsBoolean()
  isSeller: boolean; // Official answer from seller/admin

  @Column({ default: true })
  @IsBoolean()
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => ProductQuestion, (question) => question.answers, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "questionId" })
  question: ProductQuestion;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @OneToMany(() => AnswerVote, (vote) => vote.answer)
  votes: AnswerVote[];
}
```

### Voting Entities

```typescript
@Entity("question_votes")
@Index(["questionId", "userId"], { unique: true })
export class QuestionVote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  questionId: number;

  @Column({ type: "uuid" })
  userId: string;

  @Column({ type: "boolean" })
  isHelpful: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => ProductQuestion, (question) => question.votes, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "questionId" })
  question: ProductQuestion;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
}

@Entity("answer_votes")
@Index(["answerId", "userId"], { unique: true })
export class AnswerVote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  answerId: number;

  @Column({ type: "uuid" })
  userId: string;

  @Column({ type: "boolean" })
  isHelpful: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => ProductAnswer, (answer) => answer.votes, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "answerId" })
  answer: ProductAnswer;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
}
```

---

## 🔧 DTOs

### CreateQuestionDto

```typescript
export class CreateQuestionDto {
  @IsInt()
  @ApiProperty({ example: 123, description: "Product ID" })
  productId: number;

  @IsString()
  @MinLength(10)
  @MaxLength(500)
  @ApiProperty({ example: "Does this come with a warranty?" })
  question: string;
}
```

### CreateAnswerDto

```typescript
export class CreateAnswerDto {
  @IsInt()
  @ApiProperty({ example: 456, description: "Question ID" })
  questionId: number;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  @ApiProperty({ example: "Yes, it comes with 1 year warranty." })
  answer: string;
}
```

### QuestionFilterDto

```typescript
export class QuestionFilterDto {
  @IsInt()
  @ApiProperty({ example: 123, description: "Product ID" })
  productId: number;

  @IsOptional()
  @IsEnum(["recent", "helpful", "unanswered"])
  @ApiProperty({
    enum: ["recent", "helpful", "unanswered"],
    required: false,
  })
  sortBy?: "recent" | "helpful" | "unanswered";

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, description: "Show only unanswered" })
  unansweredOnly?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
```

---

## 🛣️ API ENDPOINTS

### Customer Endpoints

```typescript
// Ask a question
POST /api/questions
Body: CreateQuestionDto
Response: { success: true, data: ProductQuestion }

// Answer a question
POST /api/questions/:id/answers
Body: { answer: string }
Response: { success: true, data: ProductAnswer }

// Get questions for a product
GET /api/questions/product/:productId
Query: QuestionFilterDto
Response: {
  success: true,
  data: {
    questions: ProductQuestion[],
    pagination: { page, limit, total, totalPages }
  }
}

// Vote on question
POST /api/questions/:id/vote
Body: { isHelpful: true }
Response: { success: true, data: { helpfulCount } }

// Vote on answer
POST /api/questions/answers/:id/vote
Body: { isHelpful: true }
Response: { success: true, data: { helpfulCount, notHelpfulCount } }

// Get user's questions
GET /api/questions/my-questions
Response: { success: true, data: ProductQuestion[] }
```

### Seller/Admin Endpoints

```typescript
// Answer as seller (official answer)
POST /api/seller/questions/:id/answer
Body: { answer: string }
Response: { success: true, data: ProductAnswer }

// Get unanswered questions
GET /api/seller/questions/unanswered
Response: { success: true, data: ProductQuestion[] }

// Moderate questions
PATCH /api/admin/questions/:id/moderate
Body: { isActive: boolean, reason?: string }
Response: { success: true }
```

---

## 💼 BUSINESS LOGIC

### Question Submission

```typescript
async createQuestion(
  userId: string,
  createQuestionDto: CreateQuestionDto,
): Promise<ProductQuestion> {
  const { productId, question } = createQuestionDto;

  // Check if product exists
  const product = await this.productRepository.findOne({
    where: { id: productId, isActive: true },
  });

  if (!product) {
    throw new NotFoundException('Product not found');
  }

  // Check for duplicate questions
  const existingQuestion = await this.questionRepository.findOne({
    where: {
      userId,
      productId,
      question: Like(`%${question}%`),
      createdAt: MoreThan(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      ), // Last 7 days
    },
  });

  if (existingQuestion) {
    throw new BadRequestException('You already asked a similar question');
  }

  // Create question
  const newQuestion = this.questionRepository.create({
    userId,
    productId,
    question,
  });

  return await this.questionRepository.save(newQuestion);
}
```

### Answer Submission

```typescript
async createAnswer(
  userId: string,
  questionId: number,
  answer: string,
  isSeller: boolean = false,
): Promise<ProductAnswer> {
  const question = await this.questionRepository.findOne({
    where: { id: questionId, isActive: true },
    relations: ['user'],
  });

  if (!question) {
    throw new NotFoundException('Question not found');
  }

  // Create answer
  const newAnswer = this.answerRepository.create({
    questionId,
    userId,
    answer,
    isSeller,
  });

  await this.answerRepository.save(newAnswer);

  // Update question answers count
  await this.questionRepository.increment(
    { id: questionId },
    'answersCount',
    1,
  );

  // If seller answered, mark question
  if (isSeller) {
    await this.questionRepository.update(
      { id: questionId },
      { hasOfficialAnswer: true },
    );
  }

  // Send email notification to question asker
  await this.emailService.sendAnswerNotification(
    question.user,
    question,
    newAnswer,
  );

  return newAnswer;
}
```

### Notification System

```typescript
async sendAnswerNotification(
  user: User,
  question: ProductQuestion,
  answer: ProductAnswer,
) {
  const subject = answer.isSeller
    ? 'The seller answered your question!'
    : 'Someone answered your question!';

  const emailData = {
    to: user.email,
    subject,
    template: 'answer-notification',
    context: {
      userName: user.firstName || user.email,
      question: question.question,
      answer: answer.answer,
      productLink: `/products/${question.productId}`,
      isSeller: answer.isSeller,
    },
  };

  await this.mailService.send(emailData);
}
```

---

## 🎨 FEATURES

### 1. Smart Question Matching

```typescript
// Before creating a new question, suggest similar existing questions
async findSimilarQuestions(
  productId: number,
  questionText: string,
): Promise<ProductQuestion[]> {
  // Using PostgreSQL full-text search
  return await this.questionRepository
    .createQueryBuilder('q')
    .where('q.productId = :productId', { productId })
    .andWhere('q.isActive = :isActive', { isActive: true })
    .andWhere(
      'to_tsvector(q.question) @@ plainto_tsquery(:query)',
      { query: questionText },
    )
    .orderBy('q.answersCount', 'DESC')
    .limit(5)
    .getMany();
}
```

### 2. Unanswered Questions Alert

```typescript
// Cron job to alert seller about unanswered questions
@Cron('0 9 * * *') // 9 AM daily
async alertUnansweredQuestions() {
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const unansweredQuestions = await this.questionRepository.find({
    where: {
      answersCount: 0,
      createdAt: LessThan(twoDaysAgo),
      isActive: true,
    },
    relations: ['product'],
  });

  if (unansweredQuestions.length > 0) {
    await this.emailService.sendUnansweredQuestionsAlert(
      unansweredQuestions,
    );
  }
}
```

---

## ✅ ACCEPTANCE CRITERIA

1. ✅ Any user can ask questions about products
2. ✅ Questions require minimum 10 characters
3. ✅ Seller answers show "Official Answer" badge
4. ✅ Other users can also answer
5. ✅ Answers can be voted as helpful/not helpful
6. ✅ Questions sorted by: Recent, Most Helpful, Unanswered
7. ✅ Email notification when question is answered
8. ✅ Suggest similar questions before posting
9. ✅ Admin can moderate questions/answers
10. ✅ Daily alert for unanswered questions

---

## 🧪 TESTING CHECKLIST

- [ ] Unit test: Create question
- [ ] Unit test: Create answer (regular user)
- [ ] Unit test: Create answer (seller)
- [ ] Unit test: Vote system
- [ ] Unit test: Find similar questions
- [ ] Integration test: Full Q&A flow
- [ ] E2E test: Ask question and receive answer

---

**Status:** ⏳ Not Started  
**Phase:** 2 - Growth
