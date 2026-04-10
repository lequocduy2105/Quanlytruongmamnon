import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../../api/axiosClient";
import { useToast } from "../../components/Toast";
import { useLang } from "../../contexts/LangContext";

// ─── Trang hồ sơ sau khi tìm được ───────────────────────────────────────────

export default function ParentDashboard() {
  const { activeStudent } = useOutletContext();
  const toast = useToast();
  const { lang } = useLang();
  const vi = lang === "vi";

  // data chi tiết (records)
  const [data, setData] = useState(null);
  const [loadingRecords, setLoadingRecords] = useState(false);
  // Feedback
  const [feedback, setFeedback] = useState({ rating: 0, comment: "" });
  const [feedbackSaving, setFeedbackSaving] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);

  // Khi tìm được học sinh → load records
  useEffect(() => {
    if (activeStudent) {
      setLoadingRecords(true);
      setFeedback({ rating: 0, comment: "" });
      setFeedbackDone(false);
      api
        .get(`/parent/student/${activeStudent.id}/records`)
        .then((res) => {
          if (res.data && !res.data.error) {
            setData(res.data);
          } else {
            setData(null);
            toast({
              message: vi ? "Không có quyền xem hồ sơ này." : "Access denied.",
              type: "error",
            });
          }
        })
        .catch(() => {
          toast({
            message: vi ? "Không thể tải hồ sơ." : "Failed to load record.",
            type: "error",
          });
        })
        .finally(() => {
          setLoadingRecords(false);
        });
    }
  }, [activeStudent, vi, toast]);

  // Reset → quay về màn hình tìm kiếm
  const handleReset = () => {
    window.location.reload(); // Hard reload returns to gatekeeper
  };

  // Gửi đánh giá giáo viên
  const handleFeedbackSubmit = async () => {
    if (!feedback.rating) {
      toast({
        message: vi ? "Vui lòng chọn số sao!" : "Please select a star rating!",
        type: "error",
      });
      return;
    }
    setFeedbackSaving(true);
    try {
      await api.post("/feedback", {
        teacherId: data?.classTeacher?.id,
        studentId: activeStudent?.id,
        rating: feedback.rating,
        comment: feedback.comment,
      });
      toast({ message: vi ? "Đã gửi đánh giá thành công!" : "Feedback sent!" });
      setFeedbackDone(true);
    } catch {
      toast({
        message: vi ? "Gửi đánh giá thất bại." : "Failed to send feedback.",
        type: "error",
      });
    } finally {
      setFeedbackSaving(false);
    }
  };



  // ── Loading records ──────────────────────────────────────────────────────
  if (loadingRecords) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <span className="material-symbols-outlined text-5xl animate-pulse text-primary">
            folder_open
          </span>
          <p className="font-semibold">
            {vi
              ? `Đang tải hồ sơ ${activeStudent?.full_name || "..."}...`
              : `Loading ${activeStudent?.full_name || "..."}'s record...`}
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // ── Hồ sơ học sinh ──────────────────────────────────────────────────────
  const student = data?.student || activeStudent;
  const activityLogs = data?.activityLogs || [];
  const assessments = data?.assessments || [];
  const classTeacher = data?.classTeacher || null;

  const shortName = student?.full_name?.charAt(0) || "S";
  const lastUpdated = activityLogs[0]?.created_at
    ? new Date(activityLogs[0].created_at).toLocaleDateString(
        vi ? "vi-VN" : "en-US",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        },
      )
    : null;
  const enrollmentStatus = student?.classroom
    ? vi
      ? "Đang học"
      : "Enrolled"
    : vi
      ? "Chưa phân lớp"
      : "Not Assigned";

  return (
    <div className="space-y-8">
      {/* Nút quay lại tìm kiếm */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors px-3 py-2 rounded-xl hover:bg-slate-100"
        >
          <span className="material-symbols-outlined text-[18px]">
            arrow_back
          </span>
          {vi ? "Tìm học sinh khác" : "Search another child"}
        </button>
        <span className="text-slate-300">|</span>
        <span className="text-sm text-slate-500 font-medium">
          {vi ? "Đang xem hồ sơ:" : "Viewing record:"}{" "}
          <span className="font-bold text-primary">{student?.full_name}</span>
        </span>
      </div>

      {/* Student Profile Card */}
      <section className="relative overflow-hidden bg-surface-container-lowest rounded-xl p-8 shadow-sm flex flex-col md:flex-row items-center gap-8 border-l-8 border-primary">
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-primary-fixed bg-cyan-100 text-cyan-800 flex items-center justify-center font-extrabold text-5xl">
            {shortName}
          </div>
          <div className="absolute bottom-1 right-1 bg-secondary w-6 h-6 rounded-full border-4 border-white" />
        </div>
        <div className="grow text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-baseline gap-2 mb-1">
            <h1 className="text-4xl font-extrabold font-headline text-primary tracking-tight">
              {student?.full_name}
            </h1>
            <span className="text-lg font-medium text-slate-500 font-headline">
              {student?.classroom?.class_name || "Chưa phân lớp"}
            </span>
          </div>
          {student?.classroom && (
            <p className="text-slate-500 flex items-center justify-center md:justify-start gap-2 text-sm font-semibold mt-2">
              <span className="material-symbols-outlined text-secondary text-lg">
                school
              </span>
              {vi ? "Lớp" : "Class"} {student.classroom.class_name}
              {student.classroom.age_group &&
                ` • ${student.classroom.age_group}`}
            </p>
          )}
          {classTeacher && (
            <p className="text-slate-500 flex items-center justify-center md:justify-start gap-2 text-sm font-semibold mt-1">
              <span className="material-symbols-outlined text-primary text-lg">
                person_pin
              </span>
              {vi ? "Giáo Viên:" : "Teacher:"}{" "}
              <span className="text-primary font-bold">
                {classTeacher.full_name}
              </span>
              {classTeacher.specializations && (
                <span className="text-slate-400">
                  • {classTeacher.specializations}
                </span>
              )}
            </p>
          )}
        </div>
        <div className="flex flex-col items-center md:items-end gap-3">
          <div
            className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${
              student?.classroom
                ? "bg-secondary-container/50 border border-secondary-container text-secondary-800"
                : "bg-slate-100 border border-slate-200 text-slate-500"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${student?.classroom ? "bg-secondary animate-pulse" : "bg-slate-400"}`}
            />
            {enrollmentStatus}
          </div>
          {lastUpdated && (
            <span className="text-xs text-slate-400 italic font-medium">
              Cập nhật: {lastUpdated}
            </span>
          )}
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Activity Log */}
        <section className="lg:col-span-5 bg-surface-container-lowest rounded-2xl p-8 space-y-6 shadow-sm border-t-4 border-secondary border border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-headline text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-[28px]">
                auto_stories
              </span>
              {vi ? "Nhật Ký Hoạt Động" : "Activity Logs"}
            </h2>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
              {activityLogs.length} {vi ? "ghi chú" : "notes"}
            </span>
          </div>
          <div className="space-y-4">
            {activityLogs.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2 text-slate-400">
                <span className="material-symbols-outlined text-3xl">
                  notes
                </span>
                <p className="text-sm">
                  {vi
                    ? "Chưa có nhật ký hoạt động nào."
                    : "No activity logs yet."}
                </p>
              </div>
            ) : (
              activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-primary/5 hover:border-primary/20 transition-all group"
                >
                  <div className="flex gap-4">
                    <span
                      className={`material-symbols-outlined pt-1 px-2 py-2 rounded-xl shrink-0 ${
                        log.category === "Behavioral"
                          ? "text-secondary bg-secondary-container/30"
                          : log.category === "Academic"
                            ? "text-primary bg-primary-container/30"
                            : "text-tertiary bg-tertiary-container/30"
                      }`}
                    >
                      {log.category === "Behavioral"
                        ? "mood"
                        : log.category === "Academic"
                          ? "school"
                          : "star"}
                    </span>
                    <div className="space-y-1">
                      <h3 className="font-bold text-on-surface group-hover:text-primary transition-colors">
                        {log.title}
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed font-medium">
                        {log.description}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        {log.teacher && (
                          <span className="text-xs text-primary font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">
                              person
                            </span>
                            {log.teacher.full_name}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 ml-auto">
                          {new Date(log.created_at).toLocaleDateString(
                            vi ? "vi-VN" : "en-US",
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Đánh Giá Giáo Viên */}
        {classTeacher && (
          <section className="lg:col-span-5">
            <div
              className={`rounded-2xl p-6 shadow-sm border ${
                feedbackDone
                  ? "bg-green-50 border-green-200"
                  : "bg-white border-slate-100"
              }`}
            >
              <div className="flex items-start gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    rate_review
                  </span>
                </div>
                <div>
                  <h3 className="font-extrabold text-primary font-headline text-lg">
                    {vi ? "Đánh Giá Giáo Viên" : "Rate Teacher"}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {vi ? "Giáo viên phụ trách:" : "Class teacher:"}{" "}
                    <span className="font-bold text-primary">
                      {classTeacher.full_name}
                    </span>
                    {classTeacher.specializations && (
                      <span className="text-slate-400">
                        {" "}
                        · {classTeacher.specializations}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {feedbackDone ? (
                <div className="text-center py-4">
                  <span
                    className="material-symbols-outlined text-4xl text-green-500 mb-2 block"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    task_alt
                  </span>
                  <p className="font-bold text-green-700">
                    {vi ? "Đã gửi đánh giá thành công!" : "Feedback submitted!"}
                  </p>
                  <button
                    onClick={() => {
                      setFeedbackDone(false);
                      setFeedback({ rating: 0, comment: "" });
                    }}
                    className="text-xs text-slate-400 hover:text-primary mt-2 font-bold"
                  >
                    {vi ? "Đánh giá lại" : "Rate again"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                      {vi ? "Chấm điểm (1-5 sao)" : "Rating (1-5 stars)"}
                    </p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() =>
                            setFeedback((f) => ({ ...f, rating: star }))
                          }
                          className="transition-all hover:scale-110"
                        >
                          <span
                            className={`material-symbols-outlined text-3xl ${star <= feedback.rating ? "text-amber-400" : "text-slate-200"}`}
                            style={{
                              fontVariationSettings: `'FILL' ${star <= feedback.rating ? 1 : 0}`,
                            }}
                          >
                            star
                          </span>
                        </button>
                      ))}
                      {feedback.rating > 0 && (
                        <span className="text-sm font-bold text-amber-600 self-center ml-2">
                          {feedback.rating}/5
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      {vi ? "Nhận xét (không bắt buộc)" : "Comment (optional)"}
                    </p>
                    <textarea
                      rows={3}
                      value={feedback.comment}
                      onChange={(e) =>
                        setFeedback((f) => ({ ...f, comment: e.target.value }))
                      }
                      placeholder={
                        vi
                          ? "Nhận xét của bạn về giáo viên..."
                          : "Your feedback about the teacher..."
                      }
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <button
                    onClick={handleFeedbackSubmit}
                    disabled={feedbackSaving || !feedback.rating}
                    className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-md disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      send
                    </span>
                    {feedbackSaving
                      ? vi
                        ? "Đang gửi..."
                        : "Sending..."
                      : vi
                        ? "Gửi Đánh Giá"
                        : "Submit Rating"}
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Stats Right */}
        <section className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
          <div className="bg-primary-container text-white p-8 rounded-2xl shadow-sm border-0 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute -right-10 -top-10 opacity-10">
              <span className="material-symbols-outlined text-[150px]">
                verified
              </span>
            </div>
            <h4 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2 mt-4 text-cyan-200">
              {vi ? "Tổng Đánh Giá" : "Total Assessments"}
            </h4>
            <p className="text-5xl font-extrabold font-headline mb-4">
              {assessments.length}
            </p>
            <p className="text-sm font-medium opacity-90">
              {vi
                ? "Đánh giá kỹ năng được giáo viên ghi nhận."
                : "Skill assessments recorded by teacher."}
            </p>
          </div>

          <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center gap-4 group hover:border-tertiary/30 transition-colors">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-cyan-100 flex items-center justify-center border-4 border-white shadow-sm shrink-0 relative">
              <span className="text-2xl md:text-3xl font-black text-cyan-800">
                {activeStudent?.full_name?.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-800 font-headline leading-tight">
                {activeStudent?.full_name}
              </h1>
              <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
                {vi ? "Sức Khoẻ & Dị Ứng" : "Health & Allergies"}
              </h4>
              <p className="text-xl font-bold font-headline text-on-surface leading-tight group-hover:text-primary transition-colors">
                {(student?.allergy_tags || []).join(", ") ||
                  (vi ? "Không có dị ứng" : "No allergies")}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
