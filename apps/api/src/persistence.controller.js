import { Controller, Post, Get, Body, Param } from '@nestjs/common';

@Controller('api/persistence')
export class PersistenceController {
  snapshotDatabase = new Map();

  @Post('snapshot')
  saveSnapshot(@Body() body) {
    const key = `${body.roomId}:${body.documentName}`;
    const record = {
      ...body,
      updatedAt: Date.now(),
    };
    this.snapshotDatabase.set(key, record);
    return { success: true, updatedAt: record.updatedAt };
  }

  @Get('snapshot/:roomId/:documentName')
  getSnapshot(@Param('roomId') roomId, @Param('documentName') documentName) {
    const key = `${roomId}:${documentName}`;
    const found = this.snapshotDatabase.get(key);
    if (!found) {
      return { snapshot: null };
    }
    return found;
  }
}
