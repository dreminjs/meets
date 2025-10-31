import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get("check-health")
  getData(): string {
    return "hello"
  }
}
