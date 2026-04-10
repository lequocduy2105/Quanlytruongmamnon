import { Test, TestingModule } from '@nestjs/testing';
import { AcademicServiceController } from './academic-service.controller';
import { AcademicServiceService } from './academic-service.service';

describe('AcademicServiceController', () => {
  let academicServiceController: AcademicServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AcademicServiceController],
      providers: [AcademicServiceService],
    }).compile();

    academicServiceController = app.get<AcademicServiceController>(
      AcademicServiceController,
    );
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(academicServiceController.getHello()).toBe('Hello World!');
    });
  });
});
