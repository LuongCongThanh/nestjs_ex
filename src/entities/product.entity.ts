import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from './category.entity';

@Entity('products')
@Index(['categoryId', 'isActive'])
@Index(['isFeatured', 'isActive'])
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  name: string;

  @Column({ unique: true, length: 500 })
  @Index()
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @Index()
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  comparePrice: number;

  @Column({ default: 0 })
  stock: number;

  @Column({ unique: true, length: 100 })
  @Index()
  sku: string;

  @Column({ type: 'json', default: [] })
  images: string[];

  @Column()
  @Index()
  categoryId: number;

  // New fields from TASK-00005
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  weight: number;

  @Column({ type: 'json', nullable: true })
  dimensions: { length: number; width: number; height: number };

  @Column({ type: 'json', default: [] })
  tags: string[];

  @Column({ type: 'json', nullable: true })
  seo: { metaTitle: string; metaDescription: string; keywords: string };

  @Column({ default: true })
  @Index()
  isActive: boolean;

  @Column({ default: false })
  @Index()
  isFeatured: boolean;

  @DeleteDateColumn()
  deletedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Category, (category) => category, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  // @OneToMany(() => CartItem, cartItem => cartItem.product)
  // cartItems: CartItem[];

  // @OneToMany(() => OrderItem, orderItem => orderItem.product)
  // orderItems: OrderItem[];
}
