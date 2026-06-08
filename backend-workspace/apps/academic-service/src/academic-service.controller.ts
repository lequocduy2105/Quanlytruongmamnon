import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AcademicServiceService } from './academic-service.service';

@Controller()
export class AcademicServiceController {
  constructor(
    private readonly academicServiceService: AcademicServiceService,
  ) {}

  @MessagePattern({ cmd: 'get_dashboard_stats' })
  getDashboardStats() {
    return this.academicServiceService.getDashboardStats();
  }

  @MessagePattern({ cmd: 'get_classes' })
  getClasses() {
    return this.academicServiceService.getClasses();
  }

  @MessagePattern({ cmd: 'get_teacher_by_user_id' })
  getTeacherByUserId(@Payload() data: { userId: number }) {
    return this.academicServiceService.getTeacherByUserId(data.userId);
  }

  @MessagePattern({ cmd: 'get_teacher_by_id' })
  getTeacherById(@Payload() data: { teacherId: number }) {
    return this.academicServiceService.getTeacherById(data.teacherId);
  }

  /**
   * Lookup classroom từ phía classroom.teacher_id (đáng tin cậy hơn teacher.class_id)
   * Dùng khi cần biết GV đang phụ trách lớp nào
   */
  @MessagePattern({ cmd: 'get_classroom_by_teacher_id' })
  getClassroomByTeacherId(@Payload() data: { teacherId: number }) {
    return this.academicServiceService.getClassroomByTeacherId(data.teacherId);
  }

  @MessagePattern({ cmd: 'get_teachers' })
  getTeachers() {
    return this.academicServiceService.getTeachers();
  }

  @MessagePattern({ cmd: 'get_students' })
  getStudents() {
    return this.academicServiceService.getStudents();
  }

  @MessagePattern({ cmd: 'get_student_by_id' })
  getStudentById(@Payload() data: { id: number }) {
    return this.academicServiceService.getStudentById(data.id);
  }

  @MessagePattern({ cmd: 'create_student' })
  createStudent(
    @Payload()
    data: {
      full_name: string;
      class_id?: number;
      allergy_tags?: string[];
      date_of_birth?: string;
    },
  ) {
    return this.academicServiceService.createStudent(data);
  }

  @MessagePattern({ cmd: 'get_teacher_dashboard' })
  getTeacherDashboard(
    @Payload() payload: { userId?: number; teacherId?: number },
  ) {
    // Ưu tiên teacherId nếu có (gatekeeper by name), fallback về userId (JWT)
    return this.academicServiceService.getTeacherDashboard(
      payload.userId,
      payload.teacherId,
    );
  }

  @MessagePattern({ cmd: 'submit_assessment' })
  submitAssessment(@Payload() data: any) {
    return this.academicServiceService.submitAssessment(data);
  }

  @MessagePattern({ cmd: 'submit_feedback' })
  submitFeedback(@Payload() data: any) {
    return this.academicServiceService.submitFeedback(data);
  }

  @MessagePattern({ cmd: 'get_all_feedbacks' })
  getAllFeedbacks() {
    return this.academicServiceService.getAllFeedbacks();
  }

  @MessagePattern({ cmd: 'get_student_records' })
  getStudentRecords(
    @Payload() data: { studentId: number; guardianUserId: number },
  ) {
    return this.academicServiceService.getStudentRecords(
      data.studentId,
      data.guardianUserId,
    );
  }

  @MessagePattern({ cmd: 'get_student_assessments' })
  async getStudentAssessments(
    @Payload() payload: { studentId?: number | null },
  ) {
    try {
      return await this.academicServiceService.getStudentAssessments(
        payload?.studentId ?? undefined,
      );
    } catch (err) {
      console.error('[get_student_assessments] DB ERROR:', err?.message ?? err);
      throw err;
    }
  }

  @MessagePattern({ cmd: 'create_activity_log' })
  createActivityLog(
    @Payload()
    data: {
      studentId: number;
      category: string;
      title: string;
      description: string;
    },
  ) {
    return this.academicServiceService.createActivityLog(data);
  }

  @MessagePattern({ cmd: 'create_classroom' })
  createClassroom(
    @Payload()
    data: {
      class_name: string;
      age_group: string;
      teacher_id: number;
      capacity: number;
    },
  ) {
    return this.academicServiceService.createClassroom(data);
  }

  @MessagePattern({ cmd: 'get_children_by_guardian' })
  getChildrenByGuardian(@Payload() payload: { guardianUserId: number }) {
    return this.academicServiceService.getChildrenByGuardian(
      payload.guardianUserId,
    );
  }

  @MessagePattern({ cmd: 'create_teacher' })
  createTeacher(
    @Payload() data: { full_name: string; specializations?: string },
  ) {
    return this.academicServiceService.createTeacher(data);
  }

  @MessagePattern({ cmd: 'create_teacher_profile' })
  createTeacherProfile(
    @Payload() data: { userId: number; full_name: string; specializations?: string },
  ) {
    return this.academicServiceService.createTeacherProfile(data);
  }

  @MessagePattern({ cmd: 'update_student' })
  updateStudent(
    @Payload()
    data: {
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
    },
  ) {
    return this.academicServiceService.updateStudent(data);
  }

  @MessagePattern({ cmd: 'update_classroom' })
  updateClassroom(
    @Payload()
    data: {
      id: number;
      class_name?: string;
      age_group?: string;
      capacity?: number;
      teacher_id?: number | null;
    },
  ) {
    return this.academicServiceService.updateClassroom(data);
  }

  @MessagePattern({ cmd: 'update_teacher' })
  updateTeacher(
    @Payload()
    data: {
      id: number;
      full_name?: string;
      specializations?: string;
      is_active?: boolean;
    },
  ) {
    return this.academicServiceService.updateTeacher(data);
  }
  @MessagePattern({ cmd: 'transfer_teacher' })
  transferTeacher(@Payload() data: { teacherId: number; newClassId: number }) {
    return this.academicServiceService.transferTeacher(
      data.teacherId,
      data.newClassId,
    );
  }

  // ─── Soft Delete ─────────────────────────────────────────────────────────

  /**
   * Vô hiệu hóa học sinh (soft delete) — KHÔNG xóa khỏi DB.
   * Chỉ chuyển status = 'inactive' và ghi lý do nghỉ học.
   */
  @MessagePattern({ cmd: 'deactivate_student' })
  deactivateStudent(
    @Payload() data: { id: number; reason?: string },
  ) {
    return this.academicServiceService.softDeleteStudent(data.id, data.reason);
  }

  /**
   * Khôi phục học sinh đã nghỉ.
   */
  @MessagePattern({ cmd: 'restore_student' })
  restoreStudent(@Payload() data: { id: number }) {
    return this.academicServiceService.restoreStudent(data.id);
  }

  /**
   * Vô hiệu hóa giáo viên (soft delete) — set is_active = false.
   */
  @MessagePattern({ cmd: 'deactivate_teacher' })
  deactivateTeacher(@Payload() data: { id: number }) {
    return this.academicServiceService.softDeleteTeacher(data.id);
  }

  /**
   * Đóng/archive lớp học — KHÔNG xóa khỏi DB.
   */
  @MessagePattern({ cmd: 'deactivate_classroom' })
  deactivateClassroom(@Payload() data: { id: number }) {
    return this.academicServiceService.softDeleteClassroom(data.id);
  }

  // ─── Enroll with Age Validation ──────────────────────────────────────────

  /**
   * Tiếp nhận học sinh mới với validation độ tuổi chuẩn Bộ GD.
   * 3 tuổi → Lớp Mầm | 4 tuổi → Lớp Chồi | 5 tuổi → Lớp Lá
   *
   * Admin có thể dùng isAdminOverride=true cho học sinh cá biệt.
   */
  @MessagePattern({ cmd: 'enroll_student' })
  enrollStudent(
    @Payload()
    data: {
      full_name: string;
      date_of_birth: string;
      class_id?: number;
      allergy_tags?: string[];
      is_special_needs?: boolean;
      isAdminOverride?: boolean;
      override_grade_level?: 'mam' | 'choi' | 'la';
    },
  ) {
    return this.academicServiceService.enrollStudent(data);
  }

  @MessagePattern({ cmd: 'promote_class' })
  promoteClass(@Payload() data: { classId: number }) {
    return this.academicServiceService.promoteClass(data.classId);
  }

  @MessagePattern({ cmd: 'get_deficiency_details' })
  getDeficiencyDetails() {
    return this.academicServiceService.getDeficiencyDetails();
  }

  @MessagePattern({ cmd: 'get_student_records_admin' })
  getStudentRecordsAdmin(@Payload() data: { studentId: number }) {
    return this.academicServiceService.getStudentRecordsAdmin(data.studentId);
  }

  // ─── Attendance ───────────────────────────────────────────────
  @MessagePattern({ cmd: 'save_attendance_bulk' })
  saveAttendanceBulk(
    @Payload()
    data: {
      date: string;
      createdBy: number;
      records: Array<{ studentId: number; status: string; note?: string }>;
    },
  ) {
    return this.academicServiceService.saveAttendanceBulk(data as any);
  }

  @MessagePattern({ cmd: 'get_attendance_by_date' })
  getAttendanceByDate(
    @Payload() data: { date: string; studentId?: number; classId?: number },
  ) {
    return this.academicServiceService.getAttendanceByDate(data);
  }

  @MessagePattern({ cmd: 'get_attendance_by_student' })
  getAttendanceByStudent(@Payload() data: { studentId: number }) {
    return this.academicServiceService.getAttendanceByStudent(data.studentId);
  }

  // ─── Authorized Pickups ───────────────────────────────────────
  @MessagePattern({ cmd: 'get_pickups_by_student' })
  getPickupsByStudent(
    @Payload() data: { studentId: number; activeOnly?: boolean },
  ) {
    return this.academicServiceService.getPickupsByStudent(
      data.studentId,
      data.activeOnly ?? false,
    );
  }

  @MessagePattern({ cmd: 'create_pickup' })
  createPickup(
    @Payload()
    data: {
      studentId: number;
      name: string;
      relationship: string;
      phone: string;
      validFrom?: string | null;
      validUntil?: string | null;
      photoUrl?: string | null;
      note?: string | null;
      createdBy?: number | null;
    },
  ) {
    return this.academicServiceService.createPickup(data);
  }

  @MessagePattern({ cmd: 'update_pickup' })
  updatePickup(
    @Payload()
    data: {
      id: number;
      name?: string;
      relationship?: string;
      phone?: string;
      validFrom?: string | null;
      validUntil?: string | null;
      photoUrl?: string | null;
      note?: string | null;
    },
  ) {
    return this.academicServiceService.updatePickup(data);
  }

  @MessagePattern({ cmd: 'delete_pickup' })
  deletePickup(@Payload() data: { id: number }) {
    return this.academicServiceService.deletePickup(data.id);
  }

  @MessagePattern({ cmd: 'verify_child_ownership' })
  verifyChildOwnership(
    @Payload() data: { studentId: number; guardianUserId: number },
  ) {
    return this.academicServiceService.verifyChildOwnership(
      data.studentId,
      data.guardianUserId,
    );
  }

  // ─── Notifications (MISSING-01) ──────────────────────────────────
  @MessagePattern({ cmd: 'get_notifications' })
  getNotifications(@Payload() data: { userId: number }) {
    return this.academicServiceService.getNotifications(data.userId);
  }

  @MessagePattern({ cmd: 'mark_notification_read' })
  markNotificationRead(@Payload() data: { id: number; userId: number }) {
    return this.academicServiceService.markOneRead(data.id);
  }

  @MessagePattern({ cmd: 'mark_all_notifications_read' })
  markAllNotificationsRead(@Payload() data: { userId: number }) {
    return this.academicServiceService.markAllRead(data.userId);
  }

  // ─── Finance (MISSING-02) ────────────────────────────────────────
  @MessagePattern({ cmd: 'get_fee_configs' })
  getFeeConfigs() {
    return this.academicServiceService.getFeeConfigs();
  }

  @MessagePattern({ cmd: 'upsert_fee_config' })
  upsertFeeConfig(@Payload() data: Record<string, unknown>) {
    return this.academicServiceService.createFeeConfig(data as any);
  }

  @MessagePattern({ cmd: 'update_fee_config' })
  updateFeeConfig(@Payload() data: { id: number } & Record<string, unknown>) {
    const { id, ...rest } = data;
    return this.academicServiceService.updateFeeConfig(id, rest as any);
  }

  @MessagePattern({ cmd: 'delete_fee_config' })
  deleteFeeConfig(@Payload() data: { id: number }) {
    return this.academicServiceService.deleteFeeConfig(data.id);
  }

  @MessagePattern({ cmd: 'get_invoices' })
  getInvoices(@Payload() data: { month?: string | null }) {
    const month = data.month ?? new Date().toISOString().slice(0, 7);
    return this.academicServiceService.getInvoicesByMonth(month);
  }

  @MessagePattern({ cmd: 'get_invoices_by_class' })
  getInvoicesByClass(@Payload() data: { classId: number; month: string }) {
    return this.academicServiceService.getInvoicesByClass(data.classId, data.month);
  }

  @MessagePattern({ cmd: 'get_class_finance_summary' })
  getClassFinanceSummary(@Payload() data: { classId: number; month: string }) {
    return this.academicServiceService.getClassFinanceSummary(data.classId, data.month);
  }

  @MessagePattern({ cmd: 'generate_monthly_invoices' })
  generateMonthlyInvoices(@Payload() data: { month: string }) {
    return this.academicServiceService.generateMonthlyInvoices({
      month: data.month,
      // tuitionAmount and mealDailyRate are now auto-read from fee_configs in DB
    });
  }

  @MessagePattern({ cmd: 'process_payment_webhook' })
  processPaymentWebhook(@Payload() data: { reference_code: string; amount: number }) {
    return this.academicServiceService.processPaymentWebhook(data.reference_code, data.amount);
  }

  @MessagePattern({ cmd: 'record_payment' })
  recordPayment(@Payload() data: Record<string, unknown>) {
    return this.academicServiceService.recordPayment(data as any);
  }

  @MessagePattern({ cmd: 'pay_invoice' })
  payInvoice(
    @Payload() data: { invoiceId: number; note?: string; receivedBy?: number | null },
  ) {
    return this.academicServiceService.payInvoice(data.invoiceId, data.note, data.receivedBy);
  }

  @MessagePattern({ cmd: 'get_finance_summary' })
  getFinanceSummary(@Payload() data: { month?: string | null }) {
    const month = data.month ?? new Date().toISOString().slice(0, 7);
    return this.academicServiceService.getFinancialSummary(month);
  }

  @MessagePattern({ cmd: 'get_parent_invoices' })
  getParentInvoices(
    @Payload() data: { guardianUserId: number; month?: string | null },
  ) {
    // Get all invoices for students belonging to this guardian
    return this.academicServiceService.getInvoicesByStudent(
      data.guardianUserId,
    );
  }

  // ─── Medications → Moved to health-service ───────────────────────────────
  // get_medications_today, get_student_medications, create_medication,
  // log_medication_given, get_medication_logs → health-service.controller.ts

  // ─── Incident Reports → Moved to health-service ──────────────────────────
  // create_incident_report, get_incidents_by_teacher, get_incidents_by_student,
  // get_incidents_admin, acknowledge_incident, review_incident → health-service.controller.ts


  // ─── Leave Requests ────────────────────────────────────────────────
  @MessagePattern({ cmd: 'create_leave_request' })
  createLeaveRequest(@Payload() data: Record<string, unknown>) {
    return this.academicServiceService.createLeaveRequest(data as any);
  }

  @MessagePattern({ cmd: 'get_leave_requests_by_student' })
  getLeaveRequestsByStudent(@Payload() data: { studentId: number }) {
    return this.academicServiceService.getLeaveRequestsByStudent(
      data.studentId,
    );
  }

  @MessagePattern({ cmd: 'get_leave_requests_admin' })
  getLeaveRequestsAdmin(@Payload() data: { status?: string }) {
    return this.academicServiceService.getLeaveRequestsAdmin(
      data.status as any,
    );
  }

  @MessagePattern({ cmd: 'get_leave_requests_teacher' })
  getLeaveRequestsForTeacher(@Payload() data: { teacherId: number }) {
    return this.academicServiceService.getLeaveRequestsForTeacher(
      data.teacherId,
    );
  }

  @MessagePattern({ cmd: 'approve_leave_request' })
  approveLeaveRequest(@Payload() data: { id: number; adminUserId: number }) {
    return this.academicServiceService.approveLeaveRequest(
      data.id,
      data.adminUserId,
    );
  }

  @MessagePattern({ cmd: 'reject_leave_request' })
  rejectLeaveRequest(
    @Payload() data: { id: number; adminUserId: number; note?: string },
  ) {
    return this.academicServiceService.rejectLeaveRequest(
      data.id,
      data.adminUserId,
      data.note,
    );
  }

  // ─── Support Tickets ───────────────────────────────────────────────
  @MessagePattern({ cmd: 'create_ticket' })
  createTicket(@Payload() data: Record<string, unknown>) {
    return this.academicServiceService.createTicket(data as any);
  }

  @MessagePattern({ cmd: 'get_tickets_parent' })
  getTicketsByParent(@Payload() data: { parentId: number }) {
    return this.academicServiceService.getTicketsByParent(data.parentId);
  }

  @MessagePattern({ cmd: 'get_tickets_admin' })
  getTicketsAdmin(@Payload() data: { status?: string }) {
    return this.academicServiceService.getTicketsAdmin(data.status as any);
  }

  @MessagePattern({ cmd: 'update_ticket_status' })
  updateTicketStatus(@Payload() data: Record<string, unknown>) {
    return this.academicServiceService.updateTicketStatus(data as any);
  }

  @MessagePattern({ cmd: 'rate_ticket_resolution' })
  rateTicketResolution(
    @Payload() data: { id: number; parentId: number; rating: number },
  ) {
    return this.academicServiceService.rateTicketResolution(
      data.id,
      data.parentId,
      data.rating,
    );
  }

  // ─── Teacher Class & Pickup Handlers ────────────────────────────────────────

  @MessagePattern({ cmd: 'get_teacher_class' })
  getTeacherClass(@Payload() payload: { userId?: number }) {
    return this.academicServiceService.getTeacherClass(
      payload.userId,
    );
  }

  /**
   * Plan B — QueryBuilder SQL hardened roster.
   * Dùng Raw SQL INNER JOIN, ép cứng WHERE tại tầng DB.
   */
  @MessagePattern({ cmd: 'get_teacher_roster' })
  getTeacherRoster(@Payload() payload: { userId: number }) {
    return this.academicServiceService.getTeacherRoster(payload.userId);
  }

  @MessagePattern({ cmd: 'get_class_pickups_today' })
  getClassPickupsToday(@Payload() data: { classId: number }) {
    return this.academicServiceService.getClassPickupsToday(data.classId);
  }

  // ─── Medication By Class → Moved to health-service ─────────────────────────────────
  // get_medications_by_class → health-service.controller.ts

  // ─── Student Emergency Info ──────────────────────────────────────────────────

  @MessagePattern({ cmd: 'update_student_emergency_info' })
  updateStudentEmergencyInfo(
    @Payload()
    data: {
      studentId: number;
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
    const { studentId, ...rest } = data;
    return this.academicServiceService.updateStudentEmergencyInfo(
      studentId,
      rest,
    );
  }

  // ─── Daily Menu Handlers ─────────────────────────────────────────────────────

  @MessagePattern({ cmd: 'get_daily_menu' })
  getDailyMenu(@Payload() data: { date: string }) {
    return this.academicServiceService.getDailyMenu(data.date);
  }

  @MessagePattern({ cmd: 'create_daily_menu' })
  createDailyMenu(@Payload() data: Record<string, unknown>) {
    return this.academicServiceService.createDailyMenu(
      data as Parameters<typeof this.academicServiceService.createDailyMenu>[0],
    );
  }

  @MessagePattern({ cmd: 'update_daily_menu' })
  updateDailyMenu(@Payload() data: { id: number } & Record<string, unknown>) {
    const { id, ...rest } = data;
    return this.academicServiceService.updateDailyMenu(
      id,
      rest as Parameters<typeof this.academicServiceService.updateDailyMenu>[1],
    );
  }

  // ─── Lesson Content Handlers (E-Learning) ───────────────────────────────────

  @MessagePattern({ cmd: 'create_lesson' })
  createLesson(@Payload() data: any) {
    return this.academicServiceService.createLesson(data);
  }

  @MessagePattern({ cmd: 'get_lessons_by_class' })
  getLessonsByClass(@Payload() data: { classId: number }) {
    return this.academicServiceService.getLessonsByClass(data.classId);
  }

  @MessagePattern({ cmd: 'update_lesson' })
  updateLesson(@Payload() data: { id: number; updateData: any }) {
    return this.academicServiceService.updateLesson(data.id, data.updateData);
  }

  @MessagePattern({ cmd: 'delete_lesson' })
  deleteLesson(@Payload() data: { id: number }) {
    return this.academicServiceService.deleteLesson(data.id);
  }
}
