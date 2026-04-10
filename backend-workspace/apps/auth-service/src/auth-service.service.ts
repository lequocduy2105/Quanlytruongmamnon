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
}
