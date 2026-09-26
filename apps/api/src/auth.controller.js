import { Controller, Post, Get, Body, Headers, UnauthorizedException } from '@nestjs/common';

@Controller('api/auth')
export class AuthController {
  @Post('login')
  login(@Body() body) {
    const username = body.username || 'Guest';
    const id = `usr_${Math.random().toString(36).substring(2, 9)}`;
    const token = `jwt_token_${id}_${Date.now()}`;

    return {
      token,
      user: {
        id,
        username,
      },
    };
  }

  @Get('verify')
  verify(@Headers('authorization') authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }
    const token = authHeader.replace('Bearer ', '');
    return { valid: true, token };
  }
}
