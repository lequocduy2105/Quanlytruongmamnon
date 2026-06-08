import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { useLang } from "../../contexts/LangContext";
import { useToast } from "../../components/Toast";
import BaseModal from "../../components/BaseModal";

export default function TeacherELearning() {
  const { activeTeacher } = useOutletContext();
  const { lang } = useLang();
  const vi = lang === "vi";
  const toast = useToast();

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content_url: "",
    file_url: "",
  });

  const fetchLessons = useCallback(async () => {
    if (!activeTeacher?.classroom?.id) return;
    try {
      const res = await axiosClient.get(`/academic/classes/${activeTeacher.classroom.id}/lessons`);
      setLessons(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTeacher?.classroom?.id]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const handleOpenModal = (lesson = null) => {
    if (lesson) {
      setEditingId(lesson.id);
      setFormData({
        title: lesson.title,
        description: lesson.description || "",
        content_url: lesson.content_url || "",
        file_url: lesson.file_url || "",
      });
    } else {
      setEditingId(null);
      setFormData({ title: "", description: "", content_url: "", file_url: "" });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axiosClient.put(`/academic/lessons/${editingId}`, formData);
        toast({ message: vi ? "Đã cập nhật bài học!" : "Lesson updated!" });
      } else {
        await axiosClient.post(`/academic/classes/${activeTeacher.classroom.id}/lessons`, formData);
        toast({ message: vi ? "Đã đăng bài học mới!" : "Lesson posted!" });
      }
      setShowModal(false);
      fetchLessons();
    } catch (err) {
      toast({ message: vi ? "Lỗi khi lưu bài học" : "Error saving lesson", type: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(vi ? "Xác nhận xóa bài học này?" : "Delete this lesson?")) return;
    try {
      await axiosClient.delete(`/academic/lessons/${id}`);
      toast({ message: vi ? "Đã xóa bài học" : "Lesson deleted" });
      fetchLessons();
    } catch (err) {
      toast({ message: "Error", type: "error" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-cyan-900 font-headline">
            {vi ? "E-Learning & Bài Học" : "E-Learning & Lessons"}
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            {vi ? "Quản lý nội dung giảng dạy và tài liệu buổi học" : "Manage teaching content and lesson materials"}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-cyan-700 text-white rounded-2xl font-bold shadow-lg shadow-cyan-200 hover:bg-cyan-800 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined">add_circle</span>
          {vi ? "Đăng bài mới" : "Post New Lesson"}
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-700"></div>
        </div>
      ) : lessons.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border-2 border-dashed border-slate-200 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">menu_book</span>
          <p className="text-slate-400 font-bold">{vi ? "Chưa có bài học nào" : "No lessons found"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-700">
                  <span className="material-symbols-outlined">description</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenModal(lesson)} className="p-2 text-slate-400 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                  <button onClick={() => handleDelete(lesson.id)} className="p-2 text-slate-400 hover:text-error transition-colors">
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-slate-800 mb-2 line-clamp-2">{lesson.title}</h3>
              <p className="text-xs text-slate-500 mb-4 line-clamp-3 leading-relaxed">
                {lesson.description || (vi ? "Không có mô tả" : "No description")}
              </p>
              
              <div className="space-y-2">
                {lesson.content_url && (
                  <a href={lesson.content_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[11px] font-bold text-cyan-700 hover:underline">
                    <span className="material-symbols-outlined text-[14px]">link</span>
                    {vi ? "Link bài giảng (Youtube/Drive)" : "Lesson Link"}
                  </a>
                )}
                {lesson.file_url && (
                  <a href={lesson.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[11px] font-bold text-emerald-600 hover:underline">
                    <span className="material-symbols-outlined text-[14px]">attachment</span>
                    {vi ? "Tài liệu đính kèm" : "Attachment"}
                  </a>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>{new Date(lesson.createdAt).toLocaleDateString(vi ? 'vi-VN' : 'en-US')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Đăng bài */}
      <BaseModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? (vi ? "Sửa bài học" : "Edit Lesson") : (vi ? "Đăng bài học mới" : "Post New Lesson")}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
              {vi ? "Tiêu đề bài học" : "Lesson Title"}
            </label>
            <input
              required
              type="text"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all font-bold text-slate-700"
              placeholder={vi ? "Ví dụ: Học vẽ tranh phong cảnh..." : "e.g., Landscape Painting Class..."}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
              {vi ? "Mô tả nội dung" : "Description"}
            </label>
            <textarea
              rows="3"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all font-medium text-slate-600 text-sm"
              placeholder={vi ? "Tóm tắt nội dung chính của buổi học" : "Briefly describe the lesson content"}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                {vi ? "Link Video / Driver" : "Video / Drive Link"}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-slate-400 material-symbols-outlined text-lg">link</span>
                <input
                  type="url"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all text-sm font-medium text-cyan-700"
                  placeholder="https://youtube.com/..."
                  value={formData.content_url}
                  onChange={(e) => setFormData({ ...formData, content_url: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                {vi ? "URL Tài liệu (PDF/Image)" : "Document URL"}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-slate-400 material-symbols-outlined text-lg">attachment</span>
                <input
                  type="url"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all text-sm font-medium text-emerald-600"
                  placeholder="https://drive.google.com/..."
                  value={formData.file_url}
                  onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-cyan-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-cyan-100 hover:bg-cyan-800 transition-all active:scale-[0.98] mt-4"
          >
            {editingId ? (vi ? "Cập nhật ngay" : "Update Now") : (vi ? "Đăng ngay" : "Post Now")}
          </button>
        </form>
      </BaseModal>
    </div>
  );
}
