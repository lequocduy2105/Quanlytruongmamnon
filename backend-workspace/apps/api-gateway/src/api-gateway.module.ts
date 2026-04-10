import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { JwtStrategy } from './auth/jwt.strategy';

@Module({
  imports: [
    // Load .env from workspace root using absolute path
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `${process.cwd()}/.env`,
    }),

    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JWT using env variable - never hardcode secrets
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '8h') as any,
        },
      }),
    }),

    // Microservice TCP clients
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3001 },
      },
      {
        name: 'ACADEMIC_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3002 },
      },
      {
        name: 'HEALTH_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3003 },
      },
    ]),
  ],
  controllers: [ApiGatewayController],
  providers: [ApiGatewayService, JwtStrategy],
})
export class ApiGatewayModule {}
