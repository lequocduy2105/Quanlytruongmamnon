import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, In, DataSource } from 'typeorm';
import { Teacher } from './entities/teacher.entity';
import { Classroom } from './entities/classroom.entity';
import { Student } from './entities/student.entity';
import { SkillAssessment } from './entities/skill-assessment.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { Feedback } from './entities/feedback.entity';
import { Attendance, AttendanceStatus } from './entities/attendance.entity';
import { AuthorizedPickup } from './entities/authorized-pickup.entity';
import { FeeConfig, FeeType, BillingCycle } from './entities/fee-config.entity';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem, InvoiceItemType } from './entities/invoice-item.entity';
import { Payment } from './entities/payment.entity';
import { InvoiceBatch } from './entities/invoice-batch.entity';
import { Notification, NotificationType } from './entities/notification.entity';
// MedicationSchedule, MedicationLog, IncidentReport → Moved to health-service
import { LeaveRequest, LeaveStatus } from './entities/leave-request.entity';
import {
  SupportTicket,
  TicketCategory,
  TicketStatus,
} from './entities/support-ticket.entity';
import { DailyMenu } from './entities/daily-menu.entity';
import { LessonContent } from './entities/lesson-content.entity';

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
    @InjectRepository(InvoiceItem)
    private readonly invoiceItemRepo: Repository<InvoiceItem>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(InvoiceBatch)
    private readonly invoiceBatchRepo: Repository<InvoiceBatch>,
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
    // medScheduleRepo, medLogRepo, incidentRepo → moved to health-service
    @InjectRepository(LeaveRequest)
    private readonly leaveRequestRepo: Repository<LeaveRequest>,
    @InjectRepository(SupportTicket)
    private readonly ticketRepo: Repository<SupportTicket>,
    @InjectRepository(DailyMenu)
    private readonly dailyMenuRepo: Repository<DailyMenu>,
    @InjectRepository(LessonContent)
    private readonly lessonRepo: Repository<LessonContent>,
    private readonly dataSource: DataSource,
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
   * Zero-Trust: Chỉ truy vấn theo userId từ token của Gateway.
   *
   * Mỗi student trong mảng trả về được gắn thêm { classroom: { id, name } }
   * để Frontend có thể render "Lớp: Thể Dục" thay vì "N/A".
   */
  async getTeacherClass(userId?: number) {
    if (!userId) {
      throw new BadRequestException('Không nhận diện được tài khoản giáo viên.');
    }

    try {
      // Sử dụng QueryBuilder bắt đầu từ Classroom, INNER JOIN Teacher, LEFT JOIN Student (active)
      const classroom = await this.classRepo.createQueryBuilder('class')
        .innerJoin('class.teacher', 'teacher') // Bắt buộc lớp phải có giáo viên này
        .leftJoinAndSelect('class.students', 'student', 'student.status = :status', { status: 'active' }) // Lấy kèm học sinh active
        .where('teacher.userId = :userId', { userId })
        .orderBy('student.full_name', 'ASC')
        .getOne();

      if (!classroom) {
        throw new NotFoundException('Giáo viên này chưa được phân lớp hoặc dữ liệu bị sai');
      }

      const classInfo = { id: classroom.id, name: classroom.name };
      const studentsWithClass = (classroom.students || []).map((s) => ({
        id: s.id,
        full_name: s.full_name,
        date_of_birth: s.date_of_birth,
        status: s.status,
        allergy_tags: s.allergy_tags,
        allergy_severity: s.allergy_severity,
        emergency_action: s.emergency_action,
        emergency_contact_name: s.emergency_contact_name,
        emergency_contact_phone: s.emergency_contact_phone,
        emergency_contact_relation: s.emergency_contact_relation,
        blood_type: s.blood_type,
        medical_notes: s.medical_notes,
        classroom: classInfo,
      }));

      return {
        id: classroom.id,
        name: classroom.name,
        grade_level: classroom.grade_level,
        students: studentsWithClass,
      };
    } catch (error) {
      console.error('Lỗi khi truy vấn lớp học bằng QueryBuilder:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Lỗi hệ thống khi tải danh sách lớp học.');
    }
  }

  /**
   * Plan B — QueryBuilder SQL hardened roster.
   * Dùng Raw SQL INNER JOIN để ép cứng điều kiện lọc ở tầng DB.
   * Không phụ thuộc vào ORM relation loading — không bao giờ bị lọt dữ liệu.
   *
   * SQL tương đương:
   *   SELECT s.*, c.id as c_id, c.name as c_name
   *   FROM teachers t
   *   INNER JOIN classrooms c ON c.id = t.class_id
   *   INNER JOIN students s ON s.class_id = c.id
   *   WHERE t.user_id = [userId]
   */
  async getTeacherRoster(userId: number) {
    if (!userId) {
      return { error: 'Không nhận diện được tài khoản giáo viên.' };
    }

    // Raw SQL — điều kiện WHERE ép cứng tại tầng DB, không qua ORM abstraction
    const rows: Array<{
      student_id: number;
      student_name: string;
      student_dob: Date;
      student_status: string;
      allergy_tags: string;
      allergy_severity: string;
      blood_type: string;
      emergency_contact_name: string;
      class_id: number;
      class_name: string;
      grade_level: string;
    }> = await this.teacherRepo.manager.query(
      `SELECT
         s.id           AS student_id,
         s.full_name    AS student_name,
         s.date_of_birth AS student_dob,
         s.status       AS student_status,
         s.allergy_tags,
         s.allergy_severity,
         s.blood_type,
         s.emergency_contact_name,
         c.id           AS class_id,
         c.name         AS class_name,
         c.grade_level
       FROM teachers t
       INNER JOIN classrooms c ON c.id = t.class_id
       INNER JOIN students s   ON s.class_id = c.id
       WHERE t.user_id = ?
         AND s.status = 'active'
       ORDER BY s.full_name ASC`,
      [userId],
    );

    if (rows.length === 0) {
      // Kiểm tra có phải GV không có lớp không
      const teacher = await this.teacherRepo.findOne({ where: { userId } });
      if (!teacher) return { error: 'Không tìm thấy hồ sơ giáo viên.' };
      if (!teacher.classId) return { error: 'Giáo viên chưa được phân công lớp học.' };
      // Có lớp nhưng lớp rỗng → trả mảng trống
      const classroom = await this.classRepo.findOne({ where: { id: teacher.classId } });
      return {
        id: classroom?.id,
        name: classroom?.name,
        grade_level: classroom?.grade_level,
        students: [],
      };
    }

    // Normalize kết quả về cùng shape với getTeacherClass
    const first = rows[0];
    const classInfo = { id: first.class_id, name: first.class_name };
    const students = rows.map((r) => ({
      id: r.student_id,
      full_name: r.student_name,
      date_of_birth: r.student_dob,
      status: r.student_status,
      allergy_tags: r.allergy_tags ? r.allergy_tags.split(',').filter(Boolean) : [],
      allergy_severity: r.allergy_severity,
      blood_type: r.blood_type,
      emergency_contact_name: r.emergency_contact_name,
      classroom: classInfo,
    }));

    return {
      id: first.class_id,
      name: first.class_name,
      grade_level: first.grade_level,
      students,
    };
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

  // getMedicationsByClass → Moved to health-service

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
    // Sửa lại logic đếm học sinh cần xử lý (deficiencies count)
    const skillMetadata = this.skillRepo.metadata;
    const hasNeedsInterventionInSkill = skillMetadata.columns.some(
      (c) => c.propertyName === 'needs_intervention' || c.databaseName === 'needs_intervention',
    );
    const studentMetadata = this.studentRepo.metadata;
    const hasNeedsInterventionInStudent = studentMetadata.columns.some(
      (c) => c.propertyName === 'needs_intervention' || c.databaseName === 'needs_intervention',
    );

    let deficienciesCountQuery = this.skillRepo
      .createQueryBuilder('sa')
      .leftJoin('sa.student', 'student');

    let condition = '(sa.cognitive_score + sa.social_score + sa.motor_score + sa.emotional_score) / 4.0 < 5.0';
    if (hasNeedsInterventionInSkill) {
      condition += ' OR sa.needs_intervention = true';
    }
    if (hasNeedsInterventionInStudent) {
      condition += ' OR student.needs_intervention = true';
    }

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
      deficienciesCountQuery.where(condition).getCount(),
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
      where: { status: 'active' }, // CHỈ LẤY LỚP ACTIVE
      relations: ['teacher', 'students'],
    });
    return classes.map((c) => ({
      id: c.id,
      name: c.name,
      class_name: c.name,
      grade_level: c.grade_level,
      academic_year: c.academic_year,
      capacity: c.max_capacity,
      studentsCount: c.students?.filter((s) => s.status === 'active').length || 0,
      teacherId: c.teacher?.id || null,
      teacherName: c.teacher?.full_name || 'Chưa phân công',
      status: c.status,
      teacher: c.teacher
        ? {
            id: c.teacher.id,
            full_name: c.teacher.full_name,
            specializations: c.teacher.specializations,
            is_active: c.teacher.is_active,
          }
        : null,
    }));
  }

  async transferTeacher(teacherId: number, newClassId: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // B1: Tháo giáo viên hiện tại ra khỏi lớp cũ
      await queryRunner.manager.update(
        Classroom,
        { teacher: { id: teacherId } },
        { teacher: null as any }
      );

      // B1.5: Tìm và tháo bất kỳ giáo viên nào khác đang chiếm giữ lớp mới
      await queryRunner.manager.update(
        Teacher,
        { classId: newClassId },
        { classId: null }
      );

      // B2: Gán giáo viên hiện tại vào lớp mới
      const updateClassroomResult = await queryRunner.manager.update(
        Classroom,
        { id: newClassId },
        { teacher: { id: teacherId } } as any
      );

      if (updateClassroomResult.affected === 0) {
        throw new Error(`Không tìm thấy lớp học với ID ${newClassId}`);
      }

      // B3: Cập nhật hồ sơ giáo viên với ID lớp mới
      const updateTeacherResult = await queryRunner.manager.update(
        Teacher,
        { id: teacherId },
        { classId: newClassId }
      );

      if (updateTeacherResult.affected === 0) {
        throw new Error(`Không tìm thấy giáo viên với ID ${teacherId}`);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Lỗi trong quá trình luân chuyển giáo viên: ${(error as Error).message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async getTeachers() {
    const rawTeachers = await this.teacherRepo.createQueryBuilder('t')
      .leftJoin('t.classroom', 'c')
      .leftJoin('users', 'u', 'u.id = t.user_id')
      .leftJoin(qb => qb
        .select('f.teacher_id', 'teacher_id')
        .addSelect('AVG(f.rating)', 'avgFeedbackRating')
        .addSelect('COUNT(f.id)', 'countFeedback')
        .from('feedbacks', 'f')
        .groupBy('f.teacher_id'),
        'f_avg',
        'f_avg.teacher_id = t.id'
      )
      .leftJoin(qb => qb
        .select('s.class_id', 'class_id')
        .addSelect('AVG((sa.cognitive_score + sa.social_score + sa.motor_score + sa.emotional_score) / 4.0)', 'avgSkillScore')
        .from('students', 's')
        .innerJoin('skill_assessments', 'sa', 'sa.student_id = s.id')
        .where('s.status = :status', { status: 'active' })
        .groupBy('s.class_id'),
        'sa_avg',
        'sa_avg.class_id = t.class_id'
      )
      .select([
        't.id AS id',
        't.user_id AS userId',
        't.full_name AS full_name',
        't.specializations AS specializations',
        't.is_active AS is_active',
        't.class_id AS classId',
        'c.name AS className',
        'c.status AS classStatus',
        'u.email AS email',
        'COALESCE(f_avg.avgFeedbackRating, 0) AS averageRating',
        'COALESCE(f_avg.countFeedback, 0) AS reviewCount',
        'COALESCE(sa_avg.avgSkillScore, 0) AS performanceSkills',
      ])
      .setParameter('status', 'active')
      .getRawMany();

    return rawTeachers.map((row) => {
      const avgFeedback = Number(row.averageRating);
      const countFeedback = Number(row.reviewCount);
      const avgSkills = Number(row.performanceSkills);
      
      return {
        id: Number(row.id),
        userId: row.userId ? Number(row.userId) : null,
        full_name: row.full_name,
        specializations: row.specializations,
        is_active: row.is_active === 1 || row.is_active === true || row.is_active === 'true',
        classId: row.classStatus === 'active' ? Number(row.classId) : null,
        className: row.classStatus === 'active' ? row.className : 'Chưa phân lớp',
        email: row.email || '',
        averageRating: avgFeedback > 0 ? Math.round(avgFeedback * 10) / 10 : 0,
        reviewCount: countFeedback ? Number(countFeedback) : 0,
        performanceSkills: avgSkills > 0 ? Math.round(avgSkills * 10) / 10 : 0,
        performance: avgFeedback > 0 
          ? Math.round(avgFeedback * 10) / 10 
          : (avgSkills > 0 ? Math.round(avgSkills * 10) / 10 : 0),
      };
    });
  }

  async getStudents() {
    const students = await this.studentRepo.find({ relations: ['classroom'] });
    return students.map((s) => ({
      id: s.id,
      full_name: s.full_name,
      date_of_birth: s.date_of_birth,
      status: s.status,
      is_special_needs: s.is_special_needs,
      classId: s.classroom?.id || null,
      className: s.classroom?.name || 'Chưa có lớp',
      allergy_tags: s.allergy_tags || [],
      allergy_severity: s.allergy_severity || 'NONE',
      blood_type: s.blood_type || '',
      emergency_contact_name: s.emergency_contact_name || '',
      emergency_contact_phone: s.emergency_contact_phone || '',
      emergency_contact_relation: s.emergency_contact_relation || '',
      emergency_action: s.emergency_action || '',
      medical_notes: s.medical_notes || '',
    }));
  }

  async getStudentById(id: number) {
    const student = await this.studentRepo.findOne({
      where: { id },
      relations: ['classroom'],
    });
    if (!student) return null;
    return {
      id: student.id,
      full_name: student.full_name,
      date_of_birth: student.date_of_birth,
      status: student.status,
      is_special_needs: student.is_special_needs,
      classId: student.classroom?.id || null,
      className: student.classroom?.name || 'Chưa có lớp',
      allergy_tags: student.allergy_tags || [],
      allergy_severity: student.allergy_severity || 'NONE',
      blood_type: student.blood_type || '',
      emergency_contact_name: student.emergency_contact_name || '',
      emergency_contact_phone: student.emergency_contact_phone || '',
      emergency_contact_relation: student.emergency_contact_relation || '',
      emergency_action: student.emergency_action || '',
      medical_notes: student.medical_notes || '',
      guardianUserId: student.guardianUserId || null,
    };
  }

  async getChildrenByGuardian(guardianUserId: number) {
    return this.studentRepo.find({
      where: { guardianUserId },
      relations: ['classroom'],
    });
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

      present = todayAttendance.filter(
        (a) => a.status === AttendanceStatus.PRESENT,
      ).length;
      absent = todayAttendance.filter(
        (a) =>
          a.status === AttendanceStatus.ABSENT_EXCUSED ||
          a.status === AttendanceStatus.ABSENT_UNEXCUSED,
      ).length;
      late = todayAttendance.filter((a) => a.status === AttendanceStatus.LATE).length;

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

    // Tasks = học sinh cần xử lý (điểm TB < 5.0 hoặc needs_intervention)
    let tasks: { name: string; desc: string | null }[] = [];
    if (studentIds.length > 0) {
      const skillMetadata = this.skillRepo.metadata;
      const hasNeedsInterventionInSkill = skillMetadata.columns.some(
        (c) => c.propertyName === 'needs_intervention' || c.databaseName === 'needs_intervention',
      );
      const studentMetadata = this.studentRepo.metadata;
      const hasNeedsInterventionInStudent = studentMetadata.columns.some(
        (c) => c.propertyName === 'needs_intervention' || c.databaseName === 'needs_intervention',
      );

      let query = this.skillRepo
        .createQueryBuilder('sa')
        .leftJoinAndSelect('sa.student', 'student')
        .where('student.id IN (:...ids)', { ids: studentIds });

      let condition = '(sa.cognitive_score + sa.social_score + sa.motor_score + sa.emotional_score) / 4.0 < 5.0';
      if (hasNeedsInterventionInSkill) {
        condition += ' OR sa.needs_intervention = true';
      }
      if (hasNeedsInterventionInStudent) {
        condition += ' OR student.needs_intervention = true';
      }

      const deficiencies = await query.andWhere(`(${condition})`).getMany();

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

    // VALIDATION: Chặn tạo feedback vô chủ — bắt buộc phải có teacherId và studentId
    if (!data.teacherId || !data.studentId) {
      return {
        success: false,
        message: 'Thiếu thông tin bắt buộc: teacher_id và student_id là bắt buộc.',
        missingFields: [
          ...(!data.teacherId ? ['teacher_id'] : []),
          ...(!data.studentId ? ['student_id'] : []),
        ],
      };
    }

    const feedback = this.feedbackRepo.create({
      parentUserId: data.parentUserId ?? undefined,
      teacherId: data.teacherId,
      studentId: data.studentId,
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
    grade_level?: 'mam' | 'choi' | 'la' | null;
    age_group: string;
    teacher_id: number;
    capacity: number;
  }) {
    const teacher = data.teacher_id
      ? await this.teacherRepo.findOne({ where: { id: data.teacher_id } })
      : null;
    const classroom = this.classRepo.create({
      name: data.class_name,
      grade_level: data.grade_level || null,
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

  async createTeacherProfile(data: { userId: number; full_name: string; specializations?: string }) {
    const teacher = this.teacherRepo.create({
      userId: data.userId,
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
    allergy_severity?: string;
    blood_type?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relation?: string;
    emergency_action?: string;
    medical_notes?: string;
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
      if (data.class_id) {
        const classroom = await this.classRepo.findOne({ where: { id: data.class_id } });
        student.classroom = classroom || (null as any);
      } else {
        student.classroom = null as any;
      }
    }
    if (data.allergy_severity !== undefined) student.allergy_severity = data.allergy_severity as any;
    if (data.blood_type !== undefined) student.blood_type = data.blood_type;
    if (data.emergency_contact_name !== undefined) student.emergency_contact_name = data.emergency_contact_name;
    if (data.emergency_contact_phone !== undefined) student.emergency_contact_phone = data.emergency_contact_phone;
    if (data.emergency_contact_relation !== undefined) student.emergency_contact_relation = data.emergency_contact_relation;
    if (data.emergency_action !== undefined) student.emergency_action = data.emergency_action;
    if (data.medical_notes !== undefined) student.medical_notes = data.medical_notes;

    await this.studentRepo.save(student);
    // Reload với relation classroom để trả về classId đúng
    const updated = await this.studentRepo.findOne({
      where: { id: data.id },
      relations: ['classroom'],
    });
    return {
      ...(updated ?? student),
      classId: updated?.classroom?.id || null,
      className: updated?.classroom?.name || 'Chưa có lớp',
    };
  }

  async updateClassroom(data: {
    id: number;
    class_name?: string;
    grade_level?: 'mam' | 'choi' | 'la' | null;
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
    if (data.grade_level !== undefined) classroom.grade_level = data.grade_level;
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
    classId?: number | null;
  }) {
    const teacher = await this.teacherRepo.findOne({ where: { id: data.id } });
    if (!teacher) return { error: 'Không tìm thấy giáo viên.' };

    if (data.full_name !== undefined) teacher.full_name = data.full_name;
    if (data.specializations !== undefined)
      teacher.specializations = data.specializations;
    if (data.is_active !== undefined) teacher.is_active = data.is_active;

    if (data.classId !== undefined) {
      if (data.classId === null) {
        teacher.classId = null;
        const oldClass = await this.classRepo.findOne({ where: { teacher: { id: data.id } } });
        if (oldClass) {
          oldClass.teacher = null as any;
          await this.classRepo.save(oldClass);
        }
      } else {
        teacher.classId = data.classId;
        const newClass = await this.classRepo.findOne({ where: { id: data.classId } });
        if (newClass) {
          newClass.teacher = teacher;
          await this.classRepo.save(newClass);
        }
      }
    }

    return this.teacherRepo.save(teacher);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SOFT DELETE — Chuyển trạng thái thay vì xóa cứng
  // Lý do: dữ liệu có khóa ngoại (điểm danh, hóa đơn) không được xóa.
  // GV ví dụ: Điện Máy Xanh không xóa sản phẩm ngừng bán, chỉ đánh dấu
  // "ngừng kinh doanh". Sinh viên tốt nghiệp Hoa Sen 25 năm sau vẫn xuất được bảng điểm.
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Vô hiệu hóa học sinh (soft delete).
   * Chuyển status → 'inactive', ghi lý do nghỉ học.
   * Toàn bộ dữ liệu lịch sử (điểm danh, hóa đơn) vẫn còn nguyên.
   */
  async softDeleteStudent(id: number, reason?: string) {
    const student = await this.studentRepo.findOne({ where: { id } });
    if (!student) {
      return { error: `Không tìm thấy học sinh ID=${id}.` };
    }
    if (student.status === 'inactive') {
      return { error: 'Học sinh này đã ở trạng thái không hoạt động.' };
    }

    // Safety check for reason to prevent crash on .trim() if reason is undefined/null
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return { error: 'Lý do nghỉ học là bắt buộc để thực hiện vô hiệu hóa hồ sơ.' };
    }

    student.status = 'inactive';
    student.withdrawal_reason = reason.trim();
    const saved = await this.studentRepo.save(student);

    return {
      success: true,
      message: `Đã vô hiệu hóa học sinh "${saved.full_name}". Dữ liệu lịch sử vẫn được bảo toàn.`,
      student: { id: saved.id, full_name: saved.full_name, status: saved.status },
    };
  }

  /**
   * Vô hiệu hóa giáo viên (soft delete).
   * Dùng field is_active đã có sẵn trong Teacher entity.
   */
  async softDeleteTeacher(id: number) {
    const teacher = await this.teacherRepo.findOne({ where: { id } });
    if (!teacher) {
      return { error: `Không tìm thấy giáo viên ID=${id}.` };
    }
    if (!teacher.is_active) {
      return { error: 'Giáo viên này đã ở trạng thái không hoạt động.' };
    }

    teacher.is_active = false;

    // Hủy liên kết lớp học nếu có
    const assignedClass = await this.classRepo.findOne({
      where: { teacher: { id } },
    });
    if (assignedClass) {
      assignedClass.teacher = null as any;
      await this.classRepo.save(assignedClass);
    }
    teacher.classId = null;

    const saved = await this.teacherRepo.save(teacher);
    return {
      success: true,
      message: `Đã vô hiệu hóa giáo viên "${saved.full_name}".`,
      teacher: { id: saved.id, full_name: saved.full_name, is_active: saved.is_active },
    };
  }

  /**
   * Đóng lớp học (soft delete / archive).
   * Chuyển status → 'archived'. Học sinh trong lớp vẫn giữ nguyên hồ sơ.
   * Dùng khi lớp kết thúc năm học hoặc cần đóng cửa.
   */
  async softDeleteClassroom(id: number) {
    const classroom = await this.classRepo.findOne({
      where: { id },
      relations: ['students'],
    });
    if (!classroom) {
      return { error: `Không tìm thấy lớp học ID=${id}.` };
    }
    if (classroom.status === 'archived') {
      return { error: 'Lớp học này đã được đóng (archived).' };
    }

    classroom.status = 'archived';
    const saved = await this.classRepo.save(classroom);
    return {
      success: true,
      message: `Đã đóng lớp "${saved.name}". Hồ sơ học sinh vẫn được bảo toàn.`,
      classroom: { id: saved.id, name: saved.name, status: saved.status },
    };
  }

  /**
   * Kích hoạt lại học sinh đã nghỉ (restore).
   */
  async restoreStudent(id: number) {
    const student = await this.studentRepo.findOne({ where: { id } });
    if (!student) return { error: `Không tìm thấy học sinh ID=${id}.` };

    student.status = 'active';
    student.withdrawal_reason = null;
    const saved = await this.studentRepo.save(student);
    return {
      success: true,
      message: `Đã kích hoạt lại học sinh "${saved.full_name}".`,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AGE VALIDATION — Tiếp nhận học sinh theo độ tuổi chuẩn Bộ GD
  // Quy tắc: tuổi tính đến ngày 31/8 của năm học
  //   3 tuổi → Lớp Mầm (mam)
  //   4 tuổi → Lớp Chồi (choi)
  //   5 tuổi → Lớp Lá (la)
  // Ngoại lệ Admin: học sinh cá biệt (tự kỷ, chậm phát triển) có thể
  // vào lớp không đúng độ tuổi nếu Admin set override = true
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Xác định khối lớp phù hợp dựa trên ngày sinh.
   * Tính tuổi theo ngày 31/8 của năm học hiện tại (chuẩn Bộ GD Việt Nam).
   *
   * @param dateOfBirth - Ngày sinh của học sinh
   * @param enrollmentYear - Năm học bắt đầu (VD: 2025 cho năm học 2025-2026). Nếu null thì lấy năm hiện tại.
   * @returns khối lớp 'mam' | 'choi' | 'la' hoặc throw error nếu không hợp lệ
   */
  private determineGradeLevel(
    dateOfBirth: Date,
    enrollmentYear?: number,
  ): { gradeLevel: 'mam' | 'choi' | 'la'; ageAtCutoff: number } {
    const year = enrollmentYear ?? new Date().getFullYear();
    // Ngày cắt tuổi: 31/8 của năm bắt đầu năm học (tháng 8 = index 7)
    const cutoffDate = new Date(year, 7, 31);

    let age = cutoffDate.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = cutoffDate.getMonth() - dateOfBirth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && cutoffDate.getDate() < dateOfBirth.getDate())
    ) {
      age--;
    }

    if (age === 3) return { gradeLevel: 'mam', ageAtCutoff: age };
    if (age === 4) return { gradeLevel: 'choi', ageAtCutoff: age };
    if (age === 5) return { gradeLevel: 'la', ageAtCutoff: age };

    // Tuổi ngoài khoảng 3-5
    throw new Error(
      `Học sinh ${age} tuổi (tính đến 31/8/${year}) không nằm trong độ tuổi tiếp nhận (3-5 tuổi). ` +
        `Nếu đây là trường hợp đặc biệt, Admin cần sử dụng chức năng override.`,
    );
  }

  /**
   * Tiếp nhận học sinh mới với validation độ tuổi đầy đủ.
   * Thay thế / bổ sung cho createStudent() cũ.
   *
   * @param data.isAdminOverride - true nếu là Admin đang tạo cho học sinh cá biệt
   * @param data.override_grade_level - Admin có thể chỉ định khối lớp thủ công
   */
  async enrollStudent(data: {
    full_name: string;
    date_of_birth: string; // 'YYYY-MM-DD'
    class_id?: number;
    allergy_tags?: string[];
    is_special_needs?: boolean;
    isAdminOverride?: boolean;
    override_grade_level?: 'mam' | 'choi' | 'la';
    guardianUserId?: number;
  }) {
    const { full_name, date_of_birth, allergy_tags, is_special_needs, guardianUserId } = data;

    if (!date_of_birth) {
      return { error: 'Ngày sinh là bắt buộc để xác định lớp phù hợp.' };
    }

    const dob = new Date(date_of_birth);
    if (isNaN(dob.getTime())) {
      return { error: 'Định dạng ngày sinh không hợp lệ (yêu cầu YYYY-MM-DD).' };
    }

    let expectedGradeLevel: 'mam' | 'choi' | 'la' | null = null;
    let ageInfo = '';

    // Nếu Admin override → bỏ qua validate tuổi (CHỈ dành cho học sinh đặc biệt)
    if (data.isAdminOverride && data.is_special_needs && data.override_grade_level) {
      expectedGradeLevel = data.override_grade_level;
      ageInfo = `[Admin override - Special Needs] Khối lớp được chỉ định thủ công: ${expectedGradeLevel.toUpperCase()}`;
    } else {
      // Validate tuổi chuẩn
      try {
        const result = this.determineGradeLevel(dob);
        expectedGradeLevel = result.gradeLevel;
        ageInfo = `${result.ageAtCutoff} tuổi → lớp ${expectedGradeLevel.toUpperCase()}`;
      } catch (ageError: any) {
        // Nếu không phải special needs mà không đúng tuổi -> reject
        return { error: ageError.message };
      }
    }

    // Nếu có class_id → kiểm tra lớp đó có đúng grade_level không
    if (data.class_id && expectedGradeLevel) {
      const targetClass = await this.classRepo.findOne({
        where: { id: data.class_id },
      });

      if (targetClass) {
        // Lớp có grade_level và không khớp → báo lỗi (trừ khi Admin override cho học sinh đặc biệt)
        if (
          targetClass.grade_level &&
          targetClass.grade_level !== expectedGradeLevel &&
          !(data.isAdminOverride && data.is_special_needs)
        ) {
          ageInfo = `[Cảnh báo lệch tuổi] Học sinh ${ageInfo} xếp vào lớp "${targetClass.name}" (${targetClass.grade_level.toUpperCase()})`;
        }
      }
    }

    // Tạo học sinh
    const student = this.studentRepo.create({
      full_name,
      classroom: data.class_id ? ({ id: data.class_id } as any) : undefined,
      allergy_tags: allergy_tags || [],
      date_of_birth: dob,
      status: 'active',
      enrollment_date: new Date(),
      is_special_needs: is_special_needs ?? false,
      guardianUserId: guardianUserId ?? undefined,
    });

    await this.studentRepo.save(student);
    // Reload với relation classroom để trả về classId đúng
    const saved = await this.studentRepo.findOne({
      where: { id: student.id },
      relations: ['classroom'],
    });
    return {
      success: true,
      student: {
        ...(saved ?? student),
        classId: saved?.classroom?.id || null,
        className: saved?.classroom?.name || 'Chưa có lớp',
      },
      ageInfo,
      expectedGradeLevel,
    };
  }

  /**
   * Lên Lớp Cuối Năm (Batch Promote)
   * Di chuyển toàn bộ học sinh 'active' của lớp hiện tại sang một lớp mới có cấp bậc cao hơn.
   * Lớp cũ sẽ được chuyển sang trạng thái 'archived'.
   * Lớp Lá -> Tốt nghiệp ('graduated').
   */
  async promoteClass(classId: number) {
    return this.dataSource.transaction(async (manager) => {
      // 1. Lấy thông tin lớp cũ và học sinh (chỉ học sinh active)
      const currentClass = await manager.findOne(Classroom, {
        where: { id: classId },
        relations: ['students', 'teacher'],
      });

      if (!currentClass) {
        throw new Error('Lớp học không tồn tại');
      }

      if (currentClass.status !== 'active') {
        throw new Error('Chỉ lớp đang hoạt động mới có thể thực hiện lên lớp');
      }

      const activeStudents = currentClass.students?.filter((s) => s.status === 'active') || [];

      // 2. Logic cập nhật theo cấp bậc
      if (currentClass.grade_level === 'la') {
        // Học sinh lớp Lá -> Tốt nghiệp
        for (const student of activeStudents) {
          student.status = 'graduated';
          student.classroom = null as any; // Đặt classroom = null (xóa quan hệ)
          await manager.save(Student, student);
        }
      } else {
        // Các lớp Mầm/Chồi -> lên lớp trên
        let nextGrade: 'mam' | 'choi' | 'la' = 'choi';
        let newClassName = currentClass.name; // Mặc định giữ nguyên
        let newAgeGroup = '4-5 tuổi';

        if (currentClass.grade_level === 'mam') {
          nextGrade = 'choi';
          newAgeGroup = '4-5 tuổi';
          newClassName = currentClass.name.replace(/mầm/i, 'Chồi').replace(/Mầm/i, 'Chồi');
          if (newClassName === currentClass.name) {
            newClassName = `Chồi - ${currentClass.name}`;
          }
        } else if (currentClass.grade_level === 'choi') {
          nextGrade = 'la';
          newAgeGroup = '5-6 tuổi';
          newClassName = currentClass.name.replace(/chồi/i, 'Lá').replace(/Chồi/i, 'Lá');
          if (newClassName === currentClass.name) {
            newClassName = `Lá - ${currentClass.name}`;
          }
        }

        // Năm học mới (+1) - Định dạng "2025-2026"
        const currentYearStr = currentClass.academic_year?.split('-')[0];
        const currentYear = currentYearStr ? Number(currentYearStr) : new Date().getFullYear();
        const nextYear = currentYear + 1;
        const newAcademicYear = `${nextYear}-${nextYear + 1}`;

        // 3. Tạo lớp mới
        const newClass = manager.create(Classroom, {
          name: newClassName,
          age_group: newAgeGroup,
          max_capacity: currentClass.max_capacity || 25,
          grade_level: nextGrade,
          academic_year: newAcademicYear,
          status: 'active',
        });
        
        // Không set teacher để admin tự gán sau
        newClass.teacher = null as any;

        const savedNewClass = await manager.save(Classroom, newClass);

        // 4. Cập nhật học sinh sang lớp mới
        for (const student of activeStudents) {
          student.classroom = savedNewClass;
          await manager.save(Student, student);
        }
      }

      // 5. Chuyển lớp cũ sang trạng thái archived và giải phóng giáo viên
      currentClass.status = 'archived';
      if (currentClass.teacher) {
        currentClass.teacher.classId = null;
        await manager.save(Teacher, currentClass.teacher);
        currentClass.teacher = null as any;
      }
      await manager.save(Classroom, currentClass);

      return {
        success: true,
        message: currentClass.grade_level === 'la' 
          ? 'Đã tốt nghiệp học sinh lớp Lá và đóng lớp.' 
          : 'Đã lên lớp thành công. Vui lòng phân công giáo viên cho lớp mới.',
      };
    });
  }


  /**
   * getDeficiencyDetails — Danh sách chi tiết học sinh có deficiency_log (thiếu sót phát triển).
   * Dùng cho ban giám hiệu để xem cụ thể em nào cần xử lý.
   */
  async getDeficiencyDetails() {
    try {
      const skillMetadata = this.skillRepo.metadata;
      const hasNeedsInterventionInSkill = skillMetadata.columns.some(
        (c) => c.propertyName === 'needs_intervention' || c.databaseName === 'needs_intervention',
      );
      const studentMetadata = this.studentRepo.metadata;
      const hasNeedsInterventionInStudent = studentMetadata.columns.some(
        (c) => c.propertyName === 'needs_intervention' || c.databaseName === 'needs_intervention',
      );

      let query = this.skillRepo
        .createQueryBuilder('sa')
        .leftJoinAndSelect('sa.student', 'student')
        .leftJoinAndSelect('student.classroom', 'classroom')
        .leftJoinAndSelect('sa.teacher', 'teacher');

      let condition = '(sa.cognitive_score + sa.social_score + sa.motor_score + sa.emotional_score) / 4.0 < 5.0';
      if (hasNeedsInterventionInSkill) {
        condition += ' OR sa.needs_intervention = true';
      }
      if (hasNeedsInterventionInStudent) {
        condition += ' OR student.needs_intervention = true';
      }

      const items = await query
        .where(condition)
        .orderBy('sa.created_at', 'DESC')
        .getMany();

      return items.map((item) => ({
        assessmentId: item.id,
        studentId: item.student?.id ?? null,
        studentName: item.student?.full_name ?? 'Không rõ',
        className: item.student?.classroom?.name ?? 'Chưa có lớp',
        teacherName: item.teacher?.full_name ?? 'Không rõ',
        deficiencyLog: item.deficiency_log,
        cognitiveScore: Number(item.cognitive_score),
        socialScore: Number(item.social_score),
        motorScore: Number(item.motor_score),
        emotionalScore: Number(item.emotional_score),
        createdAt: item.created_at,
      }));
    } catch (err) {
      console.error('[AcademicService] Error in getDeficiencyDetails:', err);
      throw err;
    }
  }

  async getStudentAssessments(studentId?: number) {
    try {
      const where: any = {};
      if (studentId) where.student = { id: studentId };

      const assessments = await this.skillRepo.find({
        where,
        relations: ['student', 'teacher'],
        order: { created_at: 'DESC' },
      });

      return assessments.map((a) => ({
        id: a.id,
        studentId: a.student?.id,
        studentName: a.student?.full_name,
        teacherName: a.teacher?.full_name,
        cognitiveScore: a.cognitive_score,
        socialScore: a.social_score,
        motorScore: a.motor_score,
        emotionalScore: a.emotional_score,
        deficiencyLog: a.deficiency_log,
        createdAt: a.created_at,
      }));
    } catch (err) {
      console.error('[AcademicService] Error in getStudentAssessments:', err);
      throw err;
    }
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

  async getPickupsByStudent(studentId: number, activeOnly = false) {
    const where: any = { studentId };
    const list = await this.pickupRepo.find({ where, order: { createdAt: 'DESC' } });
    if (activeOnly) {
      const today = new Date().toISOString().slice(0, 10);
      return list.filter((p) => {
        const fromOk = !p.validFrom || p.validFrom <= today;
        const untilOk = !p.validUntil || p.validUntil >= today;
        return fromOk && untilOk;
      });
    }
    return list;
  }

  async createPickup(data: any) {
    const pickup = this.pickupRepo.create({
      studentId: data.studentId,
      name: data.name,
      relationship: data.relationship,
      phone: data.phone,
      validFrom: data.validFrom ?? null,
      validUntil: data.validUntil ?? null,
      photoUrl: data.photoUrl ?? null,
      note: data.note ?? null,
      createdBy: data.createdBy ?? null,
    });
    return this.pickupRepo.save(pickup);
  }

  async updatePickup(data: any) {
    const pickup = await this.pickupRepo.findOne({ where: { id: data.id } });
    if (!pickup) {
      throw new Error('Không tìm thấy người được ủy quyền.');
    }
    if (data.name !== undefined) pickup.name = data.name;
    if (data.relationship !== undefined) pickup.relationship = data.relationship;
    if (data.phone !== undefined) pickup.phone = data.phone;
    if (data.validFrom !== undefined) pickup.validFrom = data.validFrom;
    if (data.validUntil !== undefined) pickup.validUntil = data.validUntil;
    if (data.photoUrl !== undefined) pickup.photoUrl = data.photoUrl;
    if (data.note !== undefined) pickup.note = data.note;
    return this.pickupRepo.save(pickup);
  }

  async deletePickup(id: number) {
    const pickup = await this.pickupRepo.findOne({ where: { id } });
    if (!pickup) {
      throw new Error('Không tìm thấy người được ủy quyền.');
    }
    await this.pickupRepo.remove(pickup);
    return { success: true };
  }

  // ============================================================
  // FINANCE — Học phí & Thanh toán (Phase 1)
  // ============================================================

  /** Lấy tất cả cấu hình học phí */
  async getFeeConfigs() {
    return this.feeConfigRepo.find({
      relations: ['classroom'],
      order: { createdAt: 'DESC' },
    });
  }

  /** Cập nhật cấu hình học phí */
  async updateFeeConfig(
    id: number,
    data: {
      classId?: number | null;
      gradeLevel?: 'MAM' | 'CHOI' | 'LA' | null;
      feeType?: FeeType;
      name?: string;
      amount?: number;
      billingCycle?: BillingCycle;
      effectiveFrom?: string;
      effectiveUntil?: string | null;
      note?: string | null;
    },
  ) {
    const config = await this.feeConfigRepo.findOne({ where: { id } });
    if (!config) throw new NotFoundException('Không tìm thấy cấu hình học phí.');
    
    if (data.classId !== undefined) {
      config.classId = data.classId;
      config.classroom = data.classId ? ({ id: data.classId } as any) : null;
    }
    if (data.gradeLevel !== undefined) config.gradeLevel = data.gradeLevel;
    if (data.feeType !== undefined) config.feeType = data.feeType;
    if (data.name !== undefined) config.name = data.name;
    if (data.amount !== undefined) config.amount = data.amount;
    if (data.billingCycle !== undefined) config.billingCycle = data.billingCycle;
    if (data.effectiveFrom !== undefined) config.effectiveFrom = data.effectiveFrom;
    if (data.effectiveUntil !== undefined) config.effectiveUntil = data.effectiveUntil;
    if (data.note !== undefined) config.note = data.note;

    return this.feeConfigRepo.save(config);
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
    gradeLevel?: 'MAM' | 'CHOI' | 'LA' | null;
    feeType: FeeType;
    name: string;
    amount: number;
    billingCycle: BillingCycle;
    effectiveFrom: string;
    effectiveUntil?: string | null;
    note?: string | null;
    createdBy?: number | null;
  }) {
    const config = this.feeConfigRepo.create({
      classId: data.classId ?? null,
      gradeLevel: data.gradeLevel ?? null,
      feeType: data.feeType,
      name: data.name,
      amount: data.amount,
      billingCycle: data.billingCycle,
      effectiveFrom: data.effectiveFrom,
      effectiveUntil: data.effectiveUntil ?? null,
      note: data.note ?? null,
      createdBy: data.createdBy ?? null,
    });
    const saved = await this.feeConfigRepo.save(config);
    return { success: true, id: saved.id };
  }

  /** Lấy hóa đơn theo học sinh cho phụ huynh */
  async getInvoicesByStudent(guardianUserId: number) {
    const students = await this.studentRepo.find({
      where: { guardianUserId },
      select: ['id'],
    });
    if (students.length === 0) return [];
    const studentIds = students.map((s) => s.id);
    
    const invoices = await this.invoiceRepo.find({
      where: { studentId: In(studentIds) },
      relations: ['student', 'items'],
      order: { month: 'DESC' },
    });
    
    return invoices.map(inv => ({
      ...inv,
      studentName: inv.student?.full_name || `Học sinh #${inv.studentId}`,
    }));
  }

  /** Lấy hóa đơn theo tháng (có thể lọc theo trạng thái) */
  async getInvoicesByMonth(month: string, status?: string) {
    const where: any = { month };
    if (status) {
      where.status = status;
    }
    const invoices = await this.invoiceRepo.find({
      where,
      relations: ['student'],
      order: { studentId: 'ASC' },
    });

    return invoices.map((inv) => ({
      ...inv,
      studentName: inv.student?.full_name || `Học sinh #${inv.studentId}`,
    }));
  }

  /** Tính số ngày làm việc giữa 2 ngày (không tính T7, CN) cho tiền ăn */
  private getExpectedWeekdays(monthStr: string): number {
    const [year, month] = monthStr.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    let weekdaysCount = 0;
    const cur = new Date(startDate);
    while (cur <= endDate) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) {
        weekdaysCount++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return weekdaysCount;
  }

  /**
   * Tạo hóa đơn hàng loạt cho tất cả học sinh trong 1 tháng (Batch Algorithm)
   */
  async generateMonthlyInvoices(data: {
    month: string;
    dueDate?: string | null;
    createdBy?: number | null;
  }) {
    const monthStr = data.month;
    
    // 1. Check existing batch logic (state lock)
    const existingBatch = await this.invoiceBatchRepo.findOne({
      where: { month: monthStr },
    });
    if (existingBatch) {
      if (existingBatch.status === 'PROCESSING' || existingBatch.status === 'COMPLETED') {
        throw new BadRequestException(`Tiến trình tạo hóa đơn tháng ${monthStr} đang chạy hoặc đã hoàn thành.`);
      }
      await this.invoiceBatchRepo.delete(existingBatch.id);
    }

    // 2. Query all active students
    const activeStudents = await this.studentRepo.find({
      where: { status: 'active' },
      relations: ['classroom'],
    });

    if (activeStudents.length === 0) {
      return { success: true, total: 0, created: 0, updated: 0 };
    }

    // 3. Find active configs for the target month
    const [year, month] = monthStr.split('-').map(Number);
    const firstDayStr = `${monthStr}-01`;
    const lastDayStr = new Date(year, month, 0).toISOString().slice(0, 10);

    const activeConfigs = await this.feeConfigRepo.createQueryBuilder('fc')
      .where('fc.effectiveFrom <= :lastDayStr', { lastDayStr })
      .andWhere('(fc.effectiveUntil IS NULL OR fc.effectiveUntil >= :firstDayStr)', { firstDayStr })
      .getMany();

    // 4. Calculate default due date (15th of next month)
    const nextMonth = month === 12
      ? `${year + 1}-01`
      : `${year}-${String(month + 1).padStart(2, '0')}`;
    const defaultDueDate = data.dueDate ?? `${nextMonth}-15`;

    // 5. Initialize batch with PROCESSING status outside the transaction
    let batch = this.invoiceBatchRepo.create({
      month: monthStr,
      status: 'PROCESSING',
      totalRecords: activeStudents.length,
      successRecords: 0,
      createdBy: data.createdBy ?? null,
    });
    batch = await this.invoiceBatchRepo.save(batch);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let createdCount = 0;
      let updatedCount = 0;
      let successCount = 0;

      for (const student of activeStudents) {
        const classroomId = student.classroom?.id || null;
        const gradeLevel = student.classroom?.grade_level ? student.classroom.grade_level.toUpperCase() : null;

        // Resolve configs matching Student (Classroom -> Grade -> Global)
        const studentConfigs: FeeConfig[] = [];
        const feeTypes: FeeType[] = ['tuition', 'meal', 'facility', 'transport', 'extracurricular', 'other'];

        for (const feeType of feeTypes) {
          let resolvedConfig = activeConfigs.find(
            (c) => c.feeType === feeType && c.classId === classroomId && classroomId !== null
          );

          if (!resolvedConfig && gradeLevel) {
            resolvedConfig = activeConfigs.find(
              (c) => c.feeType === feeType && c.gradeLevel === gradeLevel && c.classId === null
            );
          }

          if (!resolvedConfig) {
            resolvedConfig = activeConfigs.find(
              (c) => c.feeType === feeType && c.classId === null && c.gradeLevel === null
            );
          }

          if (resolvedConfig) {
            studentConfigs.push(resolvedConfig);
          }
        }

        if (studentConfigs.length === 0) {
          continue;
        }

        // Calculate invoice totals
        let subtotalAmount = 0;
        const discountAmount = 0;
        const refundAmount = 0;
        
        const invoiceItemsData: Partial<InvoiceItem>[] = [];

        for (const cfg of studentConfigs) {
          let quantity = 1;
          let name = cfg.name;
          let type: InvoiceItemType = 'other';

          if (cfg.feeType === 'tuition') {
            type = 'tuition';
          } else if (cfg.feeType === 'meal') {
            type = 'meal_expected';
            quantity = this.getExpectedWeekdays(monthStr);
            name = `${cfg.name} (Tạm tính ${quantity} ngày)`;
          } else if (cfg.feeType === 'facility') {
            type = 'facility';
          } else if (cfg.feeType === 'transport') {
            type = 'transport';
          } else if (cfg.feeType === 'extracurricular') {
            type = 'extracurricular';
          } else {
            type = 'other';
          }

          const itemSubtotal = cfg.amount * quantity;
          const itemTotal = itemSubtotal;

          invoiceItemsData.push({
            feeConfigId: cfg.id,
            name,
            type,
            unitPrice: cfg.amount,
            quantity,
            subtotal: itemSubtotal,
            discount: 0,
            totalAmount: itemTotal,
          });

          subtotalAmount += itemTotal;
        }

        const totalAmount = subtotalAmount - discountAmount - refundAmount;

        // Check if invoice already exists
        let invoice = await queryRunner.manager.findOne(Invoice, {
          where: { studentId: student.id, month: monthStr },
        });

        if (invoice) {
          if (invoice.status !== 'pending') {
            // To preserve already paid data, skip updating this invoice
            successCount++;
            continue;
          }

          // Delete old items
          await queryRunner.manager.delete(InvoiceItem, { invoiceId: invoice.id });
          
          invoice.subtotalAmount = subtotalAmount;
          invoice.discountAmount = discountAmount;
          invoice.refundAmount = refundAmount;
          invoice.totalAmount = totalAmount;
          invoice.dueDate = defaultDueDate;
          invoice.note = `Cập nhật tự động (Batch #${batch.id})`;
          await queryRunner.manager.save(Invoice, invoice);
          updatedCount++;
        } else {
          invoice = queryRunner.manager.create(Invoice, {
            studentId: student.id,
            month: monthStr,
            subtotalAmount,
            discountAmount,
            refundAmount,
            totalAmount,
            amountPaid: 0,
            status: 'pending',
            dueDate: defaultDueDate,
            note: `Tạo tự động (Batch #${batch.id})`,
            createdBy: data.createdBy ?? null,
          });
          invoice = await queryRunner.manager.save(Invoice, invoice);
          createdCount++;
        }

        // Save items
        for (const itemData of invoiceItemsData) {
          const item = queryRunner.manager.create(InvoiceItem, {
            ...itemData,
            invoiceId: invoice.id,
          });
          await queryRunner.manager.save(InvoiceItem, item);
        }

        successCount++;
      }

      // Update and commit batch
      batch.status = 'COMPLETED';
      batch.successRecords = successCount;
      batch.completedAt = new Date();
      await queryRunner.manager.save(InvoiceBatch, batch);

      await queryRunner.commitTransaction();

      return {
        success: true,
        total: activeStudents.length,
        created: createdCount,
        updated: updatedCount,
        successCount,
      };
    } catch (err: any) {
      await queryRunner.rollbackTransaction();

      batch.status = 'FAILED';
      batch.errorLog = err?.message || String(err);
      batch.completedAt = new Date();
      await this.invoiceBatchRepo.save(batch);

      throw new BadRequestException(`Tạo hóa đơn hàng loạt thất bại: ${err?.message || err}`);
    } finally {
      await queryRunner.release();
    }
  }

  /** Lấy hóa đơn theo lớp */
  async getInvoicesByClass(classId: number, month: string) {
    const invoices = await this.invoiceRepo.createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.student', 'student')
      .leftJoinAndSelect('student.classroom', 'classroom')
      .where('classroom.id = :classId', { classId })
      .andWhere('invoice.month = :month', { month })
      .orderBy('invoice.studentId', 'ASC')
      .getMany();
    return invoices.map((inv) => ({
      ...inv,
      studentName: inv.student?.full_name || `Học sinh #${inv.studentId}`,
    }));
  }

  /** Tổng hợp tài chính lớp */
  async getClassFinanceSummary(classId: number, month: string) {
    const invoices = await this.getInvoicesByClass(classId, month);
    const classroom = await this.classRepo.findOne({
      where: { id: classId },
      relations: ['teacher'],
    });

    const totalBilled = invoices.reduce((s, i) => s + Number(i.totalAmount || 0), 0);
    const totalCollected = invoices.reduce((s, i) => s + Number(i.amountPaid || 0), 0);
    const totalRemaining = totalBilled - totalCollected;

    return {
      classId,
      className: classroom?.name || `Lớp #${classId}`,
      teacherName: classroom?.teacher?.full_name || null,
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
      throw new NotFoundException('Không tìm thấy hóa đơn.');
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
    const total = Number(invoice.totalAmount || 0);
    if (invoice.amountPaid >= total) {
      invoice.status = 'paid';
      invoice.paidAt = new Date();
    } else if (invoice.amountPaid > 0) {
      invoice.status = 'partial';
    }
    await this.invoiceRepo.save(invoice);
    return { success: true, newStatus: invoice.status };
  }

  /** Xác nhận đã thu tiền thủ công */
  async payInvoice(invoiceId: number, note?: string, receivedBy?: number | null) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId },
    });
    if (!invoice) {
      throw new NotFoundException('Không tìm thấy hóa đơn.');
    }

    const remaining = Number(invoice.totalAmount || 0) - Number(invoice.amountPaid || 0);
    if (remaining <= 0) {
      return { success: true, message: 'Hóa đơn đã được thanh toán đầy đủ.', newStatus: invoice.status };
    }

    const ref = `CONFIRM-${invoiceId}-${Date.now()}`;
    const payment = this.paymentRepo.create({
      invoiceId,
      amount: remaining,
      paymentMethod: 'cash',
      referenceCode: ref,
      receivedBy: receivedBy ?? null,
      note: note || 'Xác nhận thu tiền thủ công bởi Admin',
    });
    await this.paymentRepo.save(payment);

    invoice.amountPaid = Number(invoice.totalAmount || 0);
    invoice.status = 'paid';
    invoice.paidAt = new Date();
    await this.invoiceRepo.save(invoice);

    return { success: true, newStatus: invoice.status };
  }

  /** Xử lý thanh toán tự động qua Webhook */
  async processPaymentWebhook(referenceCode: string, amount: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // Tìm hóa đơn bằng referenceCode (ví dụ: INV202605STU1)
      const match = referenceCode.match(/^INV(\d{4})(\d{2})STU(\d+)$/i);
      let invoice: Invoice | null = null;
      
      if (match) {
        const year = match[1];
        const month = match[2];
        const studentId = parseInt(match[3], 10);
        invoice = await queryRunner.manager.findOne(Invoice, {
          where: { studentId, month: year + '-' + month },
          relations: ['student'],
          lock: { mode: 'pessimistic_write' },
        });
      } else {
        // Fallback: Tìm theo invoiceId trực tiếp (INV-123 hoặc 123)
        const idMatch = referenceCode.match(/^INV-?(\d+)$/i);
        const invoiceId = idMatch ? parseInt(idMatch[1], 10) : parseInt(referenceCode, 10);
        if (!isNaN(invoiceId)) {
          invoice = await queryRunner.manager.findOne(Invoice, {
            where: { id: invoiceId },
            relations: ['student'],
            lock: { mode: 'pessimistic_write' },
          });
        }
      }

      if (!invoice) {
        await queryRunner.rollbackTransaction();
        return { success: false, message: 'Không tìm thấy hóa đơn tương ứng với mã thanh toán: ' + referenceCode };
      }

      if (invoice.status === 'paid') {
        await queryRunner.rollbackTransaction();
        return { success: true, message: 'Hóa đơn đã được thanh toán trước đó.' };
      }

      const totalAmount = Number(invoice.totalAmount || 0);
      if (amount >= totalAmount) {
        // Tạo bản ghi giao dịch
        const payment = queryRunner.manager.create(Payment, {
          invoiceId: invoice.id,
          amount: amount,
          paymentMethod: 'bank_transfer',
          referenceCode: referenceCode,
          note: 'Thanh toán tự động thành công qua cổng Webhook.',
        });
        await queryRunner.manager.save(Payment, payment);

        // Cập nhật hóa đơn
        invoice.amountPaid = amount;
        invoice.status = 'paid';
        invoice.paidAt = new Date();
        invoice.note = (invoice.note ? invoice.note + '\n' : '') + 'Đã thanh toán tự động qua Webhook (' + referenceCode + ').';
        await queryRunner.manager.save(Invoice, invoice);

        await queryRunner.commitTransaction();
        return { success: true, message: 'Xử lý hóa đơn thành công.' };
      } else {
        await queryRunner.rollbackTransaction();
        return { success: false, message: 'Số tiền thanh toán không đủ. Yêu cầu: ' + totalAmount + ', Nhận: ' + amount };
      }
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /** Báo cáo tài chính tháng */
  async getFinancialSummary(month: string) {
    const invoices = await this.invoiceRepo.find({ where: { month } });
    const totalBilled = invoices.reduce(
      (s, i) => s + Number(i.totalAmount || 0),
      0,
    );
    const totalCollected = invoices.reduce(
      (s, i) => s + Number(i.amountPaid || 0),
      0,
    );
    
    const todayStr = new Date().toISOString().slice(0, 10);
    const totalOverdue = invoices
      .filter(
        (i) =>
          i.status === 'overdue' ||
          (i.status === 'pending' && i.dueDate && i.dueDate < todayStr),
      )
      .reduce(
        (s, i) => s + (Number(i.totalAmount || 0) - Number(i.amountPaid || 0)),
        0,
      );

    return {
      month,
      totalStudents: invoices.length,
      statusBreakdown: {
        pending: invoices.filter((i) => i.status === 'pending').length,
        partial: invoices.filter((i) => i.status === 'partial').length,
        paid: invoices.filter((i) => i.status === 'paid').length,
        overdue: invoices.filter((i) => i.status === 'overdue' || (i.status === 'pending' && i.dueDate < todayStr)).length,
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
  // NOTIFICATIONS - Hệ thống thông báo
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
  // MEDICATIONS → Moved to health-service
  // getMedicationsByStudent, getTodayMedications, getMedicationsByClass,
  // createMedicationSchedule, logMedicationGiven, getMedicationLogs
  // → See health-service.service.ts
  // ============================================================
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
  // INCIDENT REPORTS → Moved to health-service
  // createIncidentReport, getIncidentsByTeacher, getIncidentsByStudent,
  // getIncidentsAdmin, acknowledgeIncident, reviewIncident
  // → See health-service.service.ts
  // ============================================================

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

    // In Phase 1, manual adjustment is preferred. Invoice adjustment is disabled.
    /*
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
    */

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

  // ═══════════════════════════════════════════════════════════════════════════
  // E-LEARNING — Bài học (LessonContent)
  // ═══════════════════════════════════════════════════════════════════════════

  async createLesson(data: {
    title: string;
    description?: string;
    content_url?: string;
    file_url?: string;
    classId: number;
    createdBy: number;
  }) {
    const lesson = this.lessonRepo.create(data);
    return this.lessonRepo.save(lesson);
  }

  async getLessonsByClass(classId: number) {
    return this.lessonRepo.find({
      where: { classId },
      order: { createdAt: 'DESC' }, // Fix: Mới nhất hiển thị ở trên cùng
    });
  }

  async updateLesson(id: number, data: Partial<LessonContent>) {
    await this.lessonRepo.update(id, data);
    return this.lessonRepo.findOne({ where: { id } });
  }

  async deleteLesson(id: number) {
    const lesson = await this.lessonRepo.findOne({ where: { id } });
    if (!lesson) return { success: false, message: 'Bài học không tồn tại.' };
    await this.lessonRepo.remove(lesson);
    return { success: true };
  }
}
