import React, { useState } from "react";
import axiosClient from "../../../../api/axiosClient";

export default function FeedbackLockModal({ onUnlock }) {
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const submitRating = async () => {
    if (rating === 0) return alert("Select a star rating framework first.");
    setLoading(true);
    try {
      // Usually posts to /api/feedbacks
      await axiosClient.post("/feedbacks", { rating });
      console.log("React State Unlock Triggered securely:", rating);
    } catch (e) {
      console.error("Error submitting feedback proxy natively.", e);
    } finally {
      setLoading(false);
      onUnlock();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-70 backdrop-blur-md">
      <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-md w-full text-center transform transition-all scale-100">
        <div className="w-16 h-16 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-gray-800 mb-2">
          Mandatory Check
        </h2>
        <p className="text-gray-500 font-medium mb-8">
          Please provide a 1-5 star assessment of administrative communication
          this week before accessing the data locker.
        </p>

        <div className="flex justify-center space-x-3 mb-10">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={`text-5xl transition-transform transform focus:outline-none ${rating >= star ? "text-yellow-400 scale-110 drop-shadow-md" : "text-gray-200 hover:text-gray-300"}`}
            >
              ★
            </button>
          ))}
        </div>

        <button
          onClick={submitRating}
          disabled={loading || rating === 0}
          className="w-full bg-indigo-600 text-white font-bold py-4 px-4 rounded-xl hover:bg-indigo-700 transition disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed shadow-lg"
        >
          {loading ? "Authorizing Portal..." : "Unlock Parent Network View"}
        </button>
      </div>
    </div>
  );
}
