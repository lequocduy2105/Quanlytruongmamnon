import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../api/axiosClient';

/**
 * TeacherPickupCheck — Màn hình đón trẻ cho giáo viên
 *
 * Hiển thị danh sách người được ủy quyền đón trẻ hôm nay theo lớp.
 * Giáo viên dùng để đối chiếu khi bàn giao buổi chiều (16:00–17:30).
 * Không cần reload — danh sách real-time khi phụ huynh cập nhật.
 */
const SEVERITY_COLOR = {
  NONE: '',
  MILD: 'bg-yellow-50 border-yellow-200',
  SEVERE: 'bg-orange-50 border-orange-200',
  ANAPHYLACTIC: 'bg-red-50 border-red-300',
};

const SEVERITY_BADGE = {
  NONE: null,
  MILD: { label: '⚠️ Nhẹ', cls: 'text-yellow-700 bg-yellow-100' },
  SEVERE: { label: '🔶 Nặng', cls: 'text-orange-700 bg-orange-100' },
  ANAPHYLACTIC: {
    label: '🚨 SỐC PHẢN VỆ',
    cls: 'text-red-700 bg-red-100 font-bold animate-pulse',
  },
};

export default function TeacherPickupCheck() {
  const [pickups, setPickups] = useState([]);
  const [myClass, setMyClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmedIds, setConfirmedIds] = useState(new Set());
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [classRes, pickupsRes] = await Promise.all([
        axiosClient.get('/teacher/my-class'),
        axiosClient.get('/teacher/class-pickups'),
      ]);
      setMyClass(classRes.data);
      setPickups(pickupsRes.data || []);
      setLastRefreshed(new Date());
    } catch (err) {
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh mỗi 2 phút để cập nhật ủy quyền mới từ phụ huynh
    const interval = setInterval(fetchData, 120_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Nhóm ủy quyền theo học sinh
  const studentMap = {};
  pickups.forEach((p) => {
    const studentId = p.student?.id || p.studentId;
    const studentName = p.student?.full_name || 'Không xác định';
    const allergy = p.student?.allergy_tags;
    const severity = p.student?.allergy_severity || 'NONE';
    const emergencyAction = p.student?.emergency_action;

    if (!studentMap[studentId]) {
      studentMap[studentId] = {
        studentId,
        studentName,
        allergy,
        severity,
        emergencyAction,
        authorizedPersons: [],
      };
    }
    studentMap[studentId].authorizedPersons.push(p);
  });

  const studentList = Object.values(studentMap).filter((s) =>
    s.studentName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Học sinh trong lớp chưa có ủy quyền nào
  const studentsWithPickup = new Set(Object.keys(studentMap).map(Number));
  const studentsNoPickup = (myClass?.students || []).filter(
    (s) => !studentsWithPickup.has(s.id),
  );

  const confirmedCount = confirmedIds.size;
  const totalStudents = (myClass?.students || []).length;
  const pendingCount = totalStudents - confirmedCount;

  const handleConfirm = (studentId, personName) => {
    setConfirmedIds((prev) => {
      const next = new Set(prev);
      next.add(`${studentId}-${personName}`);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500">Đang tải danh sách đón trẻ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              🏫 Đón Trẻ — {myClass?.name || 'Lớp của tôi'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">{today}</p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
          >
            🔄 Làm mới
          </button>
        </div>

        {/* Summary badges */}
        <div className="flex gap-4 mt-4 flex-wrap">
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <span className="text-2xl font-bold text-blue-700">{totalStudents}</span>
            <span className="text-blue-600 text-sm">Tổng học sinh</span>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
            <span className="text-2xl font-bold text-amber-700 animate-pulse">{pendingCount}</span>
            <span className="text-amber-600 text-sm">Chưa về</span>
          </div>
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            <span className="text-2xl font-bold text-green-700">{confirmedCount}</span>
            <span className="text-green-600 text-sm">Đã bàn giao</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Cập nhật lần cuối */}
      <p className="text-xs text-gray-400 mb-4">
        Cập nhật lúc: {lastRefreshed.toLocaleTimeString('vi-VN')} · Tự động làm mới mỗi 2 phút
      </p>

      {/* Tìm kiếm */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="🔍 Tìm tên học sinh..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Học sinh CÓ ủy quyền */}
      {studentList.length > 0 && (
        <div className="space-y-4 mb-8">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
            Danh sách ủy quyền đón ({studentList.length} học sinh)
          </h2>
          {studentList.map((s) => {
            const severityBadge = SEVERITY_BADGE[s.severity];
            const severityBg = SEVERITY_COLOR[s.severity];
            return (
              <div
                key={s.studentId}
                className={`border rounded-xl p-4 ${severityBg || 'bg-white border-gray-200'}`}
              >
                {/* Tên học sinh + badge dị ứng */}
                <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base">
                      👧 {s.studentName}
                    </h3>
                    {s.allergy && s.allergy.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {s.allergy.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200"
                          >
                            Dị ứng: {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {severityBadge && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${severityBadge.cls}`}
                    >
                      {severityBadge.label}
                    </span>
                  )}
                </div>

                {/* Emergency action nếu SEVERE+ */}
                {(s.severity === 'SEVERE' || s.severity === 'ANAPHYLACTIC') &&
                  s.emergencyAction && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                      <p className="font-semibold">⚡ Kế hoạch xử lý khẩn:</p>
                      <p>{s.emergencyAction}</p>
                    </div>
                  )}

                {/* Danh sách người được ủy quyền */}
                <div className="space-y-2">
                  {s.authorizedPersons.map((person) => {
                    const key = `${s.studentId}-${person.name}`;
                    const isDone = confirmedIds.has(key);
                    return (
                      <div
                        key={person.id || person.name}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 border transition-all ${
                          isDone
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {person.photoUrl ? (
                            <img
                              src={person.photoUrl}
                              alt={person.name}
                              className="w-8 h-8 rounded-full object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                              {person.name?.[0] || '?'}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm text-gray-800">
                              {person.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {person.relationship} · {person.phone}
                            </p>
                          </div>
                        </div>
                        {isDone ? (
                          <span className="text-green-600 text-sm font-semibold flex items-center gap-1">
                            ✅ Đã bàn giao
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              handleConfirm(s.studentId, person.name)
                            }
                            className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            ✓ Xác nhận
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Học sinh KHÔNG có ủy quyền nào hôm nay */}
      {studentsNoPickup.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">
            ⚠️ Chưa đăng ký người đón ({studentsNoPickup.length} học sinh)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {studentsNoPickup.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg"
              >
                <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-semibold text-sm">
                  {s.full_name?.[0] || '?'}
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-800">
                    {s.full_name}
                  </p>
                  <p className="text-xs text-amber-600">
                    Phụ huynh chưa đăng ký người đón
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {pickups.length === 0 && studentsNoPickup.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium">
            Chưa có dữ liệu hoặc lớp chưa được phân công.
          </p>
          <p className="text-sm mt-1">
            Liên hệ Admin để được phân công lớp phụ trách.
          </p>
        </div>
      )}
    </div>
  );
}
