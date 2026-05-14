import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User, UserRole } from '@prisma/client';
import { GetUser } from '@common/decorators/get-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @ApiOperation({ summary: 'Create payment for an order' })
  createPayment(@GetUser() user: User, @Body() dto: CreatePaymentDto) {
    return this.paymentService.createPayment(user.id, dto);
  }

  @Patch(':id/confirm')
  @UseGuards(RolesGuard)
  @Roles(UserRole.staff, UserRole.admin)
  @ApiOperation({ summary: 'Confirm payment (staff/admin)' })
  confirmPayment(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.paymentService.confirmPayment(id, user.role as UserRole);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'List payments for an order' })
  findByOrder(@GetUser() user: User, @Param('orderId', ParseIntPipe) orderId: number) {
    return this.paymentService.findByOrder(orderId, user.id, user.role as UserRole);
  }
}
