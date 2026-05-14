import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User, UserRole } from '@prisma/client';
import { GetUser } from '@common/decorators/get-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create order from cart' })
  createOrder(@GetUser() user: User, @Body() dto: CreateOrderDto) {
    return this.orderService.createOrder(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List orders (user sees own, staff/admin see all)' })
  findAll(@GetUser() user: User) {
    return this.orderService.findAll(user.id, user.role as UserRole);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  findOne(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.orderService.findOne(id, user.id, user.role as UserRole);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(@GetUser() user: User, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOrderStatusDto) {
    return this.orderService.updateStatus(id, user.id, user.role as UserRole, dto);
  }
}
