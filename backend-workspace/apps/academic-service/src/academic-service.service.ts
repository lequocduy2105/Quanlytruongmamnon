import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, In } from 'typeorm';
import { Teacher } from './entities/teacher.entity';
import { Classroom } from './entities/classroom.entity';
import { Student } from './entities/student.entity';
import { SkillAssessment } from './entities/skill-assessment.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { Feedback } from './entities/feedback.entity';
import { Attendance, AttendanceStatus } from './entities/attendance.entity';
import { AuthorizedPickup } from './entities/authorized-pickup.entity';
import { FeeConfig } from './entities/fee-config.entity';
import { Invoice } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';
import { Notification, NotificationType } from './entities/notification.entity';
import { MedicationSchedule } from './entities/medication-schedule.entity';
import { MedicationLog } from './entities/medication-log.entity';
import {
  IncidentReport,
  IncidentType,
  IncidentSeverity,
} from './entities/incident-report.entity';
import { LeaveRequest, LeaveStatus } from './entities/leave-request.entity';
import {
  SupportTicket,
  TicketCategory,
  TicketStatus,
} from './entities/support-ticket.entity';
import { DailyMenu } from './entities/daily-menu.entity';

@Injectable()
export class AcademicServiceService {
  constructor(
    @InjectRepository(Teacher)
    private readonly teacherRepo: Repository<Teacher>,
    @InjectRepository(Classroom)
    private readonly classRepo: Repository<Classroom>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(SkillAssessment)
    private readonly skillRepo: Repository<SkillAssessment>,
    @InjectRepository(ActivityLog)
    private readonly activityLogRepo: Repository<ActivityLog>,
    @InjectRepository(Feedback)
    private readonly feedbackRepo: Repository<Feedback>,
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
    @InjectRepository(AuthorizedPickup)
    private readonly pickupRepo: Repository<AuthorizedPickup>,
    @InjectRepository(FeeConfig)
    private readonly feeConfigRepo: Repository<FeeConfig>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
    @InjectRepository(MedicationSchedule)
    private readonly medScheduleRepo: Repository<MedicationSchedule>,
    @InjectRepository(MedicationLog)
    private readonly medLogRepo: Repository<MedicationLog>,
    @InjectRepository(IncidentReport)
    private readonly incidentRepo: Repository<IncidentReport>,
    @InjectRepository(LeaveRequest)
    private readonly leaveRequestRepo: Repository<LeaveRequest>,
    @InjectRepository(SupportTicket)
    private readonly ticketRepo: Repository<SupportTicket>,
    @InjectRepository(DailyMenu)
    private readonly dailyMenuRepo: Repository<DailyMenu>,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // TEACHER — Lớp học & Dashboard
  // ═══════════════════════════════════════════════════════════════════════════

  /** Teacher lookup by auth userId (for teacher-specific routes) */
  async getTeacherByUserId(userId: number) {
    return this.teacherRepo.findOne({
      where: { userId },
      relations: ['classroom'],
    });
  }

  /** Teacher lookup by primary key ID (for gatekeeper contexts) */
  async getTeacherById(teacherId: number) {
    return this.teacherRepo.findOne({
      where: { id: teacherId },
      relations: ['classroom'],
    });
  }

  /**
   * Lookup classroom mà teacher đang phụ trách, dựa trên classrooms.teacher_id.
   * Dùng raw SQL để tránh mọi vấn đề mapping TypeORM relation.
   * Đây là nguồn dữ liệu chính xác nhất.
   */
  async getClassroomByTeacherId(teacherId: number) {
    const rows: { id: number; name: string; teacher_id: number }[] =
      await this.classRepo.manager.query(
        'SELECT id, name, teacher_id FROM classrooms WHERE teacher_id = ? LIMIT 1',
        [teacherId],
      );
    if (!rows || rows.length === 0) return null;
    return { id: rows[0].id, name: rows[0].name };
  }

  /**
   * Lấy thông tin lớp + danh sách học sinh mà giáo viên phụ trách.
   * Dùng teacher.classId thay vì heuristic cũ.
   */
  async getTeacherClass(userId?: number, teacherId?: number) {
    let teacher: Teacher | null = null;

    if (teacherId) {
      teacher = await this.teacherRepo.findOne({ where: { id: teacherId } });
    } else if (userId) {
      teacher = await this.teacherRepo.findOne({ where: { userId } });
    }

    if (!teacher) return null;

    // Use classroom's teacher relation because teacher.classId might be inconsistently null in DB
    const classroom = await this.classRepo.findOne({
      where: [{ id: teacher.classId ?? undefined }, { teacher: { id: teacher.id } }],
      relations: ['students'],
    });
    return classroom;
  }

  /**
   * Danh sách người ủy quyền đón trẻ của tất cả học sinh trong lớp — hôm nay.
   * Giáo viên dùng để đối chiếu khi bàn giao buổi chiều.
   */
  async getClassPickupsToday(classId: number) {
    const today = new Date().toISOString().split('T')[0];
    // Lấy danh sách học sinh của lớp
    const students = await this.studentRepo.find({
      where: { classroom: { id: classId } },
      relations: ['classroom'],
    });
    const studentIds = students.map((s) => s.id);
    if (studentIds.length === 0) return [];

    // Lấy ủy quyền còn hiệu lực hôm nay
    const pickups = await this.pickupRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.student', 's')
      .where('p.studentId IN (:...ids)', { ids: studentIds })
      .andWhere('(p.validFrom IS NULL OR p.validFrom <= :today)', { today })
      .andWhere('(p.validUntil IS NULL OR p.validUntil >= :today)', { today })
      .orderBy('s.full_name', 'ASC')
      .getMany();

    return pickups;
  }

  /**
   * Cập nhật thông tin khẩn cấp của học sinh (Admin sử dụng).
   */
  async updateStudentEmergencyInfo(
    studentId: number,
    data: {
      allergy_severity?: string;
      emergency_action?: string;
      emergency_contact_name?: string;
      emergency_contact_phone?: string;
      emergency_contact_relation?: string;
      blood_type?: string;
      medical_notes?: string;
      allergy_tags?: string[];
    },
  ) {
    await this.studentRepo.update(studentId, data as Partial<Student>);
    return this.studentRepo.findOne({ where: { id: studentId } });
  }

  /**
   * Danh sách thuốc cần cho uống hôm nay cho một lớp cụ thể.
   * Trả về schedule + tên học sinh, dùng để hiển thị banner trên Teacher Dashboard.
   */
  async getMedicationsByClass(classId: number) {
    const today = new Date().toISOString().split('T')[0];
    const students = await this.studentRepo.find({
      where: { classroom: { id: classId } },
    });
    const studentIds = students.map((s) => s.id);
    if (studentIds.length === 0) return [];

    const schedules = await this.medScheduleRepo
      .createQueryBuilder('ms')
      .where('ms.studentId IN (:...ids)', { ids: studentIds })
      .andWhere('ms.isActive = true')
      .andWhere('ms.startDate <= :today', { today })
      .andWhere('(ms.endDate IS NULL OR ms.endDate >= :today)', { today })
      .getMany();

    // Gắn tên học sinh vào kết quả
    const studentMap = new Map(students.map((s) => [s.id, s.full_name]));
    return schedules.map((s) => ({
      ...s,
      studentName: studentMap.get(s.studentId) || 'Không xác định',
    }));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DAILY MENU — Thực Đơn
  // ═══════════════════════════════════════════════════════════════════════════

  /** Lấy thực đơn theo ngày (toàn trường + riêng lớp nếu có) */
  async getDailyMenu(date: string) {
    const menus = await this.dailyMenuRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.classroom', 'c')
      .where('m.menu_date = :date', { date })
      .orderBy('m.classId', 'ASC')
      .getMany();
    return menus;
  }

  /** Tạo thực đơn ngày mới + tự động phát hiện xung đột dị ứng */
  async createDailyMenu(data: {
    menu_date: string;
    classId?: number | null;
    breakfast_main?: string;
    breakfast_ingredients?: string;
    lunch_main?: string;
    lunch_soup?: string;
    lunch_ingredients?: string;
    snack_main?: string;
    snack_ingredients?: string;
    notes?: string;
    createdBy: number;
  }) {
    const menu = this.dailyMenuRepo.create(data);
    const saved = await this.dailyMenuRepo.save(menu);

    // Kiểm tra xung đột dị ứng sau khi lưu
    const allergyWarnings = await this._checkMenuAllergyConflicts(saved);
    return { menu: saved, allergyWarnings };
  }

  /** Cập nhật thực đơn */
  async updateDailyMenu(
    id: number,
    data: {
      breakfast_main?: string;
      breakfast_ingredients?: string;
      lunch_main?: string;
      lunch_soup?: string;
      lunch_ingredients?: string;
      snack_main?: string;
      snack_ingredients?: string;
      notes?: string;
    },
  ) {
    await this.dailyMenuRepo.update(id, data);
    const updated = await this.dailyMenuRepo.findOne({ where: { id } });
    if (!updated) return null;
    const allergyWarnings = await this._checkMenuAllergyConflicts(updated);
    return { menu: updated, allergyWarnings };
  }

  /**
   * Kiểm tra thực đơn xem có thành phần nào khớp với dị ứng học sinh không.
   * Trả về danh sách cảnh báo: [{ studentName, allergen, severity }]
   */
  private async _checkMenuAllergyConflicts(menu: DailyMenu) {
    const allIngredients = [
      menu.breakfast_ingredients,
      menu.lunch_ingredients,
      menu.snack_ingredients,
    ]
      .filter(Boolean)
      .join(',');
    if (!allIngredients) return [];

    // Lấy học sinh có dị ứng (không phải NONE)
    const students = await this.studentRepo
      .createQueryBuilder('s')
      .where('s.allergy_severity != :none', { none: 'NONE' })
      .andWhere('s.allergy_tags IS NOT NULL')
      .getMany();

    const warnings: {
      studentName: string;
      allergen: string;
      severity: string;
    }[] = [];
    const ingredientLower = allIngredients.toLowerCase();

    for (const student of students) {
      if (!student.allergy_tags) continue;
      for (const tag of student.allergy_tags) {
        if (ingredientLower.includes(tag.toLowerCase())) {
          warnings.push({
            studentName: student.full_name,
            allergen: tag,
            severity: student.allergy_severity,
          });
        }
      }
    }
    return warnings;
  }

  async getDashboardStats() {
    const [
      teachers,
      students,
      classrooms,
      assessments,
      deficiencies,
      feedbackList,
    ] = await Promise.all([
      this.teacherRepo.count(),
      this.studentRepo.count(),
      this.classRepo.count(),
      this.skillRepo.count(),
      this.skillRepo.count({ where: { deficiency_log: Not(IsNull()) } }),
      this.feedbackRepo.find({ select: ['rating'] }),
    ]);

    // Rating thật từ bảng feedbacks
    const rating =
      feedbackList.length > 0
        ? Math.round(
            (feedbackList.reduce((sum, f) => sum + Number(f.rating), 0) /
              feedbackList.length) *
              10,
          ) / 10
        : 0;

    return {
      teachers,
      students,
      classrooms,
      assessments,
      deficiencies,
      rating,
      ratingCount: feedbackList.length,
    };
  }

  /**
   * getAllFeedbacks — Lấy toàn bộ đánh giá phụ huynh kèm thông tin giáo viên/học sinh
   */
  async getAllFeedbacks() {
    const feedbacks = await this.feedbackRepo.find({
      order: { submittedAt: 'DESC' },
    });

    // Gắn tên giáo viên và học sinh nếu có
    const enriched = await Promise.all(
      feedbacks.map(async (f) => {
        let teacherName: string | null = null;
        let studentName: string | null = null;

        if (f.teacherId) {
          const teacher = await this.teacherRepo.findOne({
            where: { id: f.teacherId },
            select: ['full_name'],
          });
          teacherName = teacher?.full_name ?? null;
        }
        if (f.studentId) {
          const student = await this.studentRepo.findOne({
            where: { id: f.studentId },
            select: ['full_name'],
          });
          studentName = student?.full_name ?? null;
        }

        return {
          id: f.id,
          rating: Number(f.rating),
          comment: f.comment,
          teacherId: f.teacherId,
          teacherName,
          studentId: f.studentId,
          studentName,
          submittedAt: f.submittedAt,
        };
      }),
    );

    return enriched;
  }

  async getClasses() {
    const classes = await this.classRepo.find({
      relations: ['teacher', 'students'],
    });
    return classes.map((c) => ({
      ...c,
      class_name: c.name,
      capacity: c.max_capacity,
      studentsOnline: c.students?.length || 0,
    }));
  }

  async getTeachers() {
    return this.teacherRepo.find({ relations: ['classroom'] });
  }

  async getStudents() {
    return this.studentRepo.find({ relations: ['classroom'] });
  }

  async getChildrenByGuardian(guardianUserId: number) {
    return this.studentRepo.find({
      where: { guardianUserId },
      relations: ['classroom'],
    });
  }

  async linkChild(data: {
    guardianUserId: number;
    full_name: string;
    date_of_birth: string; // 'YYYY-MM-DD'
    class_name: string;
  }) {
    // Tìm học sinh khớp tên + ngày sinh + lớp (tìm không phân biệt hoa thường)
    const students = await this.studentRepo.find({
      relations: ['classroom'],
    });

    // ── Normalize đầu vào ───────────────────────────────────────────
    const normInput = (s: string) =>
      s?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
    const inputName = normInput(data.full_name);
    const inputClass = normInput(data.class_name);
    // So sánh ngày dạng string 'YYYY-MM-DD' để tránh timezone offset
    const inputDob = (data.date_of_birth ?? '').slice(0, 10);

    const match = students.find((s) => {
      const nameMatch = normInput(s.full_name) === inputName;
      const classMatch = normInput(s.classroom?.name ?? '') === inputClass;
      const dobStr = s.date_of_birth
        ? s.date_of_birth instanceof Date
          ? s.date_of_birth.toISOString().slice(0, 10)
          : String(s.date_of_birth).slice(0, 10)
        : '';
      const dobMatch = dobStr === inputDob;
      return nameMatch && classMatch && dobMatch;
    });

    if (!match) {
      return {
        success: false,
        message: 'Không tìm thấy học sinh khớp thông tin đã nhập.',
      };
    }

    if (match.guardianUserId && match.guardianUserId !== data.guardianUserId) {
      return {
        success: false,
        message: 'Học sinh này đã được liên kết với tài khoản phụ huynh khác.',
      };
    }

    match.guardianUserId = data.guardianUserId;
    const saved = await this.studentRepo.save(match);
    return {
      success: true,
      message: `Đã liên kết thành công với ${saved.full_name}`,
      student: {
        id: saved.id,
        full_name: saved.full_name,
        classroom: match.classroom
          ? { class_name: match.classroom.name, id: match.classroom.id }
          : null,
      },
    };
  }

  async createStudent(data: {
    full_name: string;
    class_id?: number;
    allergy_tags?: string[];
    date_of_birth?: string;
  }) {
    const student = this.studentRepo.create({
      full_name: data.full_name,
      classroom: data.class_id ? ({ id: data.class_id } as any) : undefined,
      allergy_tags: data.allergy_tags || [],
      date_of_birth: data.date_of_birth
        ? new Date(data.date_of_birth)
        : undefined,
    });
    return this.studentRepo.save(student);
  }

  async getTeacherDashboard(userId?: number, teacherId?: number) {
    // Ưu tiên teacherId nếu có (gatekeeper bằng tên, không cần userId link)
    let teacher: Teacher | null = null;
    if (teacherId) {
      teacher = await this.teacherRepo.findOne({ where: { id: teacherId } });
    } else if (userId) {
      teacher = await this.teacherRepo.findOne({ where: { userId } });
    }

    if (!teacher)
      return {
        attendance: { present: 0, absent: 0, late: 0 },
        alerts: [],
        tasks: [],
      };

    const classrooms = await this.classRepo.find({
      where: { teacher: { id: teacher.id } },
      relations: ['students'],
    });
    const students = classrooms.flatMap((c) => c.students || []);
    const studentIds = students.map((s) => s.id);

    // Điểm danh thật từ DB — đọc bảng attendances theo ngày hôm nay
    const today = new Date().toISOString().slice(0, 10);
    let present = 0,
      absent = 0,
      late = 0;
    if (studentIds.length > 0) {
      const todayAttendance = await this.attendanceRepo
        .createQueryBuilder('att')
        .where('att.date = :today', { today })
        .andWhere('att.studentId IN (:...ids)', { ids: studentIds })
        .getMany();

      present = todayAttendance.filter((a) => a.status === 'present').length;
      absent = todayAttendance.filter(
        (a) => a.status === 'absent_excused' || a.status === 'absent_unexcused',
      ).length;
      late = todayAttendance.filter((a) => a.status === 'late').length;

      // Nếu chưa điểm danh hôm nay — hiển thị tổng số học sinh là present
      if (todayAttendance.length === 0) {
        present = students.length;
      }
    }

    const alerts = students
      .filter((s) => s.allergy_tags && s.allergy_tags.length > 0)
      .map((s) => ({
        type: 'allergy',
        name: `${s.full_name}`,
        desc: `Dị ứng: ${s.allergy_tags.join(', ')}`,
      }));

    // Tasks = học sinh có deficiency_log chưa được theo dõi
    let tasks: { name: string; desc: string | null }[] = [];
    if (studentIds.length > 0) {
      const deficiencies = await this.skillRepo.find({
        where: {
          student: { id: In(studentIds) },
          deficiency_log: Not(IsNull()),
        },
        relations: ['student'],
      });
      tasks = deficiencies.map((d) => ({
        name: d.student?.full_name || 'Unknown Student',
        desc: d.deficiency_log,
      }));
    }

    return {
      attendance: { present, absent, late },
      alerts,
      tasks,
    };
  }

  async submitAssessment(data: {
    studentId: number;
    teacherId: number;
    cognitiveScore: number;
    socialScore: number;
    motorScore?: number;
    emotionalScore?: number;
    deficiencyLog?: string;
  }) {
    const newAssessment = this.skillRepo.create({
      student: { id: data.studentId } as any,
      teacher: { id: data.teacherId } as any,
      cognitive_score: data.cognitiveScore,
      social_score: data.socialScore,
      motor_score: data.motorScore ?? 0,
      emotional_score: data.emotionalScore ?? 0,
      deficiency_log: data.deficiencyLog ?? null,
    });
    return this.skillRepo.save(newAssessment);
  }

  /**
   * submitFeedback — Lưu đánh giá phụ huynh vào DB thật
   */
  async submitFeedback(data: {
    parentUserId?: number;
    teacherId?: number;
    studentId?: number;
    rating: number;
    comment?: string;
  }) {
    // SEC-03: Kiểm tra đã đánh giá giáo viên này trong tháng này chưa
    if (data.parentUserId && data.teacherId) {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const monthStart = `${currentMonth}-01`;
      const monthEnd = new Date(
        Number(currentMonth.slice(0, 4)),
        Number(currentMonth.slice(5, 7)),
        0,
      )
        .toISOString()
        .slice(0, 10);

      const existing = await this.feedbackRepo
        .createQueryBuilder('f')
        .where('f.parent_user_id = :parentUserId', {
          parentUserId: data.parentUserId,
        })
        .andWhere('f.teacher_id = :teacherId', { teacherId: data.teacherId })
        .andWhere('f.submitted_at BETWEEN :start AND :end', {
          start: monthStart + ' 00:00:00',
          end: monthEnd + ' 23:59:59',
        })
        .getOne();

      if (existing) {
        return {
          success: false,
          message: 'Bạn đã đánh giá giáo viên này trong tháng này rồi.',
          alreadySubmitted: true,
        };
      }
    }

    const feedback = this.feedbackRepo.create({
      parentUserId: data.parentUserId ?? undefined,
      teacherId: data.teacherId ?? undefined,
      studentId: data.studentId ?? undefined,
      rating: data.rating,
      comment: data.comment ?? undefined,
    });
    const saved = await this.feedbackRepo.save(feedback);
    return {
      success: true,
      message: 'Feedback submitted successfully.',
      id: (saved as any).id,
    };
  }

  async getStudentRecords(studentId: number, guardianUserId: number) {
    const student = await this.studentRepo.findOne({
      where: { id: studentId, guardianUserId },
      relations: ['classroom', 'classroom.teacher'],
    });

    if (!student) {
      return { error: 'Unauthorized: Student not found or access denied.' };
    }

    const assessments = await this.skillRepo.find({
      where: { student: { id: studentId } },
      relations: ['teacher'],
      order: { created_at: 'DESC' },
    });

    const activityLogs = await this.activityLogRepo.find({
      where: { studentId },
      relations: ['teacher'],
      order: { created_at: 'DESC' },
    });

    const classroomNormalized = student.classroom
      ? {
          id: student.classroom.id,
          class_name: student.classroom.name,
          age_group: student.classroom.age_group,
          max_capacity: student.classroom.max_capacity,
        }
      : null;

    const classTeacher = student.classroom?.teacher ?? null;

    const studentOut = {
      id: student.id,
      full_name: student.full_name,
      allergy_tags: student.allergy_tags,
      date_of_birth: student.date_of_birth,
      guardianUserId: student.guardianUserId,
      classroom: classroomNormalized,
    };

    return { student: studentOut, assessments, activityLogs, classTeacher };
  }

  /**
   * getStudentRecordsAdmin — Dành cho ADMIN, không kiểm tra guardianUserId.
   * Trả về đầy đủ hồ sơ học sinh để ban giám hiệu xem báo cáo lớp.
   */
  async getStudentRecordsAdmin(studentId: number) {
    const student = await this.studentRepo.findOne({
      where: { id: studentId },
      relations: ['classroom', 'classroom.teacher'],
    });

    if (!student) {
      return { error: 'Student not found.' };
    }

    const assessments = await this.skillRepo.find({
      where: { student: { id: studentId } },
      relations: ['teacher'],
      order: { created_at: 'DESC' },
    });

    const activityLogs = await this.activityLogRepo.find({
      where: { studentId },
      relations: ['teacher'],
      order: { created_at: 'DESC' },
    });

    const classroomNormalized = student.classroom
      ? {
          id: student.classroom.id,
          class_name: student.classroom.name,
          age_group: student.classroom.age_group,
          max_capacity: student.classroom.max_capacity,
        }
      : null;

    const classTeacher = student.classroom?.teacher ?? null;

    const studentOut = {
      id: student.id,
      full_name: student.full_name,
      allergy_tags: student.allergy_tags,
      date_of_birth: student.date_of_birth,
      guardianUserId: student.guardianUserId,
      classroom: classroomNormalized,
    };

    return { student: studentOut, assessments, activityLogs, classTeacher };
  }

  async getStudentAssessments(studentId?: number) {
    if (studentId) {
      return this.skillRepo.find({
        where: { student: { id: studentId } },
        relations: ['teacher'],
        order: { created_at: 'DESC' },
      });
    }
    return this.skillRepo.find({
      relations: ['student', 'teacher'],
      order: { created_at: 'DESC' },
    });
  }

  async createActivityLog(data: {
    studentId: number;
    teacherId?: number | null;
    category: string;
    title: string;
    description: string;
  }) {
    const log = this.activityLogRepo.create({
      studentId: data.studentId,
      teacherId: data.teacherId ?? null,
      teacher: data.teacherId ? ({ id: data.teacherId } as any) : null,
      category: data.category,
      title: data.title,
      description: data.description,
    });
    return this.activityLogRepo.save(log);
  }

  async createClassroom(data: {
    class_name: string;
    age_group: string;
    teacher_id: number;
    capacity: number;
  }) {
    const teacher = data.teacher_id
      ? await this.teacherRepo.findOne({ where: { id: data.teacher_id } })
      : null;
    const classroom = this.classRepo.create({
      name: data.class_name,
      age_group: data.age_group,
      max_capacity: data.capacity,
      teacher: teacher || undefined,
    });
    const savedClassroom = await this.classRepo.save(classroom);
    
    // Sync teacher class_id
    if (teacher) {
      teacher.classId = savedClassroom.id;
      await this.teacherRepo.save(teacher);
    }
    
    return savedClassroom;
  }

  async createTeacher(data: { full_name: string; specializations?: string }) {
    const teacher = this.teacherRepo.create({
      full_name: data.full_name,
      specializations: data.specializations || 'General',
      is_active: true,
    });
    return this.teacherRepo.save(teacher);
  }

  async updateStudent(data: {
    id: number;
    full_name?: string;
    class_id?: number | null;
    allergy_tags?: string[];
    date_of_birth?: string | null;
  }) {
    const student = await this.studentRepo.findOne({
      where: { id: data.id },
      relations: ['classroom'],
    });
    if (!student) return { error: 'Không tìm thấy học sinh.' };

    if (data.full_name !== undefined) student.full_name = data.full_name;
    if (data.allergy_tags !== undefined)
      student.allergy_tags = data.allergy_tags;
    if (data.date_of_birth !== undefined) {
      student.date_of_birth = data.date_of_birth
        ? new Date(data.date_of_birth)
        : (null as any);
    }
    if (data.class_id !== undefined) {
      student.classroom = data.class_id
        ? ({ id: data.class_id } as any)
        : (null as any);
    }

    return this.studentRepo.save(student);
  }

  async updateClassroom(data: {
    id: number;
    class_name?: string;
    age_group?: string;
    capacity?: number;
    teacher_id?: number | null;
  }) {
    const classroom = await this.classRepo.findOne({
      where: { id: data.id },
      relations: ['teacher'],
    });
    if (!classroom) return { error: 'Không tìm thấy lớp học.' };

    if (data.class_name !== undefined) classroom.name = data.class_name;
    if (data.age_group !== undefined) classroom.age_group = data.age_group;
    if (data.capacity !== undefined) classroom.max_capacity = data.capacity;
    if (data.teacher_id !== undefined) {
      if (data.teacher_id === null) {
        if (classroom.teacher) {
          classroom.teacher.classId = null;
          await this.teacherRepo.save(classroom.teacher);
        }
        classroom.teacher = null as any;
      } else {
        const teacher = await this.teacherRepo.findOne({
          where: { id: data.teacher_id },
        });
        
        // Remove old teacher's class_id if assigning a new teacher
        if (classroom.teacher && classroom.teacher.id !== data.teacher_id) {
          classroom.teacher.classId = null;
          await this.teacherRepo.save(classroom.teacher);
        }

        classroom.teacher = teacher || (null as any);
        
        if (teacher) {
          teacher.classId = classroom.id;
          await this.teacherRepo.save(teacher);
        }
      }
    }

    return this.classRepo.save(classroom);
  }

  async updateTeacher(data: {
    id: number;
    full_name?: string;
    specializations?: string;
    is_active?: boolean;
  }) {
    const teacher = await this.teacherRepo.findOne({ where: { id: data.id } });
    if (!teacher) return { error: 'Không tìm thấy giáo viên.' };

    if (data.full_name !== undefined) teacher.full_name = data.full_name;
    if (data.specializations !== undefined)
      teacher.specializations = data.specializations;
    if (data.is_active !== undefined) teacher.is_active = data.is_active;

    return this.teacherRepo.save(teacher);
  }

  /**
   * getDeficiencyDetails — Danh sách chi tiết học sinh có deficiency_log (thiếu sót phát triển).
   * Dùng cho ban giám hiệu để xem cụ thể em nào cần xử lý.
   */
  async getDeficiencyDetails() {
    const items = await this.skillRepo.find({
      where: { deficiency_log: Not(IsNull()) },
      relations: ['student', 'student.classroom', 'teacher'],
      order: { created_at: 'DESC' },
    });

    return items.map((item) => ({
      assessmentId: item.id,
      studentId: item.student?.id ?? null,
      studentName: item.student?.full_name ?? 'Không rõ',
      className: item.student?.classroom?.name ?? 'Chưa có lớp',
      teacherName: item.teacher?.full_name ?? 'Không rõ',
      deficiencyLog: item.deficiency_log,
      cognitiveScore: item.cognitive_score,
      socialScore: item.social_score,
      motorScore: item.motor_score,
      emotionalScore: item.emotional_score,
      createdAt: item.created_at,
    }));
  }

  // ============================================================
  // ATTENDANCE — Bảng điểm danh độc lập
  // ============================================================

  /**
   * Lưu hàng loạt bản ghi điểm danh cho 1 ngày.
   * Dùng INSERT...ON DUPLICATE UPDATE (à dùng upsert của TypeORM)
   * để cho phép giáo viên cập nhật lại nếu gọi lần 2.
   */
  async saveAttendanceBulk(data: {
    date: string; // 'YYYY-MM-DD'
    createdBy: number; // teacher user_id (từ JWT)
    records: Array<{
      studentId: number;
      status: AttendanceStatus;
      note?: string;
    }>;
  }) {
    const { date, createdBy, records } = data;

    const upserted = await Promise.all(
      records.map(async (r) => {
        const existing = await this.attendanceRepo.findOne({
          where: { studentId: r.studentId, date },
        });

        if (existing) {
          // Cập nhật bản ghi cũ
          existing.status = r.status;
          existing.note = r.note ?? null;
          existing.createdBy = createdBy;
          return this.attendanceRepo.save(existing);
        } else {
          // Tạo mới
          const record = this.attendanceRepo.create({
            studentId: r.studentId,
            date,
            status: r.status,
            note: r.note ?? null,
            createdBy,
          });
          return this.attendanceRepo.save(record);
        }
      }),
    );

    // Tính tổng cho dashboard
    const summary = {
      present: upserted.filter((r) => r.status === AttendanceStatus.PRESENT)
        .length,
      absent_excused: upserted.filter(
        (r) => r.status === AttendanceStatus.ABSENT_EXCUSED,
      ).length,
      absent_unexcused: upserted.filter(
        (r) => r.status === AttendanceStatus.ABSENT_UNEXCUSED,
      ).length,
      late: upserted.filter((r) => r.status === AttendanceStatus.LATE).length,
      total: upserted.length,
    };

    return { success: true, date, summary };
  }

  /**
   * Lấy danh sách điểm danh theo ngày (hoặc theo studentId).
   */
  async getAttendanceByDate(data: {
    date: string;
    studentId?: number;
    classId?: number;
  }) {
    const qb = this.attendanceRepo
      .createQueryBuilder('att')
      .leftJoinAndSelect('att.student', 'student')
      .leftJoinAndSelect('student.classroom', 'classroom')
      .where('att.date = :date', { date: data.date });

    if (data.studentId) {
      qb.andWhere('att.studentId = :sid', { sid: data.studentId });
    }
    if (data.classId) {
      qb.andWhere('classroom.id = :cid', { cid: data.classId });
    }

    const rows = await qb.orderBy('student.full_name', 'ASC').getMany();

    return rows.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      studentName: r.student?.full_name ?? '?',
      className: r.student?.classroom?.name ?? '?',
      date: r.date,
      status: r.status,
      note: r.note,
      createdBy: r.createdBy,
      createdAt: r.createdAt,
    }));
  }

  /**
   * Lấy lịch sử điểm danh theo học sinh (cho admin/phụ huynh xem).
   */
  async getAttendanceByStudent(studentId: number) {
    const rows = await this.attendanceRepo.find({
      where: { studentId },
      order: { date: 'DESC' },
    });
    return rows;
  }

  // ============================================================
  // AUTHORIZED PICKUPS — Ủy quyền đón trẻ
  // ============================================================

  /**
   * Lấy tất cả người được ủy quyền đón của 1 học sinh.
   * Tự động lọc: chỉ trả về bản ghi còn hiệu lực (valid_until >= hôm nay hoặc null).
   */
  async getPickupsByStudent(studentId: number, activeOnly = false) {
    const today = new Date().toISOString().slice(0, 10);
    const qb = this.pickupRepo
      .createQueryBuilder('p')
      .where('p.studentId = :studentId', { studentId });

    if (activeOnly) {
      qb.andWhere('(p.validUntil IS NULL OR p.validUntil >= :today)', {
        today,
      });
    }

    const rows = await qb.orderBy('p.createdAt', 'DESC').getMany();
    return rows.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      name: r.name,
      relationship: r.relationship,
      phone: r.phone,
      validFrom: r.validFrom,
      validUntil: r.validUntil,
      photoUrl: r.photoUrl,
      note: r.note,
      createdBy: r.createdBy,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      // Tính trạng thái hiệu lực
      isActive:
        (r.validUntil === null || r.validUntil >= today) &&
        (r.validFrom === null || r.validFrom <= today),
    }));
  }

  /**
   * Tạo mới một ủy quyền đón trẻ.
   */
  async createPickup(data: {
    studentId: number;
    name: string;
    relationship: string;
    phone: string;
    validFrom?: string | null;
    validUntil?: string | null;
    photoUrl?: string | null;
    note?: string | null;
    createdBy?: number | null;
  }) {
    const pickup = this.pickupRepo.create({
      studentId: data.studentId,
      name: data.name.trim(),
      relationship: data.relationship.trim(),
      phone: data.phone.trim(),
      validFrom: data.validFrom ?? null,
      validUntil: data.validUntil ?? null,
      photoUrl: data.photoUrl ?? null,
      note: data.note ?? null,
      createdBy: data.createdBy ?? null,
    });
    const saved = await this.pickupRepo.save(pickup);
    return { success: true, id: saved.id };
  }

  /**
   * Cập nhật thông tin ủy quyền.
   */
  async updatePickup(data: {
    id: number;
    name?: string;
    relationship?: string;
    phone?: string;
    validFrom?: string | null;
    validUntil?: string | null;
    photoUrl?: string | null;
    note?: string | null;
  }) {
    const existing = await this.pickupRepo.findOne({ where: { id: data.id } });
    if (!existing) {
      return { success: false, message: 'Không tìm thấy bản ghi.' };
    }
    if (data.name !== undefined) existing.name = data.name.trim();
    if (data.relationship !== undefined)
      existing.relationship = data.relationship.trim();
    if (data.phone !== undefined) existing.phone = data.phone.trim();
    if (data.validFrom !== undefined) existing.validFrom = data.validFrom;
    if (data.validUntil !== undefined) existing.validUntil = data.validUntil;
    if (data.photoUrl !== undefined) existing.photoUrl = data.photoUrl;
    if (data.note !== undefined) existing.note = data.note;
    await this.pickupRepo.save(existing);
    return { success: true };
  }

  /**
   * Xoá một ủy quyền theo id.
   */
  async deletePickup(id: number) {
    const existing = await this.pickupRepo.findOne({ where: { id } });
    if (!existing) {
      return { success: false, message: 'Không tìm thấy bản ghi.' };
    }
    await this.pickupRepo.remove(existing);
    return { success: true };
  }

  // ============================================================
  // FINANCE — Học phí & Thanh toán
  // ============================================================

  /** Lấy tất cả cấu hình học phí */
  async getFeeConfigs() {
    return this.feeConfigRepo.find({ order: { createdAt: 'DESC' } });
  }

  /** Cập nhật cấu hình học phí */
  async updateFeeConfig(
    id: number,
    data: {
      name?: string;
      amount?: number;
      billingCycle?: string;
      effectiveFrom?: string;
      effectiveUntil?: string | null;
      note?: string | null;
    },
  ) {
    await this.feeConfigRepo.update(id, data as any);
    return this.feeConfigRepo.findOne({ where: { id } });
  }

  /** Xoá cấu hình học phí */
  async deleteFeeConfig(id: number) {
    const existing = await this.feeConfigRepo.findOne({ where: { id } });
    if (!existing) return { success: false, message: 'Không tìm thấy cấu hình.' };
    await this.feeConfigRepo.remove(existing);
    return { success: true };
  }

  /** Tạo cấu hình học phí mới */
  async createFeeConfig(data: {
    classId?: number | null;
    feeType: string;
    name: string;
    amount: number;
    billingCycle: string;
    effectiveFrom: string;
    effectiveUntil?: string | null;
    note?: string | null;
    createdBy?: number | null;
  }) {
    const config = this.feeConfigRepo.create({
      classId: data.classId ?? null,
      feeType: data.feeType as any,
      name: data.name,
      amount: data.amount,
      billingCycle: data.billingCycle as any,
      effectiveFrom: data.effectiveFrom,
      effectiveUntil: data.effectiveUntil ?? null,
      note: data.note ?? null,
      createdBy: data.createdBy ?? null,
    });
    const saved = await this.feeConfigRepo.save(config);
    return { success: true, id: saved.id };
  }

  /** Lấy hóa đơn theo học sinh */
  async getInvoicesByStudent(studentId: number) {
    return this.invoiceRepo.find({
      where: { studentId },
      order: { month: 'DESC' },
    });
  }

  /** Lấy hóa đơn theo tháng (có thể lọc theo trạng thái) */
  async getInvoicesByMonth(month: string, status?: string) {
    const qb = this.invoiceRepo
      .createQueryBuilder('inv')
      .where('inv.month = :month', { month });
    if (status) {
      qb.andWhere('inv.status = :status', { status });
    }
    const invoices = await qb.orderBy('inv.studentId', 'ASC').getMany();

    // Enrich với tên học sinh
    const students = await this.studentRepo.find({
      select: ['id', 'full_name'],
    });
    const studentMap = new Map(students.map((s) => [s.id, s.full_name]));
    return invoices.map((inv) => ({
      ...inv,
      studentName:
        studentMap.get(inv.studentId) ?? `Học sinh #${inv.studentId}`,
    }));
  }

  /**
   * Tạo/cập nhật hóa đơn cho 1 học sinh trong 1 tháng.
   * Logic: đếm ngày có mặt từ bảng attendance để tính tiền ăn.
   */
  async upsertInvoice(data: {
    studentId: number;
    month: string; // YYYY-MM
    tuitionAmount: number;
    mealDailyRate: number;
    otherFees?: number;
    discount?: number;
    dueDate?: string | null;
    note?: string | null;
    createdBy?: number | null;
  }) {
    // Đếm ngày có mặt trong tháng này
    const [year, mon] = data.month.split('-');
    const firstDay = `${year}-${mon}-01`;
    const lastDay = new Date(Number(year), Number(mon), 0)
      .toISOString()
      .slice(0, 10);

    const presentCount = await this.attendanceRepo
      .createQueryBuilder('att')
      .where('att.studentId = :studentId', { studentId: data.studentId })
      .andWhere('att.date BETWEEN :firstDay AND :lastDay', {
        firstDay,
        lastDay,
      })
      .andWhere("att.status = 'present'")
      .getCount();

    const existing = await this.invoiceRepo.findOne({
      where: { studentId: data.studentId, month: data.month },
    });

    if (existing) {
      existing.tuitionAmount = data.tuitionAmount;
      existing.mealDays = presentCount;
      existing.mealDailyRate = data.mealDailyRate;
      existing.otherFees = data.otherFees ?? 0;
      existing.discount = data.discount ?? 0;
      existing.dueDate = data.dueDate ?? null;
      existing.note = data.note ?? null;
      // Nếu đã có thanh toán thì cập nhật trạng thái
      if (existing.amountPaid >= (existing.totalAmount ?? 0)) {
        existing.status = 'paid';
      }
      await this.invoiceRepo.save(existing);
      return {
        success: true,
        id: existing.id,
        action: 'updated',
        mealDays: presentCount,
      };
    }

    const invoice = this.invoiceRepo.create({
      studentId: data.studentId,
      month: data.month,
      tuitionAmount: data.tuitionAmount,
      mealDays: presentCount,
      mealDailyRate: data.mealDailyRate,
      otherFees: data.otherFees ?? 0,
      discount: data.discount ?? 0,
      amountPaid: 0,
      status: 'pending',
      dueDate: data.dueDate ?? null,
      note: data.note ?? null,
      createdBy: data.createdBy ?? null,
    });
    const saved = await this.invoiceRepo.save(invoice);
    return {
      success: true,
      id: saved.id,
      action: 'created',
      mealDays: presentCount,
    };
  }


  /**
   * Tạo hóa đơn hàng loạt cho tất cả học sinh trong 1 tháng.
   * Tự động đọc tuitionAmount và mealDailyRate từ bảng fee_configs.
   */
  async generateMonthlyInvoices(data: {
    month: string;
    tuitionAmount?: number;   // optional override
    mealDailyRate?: number;   // optional override
    dueDate?: string | null;
    createdBy?: number | null;
  }) {
    // Đọc fee config từ DB (ưu tiên config mới nhất còn hiệu lực)
    const today = new Date().toISOString().slice(0, 10);
    const allConfigs = await this.feeConfigRepo.find({
      order: { createdAt: 'DESC' },
    });

    // Lấy học phí hàng tháng (tuition)
    const tuitionConfig = allConfigs.find(
      (c) =>
        c.feeType === 'tuition' &&
        c.billingCycle === 'monthly' &&
        c.effectiveFrom <= data.month + '-01' &&
        (c.effectiveUntil === null || c.effectiveUntil >= data.month + '-01'),
    );
    // Lấy tiền ăn hàng ngày (meal)
    const mealConfig = allConfigs.find(
      (c) =>
        c.feeType === 'meal' &&
        c.billingCycle === 'daily' &&
        c.effectiveFrom <= data.month + '-01' &&
        (c.effectiveUntil === null || c.effectiveUntil >= data.month + '-01'),
    );

    const tuitionAmount =
      data.tuitionAmount ?? Number(tuitionConfig?.amount ?? 1500000);
    const mealDailyRate =
      data.mealDailyRate ?? Number(mealConfig?.amount ?? 25000);

    // Tính due date mặc định: ngày 15 tháng tiếp theo
    const [yr, mo] = data.month.split('-');
    const nextMonth = mo === '12'
      ? `${Number(yr) + 1}-01`
      : `${yr}-${String(Number(mo) + 1).padStart(2, '0')}`;
    const defaultDueDate = data.dueDate ?? `${nextMonth}-15`;

    const students = await this.studentRepo.find({ select: ['id', 'full_name'] });
    const results = await Promise.all(
      students.map((s) =>
        this.upsertInvoice({
          studentId: s.id,
          month: data.month,
          tuitionAmount,
          mealDailyRate,
          dueDate: defaultDueDate,
          createdBy: data.createdBy,
        }),
      ),
    );
    const created = results.filter((r) => r.action === 'created').length;
    const updated = results.filter((r) => r.action === 'updated').length;
    return {
      success: true,
      total: students.length,
      created,
      updated,
      tuitionAmount,
      mealDailyRate,
      usedConfig: {
        tuition: tuitionConfig?.name ?? '(mặc định)',
        meal: mealConfig?.name ?? '(mặc định)',
      },
    };
  }

  /**
   * Lấy hóa đơn theo lớp (giáo viên / BGH xem theo lớp).
   */
  async getInvoicesByClass(classId: number, month: string) {
    // Lấy học sinh của lớp
    const students = await this.studentRepo.find({
      where: { classroom: { id: classId } },
      select: ['id', 'full_name'],
      relations: ['classroom'],
    });
    if (students.length === 0) return [];

    const studentIds = students.map((s) => s.id);
    const studentMap = new Map(students.map((s) => [s.id, s.full_name]));

    const invoices = await this.invoiceRepo
      .createQueryBuilder('inv')
      .where('inv.studentId IN (:...ids)', { ids: studentIds })
      .andWhere('inv.month = :month', { month })
      .orderBy('inv.studentId', 'ASC')
      .getMany();

    return invoices.map((inv) => ({
      ...inv,
      studentName: studentMap.get(inv.studentId) ?? `Học sinh #${inv.studentId}`,
    }));
  }

  /**
   * Tổng hợp tài chính của một lớp trong một tháng (giáo viên báo cáo BGH).
   */
  async getClassFinanceSummary(classId: number, month: string) {
    const invoices = await this.getInvoicesByClass(classId, month);
    const classroom = await this.classRepo.findOne({
      where: { id: classId },
      relations: ['teacher'],
    });

    const totalBilled = invoices.reduce((s, i) => s + Number(i.totalAmount ?? 0), 0);
    const totalCollected = invoices.reduce((s, i) => s + Number(i.amountPaid), 0);
    const totalRemaining = totalBilled - totalCollected;
    return {
      classId,
      className: classroom?.name ?? `Lớp #${classId}`,
      teacherName: classroom?.teacher?.full_name ?? null,
      month,
      totalStudents: invoices.length,
      statusBreakdown: {
        paid: invoices.filter((i) => i.status === 'paid').length,
        partial: invoices.filter((i) => i.status === 'partial').length,
        pending: invoices.filter((i) => i.status === 'pending').length,
        overdue: invoices.filter((i) => i.status === 'overdue').length,
      },
      totalBilled,
      totalCollected,
      totalRemaining,
      collectionRate:
        totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0,
      invoices,
    };
  }



  /** Ghi nhận thanh toán hóa đơn */
  async recordPayment(data: {
    invoiceId: number;
    amount: number;
    paymentMethod: string;
    referenceCode?: string | null;
    receivedBy?: number | null;
    note?: string | null;
  }) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: data.invoiceId },
    });
    if (!invoice) {
      return { success: false, message: 'Không tìm thấy hóa đơn.' };
    }

    const payment = this.paymentRepo.create({
      invoiceId: data.invoiceId,
      amount: data.amount,
      paymentMethod: data.paymentMethod as any,
      referenceCode: data.referenceCode ?? null,
      receivedBy: data.receivedBy ?? null,
      note: data.note ?? null,
    });
    await this.paymentRepo.save(payment);

    // Cập nhật amount_paid và status trên invoice
    invoice.amountPaid = Number(invoice.amountPaid) + Number(data.amount);
    const total = Number(invoice.totalAmount ?? 0);
    if (invoice.amountPaid >= total) {
      invoice.status = 'paid';
      invoice.paidAt = new Date();
    } else if (invoice.amountPaid > 0) {
      invoice.status = 'partial';
    }
    await this.invoiceRepo.save(invoice);
    return { success: true, newStatus: invoice.status };
  }

  /** Báo cáo tài chính tháng */
  async getFinancialSummary(month: string) {
    const invoices = await this.invoiceRepo.find({ where: { month } });
    const totalBilled = invoices.reduce(
      (s, i) => s + Number(i.totalAmount ?? 0),
      0,
    );
    const totalCollected = invoices.reduce(
      (s, i) => s + Number(i.amountPaid),
      0,
    );
    const totalOverdue = invoices
      .filter(
        (i) =>
          i.status === 'overdue' ||
          (i.status === 'pending' &&
            i.dueDate &&
            i.dueDate < new Date().toISOString().slice(0, 10)),
      )
      .reduce(
        (s, i) => s + (Number(i.totalAmount ?? 0) - Number(i.amountPaid)),
        0,
      );
    return {
      month,
      totalStudents: invoices.length,
      statusBreakdown: {
        pending: invoices.filter((i) => i.status === 'pending').length,
        partial: invoices.filter((i) => i.status === 'partial').length,
        paid: invoices.filter((i) => i.status === 'paid').length,
        overdue: invoices.filter((i) => i.status === 'overdue').length,
      },
      totalBilled,
      totalCollected,
      totalRemaining: totalBilled - totalCollected,
      totalOverdue,
      collectionRate:
        totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0,
    };
  }

  // ============================================================
  // NOTIFICATIONS — Hệ thống thông báo
  // ============================================================

  async createNotification(data: {
    recipientUserId: number;
    type: string;
    title: string;
    body: string;
    linkUrl?: string | null;
    relatedId?: number | null;
  }) {
    const notif = this.notifRepo.create({
      recipientUserId: data.recipientUserId,
      type: data.type as any,
      title: data.title,
      body: data.body,
      linkUrl: data.linkUrl ?? null,
      relatedId: data.relatedId ?? null,
    });
    await this.notifRepo.save(notif);
    return { success: true };
  }

  async getNotifications(userId: number, limit = 30) {
    return this.notifRepo.find({
      where: { recipientUserId: userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getUnreadCount(userId: number) {
    const count = await this.notifRepo.count({
      where: { recipientUserId: userId, isRead: false },
    });
    return { count };
  }

  async markAllRead(userId: number) {
    await this.notifRepo.update(
      { recipientUserId: userId, isRead: false },
      { isRead: true },
    );
    return { success: true };
  }

  async markOneRead(notifId: number) {
    await this.notifRepo.update({ id: notifId }, { isRead: true });
    return { success: true };
  }

  // ============================================================
  // MEDICATIONS — Quản lý thuốc & Y tế
  // ============================================================

  /** Lấy tất cả lịch thuốc còn hiệu lực cho 1 học sinh */
  async getMedicationsByStudent(studentId: number) {
    const today = new Date().toISOString().slice(0, 10);
    return this.medScheduleRepo
      .find({
        where: { studentId, isActive: true },
        order: { startDate: 'DESC' },
      })
      .then((items) =>
        items.filter((m) => m.endDate === null || m.endDate >= today),
      );
  }

  /** Lấy tất cả học sinh cần uống thuốc hôm nay (cho giáo viên) */
  async getTodayMedications() {
    const today = new Date().toISOString().slice(0, 10);
    const schedules = await this.medScheduleRepo
      .createQueryBuilder('m')
      .where('m.isActive = true')
      .andWhere('m.startDate <= :today', { today })
      .andWhere('(m.endDate IS NULL OR m.endDate >= :today)', { today })
      .getMany();

    // Enrich với tên học sinh
    const studentIds = [...new Set(schedules.map((s) => s.studentId))];
    if (studentIds.length === 0) return [];

    const students = await this.studentRepo.findBy({ id: In(studentIds) });
    const studentMap = new Map(students.map((s) => [s.id, s.full_name]));

    // Lấy log hôm nay để biết đã cho uống chưa
    const logsToday = await this.medLogRepo
      .createQueryBuilder('l')
      .where('DATE(l.administeredAt) = :today', { today })
      .andWhere('l.scheduleId IN (:...ids)', {
        ids: schedules.map((s) => s.id),
      })
      .getMany();
    const logMap = new Map(logsToday.map((l) => [l.scheduleId, l]));

    return schedules.map((s) => ({
      ...s,
      studentName: studentMap.get(s.studentId) ?? `Học sinh #${s.studentId}`,
      todayLog: logMap.get(s.id) ?? null,
      isGivenToday: logMap.has(s.id),
    }));
  }

  /** Phụ huynh tạo đơn thuốc mới */
  async createMedicationSchedule(data: {
    studentId: number;
    medicationName: string;
    dosage: string;
    frequency: string;
    timeMorning?: string | null;
    timeNoon?: string | null;
    timeAfternoon?: string | null;
    startDate: string;
    endDate?: string | null;
    prescriptionNote?: string | null;
    prescriptionUrl?: string | null;
    createdBy?: number | null;
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
      isActive: true,
      createdBy: data.createdBy ?? null,
    });
    const saved = await this.medScheduleRepo.save(schedule);
    return { success: true, id: saved.id };
  }

  /** Giáo viên ghi nhận đã cho uống thuốc */
  async logMedicationGiven(data: {
    scheduleId: number;
    studentId?: number;
    status?: string;
    administeredBy?: number | null;
    note?: string | null;
    administerNote?: string | null;
  }) {
    let studentId = data.studentId;
    if (!studentId) {
      const schedule = await this.medScheduleRepo.findOne({
        where: { id: data.scheduleId },
      });
      if (!schedule) throw new Error('Medication schedule not found');
      studentId = schedule.studentId;
    }

    const log = this.medLogRepo.create({
      scheduleId: data.scheduleId,
      studentId: studentId,
      status: (data.status || 'given') as any,
      administeredBy: data.administeredBy ?? null,
      note: data.administerNote || data.note || null,
    });
    await this.medLogRepo.save(log);
    return { success: true };
  }

  /** Lịch sử log thuốc của 1 học sinh */
  async getMedicationLogs(studentId: number) {
    return this.medLogRepo.find({
      where: { studentId },
      order: { administeredAt: 'DESC' },
      take: 50,
    });
  }

  // ============================================================
  // VERIFY OWNERSHIP
  // ============================================================

  /**
   * Kiểm tra học sinh có thuộc về phụ huynh này không (SEC-01)
   */
  async verifyChildOwnership(
    studentId: number,
    guardianUserId: number,
  ): Promise<{ owned: boolean }> {
    const student = await this.studentRepo.findOne({
      where: { id: studentId, guardianUserId },
    });
    return { owned: student !== null };
  }

  // ============================================================
  // INCIDENT REPORTS — Báo cáo sự cố y tế/an toàn
  // ============================================================

  /** Tạo biên bản sự cố + push notifications đến PH và toàn bộ Admin */
  async createIncidentReport(data: {
    studentId: number;
    teacherId: number;
    incidentType: IncidentType;
    severity: IncidentSeverity;
    description: string;
    firstAidTaken?: string;
    attachmentUrl?: string;
    parentUserId?: number;
    adminUserIds?: number[];
  }) {
    const incident = this.incidentRepo.create({
      studentId: data.studentId,
      teacherId: data.teacherId,
      incidentType: data.incidentType,
      severity: data.severity,
      description: data.description,
      firstAidTaken: data.firstAidTaken ?? null,
      attachmentUrl: data.attachmentUrl ?? null,
    });
    const saved = await this.incidentRepo.save(incident);

    // Lấy tên bé để đưa vào nội dung thông báo
    const student = await this.studentRepo.findOne({
      where: { id: data.studentId },
    });
    const studentName = student?.full_name ?? 'Học sinh';
    const severityLabel: Record<IncidentSeverity, string> = {
      LOW: '🟢 Nhẹ',
      MEDIUM: '🟡 Trung bình',
      HIGH: '🟠 Nghiêm trọng',
      EMERGENCY: '🔴 Khẩn cấp',
    };
    const typeLabel: Record<IncidentType, string> = {
      INJURY: 'Chấn thương',
      ILLNESS: 'Ốm/Sốt',
      BEHAVIOR: 'Hành vi',
      OTHER: 'Khác',
    };

    const notifTitle = `Sự cố: ${typeLabel[data.incidentType]} (${severityLabel[data.severity]})`;
    const notifBody = `${studentName}: ${data.description.slice(0, 100)}`;

    // Notify parent
    if (data.parentUserId) {
      await this.notifRepo.save(
        this.notifRepo.create({
          recipientUserId: data.parentUserId,
          type: 'incident' as NotificationType,
          title: notifTitle,
          body: notifBody,
          relatedId: saved.id,
          linkUrl: `/parent/incidents`,
        }),
      );
    }

    // Notify all admins
    if (data.adminUserIds && data.adminUserIds.length > 0) {
      const adminNotifs = data.adminUserIds.map((uid) =>
        this.notifRepo.create({
          recipientUserId: uid,
          type: 'incident' as NotificationType,
          title: `[BGH] ${notifTitle}`,
          body: notifBody,
          relatedId: saved.id,
          linkUrl: `/admin/incidents`,
        }),
      );
      await this.notifRepo.save(adminNotifs);
    }

    return { success: true, id: saved.id, incident: saved };
  }

  async getIncidentsByTeacher(teacherId: number) {
    return this.incidentRepo.find({
      where: { teacherId },
      relations: ['student', 'student.classroom'],
      order: { createdAt: 'DESC' },
    });
  }

  async getIncidentsByStudent(studentId: number) {
    return this.incidentRepo.find({
      where: { studentId },
      relations: ['teacher'],
      order: { createdAt: 'DESC' },
    });
  }

  async getIncidentsAdmin(filters: {
    severity?: string;
    studentId?: number;
    limit?: number;
  }) {
    const qb = this.incidentRepo
      .createQueryBuilder('inc')
      .leftJoinAndSelect('inc.student', 'student')
      .leftJoinAndSelect('student.classroom', 'classroom')
      .leftJoinAndSelect('inc.teacher', 'teacher')
      .orderBy('inc.createdAt', 'DESC');

    if (filters.severity)
      qb.andWhere('inc.severity = :sev', { sev: filters.severity });
    if (filters.studentId)
      qb.andWhere('inc.studentId = :sid', { sid: filters.studentId });
    if (filters.limit) qb.limit(filters.limit);

    return qb.getMany();
  }

  async acknowledgeIncident(id: number, parentUserId: number) {
    const incident = await this.incidentRepo.findOne({ where: { id } });
    if (!incident) return { success: false, message: 'Không tìm thấy sự cố.' };
    if (incident.parentAcknowledgedAt) {
      return { success: false, message: 'Đã xác nhận trước đó.' };
    }
    incident.parentAcknowledgedAt = new Date();
    await this.incidentRepo.save(incident);
    return { success: true };
  }

  async reviewIncident(id: number, adminUserId: number) {
    const incident = await this.incidentRepo.findOne({ where: { id } });
    if (!incident) return { success: false, message: 'Không tìm thấy sự cố.' };
    incident.principalReviewedAt = new Date();
    await this.incidentRepo.save(incident);
    return { success: true };
  }

  // ============================================================
  // LEAVE REQUESTS — Đơn xin nghỉ + hoàn tiền ăn
  // ============================================================

  /** Tính số ngày làm việc giữa 2 ngày (không tính T7, CN) */
  private countWeekdays(start: string, end: string): number {
    const s = new Date(start);
    const e = new Date(end);
    let count = 0;
    const cur = new Date(s);
    while (cur <= e) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }

  async createLeaveRequest(data: {
    studentId: number;
    requestedBy: number;
    startDate: string;
    endDate: string;
    reason: string;
    adminUserIds?: number[];
    teacherUserIds?: number[];
  }) {
    // Tính eligibility: nộp trước 17h hôm nay và ngày bắt đầu từ hôm nay trở đi
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const hour = now.getHours();
    const startIsAfterToday = data.startDate > today;
    const startIsTodayAndEarly = data.startDate === today && hour < 17;
    const isMealRefundEligible = startIsAfterToday || startIsTodayAndEarly;

    const lr = this.leaveRequestRepo.create({
      studentId: data.studentId,
      requestedBy: data.requestedBy,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
      status: 'PENDING',
      isMealRefundEligible,
      mealsToDeduct: 0,
      refundAmount: 0,
    });
    const saved = await this.leaveRequestRepo.save(lr);

    const student = await this.studentRepo.findOne({
      where: { id: data.studentId },
    });
    const studentName = student?.full_name ?? 'Học sinh';

    // Notify admins về đơn mới
    if (data.adminUserIds?.length) {
      const notifs = data.adminUserIds.map((uid) =>
        this.notifRepo.create({
          recipientUserId: uid,
          type: 'leave_request' as NotificationType,
          title: `Đơn xin nghỉ: ${studentName}`,
          body: `Từ ${data.startDate} đến ${data.endDate}. Lý do: ${data.reason.slice(0, 80)}`,
          relatedId: saved.id,
          linkUrl: `/admin/leave-requests`,
        }),
      );
      await this.notifRepo.save(notifs);
    }

    return { success: true, id: saved.id, isMealRefundEligible };
  }

  async getLeaveRequestsByStudent(studentId: number) {
    return this.leaveRequestRepo.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
    });
  }

  async getLeaveRequestsAdmin(status?: LeaveStatus) {
    const where = status ? { status } : {};
    return this.leaveRequestRepo.find({
      where,
      relations: ['student', 'student.classroom'],
      order: { createdAt: 'DESC' },
    });
  }

  async getLeaveRequestsForTeacher(teacherId: number) {
    // Lấy danh sách studentId của lớp giáo viên này
    const classrooms = await this.classRepo.find({
      where: { teacher: { id: teacherId } },
      relations: ['students'],
    });
    const studentIds = classrooms.flatMap(
      (c) => c.students?.map((s) => s.id) ?? [],
    );
    if (!studentIds.length) return [];

    return this.leaveRequestRepo
      .createQueryBuilder('lr')
      .leftJoinAndSelect('lr.student', 'student')
      .where('lr.studentId IN (:...ids)', { ids: studentIds })
      .andWhere('lr.status = :status', { status: 'APPROVED' })
      .orderBy('lr.startDate', 'DESC')
      .getMany();
  }

  async approveLeaveRequest(id: number, adminUserId: number) {
    const lr = await this.leaveRequestRepo.findOne({
      where: { id },
      relations: ['student'],
    });
    if (!lr) return { success: false, message: 'Không tìm thấy đơn xin nghỉ.' };
    if (lr.status !== 'PENDING')
      return { success: false, message: 'Đơn đã được xử lý rồi.' };

    const weekdays = this.countWeekdays(lr.startDate, lr.endDate);

    // Lấy meal rate từ fee_config
    let mealRate = 0;
    if (lr.isMealRefundEligible) {
      const feeConfig = await this.feeConfigRepo.findOne({
        where: { feeType: 'meal' as any },
        order: { createdAt: 'DESC' },
      });
      mealRate = Number(feeConfig?.amount ?? 25000);
    }

    lr.status = 'APPROVED';
    lr.reviewedBy = adminUserId;
    lr.reviewedAt = new Date();
    lr.mealsToDeduct = weekdays;
    lr.refundAmount = lr.isMealRefundEligible ? weekdays * mealRate : 0;
    await this.leaveRequestRepo.save(lr);

    // Điều chỉnh meal_days trong invoice tháng hiện tại (chỉ khi invoice chưa paid)
    if (lr.isMealRefundEligible && weekdays > 0) {
      const month = lr.startDate.slice(0, 7);
      const invoice = await this.invoiceRepo.findOne({
        where: { studentId: lr.studentId, month },
      });
      if (invoice && invoice.status !== 'paid') {
        invoice.mealDays = Math.max(0, invoice.mealDays - weekdays);
        await this.invoiceRepo.save(invoice);
      }
    }

    // Notify parent
    await this.notifRepo.save(
      this.notifRepo.create({
        recipientUserId: lr.requestedBy,
        type: 'leave_request' as NotificationType,
        title: `Đơn xin nghỉ đã được duyệt ✅`,
        body: `Đơn nghỉ của ${lr.student?.full_name ?? ''} từ ${lr.startDate} đến ${lr.endDate} đã được BGH phê duyệt.`,
        relatedId: lr.id,
        linkUrl: `/parent/leave-requests`,
      }),
    );

    return {
      success: true,
      mealsDeducted: weekdays,
      refundAmount: lr.refundAmount,
    };
  }

  async rejectLeaveRequest(id: number, adminUserId: number, note?: string) {
    const lr = await this.leaveRequestRepo.findOne({
      where: { id },
      relations: ['student'],
    });
    if (!lr) return { success: false, message: 'Không tìm thấy đơn xin nghỉ.' };
    if (lr.status !== 'PENDING')
      return { success: false, message: 'Đơn đã được xử lý rồi.' };

    lr.status = 'REJECTED';
    lr.reviewedBy = adminUserId;
    lr.reviewedAt = new Date();
    lr.reviewNote = note ?? null;
    await this.leaveRequestRepo.save(lr);

    await this.notifRepo.save(
      this.notifRepo.create({
        recipientUserId: lr.requestedBy,
        type: 'leave_request' as NotificationType,
        title: `Đơn xin nghỉ không được duyệt ❌`,
        body: note
          ? `Lý do: ${note}`
          : `Đơn nghỉ của ${lr.student?.full_name ?? ''} không được phê duyệt.`,
        relatedId: lr.id,
        linkUrl: `/parent/leave-requests`,
      }),
    );

    return { success: true };
  }

  // ============================================================
  // SUPPORT TICKETS — Kênh khiếu nại / góp ý một cửa
  // ============================================================

  async createTicket(data: {
    parentId: number;
    studentId?: number;
    category: TicketCategory;
    subject: string;
    content: string;
    attachmentUrl?: string;
    adminUserIds?: number[];
  }) {
    const ticket = this.ticketRepo.create({
      parentId: data.parentId,
      studentId: data.studentId ?? null,
      category: data.category,
      subject: data.subject,
      content: data.content,
      attachmentUrl: data.attachmentUrl ?? null,
      status: 'OPEN',
    });
    const saved = await this.ticketRepo.save(ticket);

    // Notify all admins
    if (data.adminUserIds?.length) {
      const notifs = data.adminUserIds.map((uid) =>
        this.notifRepo.create({
          recipientUserId: uid,
          type: 'ticket' as NotificationType,
          title: `[Ticket mới] ${data.subject}`,
          body: data.content.slice(0, 120),
          relatedId: saved.id,
          linkUrl: `/admin/tickets`,
        }),
      );
      await this.notifRepo.save(notifs);
    }

    return { success: true, id: saved.id };
  }

  async getTicketsByParent(parentId: number) {
    return this.ticketRepo.find({
      where: { parentId },
      relations: ['student'],
      order: { createdAt: 'DESC' },
    });
  }

  async getTicketsAdmin(status?: TicketStatus) {
    const where = status ? { status } : {};
    return this.ticketRepo.find({
      where,
      relations: ['student', 'student.classroom'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateTicketStatus(data: {
    id: number;
    status: TicketStatus;
    adminId: number;
    resolutionNote?: string;
  }) {
    const ticket = await this.ticketRepo.findOne({ where: { id: data.id } });
    if (!ticket) return { success: false, message: 'Không tìm thấy ticket.' };

    ticket.status = data.status;
    ticket.assignedTo = data.adminId;
    if (data.resolutionNote) ticket.resolutionNote = data.resolutionNote;
    if (data.status === 'RESOLVED' || data.status === 'CLOSED') {
      ticket.resolvedAt = new Date();
    }
    await this.ticketRepo.save(ticket);

    // Notify parent về cập nhật
    const statusLabel: Record<TicketStatus, string> = {
      OPEN: 'Mới tiếp nhận',
      IN_PROGRESS: 'Đang xử lý',
      RESOLVED: 'Đã giải quyết ✅',
      CLOSED: 'Đã đóng',
    };
    await this.notifRepo.save(
      this.notifRepo.create({
        recipientUserId: ticket.parentId,
        type: 'ticket' as NotificationType,
        title: `Ticket #${ticket.id}: ${statusLabel[data.status]}`,
        body:
          data.resolutionNote ?? `Trạng thái ticket của bạn đã được cập nhật.`,
        relatedId: ticket.id,
        linkUrl: `/parent/tickets`,
      }),
    );

    return { success: true };
  }

  async rateTicketResolution(id: number, parentId: number, rating: number) {
    const ticket = await this.ticketRepo.findOne({ where: { id, parentId } });
    if (!ticket) return { success: false, message: 'Không tìm thấy ticket.' };
    if (ticket.status !== 'RESOLVED') {
      return {
        success: false,
        message: 'Chỉ đánh giá được ticket đã giải quyết.',
      };
    }
    ticket.parentRating = Math.min(5, Math.max(1, rating));
    await this.ticketRepo.save(ticket);
    return { success: true };
  }
}
