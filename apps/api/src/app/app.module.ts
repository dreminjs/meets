import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { StreamModule } from '../stream/stream.module';

@Module({
  imports: [StreamModule],
  controllers: [AppController],
})
export class AppModule {}
