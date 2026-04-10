import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HealthRecord } from './entities/health-record.entity';

@Injectable()
export class HealthServiceService {
  constructor(
    @InjectRepository(HealthRecord)
    private healthRepo: Repository<HealthRecord>,
  ) {}

  async submitVitals(data: any) {
    const newRecord = this.healthRepo.create({
      studentId: data.studentId,
      weight: data.weight,
      height: data.height,
      heart_rate: data.heartRate,
      bmi_value: data.bmi,
      doctor_note: data.note,
    });
    return this.healthRepo.save(newRecord);
  }

  async getHealthStats() {
    const records = await this.healthRepo.find();
    let normal = 0,
      under = 0,
      over = 0;

    /**
     * Ngưỡng BMI theo chuẩn WHO cho trẻ mầm non (3–6 tuổi):
     * - Thiếu cân (Underweight): BMI < 14.5
     * - Bình thường (Normal):    14.5 ≤ BMI < 17.5
     * - Thừa cân (Overweight):   BMI ≥ 17.5
     * (Thay thế ngưỡng người lớn 18.5 cũ — LOGIC-03 fix)
     */
    records.forEach((r) => {
      const bmi = Number(r.bmi_value);
      if (!bmi || isNaN(bmi)) return; // bỏ qua record không có BMI
      if (bmi < 14.5) under++;
      else if (bmi >= 17.5) over++;
      else normal++;
    });

    const total = records.length || 1; // tránh chia 0
    return {
      normal,
      under,
      over,
      normalPercentage: Math.round((normal / total) * 100),
    };
  }

  async getVitals(studentId?: number) {
    if (studentId) {
      return this.healthRepo.find({
        where: { studentId },
        order: { logged_at: 'DESC' },
      });
    }
    return this.healthRepo.find({
      order: { logged_at: 'DESC' },
    });
  }
}
