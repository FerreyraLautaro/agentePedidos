import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { AuthService } from './auth.service.js';
import { loginBodySchema, registerBodySchema, type LoginBody, type RegisterBody } from './dto/credentials.body.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body(new ZodValidationPipe(registerBodySchema)) body: RegisterBody) {
    return this.authService.register(body.email, body.password);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body(new ZodValidationPipe(loginBodySchema)) body: LoginBody) {
    return this.authService.login(body.email, body.password);
  }
}
