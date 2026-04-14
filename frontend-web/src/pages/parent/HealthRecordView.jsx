import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import api from "../../api/axiosClient";
import { useLang } from "../../contexts/LangContext";
import { useOutletContext } from "react-router-dom";

export default function HealthRecordView() {
  const { lang } = useLang();
  const vi = lang === "vi";
  const { activeStudent } = useOutletContext();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVitals = async () => {
      try {
        if (!activeStudent) {
          setLoading(false);
          return;
        }

        const res = await api.get(`/health/vitals?studentId=${activeStudent.id}`);
        setData(res.data || []);
      } catch (e) {
        console.error("Vitals error", e);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchVitals();
  }, [activeStudent]);

  const latestVital = data.length > 0 ? data[data.length - 1] : null;

  const chartData = data.map((v) => ({
    name: new Date(v.logged_at).toLocaleDateString(vi ? "vi-VN" : "en-US", {
      month: "short",
      day: "numeric",
    }),
    bmi: Number(v.bmi_value),
    baseline: 15.0,
  }));

  const finalChartData =
    chartData.length > 0
      ? chartData
      : [
          { name: vi ? "Tháng 1" : "Jan", bmi: 0, baseline: 13.0 },
          { name: vi ? "Tháng 3" : "Mar", bmi: 0, baseline: 13.8 },
          { name: vi ? "Tháng 5" : "May", bmi: 0, baseline: 14.6 },
        ];

  // Tính BMI status
  const bmi = Number(latestVital?.bmi_value);
  const bmiStatus = !bmi
    ? null
    : bmi < 14
      ? {
          label: vi ? "Thiếu Cân" : "Underweight",
          color: "text-amber-600",
          bg: "bg-amber-50 border-amber-200",
        }
      : bmi >= 18
        ? {
            label: vi ? "Thừa Cân" : "Overweight",
            color: "text-error",
            bg: "bg-error-container/30 border-error-container/50",
          }
        : {
            label: vi ? "Bình Thường" : "Normal",
            color: "text-secondary",
            bg: "bg-green-50 border-green-200",
          };

  if (loading)
    return (
      <div className="flex items-center justify-center p-16 gap-3 text-slate-400">
        <span className="material-symbols-outlined animate-pulse text-4xl">
          monitor_heart
        </span>
        <p>{vi ? "Đang tải hồ sơ sức khỏe..." : "Loading health records..."}</p>
      </div>
    );

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="mb-10 ml-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary font-headline mb-1">
          {vi ? "Hồ Sơ Sức Khỏe" : "Health Record"}
        </h1>
        <div className="flex items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">history</span>
          <p className="text-sm font-medium">
            {vi ? "Cập nhật lần cuối: " : "Last updated: "}
            {latestVital
              ? new Date(latestVital.logged_at).toLocaleDateString(
                  vi ? "vi-VN" : "en-US",
                  { day: "numeric", month: "long", year: "numeric" },
                )
              : vi
                ? "Chưa có dữ liệu"
                : "No data"}
          </p>
        </div>
      </header>

      {/* Top Row Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Cân nặng */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl transition-all hover:shadow-lg shadow-sm border border-slate-100">
          <div className="w-12 h-12 bg-cyan-50 rounded-xl text-primary flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-2xl">
              monitor_weight
            </span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 mt-2">
            {vi ? "Cân Nặng Mới Nhất" : "Latest Weight"}
          </p>
          <div className="flex items-baseline gap-1">
            <h3 className="text-4xl font-extrabold text-primary font-headline tracking-tighter">
              {latestVital?.weight || "--"}
            </h3>
            <span className="text-lg font-bold text-slate-400">kg</span>
          </div>
        </div>

        {/* Chiều cao */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl transition-all hover:shadow-lg shadow-sm border border-slate-100">
          <div className="w-12 h-12 bg-green-50 rounded-xl text-secondary flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-2xl">
              straighten
            </span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 mt-2">
            {vi ? "Chiều Cao Mới Nhất" : "Latest Height"}
          </p>
          <div className="flex items-baseline gap-1">
            <h3 className="text-4xl font-extrabold text-on-surface font-headline tracking-tighter">
              {latestVital?.height || "--"}
            </h3>
            <span className="text-lg font-bold text-slate-400">cm</span>
          </div>
        </div>

        {/* Tình trạng BMI */}
        <div
          className={`p-6 rounded-2xl shadow-sm border ${bmiStatus ? bmiStatus.bg : "bg-error-container/30 border-error-container/50"}`}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-error text-white rounded-xl shadow-sm">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                monitor_heart
              </span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-error bg-white/50 px-2 py-1 rounded">
              {vi ? "Cảnh Báo" : "Alerts"}
            </span>
          </div>
          <p
            className={`text-xs font-black uppercase tracking-widest mb-1 mt-2 ${bmiStatus ? bmiStatus.color : "text-error"}`}
          >
            {vi ? "Tình Trạng BMI" : "BMI Status"}
          </p>
          <h3
            className={`text-xl font-bold font-headline ${bmiStatus ? bmiStatus.color : "text-error"}`}
          >
            {bmiStatus
              ? `${bmiStatus.label} (${bmi.toFixed(1)})`
              : vi
                ? "Xem Hồ Sơ Để Biết Thêm"
                : "Check Profile for Details"}
          </h3>
        </div>
      </section>

      {/* BMI Chart */}
      <section className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-slate-100 mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-primary font-headline">
              {vi ? "Xu Hướng Phát Triển BMI" : "BMI Growth Trend"}
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              {vi
                ? "So sánh tăng trưởng của con với chuẩn WHO"
                : "Comparison between Child's growth and WHO baseline"}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-primary shadow-sm border border-white inline-block"></span>
              <span className="text-xs font-bold text-slate-600">
                {vi ? "BMI Của Con" : "Child's BMI"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-slate-300 inline-block"></span>
              <span className="text-xs font-bold text-slate-500">
                {vi ? "Chuẩn WHO" : "WHO Baseline"}
              </span>
            </div>
          </div>
        </div>

        <div className="h-[360px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={finalChartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorBmi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#004e63" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#004e63" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#cbd5e1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#cbd5e1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fontWeight: 700, fill: "#94a3b8" }}
                dy={10}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value, name) => [
                  value,
                  name === "bmi"
                    ? vi
                      ? "BMI"
                      : "BMI"
                    : vi
                      ? "Chuẩn WHO"
                      : "WHO Baseline",
                ]}
              />
              <Area
                type="monotone"
                dataKey="baseline"
                stroke="#cbd5e1"
                strokeWidth={3}
                strokeDasharray="5 5"
                fillOpacity={1}
                fill="url(#colorBaseline)"
                name={vi ? "Chuẩn WHO" : "WHO Baseline"}
              />
              <Area
                type="monotone"
                dataKey="bmi"
                stroke="#004e63"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorBmi)"
                activeDot={{ r: 8, strokeWidth: 0, fill: "#004e63" }}
                name="BMI"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Ghi chú y tế */}
      <section className="w-full">
        <div className="bg-slate-50 rounded-3xl overflow-hidden shadow-sm border border-slate-100">
          <div className="bg-white px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 text-secondary rounded-xl">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  clinical_notes
                </span>
              </div>
              <h2 className="text-xl font-bold text-primary font-headline">
                {vi ? "Ghi Chú Quan Sát Y Tế" : "Clinical Observations"}
              </h2>
            </div>
          </div>
          <div className="p-10">
            <div className="relative pl-6 border-l-4 border-secondary/30">
              <p className="text-slate-700 leading-relaxed text-lg font-medium italic font-serif">
                "
                {latestVital?.doctor_note ||
                  (vi
                    ? "Không có ghi chú cụ thể nào cho lần khám gần nhất."
                    : "No specific notes recorded for the most recent visit.")}
                "
              </p>
            </div>
            <div className="mt-8 flex items-center gap-4 pl-6">
              <div className="w-12 h-12 rounded-full bg-surface-container-highest text-slate-500 flex items-center justify-center font-bold">
                YT
              </div>
              <div>
                <p className="text-sm font-extrabold text-primary font-headline tracking-wide">
                  {vi ? "Y Tế Trường" : "School Nurse"}
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  {vi ? "Phụ trách sức khỏe học sinh" : "Lead Pediatrician"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
