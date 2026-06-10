import { useState, useEffect, useCallback } from "react";
import { invoiceService } from "../api/invoiceService";

/**
 * Custom React hook to fetch and manage parent invoices.
 * Automatically filters invoices based on the active student's ID.
 *
 * @param {string|number} studentId - The active student ID to filter invoices by.
 * @returns {Object} Object containing invoices, loading state, error message, and a refetch function.
 */
export default function useInvoices(studentId) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInvoices = useCallback(async () => {
    if (!studentId) {
      setInvoices([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const allMappedInvoices = await invoiceService.getParentInvoices();
      
      // Filter invoices for the active student on the frontend
      const studentInvoices = allMappedInvoices.filter(
        (inv) => String(inv.studentId) === String(studentId)
      );
      
      setInvoices(studentInvoices);
    } catch (err) {
      console.error("Failed fetching parent invoices:", err);
      setError(err.response?.data?.message || err.message || "Không thể tải dữ liệu hóa đơn.");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return {
    invoices,
    loading,
    error,
    refetch: fetchInvoices,
  };
}
