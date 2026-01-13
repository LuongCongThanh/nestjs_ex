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
import { User } from './user.entity';

export enum AddressType {
  HOME = 'home',
  OFFICE = 'office',
  OTHER = 'other',
}

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ length: 100 })
  label: string;

  @Column({ length: 255 })
  fullName: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ length: 500 })
  address: string;

  @Column({ length: 100, nullable: true })
  ward: string;

  @Column({ length: 100, nullable: true })
  district: string;

  @Column({ length: 100 })
  city: string;

  @Column({ length: 100, default: 'Vietnam' })
  country: string;

  @Column({ length: 20, nullable: true })
  postalCode: string;

  @Column({ default: false })
  @Index()
  isDefault: boolean;

  @Column({
    type: 'enum',
    enum: AddressType,
    default: AddressType.HOME,
  })
  type: AddressType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
