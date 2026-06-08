import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { HealthServiceService } from './health-service.service';

@Controller()
export class HealthServiceController {
  constructor(private readonly healthServiceService: HealthServiceService) {}

  // ═══════════════════════════════════════════════════════
  // VITALS
  // ═══════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════
  // MEDICATIONS — Di chuyển từ academic-service
  // ═══════════════════════════════════════════════════════

  @MessagePattern({ cmd: 'get_medications_today' })
  getMedicationsToday() {
    return this.healthServiceService.getTodayMedications();
  }

  @MessagePattern({ cmd: 'get_student_medications' })
  getStudentMedications(@Payload() data: { studentId: number }) {
    return this.healthServiceService.getMedicationsByStudent(data.studentId);
  }

  @MessagePattern({ cmd: 'get_medications_by_class' })
  getMedicationsByClass(@Payload() data: { classId: number }) {
    return this.healthServiceService.getMedicationsByClass(data.classId);
  }

  @MessagePattern({ cmd: 'create_medication' })
  createMedication(@Payload() data: Record<string, unknown>) {
    return this.healthServiceService.createMedicationSchedule(data as any);
  }

  @MessagePattern({ cmd: 'log_medication_given' })
  logMedicationGiven(@Payload() data: Record<string, unknown>) {
    return this.healthServiceService.logMedicationGiven(data as any);
  }

  @MessagePattern({ cmd: 'get_medication_logs' })
  getMedicationLogs(@Payload() data: { studentId: number }) {
    return this.healthServiceService.getMedicationLogs(data.studentId);
  }

  // ═══════════════════════════════════════════════════════
  // INCIDENT REPORTS — Di chuyển từ academic-service
  // ═══════════════════════════════════════════════════════

  @MessagePattern({ cmd: 'create_incident_report' })
  createIncidentReport(@Payload() data: Record<string, unknown>) {
    return this.healthServiceService.createIncidentReport(data as any);
  }

  @MessagePattern({ cmd: 'get_incidents_by_teacher' })
  getIncidentsByTeacher(@Payload() data: { teacherId: number }) {
    return this.healthServiceService.getIncidentsByTeacher(data.teacherId);
  }

  @MessagePattern({ cmd: 'get_incidents_by_student' })
  getIncidentsByStudent(@Payload() data: { studentId: number }) {
    return this.healthServiceService.getIncidentsByStudent(data.studentId);
  }

  @MessagePattern({ cmd: 'get_incidents_admin' })
  getIncidentsAdmin(
    @Payload()
    data: {
      severity?: string;
      studentId?: number;
      limit?: number;
    },
  ) {
    return this.healthServiceService.getIncidentsAdmin(data);
  }

  @MessagePattern({ cmd: 'acknowledge_incident' })
  acknowledgeIncident(@Payload() data: { id: number; parentUserId: number }) {
    return this.healthServiceService.acknowledgeIncident(
      data.id,
      data.parentUserId,
    );
  }

  @MessagePattern({ cmd: 'review_incident' })
  reviewIncident(@Payload() data: { id: number; adminUserId: number }) {
    return this.healthServiceService.reviewIncident(data.id, data.adminUserId);
  }
}
