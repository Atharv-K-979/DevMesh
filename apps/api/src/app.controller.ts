import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  getHealth(): { status: string; timestamp: number } {
    return {
      status: 'ok',
      timestamp: Date.now(),
    };
  }

  @Get()
  getHome(): { message: string; version: string } {
    return {
      message: 'DevMesh API Gateway',
      version: '1.0.0',
    };
  }
}
