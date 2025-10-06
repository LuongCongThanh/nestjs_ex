import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import bcryptJs from 'bcryptjs';
import { DEFAULT_USER_ROLES, SanitizedUser, toUserResponse } from 'src/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // Local typed wrapper avoids unsafe "any" from bcryptjs CJS typings.
  private readonly bcrypt: {
    hash(data: string, salt: string | number): Promise<string>;
  } = bcryptJs as unknown as {
    hash(data: string, salt: string | number): Promise<string>;
  };

  async create(createUserDto: CreateUserDto): Promise<SanitizedUser> {
    try {
      const hashed = await this.bcrypt.hash(createUserDto.password, 10);
      const created = await this.prisma.user.create({
        data: {
          ...createUserDto,
          password: hashed,
          roles: [...DEFAULT_USER_ROLES],
        },
      });
      return toUserResponse(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Email is already being used by another user',
          );
        }
      }
      throw new BadRequestException('Failed to create user');
    }
  }

  async findAll(): Promise<SanitizedUser[]> {
    try {
      const users = await this.prisma.user.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });
      return users.map(toUserResponse);
    } catch {
      throw new BadRequestException('Failed to retrieve users');
    }
  }

  async findOne(id: number): Promise<SanitizedUser> {
    if (!id || id <= 0) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return toUserResponse(user);
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<SanitizedUser> {
    const data = await this.prepareUpdatePayload(updateUserDto);

    try {
      const updated = await this.prisma.user.update({
        where: { id },
        data,
      });
      return toUserResponse(updated);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Email is already being used by another user',
          );
        }
        if (error.code === 'P2025') {
          throw new NotFoundException(`User with ID ${id} not found`);
        }
      }
      throw new BadRequestException('Failed to update user');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`User with ID ${id} not found`);
        }
      }
      throw new BadRequestException('Failed to delete user');
    }
  }

  // Additional utility method for finding by email
  async findByEmail(email: string): Promise<User | null> {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  // Method to check if email exists
  async emailExists(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return !!user;
  }

  private async prepareUpdatePayload(
    updateUserDto: UpdateUserDto,
  ): Promise<Prisma.UserUpdateInput> {
    const { password, ...rest } = updateUserDto;
    const data: Prisma.UserUpdateInput = { ...rest };

    if (password) {
      data.password = await this.bcrypt.hash(password, 10);
    }

    return data;
  }
}
