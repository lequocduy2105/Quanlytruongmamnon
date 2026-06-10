import React from "react";

/**
 * Reusable component to render standard VietQR dynamic codes.
 * Uses NAPAS Quick-Link API for 0KB client bundle size and dynamic rendering.
 */
export default function VietQRContainer({
  bankId = "vietinbank",
  accountNo = "102888888888",
  accountName = "TRUONG MAM NON",
  amount = 0,
  description = "",
}) {
  const cleanAccountName = encodeURIComponent(accountName);
  const cleanDescription = encodeURIComponent(description);
  
  // Construct VietQR URL using the 'compact' template
  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact.png?amount=${amount}&addInfo=${cleanDescription}&accountName=${cleanAccountName}`;

  const fmtVND = (n) => {
    return Number(n || 0).toLocaleString("vi-VN") + " ₫";
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-6 bg-cyan-50/50 dark:bg-cyan-950/10 rounded-2xl p-6 border border-cyan-100/50 dark:border-cyan-900/30 w-full">
      {/* QR Code Frame */}
      <div className="flex-shrink-0 bg-white p-3 rounded-2xl shadow-sm border border-slate-150/80">
        <img
          src={qrUrl}
          alt="Mã VietQR thanh toán học phí"
          className="w-40 h-40 object-contain rounded-lg"
          loading="lazy"
        />
      </div>

      {/* Payment Details */}
      <div className="flex-1 space-y-2 text-sm text-slate-600 dark:text-gray-300 w-full">
        <h4 className="font-bold text-cyan-900 dark:text-cyan-400 text-base flex items-center gap-1.5 font-headline">
          <span className="material-symbols-outlined text-cyan-600 dark:text-cyan-400" style={{ fontVariationSettings: "'FILL' 1" }}>
            qr_code_scanner
          </span>
          Thanh toán tự động qua VietQR
        </h4>
        <p className="text-slate-500 dark:text-gray-400 text-xs leading-relaxed">
          Quét mã QR bằng ứng dụng ngân hàng của bạn để thanh toán nhanh 24/7. 
          Thông tin thanh toán sẽ được đối soát tự động ngay lập tức sau khi giao dịch thành công.
        </p>
        
        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-slate-400 dark:text-gray-500">Ngân hàng: </span>
            <strong className="text-slate-700 dark:text-gray-250 uppercase">{bankId}</strong>
          </div>
          <div>
            <span className="text-slate-400 dark:text-gray-500">Số tài khoản: </span>
            <strong className="text-slate-700 dark:text-gray-250 font-mono">{accountNo}</strong>
          </div>
          <div>
            <span className="text-slate-400 dark:text-gray-500">Số tiền: </span>
            <strong className="text-cyan-800 dark:text-cyan-400 font-bold">{fmtVND(amount)}</strong>
          </div>
          <div>
            <span className="text-slate-400 dark:text-gray-500">Nội dung CK: </span>
            <strong className="font-mono text-cyan-800 dark:text-cyan-300 bg-cyan-100/50 dark:bg-cyan-950/40 px-1.5 py-0.5 rounded uppercase">
              {description}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
