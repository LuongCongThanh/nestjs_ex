import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 255 })
  @Index()
  name: string;

  @Column({ unique: true, length: 255 })
  @Index()
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true, length: 500 })
  image: string;

  @Column({ nullable: true })
  @Index()
  parentId: number;

  @Column({ default: true })
  @Index()
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Self-referencing relationship
  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parentId' })
  parent: Category;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];

  // @OneToMany(() => Product, product => product.category)
  // products: Product[];
}
