import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ApiGatewayService {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('ACADEMIC_SERVICE') private readonly academicClient: ClientProxy,
    @Inject('HEALTH_SERVICE') private readonly healthClient: ClientProxy,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Authenticate user via auth-service (TCP), then issue a signed JWT.
   * Returns access_token + role for frontend localStorage.
   */
  async login(email: string, password: string) {
    const user = await firstValueFrom(
      this.authClient.send({ cmd: 'verify_login' }, { email, password }),
    );

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng.');
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      role: user.role,
      userId: user.id,
    };
  }

  async getAdminDashboard() {
    const [academicStats, healthStats] = await Promise.all([
      firstValueFrom(
        this.academicClient.send({ cmd: 'get_dashboard_stats' }, {}),
      ),
      firstValueFrom(this.healthClient.send({ cmd: 'get_health_stats' }, {})),
    ]);
    return { ...academicStats, healthStats };
  }

  getAcademicClasses() {
    return firstValueFrom(this.academicClient.send({ cmd: 'get_classes' }, {}));
  }

  getTeachers() {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'get_teachers' }, {}),
    );
  }

  getStudents() {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'get_students' }, {}),
    );
  }

  createStudent(data: {
    full_name: string;
    class_id?: number;
    allergy_tags?: string[];
  }) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'create_student' }, data),
    );
  }

  submitHealthVitals(vitalsData: object) {
    return firstValueFrom(
      this.healthClient.send({ cmd: 'submit_vitals' }, vitalsData),
    );
  }

  submitAssessment(assessmentData: object) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'submit_assessment' }, assessmentData),
    );
  }

  submitFeedback(feedbackData: object) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'submit_feedback' }, feedbackData),
    );
  }

  getAllFeedbacks() {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'get_all_feedbacks' }, {}),
    );
  }

  getParentStudentRecords(studentId: string, guardianUserId: number) {
    return firstValueFrom(
      this.academicClient.send(
        { cmd: 'get_student_records' },
        { studentId, guardianUserId },
      ),
    );
  }

  getHealthVitals(studentId?: number) {
    return firstValueFrom(
      this.healthClient.send(
        { cmd: 'get_health_vitals' },
        { studentId: studentId ?? null },
      ),
    );
  }

  /**
   * Kiểm tra phụ huynh có quyền xem học sinh này không
   * (học sinh đã được liên kết với guardianUserId = userId của phụ huynh)
   */
  async verifyChildOwnership(
    studentId: number,
    guardianUserId: number,
  ): Promise<boolean> {
    const result = await firstValueFrom(
      this.academicClient.send(
        { cmd: 'verify_child_ownership' },
        { studentId, guardianUserId },
      ),
    );
    return result?.owned === true;
  }

  getStudentAssessments(studentId?: number) {
    return firstValueFrom(
      this.academicClient.send(
        { cmd: 'get_student_assessments' },
        { studentId: studentId ?? null },
      ),
    );
  }

  createActivityLog(data: any) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'create_activity_log' }, data),
    );
  }

  createClassroom(data: any) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'create_classroom' }, data),
    );
  }

  getChildrenByGuardian(guardianUserId: number) {
    return firstValueFrom(
      this.academicClient.send(
        { cmd: 'get_children_by_guardian' },
        { guardianUserId },
      ),
    );
  }

  linkChild(data: {
    guardianUserId: number;
    full_name: string;
    date_of_birth: string;
    class_name: string;
  }) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'link_child' }, data),
    );
  }

  createTeacher(data: { full_name: string; specializations?: string }) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'create_teacher' }, data),
    );
  }

  updateStudent(
    id: number,
    data: {
      full_name?: string;
      class_id?: number | null;
      allergy_tags?: string[];
    },
  ) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'update_student' }, { id, ...data }),
    );
  }

  updateClassroom(
    id: number,
    data: {
      class_name?: string;
      age_group?: string;
      capacity?: number;
      teacher_id?: number | null;
    },
  ) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'update_classroom' }, { id, ...data }),
    );
  }

  updateTeacher(
    id: number,
    data: { full_name?: string; specializations?: string; is_active?: boolean },
  ) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'update_teacher' }, { id, ...data }),
    );
  }

  getDeficiencyDetails() {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'get_deficiency_details' }, {}),
    );
  }

  getStudentRecordsAdmin(studentId: number) {
    return firstValueFrom(
      this.academicClient.send(
        { cmd: 'get_student_records_admin' },
        { studentId },
      ),
    );
  }

  // ─── Attendance ──────────────────────────────────────────────
  saveAttendanceBulk(payload: {
    date: string;
    createdBy: number;
    records: Array<{ studentId: number; status: string; note?: string }>;
  }) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'save_attendance_bulk' }, payload),
    );
  }

  getAttendanceByDate(date: string, classId?: number, studentId?: number) {
    return firstValueFrom(
      this.academicClient.send(
        { cmd: 'get_attendance_by_date' },
        { date, classId, studentId },
      ),
    );
  }

  getAttendanceByStudent(studentId: number) {
    return firstValueFrom(
      this.academicClient.send(
        { cmd: 'get_attendance_by_student' },
        { studentId },
      ),
    );
  }

  // ─── Authorized Pickups ──────────────────────────────
  getPickupsByStudent(studentId: number, activeOnly = false) {
    return firstValueFrom(
      this.academicClient.send(
        { cmd: 'get_pickups_by_student' },
        { studentId, activeOnly },
      ),
    );
  }

  createPickup(payload: {
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
    return firstValueFrom(
      this.academicClient.send({ cmd: 'create_pickup' }, payload),
    );
  }

  updatePickup(payload: {
    id: number;
    name?: string;
    relationship?: string;
    phone?: string;
    validFrom?: string | null;
    validUntil?: string | null;
    photoUrl?: string | null;
    note?: string | null;
  }) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'update_pickup' }, payload),
    );
  }

  deletePickup(id: number) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'delete_pickup' }, { id }),
    );
  }

  // ─── Notifications (MISSING-01) ──────────────────────────────────
  getNotifications(userId: number) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'get_notifications' }, { userId }),
    );
  }

  markNotificationRead(id: number, userId: number) {
    return firstValueFrom(
      this.academicClient.send(
        { cmd: 'mark_notification_read' },
        { id, userId },
      ),
    );
  }

  markAllNotificationsRead(userId: number) {
    return firstValueFrom(
      this.academicClient.send(
        { cmd: 'mark_all_notifications_read' },
        { userId },
      ),
    );
  }

  // ─── Finance (MISSING-02) ────────────────────────────────────────
  getFeeConfigs() {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'get_fee_configs' }, {}),
    );
  }

  upsertFeeConfig(data: object) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'upsert_fee_config' }, data),
    );
  }

  getInvoices(month?: string) {
    return firstValueFrom(
      this.academicClient.send(
        { cmd: 'get_invoices' },
        { month: month ?? null },
      ),
    );
  }

  generateMonthlyInvoices(month: string) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'generate_monthly_invoices' }, { month }),
    );
  }

  recordPayment(data: object) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'record_payment' }, data),
    );
  }

  getFinanceSummary(month?: string) {
    return firstValueFrom(
      this.academicClient.send(
        { cmd: 'get_finance_summary' },
        { month: month ?? null },
      ),
    );
  }

  getParentInvoices(guardianUserId: number, month?: string) {
    return firstValueFrom(
      this.academicClient.send(
        { cmd: 'get_parent_invoices' },
        { guardianUserId, month: month ?? null },
      ),
    );
  }

  updateFeeConfig(id: number, data: object) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'update_fee_config' }, { id, ...data }),
    );
  }

  deleteFeeConfig(id: number) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'delete_fee_config' }, { id }),
    );
  }

  getInvoicesByClass(classId: number, month: string) {
    return firstValueFrom(
      this.academicClient.send(
        { cmd: 'get_invoices_by_class' },
        { classId, month },
      ),
    );
  }

  getClassFinanceSummary(classId: number, month: string) {
    return firstValueFrom(
      this.academicClient.send(
        { cmd: 'get_class_finance_summary' },
        { classId, month },
      ),
    );
  }

  // ─── Medications (MISSING-03) ────────────────────────────────────
  getMedicationsToday() {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'get_medications_today' }, {}),
    );
  }

  getStudentMedications(studentId: number) {
    return firstValueFrom(
      this.academicClient.send(
        { cmd: 'get_student_medications' },
        { studentId },
      ),
    );
  }

  createMedication(data: object) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'create_medication' }, data),
    );
  }

  logMedicationGiven(scheduleId: number, data: object) {
    return firstValueFrom(
      this.academicClient.send(
        { cmd: 'log_medication_given' },
        { scheduleId, ...data },
      ),
    );
  }

  getMedicationLogs(studentId: number) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'get_medication_logs' }, { studentId }),
    );
  }

  // ─── Teacher Lookup ─────────────────────────────────────────────────────────
  getTeacherByUserId(userId: number) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'get_teacher_by_user_id' }, { userId }),
    );
  }

  getTeacherById(teacherId: number) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'get_teacher_by_id' }, { teacherId }),
    );
  }

  /**
   * Lấy classroom mà teacher đang phụ trách, lookup từ phía classroom.teacher_id
   * Đây là nguồn dữ liệu chính xác nhất, tránh trường hợp teachers.class_id bị stale
   */
  getClassroomByTeacherId(teacherId: number) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'get_classroom_by_teacher_id' }, { teacherId }),
    );
  }

  // ─── Incident Reports ───────────────────────────────────────────────────────

  createIncidentReport(data: Record<string, unknown>) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'create_incident_report' }, data),
    );
  }

  getIncidentsByTeacher(teacherId: number) {
    return firstValueFrom(
      this.academicClient.send(
        { cmd: 'get_incidents_by_teacher' },
        { teacherId },
      ),
    );
  }

  getIncidentsByStudent(studentId: number) {
    return firstValueFrom(
      this.academicClient.send(
        { cmd: 'get_incidents_by_student' },
        { studentId },
      ),
    );
  }

  getIncidentsAdmin(filters: {
    severity?: string;
    studentId?: number;
    limit?: number;
  }) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'get_incidents_admin' }, filters),
    );
  }

  acknowledgeIncident(id: number, parentUserId: number) {
    return firstValueFrom(
      this.academicClient.send(
        { cmd: 'acknowledge_incident' },
        { id, parentUserId },
      ),
    );
  }

  reviewIncident(id: number, adminUserId: number) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'review_incident' }, { id, adminUserId }),
    );
  }

  // ─── Leave Requests ─────────────────────────────────────────────────────────
  createLeaveRequest(data: Record<string, unknown>) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'create_leave_request' }, data),
    );
  }

  getLeaveRequestsByStudent(studentId: number) {
    return firstValueFrom(
      this.academicClient.send(
        { cmd: 'get_leave_requests_by_student' },
        { studentId },
      ),
    );
  }

  getLeaveRequestsAdmin(status?: string) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'get_leave_requests_admin' }, { status }),
    );
  }

  getLeaveRequestsForTeacher(teacherId: number) {
    return firstValueFrom(
      this.academicClient.send(
        { cmd: 'get_leave_requests_teacher' },
        { teacherId },
      ),
    );
  }

  approveLeaveRequest(id: number, adminUserId: number) {
    return firstValueFrom(
      this.academicClient.send(
        { cmd: 'approve_leave_request' },
        { id, adminUserId },
      ),
    );
  }

  rejectLeaveRequest(id: number, adminUserId: number, note?: string) {
    return firstValueFrom(
      this.academicClient.send(
        { cmd: 'reject_leave_request' },
        { id, adminUserId, note },
      ),
    );
  }

  // ─── Support Tickets ────────────────────────────────────────────────────────
  createTicket(data: Record<string, unknown>) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'create_ticket' }, data),
    );
  }

  getTicketsByParent(parentId: number) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'get_tickets_parent' }, { parentId }),
    );
  }

  getTicketsAdmin(status?: string) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'get_tickets_admin' }, { status }),
    );
  }

  updateTicketStatus(data: Record<string, unknown>) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'update_ticket_status' }, data),
    );
  }

  rateTicketResolution(id: number, parentId: number, rating: number) {
    return firstValueFrom(
      this.academicClient.send(
        { cmd: 'rate_ticket_resolution' },
        { id, parentId, rating },
      ),
    );
  }

  // ─── Teacher Class & Pickup ──────────────────────────────────────────────────

  getTeacherClass(userId?: number, teacherId?: number) {
    return firstValueFrom(
      this.academicClient.send(
        { cmd: 'get_teacher_class' },
        { userId, teacherId },
      ),
    );
  }

  getClassPickupsToday(classId: number) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'get_class_pickups_today' }, { classId }),
    );
  }

  getMedicationsByClass(classId: number) {
    return firstValueFrom(
      this.academicClient.send(
        { cmd: 'get_medications_by_class' },
        { classId },
      ),
    );
  }

  // ─── Student Emergency Info ──────────────────────────────────────────────────

  updateStudentEmergencyInfo(studentId: number, data: Record<string, unknown>) {
    return firstValueFrom(
      this.academicClient.send(
        { cmd: 'update_student_emergency_info' },
        { studentId, ...data },
      ),
    );
  }

  // ─── Daily Menu ──────────────────────────────────────────────────────────────

  getDailyMenu(date: string) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'get_daily_menu' }, { date }),
    );
  }

  createDailyMenu(data: Record<string, unknown>, createdBy: number) {
    return firstValueFrom(
      this.academicClient.send(
        { cmd: 'create_daily_menu' },
        { ...data, createdBy },
      ),
    );
  }

  updateDailyMenu(id: number, data: Record<string, unknown>) {
    return firstValueFrom(
      this.academicClient.send({ cmd: 'update_daily_menu' }, { id, ...data }),
    );
  }
}
