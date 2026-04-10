import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { HealthServiceService } from './health-service.service';

@Controller()
export class HealthServiceController {
  constructor(private readonly healthServiceService: HealthServiceService) {}

  @MessagePattern({ cmd: 'submit_vitals' })
  submitVitals(@Payload() data: any) {
    return this.healthServiceService.submitVitals(data);
  }

  @MessagePattern({ cmd: 'get_health_stats' })
  getHealthStats() {
    return this.healthServiceService.getHealthStats();
  }

  @MessagePattern({ cmd: 'get_health_vitals' })
  getVitals(@Payload() payload: { studentId?: number | null }) {
    return this.healthServiceService.getVitals(payload?.studentId ?? undefined);
  }
}
