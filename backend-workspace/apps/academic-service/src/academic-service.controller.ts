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

  @MessagePattern({ cmd: 'get_teachers' })
  getTeachers() {
    return this.academicServiceService.getTeachers();
  }

  @MessagePattern({ cmd: 'get_students' })
  getStudents() {
    return this.academicServiceService.getStudents();
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
  getTeacherDashboard(@Payload() payload: { userId: number }) {
    return this.academicServiceService.getTeacherDashboard(payload.userId);
  }

  @MessagePattern({ cmd: 'submit_assessment' })
  submitAssessment(@Payload() data: any) {
    return this.academicServiceService.submitAssessment(data);
  }

  @MessagePattern({ cmd: 'submit_feedback' })
  submitFeedback(@Payload() data: any) {
    return this.academicServiceService.submitFeedback(data);
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
  async getStudentAssessments(@Payload() payload: { studentId?: number | null }) {
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

  @MessagePattern({ cmd: 'link_child' })
  linkChild(
    @Payload()
    payload: {
      guardianUserId: number;
      full_name: string;
      date_of_birth: string;
      class_name: string;
    },
  ) {
    return this.academicServiceService.linkChild(payload);
  }

  @MessagePattern({ cmd: 'create_teacher' })
  createTeacher(
    @Payload() data: { full_name: string; specializations?: string },
  ) {
    return this.academicServiceService.createTeacher(data);
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
    return this.academicServiceService.getFeeConfigs(); // placeholder — no upsert method in service yet
  }

  @MessagePattern({ cmd: 'get_invoices' })
  getInvoices(@Payload() data: { month?: string | null }) {
    const month = data.month ?? new Date().toISOString().slice(0, 7);
    return this.academicServiceService.getInvoicesByMonth(month);
  }

  @MessagePattern({ cmd: 'generate_monthly_invoices' })
  generateMonthlyInvoices(@Payload() data: { month: string }) {
    return this.academicServiceService.generateMonthlyInvoices({
      month: data.month,
      tuitionAmount: 1500000,
      mealDailyRate: 25000,
    });
  }

  @MessagePattern({ cmd: 'record_payment' })
  recordPayment(@Payload() data: Record<string, unknown>) {
    return this.academicServiceService.recordPayment(data as any);
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

  // ─── Medications (MISSING-03) ───────────────────────────────────
  @MessagePattern({ cmd: 'get_medications_today' })
  getMedicationsToday() {
    return this.academicServiceService.getTodayMedications();
  }

  @MessagePattern({ cmd: 'get_student_medications' })
  getStudentMedications(@Payload() data: { studentId: number }) {
    return this.academicServiceService.getMedicationsByStudent(data.studentId);
  }

  @MessagePattern({ cmd: 'create_medication' })
  createMedication(@Payload() data: Record<string, unknown>) {
    return this.academicServiceService.createMedicationSchedule(data as any);
  }

  @MessagePattern({ cmd: 'log_medication_given' })
  logMedicationGiven(@Payload() data: Record<string, unknown>) {
    return this.academicServiceService.logMedicationGiven(data as any);
  }

  @MessagePattern({ cmd: 'get_medication_logs' })
  getMedicationLogs(@Payload() data: { studentId: number }) {
    return this.academicServiceService.getMedicationLogs(data.studentId);
  }

  // ─── Incident Reports ──────────────────────────────────────────────
  @MessagePattern({ cmd: 'create_incident_report' })
  createIncidentReport(@Payload() data: Record<string, unknown>) {
    return this.academicServiceService.createIncidentReport(data as any);
  }

  @MessagePattern({ cmd: 'get_incidents_by_teacher' })
  getIncidentsByTeacher(@Payload() data: { teacherId: number }) {
    return this.academicServiceService.getIncidentsByTeacher(data.teacherId);
  }

  @MessagePattern({ cmd: 'get_incidents_by_student' })
  getIncidentsByStudent(@Payload() data: { studentId: number }) {
    return this.academicServiceService.getIncidentsByStudent(data.studentId);
  }

  @MessagePattern({ cmd: 'get_incidents_admin' })
  getIncidentsAdmin(
    @Payload()
    data: { severity?: string; studentId?: number; limit?: number },
  ) {
    return this.academicServiceService.getIncidentsAdmin(data);
  }

  @MessagePattern({ cmd: 'acknowledge_incident' })
  acknowledgeIncident(
    @Payload() data: { id: number; parentUserId: number },
  ) {
    return this.academicServiceService.acknowledgeIncident(
      data.id,
      data.parentUserId,
    );
  }

  @MessagePattern({ cmd: 'review_incident' })
  reviewIncident(@Payload() data: { id: number; adminUserId: number }) {
    return this.academicServiceService.reviewIncident(
      data.id,
      data.adminUserId,
    );
  }

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
  approveLeaveRequest(
    @Payload() data: { id: number; adminUserId: number },
  ) {
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
  getTeacherClass(@Payload() data: { userId: number }) {
    return this.academicServiceService.getTeacherClass(data.userId);
  }

  @MessagePattern({ cmd: 'get_class_pickups_today' })
  getClassPickupsToday(@Payload() data: { classId: number }) {
    return this.academicServiceService.getClassPickupsToday(data.classId);
  }

  @MessagePattern({ cmd: 'get_medications_by_class' })
  getMedicationsByClass(@Payload() data: { classId: number }) {
    return this.academicServiceService.getMedicationsByClass(data.classId);
  }

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
      id as number,
      rest as Parameters<typeof this.academicServiceService.updateDailyMenu>[1],
    );
  }
}
