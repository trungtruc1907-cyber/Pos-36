import React, { useState } from 'react';
import { QrCode, X, CheckCircle2, Volume2, ShieldCheck, Zap } from 'lucide-react';

interface QrPaymentModalProps {
  onClose: () => void;
}

export const QrPaymentModal: React.FC<QrPaymentModalProps> = ({ onClose }) => {
  const [testedSound, setTestedSound] = useState(false);

  const handleTestTingTing = () => {
    setTestedSound(true);
    // Play a gentle audio tone chime if supported
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.3); // A6
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.log('Audio contextual chime fallback:', e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 p-5 space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900">QR Ting Ting Miễn Phí</h3>
              <p className="text-xs text-gray-500">Tự động báo âm thanh khi nhận tiền</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Graphic */}
        <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-100 text-center space-y-3">
          <div className="bg-white p-3 inline-block rounded-xl shadow-sm border border-emerald-200">
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=VIETQR_CHONGTHAM36_TAIKHOAN_VIETINBANK"
              alt="VietQR Chống Thấm 36"
              className="w-40 h-40 mx-auto"
            />
          </div>
          <div>
            <div className="font-extrabold text-sm text-[#1e0b54]">
              STK: 3636 8888 9999 - VietinBank
            </div>
            <div className="text-xs font-semibold text-emerald-800">
              Chủ TK: CHỐNG THẤM 36 THANH HÓA
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2 text-xs text-gray-700">
          <div className="flex items-start">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2 shrink-0 mt-0.5" />
            <span>Tự động gạch nợ trên phần mềm POS khi khách hàng chuyển khoản xong.</span>
          </div>
          <div className="flex items-start">
            <Volume2 className="w-4 h-4 text-emerald-600 mr-2 shrink-0 mt-0.5" />
            <span>Phát âm thanh thông báo đọc số tiền tức thì (Ting ting!).</span>
          </div>
          <div className="flex items-start">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mr-2 shrink-0 mt-0.5" />
            <span>Tránh gian lận hóa đơn giả hay ủy nhiệm chi giả mạo.</span>
          </div>
        </div>

        {/* Test Chime Button */}
        <div className="pt-2 border-t flex flex-col gap-2">
          <button
            onClick={handleTestTingTing}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center space-x-2 transition-all shadow"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Thử phát âm thanh "Ting Ting +1,410,000đ"</span>
          </button>
          {testedSound && (
            <p className="text-[11px] text-center text-emerald-700 font-medium animate-pulse">
              ♪ Đã phát âm thanh thông báo nhận tiền thử nghiệm!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
