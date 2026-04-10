import React from "react";

export default function VitalsInputModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        onClick={onClose}
      ></div>

      {/* Modal Card */}
      <div className="relative bg-white w-full max-w-4xl rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row max-h-[90vh] shadow-2xl">
        {/* Side Summary */}
        <div className="md:w-1/3 bg-slate-50 p-8 flex flex-col border-r border-slate-100 h-full overflow-y-auto hidden-scrollbar">
          <div className="mb-8">
            <button
              onClick={onClose}
              className="mb-6 flex items-center gap-2 text-slate-400 font-bold text-xs uppercase hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-sm">
                arrow_back
              </span>{" "}
              Back
            </button>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-3xl bg-cyan-100 text-cyan-800 flex items-center justify-center text-3xl font-extrabold">
                L
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-primary leading-tight font-headline">
                  Liam Miller
                </h2>
                <p className="text-xs text-slate-500 font-medium">Age: 4y 2m</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-error text-[11px] font-bold bg-error-container/50 px-3 py-1.5 rounded-lg border border-error-container">
                <span
                  className="material-symbols-outlined text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  error
                </span>
                Allergic to Dairy & Eggs
              </div>
              <div className="flex items-center gap-2 text-tertiary text-[11px] font-bold bg-tertiary-fixed px-3 py-1.5 rounded-lg border border-tertiary-fixed-dim/20">
                <span className="material-symbols-outlined text-sm">
                  history
                </span>
                Mild Asthma (Inhaler ready)
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="md:w-2/3 p-10 overflow-y-auto no-scrollbar font-body bg-white">
          <div className="mb-8">
            <h3 className="text-2xl font-extrabold text-primary font-headline tracking-tight">
              New Health Update
            </h3>
            <p className="text-sm text-slate-500">
              Record bi-weekly vitals and general wellness check.
            </p>
          </div>

          <form
            className="space-y-8"
            onSubmit={(e) => {
              e.preventDefault();
              onClose();
            }}
          >
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  Weight (kg)
                </label>
                <input
                  className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  step="0.1"
                  type="number"
                  defaultValue="16.4"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  Height (cm)
                </label>
                <input
                  className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  step="0.1"
                  type="number"
                  defaultValue="104.5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Heart Rate (BPM)
              </label>
              <div className="flex items-center gap-4">
                <input
                  className="flex-1 bg-slate-50 border-none rounded-xl p-4 font-bold text-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  type="number"
                  defaultValue="95"
                />
                <span className="text-secondary font-bold flex items-center gap-1 text-sm bg-secondary-container/30 px-4 py-2 rounded-xl">
                  <span className="material-symbols-outlined">favorite</span>{" "}
                  Healthy
                </span>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-4">
              <h4 className="font-bold text-primary flex items-center gap-2 text-sm font-headline">
                <span className="material-symbols-outlined text-secondary">
                  check_circle
                </span>{" "}
                Wellness Confirmation
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 bg-white p-4 rounded-xl cursor-pointer shadow-sm border border-slate-100 hover:border-primary/20 transition-colors">
                  <input
                    defaultChecked
                    className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                    type="checkbox"
                  />
                  <span className="text-sm font-semibold text-slate-700">
                    Clear Breath Sounds
                  </span>
                </label>
                <label className="flex items-center gap-3 bg-white p-4 rounded-xl cursor-pointer shadow-sm border border-slate-100 hover:border-primary/20 transition-colors">
                  <input
                    defaultChecked
                    className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                    type="checkbox"
                  />
                  <span className="text-sm font-semibold text-slate-700">
                    Normal Skin Temp
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-4 pt-6 mt-8 border-t border-slate-100">
              <button
                onClick={onClose}
                className="flex-1 bg-white border border-slate-200 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-colors shadow-sm"
                type="button"
              >
                Cancel
              </button>
              <button
                className="flex-[2] bg-primary text-white py-4 rounded-2xl font-bold font-headline shadow-xl shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all"
                type="submit"
              >
                Record Health Data
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
