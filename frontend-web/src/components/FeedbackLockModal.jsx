import React, { useState } from "react";

export default function FeedbackLockModal({ onClose }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating > 0) {
      onClose(); // This unlocks the dashboard
    } else {
      alert("Please select a rating to continue.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"></div>

      {/* Modal Card with Ambient Shadow as requested */}
      <div className="relative bg-white w-full max-w-lg rounded-3xl p-8 shadow-[0_0_80px_-15px_rgba(0,103,130,0.3)] animate-in slide-in-from-bottom-4 fade-in duration-500">
        <div className="w-16 h-16 bg-primary-container text-white rounded-2xl flex items-center justify-center mb-6 shadow-sm mx-auto">
          <span className="material-symbols-outlined text-3xl">
            rate_review
          </span>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-primary font-headline mb-2">
            Weekly Feedback Required
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            Before accessing Leo's dashboard, please let us know how your
            experience was this week.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`p-2 rounded-full transition-all transform hover:scale-110 ${rating >= star ? "text-yellow-400" : "text-slate-200"}`}
              >
                <span
                  className="material-symbols-outlined text-5xl"
                  style={{
                    fontVariationSettings:
                      rating >= star ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  star
                </span>
              </button>
            ))}
          </div>

          <div>
            <textarea
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              placeholder="Any specific comments or concerns regarding Leo's week? (Optional)"
              rows="4"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-br from-primary to-primary-container text-white py-4 rounded-full font-bold font-headline shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-lg"
          >
            Submit to Unlock Portal
          </button>
        </form>
      </div>
    </div>
  );
}
