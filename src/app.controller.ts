import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class AppController {
  @Get()
  root(@Res() res: Response) {
    return res.redirect('/api');
  }
}
