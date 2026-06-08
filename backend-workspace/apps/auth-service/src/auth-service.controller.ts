import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
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
      return { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      };
    }
    return null;
  }

  @MessagePattern({ cmd: 'change_password_first_time' })
  async changePasswordFirstTime(@Payload() data: any) {
    try {
      await this.authServiceService.changePasswordFirstTime(
        data.userId,
        data.oldPassword,
        data.newPassword,
      );
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  @MessagePattern({ cmd: 'check_email_exists' })
  async checkEmailExists(@Payload() data: { email: string }) {
    if (!data || !data.email) {
      return false;
    }
    const user = await this.authServiceService.findUserByEmail(data.email);
    return !!user;
  }

  @MessagePattern({ cmd: 'create_user' })
  async createUser(@Payload() data: { email: string; password?: string; role: string; mustChangePassword?: boolean }) {
    if (!data || !data.email || data.email.trim() === '') {
      throw new RpcException('Email (phone number) is required to create a user');
    }
    const user = await this.authServiceService.createUser(data);
    return { id: user.id, userId: user.id };
  }

  @MessagePattern({ cmd: 'rollback_user' })
  async rollbackUser(@Payload() data: { userId: number }) {
    return this.authServiceService.deleteUser(data.userId);
  }

  @MessagePattern({ cmd: 'find_user_by_email' })
  async findUserByEmail(@Payload() data: { email: string }) {
    return this.authServiceService.findUserByEmail(data.email);
  }

  @MessagePattern({ cmd: 'find_user_by_id' })
  async findUserById(@Payload() data: { id: number }) {
    return this.authServiceService.findUserById(data.id);
  }

  @MessagePattern({ cmd: 'reset_password' })
  async resetPassword(@Payload() data: { userId: number; newPassword: string }) {
    try {
      await this.authServiceService.resetPassword(data.userId, data.newPassword);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  @MessagePattern({ cmd: 'update_user_email' })
  async updateUserEmail(@Payload() data: { userId: number; newEmail: string }) {
    try {
      await this.authServiceService.updateUserEmail(data.userId, data.newEmail);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
