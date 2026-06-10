import axiosClient from "./axiosClient";

/**
 * Maps database/API snake_case or legacy fields into standard camelCase frontend structures.
 * This acts as a protective boundary for the frontend data layer.
 * 
 * @param {Object} apiInvoice - Raw invoice data from server
 * @returns {Object} Cleaned and normalized invoice object
 */
export const mapInvoiceData = (apiInvoice) => {
  if (!apiInvoice) return null;
  return {
    id: apiInvoice.id,
    code: apiInvoice.code || apiInvoice.invoice_code || `INV-${apiInvoice.id}`,
    month: apiInvoice.month || "",
    period: apiInvoice.period || apiInvoice.school_year || "",
    studentId: apiInvoice.student_id || apiInvoice.studentId,
    studentName: apiInvoice.student_name || apiInvoice.studentName || "",
    className: apiInvoice.class_name || apiInvoice.className || "",
    status: String(apiInvoice.status || "pending").toLowerCase(),
    totalAmount: Number(apiInvoice.total_amount ?? apiInvoice.totalAmount ?? 0),
    amountPaid: Number(apiInvoice.amount_paid ?? apiInvoice.amountPaid ?? 0),
    tuitionAmount: Number(apiInvoice.tuition_amount ?? apiInvoice.tuitionAmount ?? 0),
    mealDays: Number(apiInvoice.meal_days ?? apiInvoice.mealDays ?? 0),
    mealDailyRate: Number(apiInvoice.meal_daily_rate ?? apiInvoice.mealDailyRate ?? 0),
    otherFees: Number(apiInvoice.other_fees ?? apiInvoice.otherFees ?? 0),
    discount: Number(apiInvoice.discount ?? 0),
    dueDate: apiInvoice.due_date || apiInvoice.dueDate,
    paidAt: apiInvoice.paid_at || apiInvoice.paidAt,
    note: apiInvoice.note || "",
  };
};

export const invoiceService = {
  /**
   * Fetches parent invoices and returns mapped frontend structures.
   * @returns {Promise<Array>} List of formatted invoice objects
   */
  getParentInvoices: async () => {
    const response = await axiosClient.get("/parent/my-invoices");
    const data = Array.isArray(response.data) ? response.data : [];
    return data.map(mapInvoiceData);
  },
};
