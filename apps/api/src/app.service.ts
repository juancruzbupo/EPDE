import { Injectable } from '@nestjs/common';
import { APP_NAME, API_VERSION } from '@epde/shared';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      app: APP_NAME,
      version: API_VERSION,
    };
  }
}
