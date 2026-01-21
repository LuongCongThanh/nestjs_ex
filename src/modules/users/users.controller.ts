import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { ConflictErrorResponseDto, ErrorResponseDto, NotFoundErrorResponseDto } from './dto/error-response.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

/**
 * Users Controller - Manages user accounts and administrative operations.
 */
@ApiTags('Users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Creates a new user account.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create user', description: 'Registers a new user in the system.' })
  @ApiResponse({ status: 201, description: 'User successfully created.', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data.', type: ErrorResponseDto })
  @ApiResponse({ status: 409, description: 'Email already exists.', type: ConflictErrorResponseDto })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return await this.usersService.create(createUserDto);
  }

  /**
   * Retrieves a paginated list of users with optional filtering.
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieves a list of users with pagination and filtering support. Restricted to Admin/Staff.',
  })
  @ApiResponse({ status: 200, description: 'User list retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized access.' })
  @ApiResponse({ status: 403, description: 'Forbidden access.' })
  async findAll(@Query() query: FindUsersQueryDto) {
    return await this.usersService.findAll(query);
  }

  /**
   * Retrieves detailed information for a specific user.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID', description: 'Retrieves a single user by their unique UUID.' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully.', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found.', type: NotFoundErrorResponseDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return await this.usersService.findOne(id);
  }

  /**
   * Updates partial information for an existing user.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user', description: 'Updates specific fields of an existing user account.' })
  @ApiResponse({ status: 200, description: 'User successfully updated.', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found.', type: NotFoundErrorResponseDto })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    return await this.usersService.update(id, updateUserDto);
  }

  /**
   * Performs a soft delete on a user account.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Soft delete user',
    description: 'Deactivates a user account without removing data from the database. Restricted to Admin.',
  })
  @ApiResponse({ status: 200, description: 'User successfully deactivated.' })
  @ApiResponse({ status: 404, description: 'User not found.', type: NotFoundErrorResponseDto })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.usersService.softDelete(id);
    return { message: 'User deactivated successfully', id };
  }
}
