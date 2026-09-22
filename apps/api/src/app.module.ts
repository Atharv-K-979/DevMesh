import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { RoomGateway } from './room.gateway';
import { AuthController } from './auth.controller';
import { LiveKitController } from './livekit.controller';

@Module({
  imports: [],
  controllers: [AppController, AuthController, LiveKitController],
  providers: [RoomGateway],
})
export class AppModule {}
