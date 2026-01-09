import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Put, ParseIntPipe } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('add')
  addToCart(@Request() req, @Body() addToCartDto: AddToCartDto) {
    return this.cartService.addToCart(req.user.userId, addToCartDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.cartService.findAll(req.user.userId);
  }

  /*
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cartService.findOne(+id);
  }
  */

  @Put('update/:id')
  update(@Param('id', ParseIntPipe) id: number, @Request() req, @Body() updateCartDto: UpdateCartDto) {
    return this.cartService.update(id, updateCartDto, req.user.userId);
  }

  @Delete('remove/:id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.cartService.remove(id, req.user.userId);
  }
}
