import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { RoomGateway } from './room.gateway';
import { AuthController } from './auth.controller';
import { LiveKitController } from './livekit.controller';
import { RecordingsController } from './recordings.controller';
import { PersistenceController } from './persistence.controller';

@Module({
  imports: [],
  controllers: [
    AppController,
    AuthController,
    LiveKitController,
    RecordingsController,
    PersistenceController,
  ],
  providers: [RoomGateway],
})
export class AppModule {}
