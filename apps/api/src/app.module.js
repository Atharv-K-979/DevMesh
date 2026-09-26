import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { RoomGateway } from './room.gateway.js';
import { AuthController } from './auth.controller.js';
import { LiveKitController } from './livekit.controller.js';
import { RecordingsController } from './recordings.controller.js';
import { PersistenceController } from './persistence.controller.js';
import { AiController } from './ai.controller.js';
import { RunnerController } from './runner.controller.js';
import { SnippetsController } from './snippets.controller.js';

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
