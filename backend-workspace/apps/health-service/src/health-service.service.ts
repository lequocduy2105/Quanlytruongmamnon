import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HealthRecord } from './entities/health-record.entity';
import { MedicationSchedule } from './entities/medication-schedule.entity';
import { MedicationLog } from './entities/medication-log.entity';
import { IncidentReport } from './entities/incident-report.entity';

@Injectable()
export class HealthServiceService {
  constructor(
    @InjectRepository(HealthRecord)
    private healthRepo: Repository<HealthRecord>,

    @InjectRepository(MedicationSchedule)
    private medScheduleRepo: Repository<MedicationSchedule>,

    @InjectRepository(MedicationLog)
    private medLogRepo: Repository<MedicationLog>,

    @InjectRepository(IncidentReport)
    private incidentRepo: Repository<IncidentReport>,
  ) {}

  // ═══════════════════════════════════════════════════════════
  // VITALS (đã có sẵn)
  // ═══════════════════════════════════════════════════════════

  async submitVitals(data: any) {
    // Tự tính BMI nếu frontend không gửi — tránh crash NOT NULL khi thiếu trường
    const computedBmi: number =
      data.bmi ?? parseFloat(
        (data.weight / Math.pow(data.height / 100, 2)).toFixed(2),
      );
    const newRecord = this.healthRepo.create({
      studentId: data.studentId,
      weight: data.weight,
      height: data.height,
      heart_rate: data.heartRate,
      bmi_value: computedBmi,
      doctor_note: data.note,
    });
    return this.healthRepo.save(newRecord);
  }

  async getHealthStats() {
    const records = await this.healthRepo.find();
    let normal = 0, under = 0, over = 0;

    /**
     * Ngưỡng BMI theo chuẩn WHO cho trẻ mầm non (3–6 tuổi):
     * - Thiếu cân (Underweight): BMI < 14.5
     * - Bình thường (Normal):    14.5 ≤ BMI < 17.5
     * - Thừa cân (Overweight):   BMI ≥ 17.5
     */
    records.forEach((r) => {
      const bmi = Number(r.bmi_value);
      if (!bmi || isNaN(bmi)) return;
      if (bmi < 14.5) under++;
      else if (bmi >= 17.5) over++;
      else normal++;
    });

    const total = normal + under + over;
    return {
      normal,
      under,
      over,
      total,
      normalPercentage: total > 0 ? Math.round((normal / total) * 100) : 0,
    };
  }

  async getVitals(studentId?: number) {
    if (studentId) {
      return this.healthRepo.find({
        where: { studentId },
        order: { logged_at: 'DESC' },
      });
    }
    return this.healthRepo.find({ order: { logged_at: 'DESC' } });
  }

  // ═══════════════════════════════════════════════════════════
  // MEDICATIONS — Di chuyển từ academic-service
  // ═══════════════════════════════════════════════════════════

  /** Lấy danh sách đơn thuốc còn hiệu lực hôm nay */
  async getTodayMedications() {
    const today = new Date().toISOString().split('T')[0];
    return this.medScheduleRepo
      .createQueryBuilder('m')
      .where('m.is_active = :active', { active: true })
      .andWhere('m.start_date <= :today', { today })
      .andWhere('(m.end_date IS NULL OR m.end_date >= :today)', { today })
      .orderBy('m.student_id', 'ASC')
      .getMany();
  }

  /** Lấy lịch thuốc của một học sinh */
  async getMedicationsByStudent(studentId: number) {
    return this.medScheduleRepo.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
    });
  }

  /** Lấy lịch thuốc theo lớp (dùng JOIN với bảng students) */
  async getMedicationsByClass(classId: number) {
    return this.medScheduleRepo
      .createQueryBuilder('m')
      .innerJoin('students', 's', 's.id = m.student_id AND s.class_id = :classId', { classId })
      .where('m.is_active = :active', { active: true })
      .orderBy('m.student_id', 'ASC')
      .getMany();
  }

  /** Phụ huynh tạo đơn thuốc mới */
  async createMedicationSchedule(data: {
    studentId: number;
    medicationName: string;
    dosage: string;
    frequency: string;
    timeMorning?: string;
    timeNoon?: string;
    timeAfternoon?: string;
    startDate: string;
    endDate?: string;
    prescriptionNote?: string;
    prescriptionUrl?: string;
    createdBy?: number;
  }) {
    const schedule = this.medScheduleRepo.create({
      studentId: data.studentId,
      medicationName: data.medicationName,
      dosage: data.dosage,
      frequency: data.frequency as any,
      timeMorning: data.timeMorning ?? null,
      timeNoon: data.timeNoon ?? null,
      timeAfternoon: data.timeAfternoon ?? null,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      prescriptionNote: data.prescriptionNote ?? null,
      prescriptionUrl: data.prescriptionUrl ?? null,
      createdBy: data.createdBy ?? null,
      isActive: true,
    });
    return this.medScheduleRepo.save(schedule);
  }

  /** Giáo viên xác nhận đã cho học sinh uống thuốc */
  async logMedicationGiven(data: {
    scheduleId: number;
    studentId: number;
    administeredBy?: number;
    status?: string;
    note?: string;
  }) {
    const log = this.medLogRepo.create({
      scheduleId: data.scheduleId,
      studentId: data.studentId,
      administeredBy: data.administeredBy ?? null,
      status: (data.status as any) ?? 'given',
      note: data.note ?? null,
    });
    return this.medLogRepo.save(log);
  }

  /** Lấy lịch sử cho uống thuốc của một học sinh */
  async getMedicationLogs(studentId: number) {
    return this.medLogRepo.find({
      where: { studentId },
      order: { administeredAt: 'DESC' },
    });
  }

  // ═══════════════════════════════════════════════════════════
  // INCIDENT REPORTS — Di chuyển từ academic-service
  // ═══════════════════════════════════════════════════════════

  /** Giáo viên tạo biên bản sự cố */
  async createIncidentReport(data: {
    studentId: number;
    teacherId: number;
    incidentType?: string;
    severity?: string;
    description: string;
    firstAidTaken?: string;
    attachmentUrl?: string;
    adminUserIds?: number[];
  }) {
    const report = this.incidentRepo.create({
      studentId: data.studentId,
      teacherId: data.teacherId,
      incidentType: (data.incidentType as any) ?? 'OTHER',
      severity: (data.severity as any) ?? 'LOW',
      description: data.description,
      firstAidTaken: data.firstAidTaken ?? null,
      attachmentUrl: data.attachmentUrl ?? null,
    });
    return this.incidentRepo.save(report);
  }

  /** Giáo viên xem biên bản do mình tạo */
  async getIncidentsByTeacher(teacherId: number) {
    return this.incidentRepo.find({
      where: { teacherId },
      order: { createdAt: 'DESC' },
    });
  }

  /** Xem tất cả sự cố liên quan đến một học sinh */
  async getIncidentsByStudent(studentId: number) {
    return this.incidentRepo.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
    });
  }

  /** BGH xem tất cả sự cố, có filter */
  async getIncidentsAdmin(filters: {
    severity?: string;
    studentId?: number;
    limit?: number;
  }) {
    const qb = this.incidentRepo
      .createQueryBuilder('i')
      .orderBy('i.created_at', 'DESC');

    if (filters.severity) {
      qb.andWhere('i.severity = :severity', { severity: filters.severity });
    }
    if (filters.studentId) {
      qb.andWhere('i.student_id = :studentId', { studentId: filters.studentId });
    }
    if (filters.limit) {
      qb.take(filters.limit);
    }
    return qb.getMany();
  }

  /** Phụ huynh xác nhận đã đọc biên bản sự cố */
  async acknowledgeIncident(id: number, _parentUserId: number) {
    const report = await this.incidentRepo.findOne({ where: { id } });
    if (!report) return { error: 'Không tìm thấy biên bản sự cố.' };
    report.parentAcknowledgedAt = new Date();
    return this.incidentRepo.save(report);
  }

  /** BGH đánh dấu đã review sự cố */
  async reviewIncident(id: number, _adminUserId: number) {
    const report = await this.incidentRepo.findOne({ where: { id } });
    if (!report) return { error: 'Không tìm thấy biên bản sự cố.' };
    report.principalReviewedAt = new Date();
    return this.incidentRepo.save(report);
  }
}
