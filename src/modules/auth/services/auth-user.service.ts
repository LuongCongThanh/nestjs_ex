import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../entities/user.entity';

/**
 * Auth User Service - Dedicated service for user entity operations within the Auth module context.
 * This service isolates Auth module from direct dependency on the main UsersModule service.
 */
@Injectable()
export class AuthUserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Finds a user by their unique email address.
   * @param email - The email to search for.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /**
   * Finds a user by their UUID.
   * @param id - User UUID.
   */
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  /**
   * Saves or updates a user entity in the database.
   * @param user - The User entity object.
   */
  async save(user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  /**
   * Performs a partial update on a user entity.
   * @param id - User UUID.
   * @param partialUser - Object containing fields to update.
   */
  async update(id: string, partialUser: Partial<User>) {
    await this.userRepository.update(id, partialUser);
  }

  /**
   * Deletes a user entity by ID (used for rollbacks during failed registration).
   * @param id - User UUID.
   */
  async delete(id: string) {
    await this.userRepository.delete(id);
  }

  /**
   * Creates a new User entity instance (not saved to DB yet).
   * @param userData - Partial user data.
   */
  create(userData: Partial<User>): User {
    return this.userRepository.create(userData);
  }
}
