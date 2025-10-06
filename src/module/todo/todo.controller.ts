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
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { TodoService } from './todo.service';
import { CreateTodoDto, TodoResponseDto, UpdateTodoDto } from './dto';

@ApiTags('todo')
@Controller('todo')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new todo' })
  @ApiCreatedResponse({
    description: 'Todo created successfully',
    type: TodoResponseDto,
  })
  async create(
    @Body() createTodoDto: CreateTodoDto,
  ): Promise<TodoResponseDto> {
    return this.todoService.create(createTodoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all todos' })
  @ApiOkResponse({
    description: 'Todos retrieved successfully',
    type: TodoResponseDto,
    isArray: true,
  })
  async findAll(): Promise<TodoResponseDto[]> {
    return this.todoService.findAll();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all todos by user id' })
  @ApiOkResponse({
    description: 'User todos retrieved successfully',
    type: TodoResponseDto,
    isArray: true,
  })
  async findAllByUser(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<TodoResponseDto[]> {
    return this.todoService.findAllByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get todo by id' })
  @ApiOkResponse({
    description: 'Todo retrieved successfully',
    type: TodoResponseDto,
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TodoResponseDto> {
    return this.todoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a todo' })
  @ApiOkResponse({
    description: 'Todo updated successfully',
    type: TodoResponseDto,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTodoDto: UpdateTodoDto,
  ): Promise<TodoResponseDto> {
    return this.todoService.update(id, updateTodoDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a todo' })
  @ApiNoContentResponse({ description: 'Todo deleted successfully' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.todoService.remove(id);
  }
}
