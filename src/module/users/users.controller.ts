import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { User } from 'src/module/users/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new user',
    description:
      'Create a new user in the system with the provided information',
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'User information to create',
    examples: {
      example1: {
        summary: 'Basic user creation example',
        value: {
          fullName: 'John Doe',
          email: 'john.doe@example.com',
          password: 'password123',
          phone: '+1234567890',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'User created successfully',
    type: User,
    schema: {
      example: {
        id: 1,
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phone: '+1234567890',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'fullName should not be empty',
          'email must be an email',
          'password must be longer than or equal to 6 characters',
        ],
        error: 'Bad Request',
      },
    },
  })
  @ApiUnprocessableEntityResponse({
    description: 'Email already exists in the system',
    schema: {
      example: {
        statusCode: 422,
        message: 'Email is already being used by another user',
        error: 'Unprocessable Entity',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    schema: {
      example: {
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
      },
    },
  })
  async create(
    @Body(ValidationPipe) createUserDto: CreateUserDto,
  ): Promise<User> {
    return await this.usersService.create(createUserDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all users',
    description: 'Return a list of all users in the system',
  })
  @ApiOkResponse({
    description: 'Users list retrieved successfully',
    type: [User],
    schema: {
      example: [
        {
          id: 1,
          fullName: 'John Doe',
          email: 'john.doe@example.com',
          password: 'password123',
          phone: '+1234567890',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    schema: {
      example: {
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
      },
    },
  })
  async findAll(): Promise<User[]> {
    return await this.usersService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Return detailed information of a user based on ID',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: 'number',
    example: 1,
    required: true,
  })
  @ApiOkResponse({
    description: 'User information retrieved successfully',
    type: User,
    schema: {
      example: {
        id: 1,
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phone: '+1234567890',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid ID format',
    schema: {
      example: {
        statusCode: 400,
        message: 'Validation failed (numeric string is expected)',
        error: 'Bad Request',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'User with ID 999 not found',
        error: 'Not Found',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    schema: {
      example: {
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
      },
    },
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return await this.usersService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user information',
    description: 'Update user information based on ID',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: 'number',
    example: 1,
    required: true,
  })
  @ApiBody({
    type: UpdateUserDto,
    description: 'User information to update',
    examples: {
      example1: {
        summary: 'Update name and phone number',
        value: {
          fullName: 'Jane Doe',
          phone: '+9876543210',
        },
      },
      example2: {
        summary: 'Update email',
        value: {
          email: 'jane.doe@example.com',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'User updated successfully',
    type: User,
    schema: {
      example: {
        id: 1,
        fullName: 'Jane Doe',
        email: 'jane.doe@example.com',
        password: 'password123',
        phone: '+9876543210',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T12:00:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'email must be an email',
          'password must be longer than or equal to 6 characters',
        ],
        error: 'Bad Request',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'User with ID 999 not found',
        error: 'Not Found',
      },
    },
  })
  @ApiUnprocessableEntityResponse({
    description: 'Email already exists in the system',
    schema: {
      example: {
        statusCode: 422,
        message: 'Email is already being used by another user',
        error: 'Unprocessable Entity',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    schema: {
      example: {
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
      },
    },
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return await this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete user',
    description: 'Delete user from the system based on ID',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: 'number',
    example: 1,
    required: true,
  })
  @ApiResponse({
    status: 204,
    description: 'User deleted successfully',
    schema: {
      example: null,
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid ID format',
    schema: {
      example: {
        statusCode: 400,
        message: 'Validation failed (numeric string is expected)',
        error: 'Bad Request',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'User with ID 999 not found',
        error: 'Not Found',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    schema: {
      example: {
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
      },
    },
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.usersService.remove(id);
  }
}
