import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { ApiGatewayService } from './api-gateway.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';
import { firstValueFrom } from 'rxjs';

@Controller('api')
export class ApiGatewayController {
  constructor(private readonly apiGatewayService: ApiGatewayService) {}

  /**
   * POST /api/login
   * Public endpoint - no guards
   */
  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.apiGatewayService.login(body.email, body.password);
  }

  /**
   * GET /api/admin/dashboard
   * RBAC: ADMIN only
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/dashboard')
  getAdminDashboard() {
    return this.apiGatewayService.getAdminDashboard();
  }

  /**
   * GET /api/academic/classes
   * RBAC: ADMIN, TEACHER
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEACHER', 'PARENT')
  @Get('academic/classes')
  getAcademicClasses() {
    return this.apiGatewayService.getAcademicClasses();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEACHER')
  @Get('academic/teachers')
  getTeachers() {
    return this.apiGatewayService.getTeachers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEACHER')
  @Get('academic/students')
  getStudents() {
    return this.apiGatewayService.getStudents();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('academic/students')
  createStudent(
    @Body()
    data: {
      full_name: string;
      class_id?: number;
      allergy_tags?: string[];
      date_of_birth?: string;
    },
  ) {
    return this.apiGatewayService.createStudent(data);
  }

  /**
   * GET /api/teacher/dashboard?teacherId=X
   * RBAC: TEACHER only
   * teacherId query param: nếu có, dùng teacher ID trực tiếp (cho trường hợp gatekeeper bằng tên)
   * Nếu không, fallback về userId từ JWT
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  @Get('teacher/dashboard')
  getTeacherDashboard(
    @Request() req: any,
    @Query('teacherId') teacherId?: string,
  ) {
    return firstValueFrom(
      this.apiGatewayService['academicClient'].send(
        { cmd: 'get_teacher_dashboard' },
        teacherId
          ? { teacherId: Number(teacherId) } // dùng teacher.id trực tiếp
          : { userId: req.user.userId }, // fallback JWT
      ),
    );
  }

  /**
   * GET /api/teacher/profile
   * RBAC: TEACHER only - trả về teacher profile tương ứng với userId JWT
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  @Get('teacher/profile')
  getTeacherProfile(@Request() req: any) {
    return firstValueFrom(
      this.apiGatewayService['academicClient'].send(
        { cmd: 'get_teacher_by_user_id' },
        { userId: req.user.userId },
      ),
    );
  }

  /**
   * POST /api/health/vitals
   * RBAC: TEACHER only
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  @Post('health/vitals')
  submitHealthVitals(@Body() vitalsData: object) {
    return this.apiGatewayService.submitHealthVitals(vitalsData);
  }

  /**
   * GET /api/health/vitals?studentId=X
   * RBAC: TEACHER, ADMIN — xem tất cả
   * PARENT — chỉ xem vitals của con mình (ownership enforced)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN', 'PARENT')
  @Get('health/vitals')
  async getHealthVitals(
    @Request() req: any,
    @Query('studentId') studentId?: string,
  ) {
    const user = req.user;
    if (user.role === 'PARENT') {
      // PARENT phải cung cấp studentId và phải là con của mình
      if (!studentId) {
        throw new ForbiddenException('studentId is required for parent role.');
      }
      // Kiểm tra quyền sở hữu qua academic-service
      const owned = await this.apiGatewayService.verifyChildOwnership(
        Number(studentId),
        user.userId,
      );
      if (!owned) {
        throw new ForbiddenException(
          'Access denied: this student does not belong to you.',
        );
      }
    }
    return this.apiGatewayService.getHealthVitals(
      studentId ? Number(studentId) : undefined,
    );
  }

  /**
   * POST /api/academic/assessments
   * RBAC: TEACHER only
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  @Post('academic/assessments')
  submitAssessment(@Body() assessmentData: object) {
    return this.apiGatewayService.submitAssessment(assessmentData);
  }

  /**
   * POST /api/feedback
   * RBAC: PARENT only (submit star rating + comment)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARENT')
  @Post('feedback')
  submitFeedback(@Body() feedbackData: object) {
    return this.apiGatewayService.submitFeedback(feedbackData);
  }

  /**
   * GET /api/parent/student/:id/records
   * RBAC: PARENT only - ownership is enforced in academic-service
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARENT')
  @Get('parent/student/:id/records')
  getParentStudentRecords(@Param('id') id: string, @Request() req: any) {
    const guardianUserId: number = req.user.userId;
    return this.apiGatewayService.getParentStudentRecords(id, guardianUserId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN', 'PARENT')
  @Get('academic/assessments')
  getStudentAssessments(@Request() req: any) {
    return this.apiGatewayService.getStudentAssessments(req.query.studentId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Post('academic/activity-logs')
  createActivityLog(@Body() logData: any) {
    return this.apiGatewayService.createActivityLog(logData);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('academic/classes')
  createClassroom(@Body() classData: any) {
    return this.apiGatewayService.createClassroom(classData);
  }

  /**
   * GET /api/parent/my-children
   * RBAC: PARENT only - returns list of children linked to this parent
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARENT')
  @Get('parent/my-children')
  getMyChildren(@Request() req: any) {
    const guardianUserId: number = req.user.userId;
    return this.apiGatewayService.getChildrenByGuardian(guardianUserId);
  }

  /**
   * POST /api/parent/link-child
   * RBAC: PARENT only - tìm + liên kết học sinh theo tên, ngày sinh, lớp
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARENT')
  @Post('parent/link-child')
  linkChild(
    @Request() req: any,
    @Body()
    body: { full_name: string; date_of_birth: string; class_name: string },
  ) {
    const guardianUserId: number = req.user.userId;
    return this.apiGatewayService.linkChild({ guardianUserId, ...body });
  }

  /**
   * POST /api/academic/teachers
   * RBAC: ADMIN only - create a new teacher profile
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('academic/teachers')
  createTeacher(
    @Body() teacherData: { full_name: string; specializations?: string },
  ) {
    return this.apiGatewayService.createTeacher(teacherData);
  }

  /**
   * PUT /api/academic/students/:id
   * RBAC: ADMIN only - update student name, class, allergies
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Put('academic/students/:id')
  updateStudent(
    @Param('id') id: string,
    @Body()
    data: {
      full_name?: string;
      class_id?: number | null;
      allergy_tags?: string[];
      date_of_birth?: string | null;
    },
  ) {
    return this.apiGatewayService.updateStudent(Number(id), data);
  }

  /**
   * PUT /api/academic/classes/:id
   * RBAC: ADMIN only - update class name, teacher, capacity, age_group
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Put('academic/classes/:id')
  updateClassroom(
    @Param('id') id: string,
    @Body()
    data: {
      class_name?: string;
      age_group?: string;
      capacity?: number;
      teacher_id?: number | null;
    },
  ) {
    return this.apiGatewayService.updateClassroom(Number(id), data);
  }

  /**
   * PUT /api/academic/teachers/:id
   * RBAC: ADMIN only - update teacher name, specialization, status
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Put('academic/teachers/:id')
  updateTeacher(
    @Param('id') id: string,
    @Body()
    data: { full_name?: string; specializations?: string; is_active?: boolean },
  ) {
    return this.apiGatewayService.updateTeacher(Number(id), data);
  }

  /**
   * GET /api/admin/deficiencies
   * RBAC: ADMIN only - chi tiết học sinh có thiếu sót phát triển
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/deficiencies')
  getDeficiencyDetails() {
    return this.apiGatewayService.getDeficiencyDetails();
  }

  /**
   * GET /api/admin/feedbacks
   * RBAC: ADMIN only - xem toàn bộ đánh giá phụ huynh kèm thông tin giáo viên/học sinh
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/feedbacks')
  getAllFeedbacks() {
    return this.apiGatewayService.getAllFeedbacks();
  }

  /**
   * GET /api/admin/student/:id/records
   * RBAC: ADMIN only - Xem toàn bộ hồ sơ học sinh (không cần guardianUserId)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/student/:id/records')
  getStudentRecordsAdmin(@Param('id') id: string) {
    return this.apiGatewayService.getStudentRecordsAdmin(Number(id));
  }

  // ─── Attendance ───────────────────────────────────────────────

  /**
   * POST /api/academic/attendance
   * RBAC: TEACHER only - Ghi điểm danh hàng loạt
   * Body: { date, records: [{ studentId, status, note? }] }
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  @Post('academic/attendance')
  saveAttendance(
    @Body()
    body: {
      date: string;
      records: Array<{ studentId: number; status: string; note?: string }>;
    },
    @Request() req: { user: { sub: number } },
  ) {
    return this.apiGatewayService.saveAttendanceBulk({
      date: body.date,
      createdBy: req.user.sub,
      records: body.records,
    });
  }

  /**
   * GET /api/academic/attendance?date=YYYY-MM-DD&classId=1
   * RBAC: ADMIN, TEACHER
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEACHER')
  @Get('academic/attendance')
  getAttendanceByDate(
    @Request()
    req: {
      query: { date?: string; classId?: string; studentId?: string };
    },
  ) {
    const {
      date = new Date().toISOString().slice(0, 10),
      classId,
      studentId,
    } = req.query;
    return this.apiGatewayService.getAttendanceByDate(
      date,
      classId ? Number(classId) : undefined,
      studentId ? Number(studentId) : undefined,
    );
  }

  /**
   * GET /api/academic/attendance/student/:id
   * RBAC: ADMIN, TEACHER, PARENT
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEACHER', 'PARENT')
  @Get('academic/attendance/student/:id')
  getAttendanceByStudent(@Param('id') id: string) {
    return this.apiGatewayService.getAttendanceByStudent(Number(id));
  }

  // ─── Authorized Pickups ────────────────────────────────────────

  /**
   * GET /api/academic/pickups/student/:id
   * RBAC: TEACHER, ADMIN, PARENT — xem danh sách người được ủy quyền đón
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEACHER', 'PARENT')
  @Get('academic/pickups/student/:id')
  getPickupsByStudent(@Param('id') id: string) {
    return this.apiGatewayService.getPickupsByStudent(Number(id), false);
  }

  /**
   * POST /api/academic/pickups
   * RBAC: PARENT, ADMIN — tạo mới ủy quyền
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PARENT')
  @Post('academic/pickups')
  createPickup(
    @Body()
    body: {
      studentId: number;
      name: string;
      relationship: string;
      phone: string;
      validFrom?: string;
      validUntil?: string;
      photoUrl?: string;
      note?: string;
    },
    @Request() req: any,
  ) {
    return this.apiGatewayService.createPickup({
      ...body,
      createdBy: req.user?.sub ?? null,
    });
  }

  /**
   * PUT /api/academic/pickups/:id
   * RBAC: PARENT, ADMIN — cập nhật ủy quyền
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PARENT')
  @Put('academic/pickups/:id')
  updatePickup(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      relationship?: string;
      phone?: string;
      validFrom?: string | null;
      validUntil?: string | null;
      photoUrl?: string | null;
      note?: string | null;
    },
  ) {
    return this.apiGatewayService.updatePickup({ id: Number(id), ...body });
  }

  /**
   * DELETE /api/academic/pickups/:id
   * RBAC: ADMIN only (phương thức HTTP DELETE đúng chuẩn REST)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete('academic/pickups/:id')
  deletePickup(@Param('id') id: string) {
    return this.apiGatewayService.deletePickup(Number(id));
  }

  // ═══════════════════════════════════════════════════════════
  // NOTIFICATIONS (MISSING-01)
  // ═══════════════════════════════════════════════════════════

  /**
   * GET /api/notifications — lấy thông báo của user đang đăng nhập
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEACHER', 'PARENT')
  @Get('notifications')
  getMyNotifications(@Request() req: any) {
    const user = req.user as { userId: number };
    return this.apiGatewayService.getNotifications(user.userId);
  }

  /**
   * PUT /api/notifications/:id/read — đánh dấu 1 thông báo đã đọc
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEACHER', 'PARENT')
  @Put('notifications/:id/read')
  markNotificationRead(@Param('id') id: string, @Request() req: any) {
    const user = req.user as { userId: number };
    return this.apiGatewayService.markNotificationRead(Number(id), user.userId);
  }

  /**
   * PUT /api/notifications/read-all — đánh dấu tất cả đã đọc
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEACHER', 'PARENT')
  @Put('notifications/read-all')
  markAllNotificationsRead(@Request() req: any) {
    const user = req.user as { userId: number };
    return this.apiGatewayService.markAllNotificationsRead(user.userId);
  }

  // ═══════════════════════════════════════════════════════════
  // FINANCE — HỌC PHÍ (MISSING-02)
  // ═══════════════════════════════════════════════════════════

  /**
   * GET /api/finance/fee-configs — cấu hình học phí
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('finance/fee-configs')
  getFeeConfigs() {
    return this.apiGatewayService.getFeeConfigs();
  }

  /**
   * POST /api/finance/fee-configs — tạo/cập nhật cấu hình học phí
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('finance/fee-configs')
  upsertFeeConfig(@Body() body: object) {
    return this.apiGatewayService.upsertFeeConfig(body);
  }

  /**
   * GET /api/finance/invoices?month=YYYY-MM — danh sách hóa đơn theo tháng
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('finance/invoices')
  getInvoices(@Query('month') month?: string) {
    return this.apiGatewayService.getInvoices(month);
  }

  /**
   * POST /api/finance/invoices/generate — tạo hóa đơn hàng loạt cho tháng
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('finance/invoices/generate')
  generateMonthlyInvoices(@Body() body: { month: string }) {
    return this.apiGatewayService.generateMonthlyInvoices(body.month);
  }

  /**
   * POST /api/finance/payments — ghi nhận thanh toán
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('finance/payments')
  recordPayment(@Body() body: object) {
    return this.apiGatewayService.recordPayment(body);
  }

  /**
   * GET /api/finance/summary?month=YYYY-MM — báo cáo tài chính tháng
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('finance/summary')
  getFinanceSummary(@Query('month') month?: string) {
    return this.apiGatewayService.getFinanceSummary(month);
  }

  /**
   * PUT /api/finance/fee-configs/:id — cập nhật cấu hình học phí
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Put('finance/fee-configs/:id')
  updateFeeConfig(@Param('id') id: string, @Body() body: object) {
    return this.apiGatewayService.updateFeeConfig(Number(id), body);
  }

  /**
   * DELETE /api/finance/fee-configs/:id — xoá cấu hình học phí
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete('finance/fee-configs/:id')
  deleteFeeConfig(@Param('id') id: string) {
    return this.apiGatewayService.deleteFeeConfig(Number(id));
  }

  /**
   * GET /api/finance/invoices/by-class?classId=X&month=YYYY-MM — admin xem hóa đơn theo lớp
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('finance/invoices/by-class')
  getInvoicesByClass(
    @Query('classId') classId: string,
    @Query('month') month?: string,
  ) {
    const m = month ?? new Date().toISOString().slice(0, 7);
    return this.apiGatewayService.getInvoicesByClass(Number(classId), m);
  }

  /**
   * GET /api/teacher/class-finance?month=YYYY-MM
   * Giáo viên xem hóa đơn & tổng hợp tài chính lớp mình.
   * Dùng classroom.teacher_id (FK từ phía classroom) thay vì teacher.class_id
   * để tránh lỗi desync — classroom.teacher_id luôn được Admin set đúng.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  @Get('teacher/class-finance')
  async getTeacherClassFinance(
    @Request() req: any,
    @Query('month') month?: string,
  ) {
    // Bước 1: Lấy thông tin teacher từ userId trong JWT
    const teacher = await this.apiGatewayService.getTeacherByUserId(req.user.userId);
    console.log('[DEBUG class-finance] userId=%s, teacher=%s', req.user.userId, JSON.stringify(teacher ? { id: teacher.id, name: teacher.full_name, classId: teacher.classId } : null));
    if (!teacher) {
      return { error: 'Không tìm thấy hồ sơ giáo viên.' };
    }

    // Bước 2: Lookup classroom từ phía classroom.teacher_id (nguồn dữ liệu đúng nhất)
    const classroom = await this.apiGatewayService.getClassroomByTeacherId(teacher.id);
    console.log('[DEBUG class-finance] classroom=%s', JSON.stringify(classroom));
    if (!classroom) {
      return { error: 'Bạn chưa được phân công lớp.' };
    }

    // Bước 3: Lấy tổng hợp tài chính theo classId đúng
    const m = month ?? new Date().toISOString().slice(0, 7);
    const summary = await this.apiGatewayService.getClassFinanceSummary(classroom.id, m);

    // Bước 4: Override teacherName bằng tên giáo viên từ JWT — luôn đúng
    if (summary && !summary.error) {
      summary.teacherName = teacher.full_name ?? summary.teacherName;
    }
    return summary;
  }

  /**
   * POST /api/teacher/finance/record-payment — giáo viên ghi nhận thu tiền
   * Body: { invoiceId, amountPaid, note? }
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Post('teacher/finance/record-payment')
  async teacherRecordPayment(
    @Body() body: { invoiceId: number; amountPaid: number; note?: string },
    @Request() req: any,
  ) {
    return this.apiGatewayService.recordPayment({
      invoiceId: body.invoiceId,
      amount: body.amountPaid,
      paymentMethod: 'cash',
      note: body.note ?? null,
      receivedBy: req.user.userId,
    });
  }

  /**
   * GET /api/parent/my-invoices — hóa đơn của phụ huynh
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARENT')
  @Get('parent/my-invoices')
  getParentInvoices(@Request() req: any, @Query('month') month?: string) {
    const user = req.user as { userId: number };
    return this.apiGatewayService.getParentInvoices(user.userId, month);
  }

  // ═══════════════════════════════════════════════════════════
  // MEDICATIONS — QUẢN LÝ THUỐC (MISSING-03)
  // ═══════════════════════════════════════════════════════════

  /**
   * GET /api/medications/today — lịch thuốc hôm nay (teacher view)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Get('medications/today')
  getMedicationsToday() {
    return this.apiGatewayService.getMedicationsToday();
  }

  /**
   * GET /api/medications/student/:id — lịch thuốc của học sinh
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN', 'PARENT')
  @Get('medications/student/:id')
  getStudentMedications(@Param('id') id: string) {
    return this.apiGatewayService.getStudentMedications(Number(id));
  }

  /**
   * POST /api/medications — phụ huynh tạo đơn thuốc mới
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARENT', 'ADMIN')
  @Post('medications')
  createMedication(@Body() body: object) {
    return this.apiGatewayService.createMedication(body);
  }

  /**
   * POST /api/medications/:id/log — giáo viên xác nhận đã cho uống thuốc
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  @Post('medications/:id/log')
  logMedicationGiven(
    @Param('id') id: string,
    @Body() body: object,
    @Request() req: any,
  ) {
    const user = req.user as { userId: number };
    return this.apiGatewayService.logMedicationGiven(Number(id), {
      ...body,
      administeredBy: user.userId,
    });
  }

  /**
   * GET /api/medications/logs/:studentId — log lịch sử cho uống thuốc
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN', 'PARENT')
  @Get('medications/logs/:studentId')
  getMedicationLogs(@Param('studentId') studentId: string) {
    return this.apiGatewayService.getMedicationLogs(Number(studentId));
  }

  // ═══════════════════════════════════════════════════════════
  // AUTHORIZED PICKUPS — FRONTEND CẦN (MISSING-04)
  // ═══════════════════════════════════════════════════════════

  /**
   * GET /api/parent/pickups — phụ huynh xem danh sách ủy quyền đón của con
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARENT')
  @Get('parent/pickups')
  getParentPickups(@Request() req: any, @Query('studentId') studentId: string) {
    return this.apiGatewayService.getPickupsByStudent(Number(studentId));
  }

  /**
   * POST /api/parent/pickups — phụ huynh tạo ủy quyền mới
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARENT')
  @Post('parent/pickups')
  createParentPickup(@Body() body: object, @Request() req: any) {
    const user = req.user as { userId: number };
    return this.apiGatewayService.createPickup({
      ...body,
      createdBy: user.userId,
    } as any);
  }

  /**
   * GET /api/teacher/pickups/verify — giáo viên kiểm tra người đến đón
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  @Get('teacher/pickups')
  getPickupsForTeacher(@Query('studentId') studentId: string) {
    return this.apiGatewayService.getPickupsByStudent(Number(studentId), true);
  }

  // ═══════════════════════════════════════════════════════════
  // PARENT CONVENIENCE ROUTES — Routes phụ huynh cần
  // ═══════════════════════════════════════════════════════════

  /**
   * GET /api/parent/notifications — phụ huynh xem thông báo
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARENT', 'TEACHER', 'ADMIN')
  @Get('parent/notifications')
  getParentNotifications(@Request() req: any) {
    return this.apiGatewayService.getNotifications(req.user.userId);
  }

  /**
   * PUT /api/parent/notifications/:id/read — đánh dấu đã đọc 1 thông báo
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARENT', 'TEACHER', 'ADMIN')
  @Put('parent/notifications/:id/read')
  markParentNotificationRead(@Param('id') id: string, @Request() req: any) {
    return this.apiGatewayService.markNotificationRead(
      Number(id),
      req.user.userId,
    );
  }

  /**
   * PUT /api/parent/notifications/read-all — đánh dấu tất cả đã đọc
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARENT', 'TEACHER', 'ADMIN')
  @Put('parent/notifications/read-all')
  markAllParentNotificationsRead(@Request() req: any) {
    return this.apiGatewayService.markAllNotificationsRead(req.user.userId);
  }

  /**
   * GET /api/parent/student/:id/medications — phụ huynh xem đơn thuốc của con
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARENT', 'ADMIN')
  @Get('parent/student/:id/medications')
  async getStudentMedicationsForParent(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const owned = await this.apiGatewayService.verifyChildOwnership(
      Number(id),
      req.user.userId,
    );
    if (!owned) {
      throw new ForbiddenException('Access denied: not your child.');
    }
    return this.apiGatewayService.getStudentMedications(Number(id));
  }

  /**
   * GET /api/parent/student/:id/medication-logs — log uống thuốc
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARENT', 'ADMIN')
  @Get('parent/student/:id/medication-logs')
  async getStudentMedicationLogsForParent(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const owned = await this.apiGatewayService.verifyChildOwnership(
      Number(id),
      req.user.userId,
    );
    if (!owned) {
      throw new ForbiddenException('Access denied: not your child.');
    }
    return this.apiGatewayService.getMedicationLogs(Number(id));
  }

  /**
   * POST /api/parent/medications — phụ huynh gửi đơn thuốc mới
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARENT')
  @Post('parent/medications')
  createMedicationForParent(@Body() body: object, @Request() req: any) {
    const user = req.user as { userId: number };
    return this.apiGatewayService.createMedication({
      ...body,
      createdBy: user.userId,
    });
  }

  /**
   * GET /api/parent/student/:id/pickups — phụ huynh xem danh sách ủy quyền đón con
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARENT')
  @Get('parent/student/:id/pickups')
  async getPickupsForParent(@Param('id') id: string, @Request() req: any) {
    const owned = await this.apiGatewayService.verifyChildOwnership(
      Number(id),
      req.user.userId,
    );
    if (!owned) {
      throw new ForbiddenException('Access denied: not your child.');
    }
    return this.apiGatewayService.getPickupsByStudent(Number(id), false);
  }

  /**
   * POST /api/parent/student/:id/pickups — tạo ủy quyền mới
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARENT')
  @Post('parent/student/:id/pickups')
  async createPickupForParent(
    @Param('id') id: string,
    @Body() body: object,
    @Request() req: any,
  ) {
    const owned = await this.apiGatewayService.verifyChildOwnership(
      Number(id),
      req.user.userId,
    );
    if (!owned) {
      throw new ForbiddenException('Access denied: not your child.');
    }
    return this.apiGatewayService.createPickup({
      ...body,
      studentId: Number(id),
      createdBy: req.user.userId,
    } as any);
  }

  /**
   * PUT /api/parent/student/:studentId/pickup/:pickupId — sửa ủy quyền
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARENT')
  @Put('parent/student/:studentId/pickup/:pickupId')
  async updatePickupForParent(
    @Param('studentId') studentId: string,
    @Param('pickupId') pickupId: string,
    @Body() body: object,
    @Request() req: any,
  ) {
    const owned = await this.apiGatewayService.verifyChildOwnership(
      Number(studentId),
      req.user.userId,
    );
    if (!owned) {
      throw new ForbiddenException('Access denied: not your child.');
    }
    return this.apiGatewayService.updatePickup({
      id: Number(pickupId),
      ...body,
    } as any);
  }

  /**
   * DELETE /api/parent/student/:studentId/pickup/:pickupId — xoá ủy quyền
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARENT')
  @Delete('parent/student/:studentId/pickup/:pickupId')
  async deletePickupForParent(
    @Param('studentId') studentId: string,
    @Param('pickupId') pickupId: string,
    @Request() req: any,
  ) {
    const owned = await this.apiGatewayService.verifyChildOwnership(
      Number(studentId),
      req.user.userId,
    );
    if (!owned) {
      throw new ForbiddenException('Access denied: not your child.');
    }
    return this.apiGatewayService.deletePickup(Number(pickupId));
  }

  // ─── INCIDENT REPORTS ────────────────────────────────────────────────────────

  /** POST /api/teacher/incidents — Giáo viên tạo biên bản sự cố */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  @Post('teacher/incidents')
  async createIncident(@Body() body: any, @Request() req: any, @Query('teacherId') teacherId?: string) {
    const teacher = teacherId
      ? await this.apiGatewayService.getTeacherById(Number(teacherId))
      : await this.apiGatewayService.getTeacherByUserId(req.user.userId);
    return this.apiGatewayService.createIncidentReport({
      ...body,
      teacherId: teacher?.id,
      adminUserIds: [1], // Admin user_id=1 mặc định; có thể mở rộng sau
    });
  }

  /** GET /api/teacher/incidents — GV xem biên bản đã tạo */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  @Get('teacher/incidents')
  async getTeacherIncidents(@Request() req: any, @Query('teacherId') teacherId?: string) {
    const teacher = teacherId
      ? await this.apiGatewayService.getTeacherById(Number(teacherId))
      : await this.apiGatewayService.getTeacherByUserId(req.user.userId);
    return this.apiGatewayService.getIncidentsByTeacher(teacher?.id ?? 0);
  }

  /** GET /api/parent/student/:id/incidents — PH xem sự cố của con */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARENT')
  @Get('parent/student/:id/incidents')
  async getStudentIncidents(
    @Param('id') studentId: string,
    @Request() req: any,
  ) {
    const owned = await this.apiGatewayService.verifyChildOwnership(
      Number(studentId),
      req.user.userId,
    );
    if (!owned) throw new ForbiddenException('Access denied: not your child.');
    return this.apiGatewayService.getIncidentsByStudent(Number(studentId));
  }

  /** PUT /api/parent/incidents/:id/acknowledge — PH xác nhận đã đọc */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARENT')
  @Put('parent/incidents/:id/acknowledge')
  acknowledgeIncident(@Param('id') id: string, @Request() req: any) {
    return this.apiGatewayService.acknowledgeIncident(
      Number(id),
      req.user.userId,
    );
  }

  /** GET /api/admin/incidents — BGH xem tất cả sự cố */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/incidents')
  getAdminIncidents(@Query() query: any) {
    return this.apiGatewayService.getIncidentsAdmin({
      severity: query.severity,
      studentId: query.studentId ? Number(query.studentId) : undefined,
      limit: query.limit ? Number(query.limit) : undefined,
    });
  }

  /** PUT /api/admin/incidents/:id/review — BGH đánh dấu đã xem xét */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Put('admin/incidents/:id/review')
  reviewIncident(@Param('id') id: string, @Request() req: any) {
    return this.apiGatewayService.reviewIncident(Number(id), req.user.userId);
  }

  // ─── LEAVE REQUESTS ──────────────────────────────────────────────────────────

  /** POST /api/parent/leave-requests — PH nộp đơn xin nghỉ */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARENT')
  @Post('parent/leave-requests')
  async createLeaveRequest(@Body() body: any, @Request() req: any) {
    return this.apiGatewayService.createLeaveRequest({
      ...body,
      requestedBy: req.user.userId,
      adminUserIds: [1],
    });
  }

  /** GET /api/parent/student/:id/leave-requests — PH xem lịch sử đơn */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARENT')
  @Get('parent/student/:id/leave-requests')
  async getStudentLeaveRequests(
    @Param('id') studentId: string,
    @Request() req: any,
  ) {
    const owned = await this.apiGatewayService.verifyChildOwnership(
      Number(studentId),
      req.user.userId,
    );
    if (!owned) throw new ForbiddenException('Access denied: not your child.');
    return this.apiGatewayService.getLeaveRequestsByStudent(Number(studentId));
  }

  /** GET /api/admin/leave-requests — BGH xem tất cả đơn */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/leave-requests')
  getAdminLeaveRequests(@Query('status') status?: string) {
    return this.apiGatewayService.getLeaveRequestsAdmin(status);
  }

  /** PUT /api/admin/leave-requests/:id/approve — BGH duyệt */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Put('admin/leave-requests/:id/approve')
  approveLeaveRequest(@Param('id') id: string, @Request() req: any) {
    return this.apiGatewayService.approveLeaveRequest(
      Number(id),
      req.user.userId,
    );
  }

  /** PUT /api/admin/leave-requests/:id/reject — BGH từ chối */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Put('admin/leave-requests/:id/reject')
  rejectLeaveRequest(
    @Param('id') id: string,
    @Body() body: { note?: string },
    @Request() req: any,
  ) {
    return this.apiGatewayService.rejectLeaveRequest(
      Number(id),
      req.user.userId,
      body.note,
    );
  }

  /** GET /api/teacher/leave-requests — GV xem đơn nghỉ của lớp */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  @Get('teacher/leave-requests')
  async getTeacherLeaveRequests(@Request() req: any) {
    const teacher = await this.apiGatewayService.getTeacherByUserId(
      req.user.userId,
    );
    return this.apiGatewayService.getLeaveRequestsForTeacher(teacher?.id ?? 0);
  }

  // ─── SUPPORT TICKETS ─────────────────────────────────────────────────────────

  /** POST /api/parent/tickets — PH tạo ticket khiếu nại */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARENT')
  @Post('parent/tickets')
  createParentTicket(@Body() body: any, @Request() req: any) {
    return this.apiGatewayService.createTicket({
      ...body,
      parentId: req.user.userId,
      adminUserIds: [1],
    });
  }

  /** GET /api/parent/tickets — PH xem ticket của mình */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARENT')
  @Get('parent/tickets')
  getParentTickets(@Request() req: any) {
    return this.apiGatewayService.getTicketsByParent(req.user.userId);
  }

  /** PUT /api/parent/tickets/:id/rate — PH đánh giá chất lượng xử lý */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARENT')
  @Put('parent/tickets/:id/rate')
  rateTicket(
    @Param('id') id: string,
    @Body() body: { rating: number },
    @Request() req: any,
  ) {
    return this.apiGatewayService.rateTicketResolution(
      Number(id),
      req.user.userId,
      body.rating,
    );
  }

  /** GET /api/admin/tickets — BGH xem tất cả tickets */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/tickets')
  getAdminTickets(@Query('status') status?: string) {
    return this.apiGatewayService.getTicketsAdmin(status);
  }

  /** PUT /api/admin/tickets/:id/status — BGH cập nhật status + phản hồi */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Put('admin/tickets/:id/status')
  updateTicketStatus(
    @Param('id') id: string,
    @Body() body: { status: string; resolutionNote?: string },
    @Request() req: any,
  ) {
    return this.apiGatewayService.updateTicketStatus({
      id: Number(id),
      status: body.status,
      adminId: req.user.userId,
      resolutionNote: body.resolutionNote,
    });
  }

  // =========================================================================
  // TEACHER — Lớp học & Đón trẻ
  // =========================================================================

  /**
   * GET /api/teacher/my-class
   * Trả về classroom + students của giáo viên đang đăng nhập.
   * Dùng teacher.classId thật, không còn heuristic.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  @Get('teacher/my-class')
  getMyClass(@Request() req: any, @Query('teacherId') teacherId?: string) {
    return this.apiGatewayService.getTeacherClass(
      teacherId ? undefined : req.user.userId,
      teacherId ? Number(teacherId) : undefined,
    );
  }

  /**
   * GET /api/teacher/class-pickups
   * Danh sách người ủy quyền đón trẻ còn hiệu lực hôm nay — theo lớp.
   * Giáo viên dùng để đối chiếu buổi chiều.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  @Get('teacher/class-pickups')
  async getClassPickups(@Request() req: any, @Query('teacherId') teacherId?: string) {
    const teacher = teacherId
      ? await this.apiGatewayService.getTeacherById(Number(teacherId))
      : await this.apiGatewayService.getTeacherByUserId(req.user.userId);
    if (!teacher?.classId) return [];
    return this.apiGatewayService.getClassPickupsToday(teacher.classId);
  }

  /**
   * GET /api/teacher/medications-today
   * Danh sách thuốc cần cho uống hôm nay cho lớp của giáo viên.
   * Dùng để hiển thị banner count trên Teacher Dashboard.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  @Get('teacher/medications-today')
  async getTeacherMedicationsToday(@Request() req: any, @Query('teacherId') teacherId?: string) {
    const teacher = teacherId
      ? await this.apiGatewayService.getTeacherById(Number(teacherId))
      : await this.apiGatewayService.getTeacherByUserId(req.user.userId);
    if (!teacher?.classId) return [];
    return this.apiGatewayService.getMedicationsByClass(teacher.classId);
  }

  // =========================================================================
  // ADMIN — Student Emergency Info
  // =========================================================================

  /**
   * PUT /api/admin/students/:id/emergency-info
   * Cập nhật thông tin y tế & liên hệ khẩn cấp của học sinh.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Put('admin/students/:id/emergency-info')
  updateStudentEmergencyInfo(
    @Param('id') id: string,
    @Body()
    body: {
      allergy_tags?: string[];
      allergy_severity?: string;
      emergency_action?: string;
      emergency_contact_name?: string;
      emergency_contact_phone?: string;
      emergency_contact_relation?: string;
      blood_type?: string;
      medical_notes?: string;
    },
  ) {
    return this.apiGatewayService.updateStudentEmergencyInfo(Number(id), body);
  }

  // =========================================================================
  // DAILY MENU — Thực Đơn
  // =========================================================================

  /**
   * GET /api/menu/:date — Lấy thực đơn theo ngày (YYYY-MM-DD)
   * Xem được bởi tất cả roles (giáo viên, phụ huynh, admin)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEACHER', 'PARENT')
  @Get('menu/:date')
  getDailyMenu(@Param('date') date: string) {
    return this.apiGatewayService.getDailyMenu(date);
  }

  /**
   * GET /api/menu/week/:startDate — Lấy thực đơn 7 ngày (dùng trong ParentDashboard)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEACHER', 'PARENT')
  @Get('menu/week/:startDate')
  async getWeeklyMenu(@Param('startDate') startDate: string) {
    const results = await Promise.all(
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        return this.apiGatewayService.getDailyMenu(
          d.toISOString().split('T')[0],
        );
      }),
    );
    return results.flat();
  }

  /**
   * POST /api/admin/menu — Admin tạo thực đơn ngày mới
   * Hệ thống tự động kiểm tra dị ứng và trả về warnings
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('admin/menu')
  createDailyMenu(@Body() body: Record<string, unknown>, @Request() req: any) {
    return this.apiGatewayService.createDailyMenu(body, req.user.userId);
  }

  /**
   * PUT /api/admin/menu/:id — Admin cập nhật thực đơn
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Put('admin/menu/:id')
  updateDailyMenu(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.apiGatewayService.updateDailyMenu(Number(id), body);
  }
}
