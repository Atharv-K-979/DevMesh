import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { RoomGateway } from './room.gateway';
import { AuthController } from './auth.controller';
import { LiveKitController } from './livekit.controller';
import { RecordingsController } from './recordings.controller';
import { PersistenceController } from './persistence.controller';
import { AiController } from './ai.controller';
import { RunnerController } from './runner.controller';
import { SnippetsController } from './snippets.controller';

@Module({
  imports: [],
  controllers: [
    AppController,
    AuthController,
    LiveKitController,
    RecordingsController,
    PersistenceController,
    AiController,
    RunnerController,
    SnippetsController,
  ],
  providers: [RoomGateway],
})
export class AppModule {}
