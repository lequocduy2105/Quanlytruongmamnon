import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';

@Injectable()
export class AuthServiceService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async validateLogin(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password_hash'> | null> {
    const user = await this.usersRepository.findOneBy({ email });
    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) return null;

    // Never return the password hash
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }

  async hashPassword(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, 10);
  }

  async createUser(data: { email: string; password?: string; role: string; mustChangePassword?: boolean }): Promise<Omit<User, 'password_hash'>> {
    if (!data || !data.email || data.email.trim() === '') {
      throw new Error('Email is required');
    }
    const password_hash = await this.hashPassword(data.password || '123456');
    const user = this.usersRepository.create({
      email: data.email,
      password_hash,
      role: data.role as any,
      mustChangePassword: data.mustChangePassword !== undefined ? data.mustChangePassword : true,
    });
    const saved = await this.usersRepository.save(user);
    const { password_hash: _, ...safeUser } = saved;
    return safeUser;
  }

  async deleteUser(userId: number): Promise<void> {
    await this.usersRepository.delete(userId);
  }

  async findUserByEmail(email: string): Promise<Omit<User, 'password_hash'> | null> {
    const user = await this.usersRepository.findOneBy({ email });
    if (!user) return null;
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }

  async changePasswordFirstTime(userId: number, oldPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new Error('Không tìm thấy tài khoản người dùng.');
    }
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Mật khẩu cũ không chính xác.');
    }
    const password_hash = await this.hashPassword(newPassword);
    user.password_hash = password_hash;
    user.mustChangePassword = false;
    await this.usersRepository.save(user);
    return true;
  }

  async resetPassword(userId: number, newPassword: string): Promise<boolean> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new Error('Không tìm thấy tài khoản người dùng.');
    }
    const password_hash = await this.hashPassword(newPassword);
    user.password_hash = password_hash;
    user.mustChangePassword = true;
    await this.usersRepository.save(user);
    return true;
  }

  async findUserById(id: number): Promise<Omit<User, 'password_hash'> | null> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) return null;
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }

  async updateUserEmail(userId: number, newEmail: string): Promise<boolean> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new Error('Không tìm thấy tài khoản.');
    user.email = newEmail;
    await this.usersRepository.save(user);
    return true;
  }
}
