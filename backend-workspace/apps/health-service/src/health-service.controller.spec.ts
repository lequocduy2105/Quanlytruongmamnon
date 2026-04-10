import { Test, TestingModule } from '@nestjs/testing';
import { HealthServiceController } from './health-service.controller';
import { HealthServiceService } from './health-service.service';

describe('HealthServiceController', () => {
  let healthServiceController: HealthServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [HealthServiceController],
      providers: [HealthServiceService],
    }).compile();

    healthServiceController = app.get<HealthServiceController>(
      HealthServiceController,
    );
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(healthServiceController.getHello()).toBe('Hello World!');
    });
  });
});
