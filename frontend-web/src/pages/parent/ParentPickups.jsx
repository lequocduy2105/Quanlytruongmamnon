import React, { useState, useEffect } from "react";
import api from "../../api/axiosClient";

function fmtDate(d) {
  if (!d) return "Không giới hạn";
  return new Date(d).toLocaleDateString("vi-VN");
}

function isExpired(validUntil) {
  if (!validUntil) return false;
  return new Date(validUntil) < new Date();
}

export default function ParentPickups() {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    relationship: "",
    phone: "",
    validFrom: "",
    validUntil: "",
    note: "",
  });

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChildId) fetchPickups(selectedChildId);
  }, [selectedChildId]);

  const fetchChildren = async () => {
    try {
      const res = await api.get("/parent/my-children");
      const list = res.data || [];
      setChildren(list);
      if (list.length > 0) setSelectedChildId(list[0].id);
    } catch {
      setChildren([]);
    }
  };

  const fetchPickups = async (studentId) => {
    setLoading(true);
    try {
      const res = await api.get(`/parent/student/${studentId}/pickups`);
      setPickups(res.data || []);
    } catch {
      setPickups([]);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditId(null);
    setForm({ name: "", relationship: "", phone: "", validFrom: "", validUntil: "", note: "" });
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditId(p.id);
    setForm({
      name: p.name || "",
      relationship: p.relationship || "",
      phone: p.phone || "",
      validFrom: p.validFrom?.slice(0, 10) || "",
      validUntil: p.validUntil?.slice(0, 10) || "",
      note: p.note || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xoá ủy quyền này?")) return;
    try {
      await api.delete(`/parent/student/${selectedChildId}/pickup/${id}`);
      fetchPickups(selectedChildId);
    } catch {
      alert("Không thể xoá. Vui lòng thử lại.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.relationship || !form.phone) return;
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/parent/student/${selectedChildId}/pickup/${editId}`, form);
      } else {
        await api.post(`/parent/student/${selectedChildId}/pickups`, form);
      }
      setShowForm(false);
      fetchPickups(selectedChildId);
    } catch {
      alert("Lỗi khi lưu. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const RELATIONSHIP_OPTIONS = [
    "Ông / Bà nội",
    "Ông / Bà ngoại",
    "Chú / Bác",
    "Cô / Dì",
    "Người giúp việc",
    "Anh / Chị",
    "Khác",
  ];

  return (
    <div className="space-y-8">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-600 mb-1">
            Phụ Huynh Portal
          </p>
          <h1 className="text-3xl font-extrabold text-cyan-900 font-headline tracking-tight">
            Ủy Quyền Đón Trẻ
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Danh sách người được phép đón con thay bạn tại trường
          </p>
        </div>
        <button
          onClick={openAdd}
          disabled={!selectedChildId}
          className="flex items-center gap-2 bg-cyan-800 hover:bg-cyan-900 text-white font-bold px-5 py-2.5 rounded-2xl transition-colors shadow disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Thêm Người Ủy Quyền
        </button>
      </div>

      {/* ─── Safety Banner ─── */}
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 flex gap-4">
        <span className="material-symbols-outlined text-amber-600 text-2xl flex-shrink-0 mt-0.5"
          style={{ fontVariationSettings: "'FILL' 1" }}>
          shield
        </span>
        <div className="text-sm text-amber-800">
          <p className="font-bold mb-1">Quy định an toàn</p>
          <p>
            Giáo viên sẽ đối chiếu danh sách này trước khi cho phép đón trẻ. Chỉ những người có
            trong danh sách và còn hiệu lực mới được đón con. Vui lòng cập nhật kịp thời.
          </p>
        </div>
      </div>

      {/* ─── Child Selector ─── */}
      {children.length > 1 && (
        <div className="flex gap-3">
          {children.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedChildId(c.id)}
              className={`px-5 py-2 rounded-2xl font-bold text-sm transition-all ${
                selectedChildId === c.id
                  ? "bg-cyan-800 text-white shadow"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {c.full_name}
            </button>
          ))}
        </div>
      )}

      {/* ─── Add/Edit Modal ─── */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.65)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-y-auto max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <h3 className="font-black text-cyan-900 text-lg font-headline">
                {editId ? "Cập Nhật Ủy Quyền" : "Thêm Người Ủy Quyền"}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Họ và tên *
                </label>
                <input
                  required
                  placeholder="VD: Nguyễn Thị Lan"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Mối quan hệ *
                  </label>
                  <select
                    required
                    value={form.relationship}
                    onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">-- Chọn --</option>
                    {RELATIONSHIP_OPTIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Số điện thoại *
                  </label>
                  <input
                    required
                    placeholder="VD: 0912 345 678"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Hiệu lực từ
                  </label>
                  <input
                    type="date"
                    value={form.validFrom}
                    onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Hiệu lực đến
                  </label>
                  <input
                    type="date"
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Ghi chú thêm
                </label>
                <textarea
                  rows={2}
                  placeholder="VD: Chỉ đón các ngày thứ 2, 4 trong tuần"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-2xl bg-cyan-800 hover:bg-cyan-900 text-white font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-[16px]">save</span>
                  )}
                  {saving ? "Đang lưu..." : editId ? "Cập Nhật" : "Thêm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Pickup List ─── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <span className="material-symbols-outlined text-4xl text-slate-300 animate-spin"
            style={{ animationDuration: "1.2s" }}>
            progress_activity
          </span>
        </div>
      ) : pickups.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 py-20 flex flex-col items-center gap-3 text-slate-400">
          <span className="material-symbols-outlined text-6xl">directions_walk</span>
          <p className="font-bold text-lg">Chưa có ủy quyền nào</p>
          <p className="text-sm text-center">
            Thêm người thân được phép đón con thay bạn
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {pickups.map((p) => {
            const expired = isExpired(p.validUntil);
            return (
              <div
                key={p.id}
                className={`rounded-3xl border p-5 transition-all ${
                  expired
                    ? "bg-slate-50 border-slate-200 opacity-60"
                    : "bg-white border-slate-100 shadow-sm"
                }`}
              >
                <div className="flex justify-between items-start gap-3">
                  {/* Avatar + Info */}
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-800 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                      {(p.name || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-cyan-900">{p.name}</p>
                      <p className="text-sm text-slate-500">{p.relationship}</p>
                      <p className="text-sm text-slate-600 font-semibold mt-1">📞 {p.phone}</p>
                    </div>
                  </div>

                  {/* Status + Actions */}
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        expired
                          ? "bg-slate-100 text-slate-500"
                          : "bg-green-50 text-green-700 border border-green-200"
                      }`}
                    >
                      {expired ? "Hết hạn" : "✓ Còn hiệu lực"}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-cyan-700 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                        title="Xoá"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Validity dates & note */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-3 text-xs text-slate-400">
                  <span>Từ: <strong className="text-slate-600">{fmtDate(p.validFrom)}</strong></span>
                  <span>Đến: <strong className="text-slate-600">{fmtDate(p.validUntil)}</strong></span>
                  {p.note && <span className="italic text-slate-400">— {p.note}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
