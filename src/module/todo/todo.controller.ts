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
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Todo } from '@prisma/client';

import { TodoService } from './todo.service';
import { CreateTodoDto, UpdateTodoDto } from './dto';
import { TodoEntity } from './entities/todo.entity';

@ApiTags('todo')
@Controller('todo')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new todo' })
  @ApiCreatedResponse({
    description: 'Todo created successfully',
    type: TodoEntity,
  })
  async create(@Body() createTodoDto: CreateTodoDto): Promise<Todo> {
    return this.todoService.create(createTodoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all todos' })
  @ApiOkResponse({
    description: 'Todos retrieved successfully',
    type: [TodoEntity],
  })
  async findAll(): Promise<Todo[]> {
    return this.todoService.findAll();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all todos by user id' })
  @ApiOkResponse({
    description: 'User todos retrieved successfully',
    type: [TodoEntity],
  })
  async findAllByUser(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Todo[]> {
    return this.todoService.findAllByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get todo by id' })
  @ApiOkResponse({
    description: 'Todo retrieved successfully',
    type: TodoEntity,
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Todo> {
    return this.todoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a todo' })
  @ApiOkResponse({
    description: 'Todo updated successfully',
    type: TodoEntity,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTodoDto: UpdateTodoDto,
  ): Promise<Todo> {
    return this.todoService.update(id, updateTodoDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a todo' })
  @ApiOkResponse({
    description: 'Todo deleted successfully',
    type: TodoEntity,
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<Todo> {
    return this.todoService.remove(id);
  }
}
