import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from './product.entity';

@Entity('cart_items')
@Index(['cartId', 'productId'], { unique: true })
export class CartItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  cartId: number;

  @Column()
  @Index()
  productId: number;

  @Column({ default: 1 })
  quantity: number;

  // Price snapshot - critical for preventing price changes
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Cart, (cart) => cart.cartItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cartId' })
  cart: Cart;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product: Product;
}
