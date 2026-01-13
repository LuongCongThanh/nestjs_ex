import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../../entities/user.entity';

/**
 * EmailVerificationToken Entity
 *
 * Purpose: Store email verification tokens for user registration
 *
 * Security:
 * - Tokens are hashed using SHA-256 before storage
 * - Single-use only (isUsed flag)
 * - Short expiration (24 hours)
 * - Associated with user for verification
 *
 * Lifecycle:
 * 1. Token created when user registers
 * 2. Token sent via email link
 * 3. User clicks link → Token validated → Email verified
 * 4. Token marked as used
 *
 * Cleanup:
 * - Cron job should delete expired tokens (expiresAt < NOW())
 * - Delete used tokens older than 7 days
 */
@Entity('email_verification_tokens')
export class EmailVerificationToken {
  /**
   * Primary key - UUID auto-generated
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Hashed verification token (SHA-256)
   * Original token is sent via email, only hash is stored
   *
   * @example "a1b2c3d4e5f6... (64 chars hex)"
   */
  @Column({ type: 'varchar', length: 255, unique: true })
  token: string;

  /**
   * User ID foreign key
   */
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  /**
   * User relationship
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /**
   * Token expiration timestamp (24 hours from creation)
   */
  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  /**
   * Flag to prevent token reuse
   */
  @Column({ name: 'is_used', type: 'boolean', default: false })
  isUsed: boolean;

  /**
   * Creation timestamp
   */
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
