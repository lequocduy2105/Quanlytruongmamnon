import React, { useState, useEffect } from "react";
import api from "../../api/axiosClient";
import { useLang } from "../../contexts/LangContext";
import { useToast } from "../../components/Toast";

export default function TeacherFeedback() {
  const { lang } = useLang();
  const vi = lang === "vi";
  const toast = useToast();

  const [teacher, setTeacher] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        // Lấy con của phụ huynh
        const childRes = await api.get("/parent/my-children");
        const children = childRes.data || [];
        if (children.length === 0) {
          setLoading(false);
          return;
        }
        const child = children[0];

        // Lấy hồ sơ học sinh (bao gồm classTeacher)
        const recordRes = await api.get(`/parent/student/${child.id}/records`);
        if (recordRes.data && !recordRes.data.error) {
          setStudent(recordRes.data.student);
          setTeacher(recordRes.data.classTeacher || null);
        }

        // Lấy lịch sử feedback về giáo viên (nếu có)
        // Endpoint này trả về feedbacks của parent hiện tại
      } catch (e) {
        console.error("TeacherFeedback load failed", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const starLabels = vi
    ? ["", "Rất Tệ", "Tệ", "Bình Thường", "Tốt", "Xuất Sắc"]
    : ["", "Very Poor", "Poor", "Average", "Good", "Excellent"];

  const starColors = [
    "",
    "text-red-400",
    "text-orange-400",
    "text-amber-400",
    "text-lime-400",
    "text-green-500",
  ];

  const handleSubmit = async () => {
    if (!rating) {
      toast({
        message: vi
          ? "Vui lòng chọn số sao đánh giá!"
          : "Please select a star rating!",
        type: "error",
      });
      return;
    }
    if (!teacher?.id) {
      toast({
        message: vi
          ? "Không tìm thấy giáo viên phụ trách."
          : "Class teacher not found.",
        type: "error",
      });
      return;
    }
    setSaving(true);
    try {
      await api.post("/feedback", {
        teacherId: teacher.id,
        studentId: student?.id,
        rating,
        comment: comment.trim(),
      });
      setHistory((prev) => [
        {
          rating,
          comment: comment.trim(),
          submittedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      toast({
        message: vi
          ? "Đã gửi đánh giá thành công! Cảm ơn bạn."
          : "Feedback submitted! Thank you.",
        type: "success",
      });
      setDone(true);
      setRating(0);
      setComment("");
    } catch {
      toast({
        message: vi
          ? "Gửi đánh giá thất bại. Thử lại sau."
          : "Failed to submit. Please try again.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-slate-400">
        <span className="material-symbols-outlined animate-pulse text-4xl">
          rate_review
        </span>
        <p>{vi ? "Đang tải..." : "Loading..."}</p>
      </div>
    );

  if (!teacher)
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
        <span className="material-symbols-outlined text-6xl">person_off</span>
        <h2 className="font-bold text-slate-600 text-lg">
          {vi ? "Chưa có giáo viên phụ trách" : "No class teacher assigned"}
        </h2>
        <p className="text-sm text-center max-w-sm">
          {vi
            ? "Con bạn chưa được phân vào lớp nào có giáo viên phụ trách. Vui lòng liên hệ nhà trường."
            : "Your child hasn't been assigned to a class with a teacher yet. Please contact the school."}
        </p>
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* ── Tiêu đề trang ── */}
      <header className="ml-1">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary font-headline mb-1">
          {vi ? "Đánh Giá Giáo Viên" : "Rate Your Teacher"}
        </h1>
        <p className="text-sm font-medium text-on-surface-variant flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">stars</span>
          {vi
            ? "Ý kiến của bạn giúp nhà trường cải thiện chất lượng giảng dạy"
            : "Your feedback helps us improve teaching quality"}
        </p>
      </header>

      {/* ── Card Giáo Viên ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-container to-primary/20 text-primary flex items-center justify-center text-3xl font-extrabold font-headline shrink-0">
          {teacher.full_name?.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              {vi ? "Giáo Viên Phụ Trách Lớp" : "Class Teacher"}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-primary font-headline">
            {teacher.full_name}
          </h2>
          {teacher.specializations && (
            <p className="text-sm text-slate-500 font-medium flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[16px] text-secondary">
                school
              </span>
              {teacher.specializations}
            </p>
          )}
          {student?.classroom && (
            <p className="text-xs font-bold text-slate-400 mt-1">
              {vi ? "Lớp" : "Class"}:{" "}
              <span className="text-primary">
                {student.classroom.class_name}
              </span>
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
            {vi ? "Con" : "Child"}
          </p>
          <p className="font-bold text-on-surface text-sm">
            {student?.full_name || "---"}
          </p>
        </div>
      </div>

      {/* ── Form Đánh Giá ── */}
      {done ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center space-y-4">
          <span
            className="material-symbols-outlined text-6xl text-green-500 block"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            task_alt
          </span>
          <h2 className="text-2xl font-extrabold text-green-700 font-headline">
            {vi ? "Cảm ơn bạn đã đánh giá!" : "Thank you for your feedback!"}
          </h2>
          <p className="text-sm text-green-600">
            {vi
              ? "Đánh giá của bạn đã được ghi nhận và sẽ giúp chúng tôi cải thiện chất lượng dạy học."
              : "Your rating has been recorded and will help us improve our teaching."}
          </p>
          <button
            onClick={() => setDone(false)}
            className="mt-4 px-6 py-2.5 rounded-xl border border-green-300 text-green-700 font-bold text-sm hover:bg-green-100 transition-colors"
          >
            {vi ? "✏️ Đánh giá lại" : "✏️ Submit another rating"}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-6 py-5 border-b border-slate-100">
            <h3 className="font-extrabold text-primary font-headline text-lg flex items-center gap-2">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                rate_review
              </span>
              {vi ? "Gửi Đánh Giá Của Bạn" : "Submit Your Rating"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {vi
                ? "Đánh giá hoàn toàn ẩn danh"
                : "Your rating is completely anonymous"}
            </p>
          </div>

          <div className="p-8 space-y-8">
            {/* Star Rating */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                {vi ? "Chất Lượng Giảng Dạy" : "Teaching Quality"}
              </p>
              <div className="flex gap-3 items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="transition-all hover:scale-125 active:scale-110"
                  >
                    <span
                      className={`material-symbols-outlined text-5xl transition-colors ${
                        star <= (hoverRating || rating)
                          ? starColors[hoverRating || rating]
                          : "text-slate-200"
                      }`}
                      style={{
                        fontVariationSettings: `'FILL' ${star <= (hoverRating || rating) ? 1 : 0}`,
                      }}
                    >
                      star
                    </span>
                  </button>
                ))}
                {(hoverRating || rating) > 0 && (
                  <div
                    className={`ml-3 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                      (hoverRating || rating) >= 4
                        ? "bg-green-100 text-green-700"
                        : (hoverRating || rating) >= 3
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-600"
                    }`}
                  >
                    <span>{hoverRating || rating}/5</span>
                    <span>·</span>
                    <span>{starLabels[hoverRating || rating]}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Category quick-select */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                {vi ? "Khía Cạnh Đánh Giá" : "Aspects"}
              </p>
              <div className="flex flex-wrap gap-2">
                {(vi
                  ? [
                      "Phương pháp dạy tốt",
                      "Quan tâm học sinh",
                      "Giao tiếp rõ ràng",
                      "Kiên nhẫn",
                      "Sáng tạo",
                      "Thân thiện",
                      "Chuyên nghiệp",
                    ]
                  : [
                      "Great teaching method",
                      "Cares about students",
                      "Clear communication",
                      "Patient",
                      "Creative",
                      "Friendly",
                      "Professional",
                    ]
                ).map((tag) => (
                  <button
                    key={tag}
                    onClick={() =>
                      setComment((prev) =>
                        prev.includes(tag)
                          ? prev.replace(tag, "").trim()
                          : prev
                            ? `${prev}, ${tag}`
                            : tag,
                      )
                    }
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                      comment.includes(tag)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-slate-100 text-slate-400 hover:border-primary/30 hover:text-slate-600"
                    }`}
                  >
                    {comment.includes(tag) ? "✓ " : ""}
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment textarea */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                {vi
                  ? "Nhận Xét Thêm (Không Bắt Buộc)"
                  : "Additional Comments (Optional)"}
              </p>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  vi
                    ? "Chia sẻ thêm cảm nhận của bạn về giáo viên phụ trách lớp của con..."
                    : "Share your thoughts about your child's class teacher..."
                }
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
              <p className="text-xs text-slate-400 mt-1 text-right">
                {comment.length}/500
              </p>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={saving || !rating}
              className="w-full py-4 bg-primary text-white font-extrabold rounded-xl shadow-lg shadow-primary/20 disabled:opacity-50 hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-3 text-base"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                send
              </span>
              {saving
                ? vi
                  ? "Đang gửi..."
                  : "Sending..."
                : vi
                  ? "Gửi Đánh Giá"
                  : "Submit Rating"}
            </button>

            <p className="text-center text-xs text-slate-400">
              {vi
                ? "🔒 Đánh giá của bạn được bảo mật và không hiển thị tên."
                : "🔒 Your feedback is confidential and submitted anonymously."}
            </p>
          </div>
        </div>
      )}

      {/* ── Lịch sử đánh giá (session này) ── */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-primary font-headline">
              {vi ? "Đánh Giá Vừa Gửi" : "Recently Submitted"}
            </h3>
          </div>
          <div className="divide-y divide-slate-50">
            {history.map((h, i) => (
              <div key={i} className="px-6 py-4 flex items-start gap-4">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className={`material-symbols-outlined text-lg ${s <= h.rating ? "text-amber-400" : "text-slate-200"}`}
                      style={{
                        fontVariationSettings: `'FILL' ${s <= h.rating ? 1 : 0}`,
                      }}
                    >
                      star
                    </span>
                  ))}
                </div>
                {h.comment && (
                  <p className="text-sm text-slate-600 flex-1">{h.comment}</p>
                )}
                <span className="text-xs text-slate-400 shrink-0">
                  {new Date(h.submittedAt).toLocaleTimeString(
                    vi ? "vi-VN" : "en-US",
                    { hour: "2-digit", minute: "2-digit" },
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
