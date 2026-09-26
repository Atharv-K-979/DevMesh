import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: Date.now(),
    };
  }

  @Get()
  getHome() {
    return {
      message: 'DevMesh API Gateway',
      version: '1.0.0',
    };
  }
}
