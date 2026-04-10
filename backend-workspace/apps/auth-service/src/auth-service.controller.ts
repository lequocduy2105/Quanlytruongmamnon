import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthServiceService } from './auth-service.service';

@Controller()
export class AuthServiceController {
  constructor(private readonly authServiceService: AuthServiceService) {}

  @MessagePattern({ cmd: 'verify_login' })
  async verifyLogin(@Payload() data: any) {
    const user = await this.authServiceService.validateLogin(
      data.email,
      data.password,
    );
    if (user) {
      return { id: user.id, email: user.email, role: user.role };
    }
    return null;
  }
}
