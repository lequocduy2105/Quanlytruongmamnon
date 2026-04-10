import React, { useState, useEffect, useContext } from "react";
import api from "../../api/axiosClient";
import { AuthContext } from "../../contexts/AuthContext";
import { useToast } from "../../components/Toast";
import { useLang } from "../../contexts/LangContext";

export default function SkillAssessment() {
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const { lang } = useLang();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [scores, setScores] = useState({
    problemSolving: 5,
    socialInteraction: 5,
    emotionalRegulation: 5,
    motorSkills: 5,
  });
  const [deficiencyLog, setDeficiencyLog] = useState("");

  const vi = lang === "vi";

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get("/academic/students");
      setStudents(res.data || []);
      if (res.data?.length > 0) {
        setSelectedStudent(res.data[0]);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách học sinh:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (e, prop) => {
    setScores({ ...scores, [prop]: parseFloat(e.target.value) });
  };

  const handleSave = async () => {
    if (!selectedStudent) return;
    try {
      setSaving(true);
      await api.post("/academic/assessments", {
        studentId: selectedStudent.id,
        teacherId: user?.id || 1,
        cognitiveScore: scores.problemSolving,
        socialScore: scores.socialInteraction,
        emotionalScore: scores.emotionalRegulation,
        motorScore: scores.motorSkills,
        deficiencyLog: deficiencyLog || undefined,
      });
      toast({
        message: vi
          ? "Lưu đánh giá thành công!"
          : "Assessment saved successfully!",
      });
      setScores({
        problemSolving: 5,
        socialInteraction: 5,
        emotionalRegulation: 5,
        motorSkills: 5,
      });
      setDeficiencyLog("");
    } catch (error) {
      console.error("Lỗi khi lưu đánh giá:", error);
      toast({
        message: vi
          ? "Lưu đánh giá thất bại. Vui lòng thử lại."
          : "Failed to save. Please try again.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 flex items-center gap-3 text-slate-400">
        <span className="material-symbols-outlined animate-spin">
          progress_activity
        </span>
        {vi ? "Đang tải danh sách học sinh..." : "Loading students..."}
      </div>
    );

  // Nhãn kỹ năng
  const skills = [
    {
      key: "problemSolving",
      label: vi ? "Giải Quyết Vấn Đề" : "Problem Solving",
    },
    {
      key: "socialInteraction",
      label: vi ? "Kỹ Năng Xã Hội" : "Social Interaction",
    },
    {
      key: "emotionalRegulation",
      label: vi ? "Điều Tiết Cảm Xúc" : "Emotional Regulation",
    },
    { key: "motorSkills", label: vi ? "Vận Động" : "Motor Skills" },
  ];

  return (
    <>
      <header className="mb-8">
        <h2 className="text-3xl font-extrabold text-primary font-headline tracking-tight">
          {vi ? "Module Đánh Giá Kỹ Năng" : "Skill Assessment Module"}
        </h2>
        <p className="text-on-surface-variant mt-1 font-body">
          {vi
            ? "Đánh giá các mốc phát triển và ghi nhận quan sát định tính của học sinh."
            : "Evaluate developmental milestones and log qualitative observations."}
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Sidebar: Danh sách học sinh */}
        <div className="w-full lg:w-1/3 xl:max-w-sm lg:sticky lg:top-24 space-y-4">
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-slate-100 h-[calc(100vh-250px)] overflow-y-auto hidden-scrollbar flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="font-headline font-bold text-on-surface">
                {vi ? "Danh Sách" : "Roster"}
              </h3>
              <span className="bg-secondary-container/50 text-on-secondary-container text-[10px] px-2 py-1 rounded-full font-bold">
                {vi ? "TẤT CẢ HỌC SINH" : "ALL STUDENTS"}
              </span>
            </div>

            <div className="space-y-2 flex-grow">
              {students.map((student) => {
                const isSelected = selectedStudent?.id === student.id;
                const shortName = student.full_name?.charAt(0) || "?";
                return (
                  <div
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all cursor-pointer ${isSelected ? "bg-primary text-white shadow-md" : "hover:bg-slate-50 border border-transparent hover:border-slate-100 group text-on-surface"}`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${isSelected ? "border-2 border-white/20 bg-primary-container text-white" : "bg-slate-100 text-slate-500"}`}
                    >
                      {shortName}
                    </div>
                    <div className="flex-1">
                      <h4
                        className={`font-semibold text-sm font-headline ${isSelected ? "" : "group-hover:text-primary transition-colors"}`}
                      >
                        {student.full_name}
                      </h4>
                      <p
                        className={`text-[11px] ${isSelected ? "opacity-80" : "text-slate-500"}`}
                      >
                        {vi ? "Lớp" : "Class"}:{" "}
                        {student.classroom?.class_name || "N/A"}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="material-symbols-outlined text-white/60">
                        arrow_forward_ios
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Form đánh giá */}
        {selectedStudent ? (
          <div className="flex-1 w-full space-y-6">
            <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-slate-100">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
                <div>
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2 block">
                    {vi
                      ? "Các Mốc Nhận Thức & Xã Hội"
                      : "Cognitive & Social Milestones"}
                  </span>
                  <h3 className="text-2xl font-bold text-on-surface font-headline leading-tight">
                    {vi
                      ? `Đánh Giá ${selectedStudent?.full_name}`
                      : `Assessing ${selectedStudent?.full_name}`}
                  </h3>
                  <p className="text-on-surface-variant mt-2 max-w-lg text-sm">
                    {vi
                      ? "Tập trung vào các mục tiêu phát triển học kỳ hiện tại. Điểm số dựa trên quan sát trực tiếp của giáo viên trong giờ tự do và hoạt động có cấu trúc."
                      : "Focus on current term developmental goals. Ratings are based on direct teacher observation during free play and structured activities."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <span className="bg-surface-container-high px-4 py-2 rounded-full text-xs font-bold text-on-surface-variant tracking-wider">
                    {vi ? "Đánh Giá" : "Assessment"}
                  </span>
                </div>
              </div>

              {/* Skill Sliders — Dynamic từ mảng skills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                {skills.map((skill) => (
                  <div key={skill.key} className="space-y-4">
                    <div className="flex justify-between items-end">
                      <label className="font-bold text-sm text-on-surface tracking-tight">
                        {skill.label}
                      </label>
                      <span className="text-2xl font-black text-primary font-headline">
                        {scores[skill.key]}
                        <span className="text-xs text-slate-400 font-normal">
                          /10
                        </span>
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={scores[skill.key]}
                        onChange={(e) => handleSliderChange(e, skill.key)}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                      <span>{vi ? "Đang Phát Triển" : "Emerging"}</span>
                      <span>{vi ? "Xuất Sắc" : "Exceeding"}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Ghi chú thiếu hụt */}
              <div className="mt-12">
                <label className="block font-bold text-sm text-on-surface mb-4 font-headline">
                  {vi
                    ? "Ghi Chú Thiếu Hụt / Quan Sát"
                    : "Deficiency Log / Observation Notes"}
                </label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-6 text-sm text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none shadow-inner"
                  placeholder={
                    vi
                      ? "Ghi chú các sự cố cụ thể, xung đột xã hội hoặc chậm phát triển quan sát được trong buổi học..."
                      : "Detail any specific incidents, social friction, or developmental delays observed during the session..."
                  }
                  rows="5"
                  value={deficiencyLog}
                  onChange={(e) => setDeficiencyLog(e.target.value)}
                />
                <p className="text-[11px] text-slate-400 mt-3 font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">
                    info
                  </span>
                  {vi
                    ? "Những ghi chú này sẽ được tóm tắt trong báo cáo tiến độ hàng tháng gửi đến phụ huynh."
                    : "These notes will be summarized in the monthly progress report shared with parents."}
                </p>
              </div>

              {/* Actions */}
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-slate-100 gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto justify-center">
                  <button
                    onClick={() => {
                      setScores({
                        problemSolving: 5,
                        socialInteraction: 5,
                        emotionalRegulation: 5,
                        motorSkills: 5,
                      });
                      setDeficiencyLog("");
                    }}
                    className="px-6 py-2.5 rounded-full text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    {vi ? "Huỷ Bỏ" : "Discard Draft"}
                  </button>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full sm:w-auto bg-gradient-to-br from-primary to-primary-container text-white px-10 py-3.5 rounded-full font-bold font-headline shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {saving
                    ? vi
                      ? "Đang lưu..."
                      : "Saving..."
                    : vi
                      ? "Lưu Đánh Giá"
                      : "Save Assessment"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 w-full bg-surface-container-lowest rounded-3xl p-8 shadow-sm flex items-center justify-center text-slate-400 h-96">
            {vi
              ? "Chọn học sinh để bắt đầu đánh giá"
              : "Select a student to begin assessment"}
          </div>
        )}
      </div>
    </>
  );
}
