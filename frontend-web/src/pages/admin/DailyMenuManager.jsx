import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../api/axiosClient';

/**
 * DailyMenuManager — Quản lý Thực Đơn
 *
 * Màn hình cho Admin để tạo và cập nhật thực đơn theo ngày.
 * Hệ thống sẽ tự động kiểm tra xem có học sinh nào bị dị ứng với các
 * món ăn trong thực đơn hay không ngay sau khi tạo/cập nhật.
 */
export default function DailyMenuManager() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [menuId, setMenuId] = useState(null);
  const [meals, setMeals] = useState({
    breakfast: '',
    morning_snack: '',
    lunch: '',
    afternoon_snack: '',
  });
  const [allergyWarnings, setAllergyWarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchMenu = useCallback(async (date) => {
    setLoading(true);
    setError(null);
    setSuccessMsg('');
    try {
      const res = await axiosClient.get(`/menu/${date}`);
      if (res.data) {
        setMenuId(res.data.id);
        setMeals({
          breakfast: res.data.breakfast || '',
          morning_snack: res.data.morning_snack || '',
          lunch: res.data.lunch || '',
          afternoon_snack: res.data.afternoon_snack || '',
        });
        setAllergyWarnings(res.data.allergyWarnings || []);
      } else {
        // No menu for this date
        setMenuId(null);
        setMeals({
          breakfast: '',
          morning_snack: '',
          lunch: '',
          afternoon_snack: '',
        });
        setAllergyWarnings([]);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        setError('Không thể lấy thực đơn. Vui lòng thử lại sau.');
      } else {
        setMenuId(null);
        setMeals({
          breakfast: '',
          morning_snack: '',
          lunch: '',
          afternoon_snack: '',
        });
        setAllergyWarnings([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchMenu(selectedDate);
    }
  }, [selectedDate, fetchMenu]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg('');
    try {
      const payload = {
        date: selectedDate,
        ...meals,
      };

      if (menuId) {
        await axiosClient.put(`/admin/menu/${menuId}`, payload);
      } else {
        await axiosClient.post('/admin/menu', payload);
      }
      
      setSuccessMsg('Lưu thực đơn thành công!');
      // Re-fetch to get any auto-generated allergy warnings
      fetchMenu(selectedDate);
    } catch (err) {
      setError('Lưu thực đơn thất bại. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span>🍲</span> Quản Lý Thực Đơn Hàng Ngày
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Hệ thống sẽ tự động quét hồ sơ y tế và đưa ra cảnh báo nếu món ăn chứa thành phần dị ứng của trẻ.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Toolbar */}
        <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center gap-4">
          <label className="font-semibold text-gray-700 text-sm">Chọn ngày:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          {loading && <span className="text-sm text-gray-500 animate-pulse">Đang tải...</span>}
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm">
              {successMsg}
            </div>
          )}

          {/* Cảnh báo dị ứng tự động */}
          {allergyWarnings && allergyWarnings.length > 0 && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <h3 className="font-bold text-orange-800 flex items-center gap-2 mb-2">
                <span>⚠️</span> Hệ Thống Phát Hiện Xung Đột Dị Ứng
              </h3>
              <ul className="space-y-1 text-sm text-orange-700 list-disc pl-5">
                {allergyWarnings.map((warning, idx) => (
                  <li key={idx}>
                    Bé <span className="font-semibold">{warning.studentName}</span> dị ứng với{' '}
                    <span className="font-semibold">"{warning.allergen}"</span> (Mức độ:{' '}
                    <span className={`font-bold ${warning.severity === 'ANAPHYLACTIC' ? 'text-red-600' : ''}`}>
                      {warning.severity}
                    </span>
                    )
                  </li>
                ))}
              </ul>
              <p className="text-xs text-orange-600 mt-2 italic">
                * Vui lòng báo nhà bếp chuẩn bị suất ăn thay thế cho các học sinh này.
              </p>
            </div>
          )}

          {/* Form */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">🌤 Bữa Sáng</label>
              <input
                type="text"
                placeholder="VD: Phở bò, sữa hạt..."
                value={meals.breakfast}
                onChange={(e) => setMeals({ ...meals, breakfast: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">🥪 Bữa Phụ Sáng</label>
              <input
                type="text"
                placeholder="VD: Sữa chua, trái cây..."
                value={meals.morning_snack}
                onChange={(e) => setMeals({ ...meals, morning_snack: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">🍱 Bữa Trưa</label>
              <textarea
                rows={2}
                placeholder="VD: Cơm trắng, cá kho tộ, canh cải thịt băm..."
                value={meals.lunch}
                onChange={(e) => setMeals({ ...meals, lunch: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">🍰 Bữa Xế Chiều</label>
              <input
                type="text"
                placeholder="VD: Bánh flan, chè đậu xanh..."
                value={meals.afternoon_snack}
                onChange={(e) => setMeals({ ...meals, afternoon_snack: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg shadow hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : menuId ? 'Cập Nhật Thực Đơn' : 'Tạo Thực Đơn'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
