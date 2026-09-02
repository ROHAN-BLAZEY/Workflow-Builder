import React from 'react';
import { Wifi, Battery, Signal, Sparkles, Smartphone, X } from 'lucide-react';

interface MobileDeviceFrameProps {
  children: React.ReactNode;
  onClosePreview: () => void;
}

export const MobileDeviceFrame: React.FC<MobileDeviceFrameProps> = ({
  children,
  onClosePreview,
}) => {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="py-4 px-2 flex flex-col items-center justify-center min-h-[calc(100vh-60px)] w-full max-w-full overflow-x-hidden">
      
      {/* Mobile Simulator Control Bar */}
      <div className="mb-3 flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold truncate">
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Samsung Galaxy A13 (SM-A135F) Display</span>
        </div>
        <button
          onClick={onClosePreview}
          className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 flex items-center gap-1 transition-colors shrink-0"
        >
          <X className="w-3 h-3" />
          <span>Exit</span>
        </button>
      </div>

      {/* Realistic Samsung SM-A135F Mobile Device Mockup */}
      <div className="relative w-full max-w-[365px] h-[780px] bg-[#f8fafc] rounded-[36px] border-[8px] border-slate-800 shadow-[0_20px_40px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col ring-1 ring-slate-700">
        
        {/* Top Status Bar */}
        <div className="bg-[#f8fafc] px-5 pt-2.5 pb-1.5 flex items-center justify-between text-slate-800 text-[11px] font-semibold shrink-0 z-30 select-none border-b border-slate-200/40">
          <span className="font-mono">{currentTime}</span>
          
          {/* Camera Notch Punchhole */}
          <div className="w-3.5 h-3.5 bg-black rounded-full mx-auto" />

          <div className="flex items-center gap-1 text-slate-600">
            <Signal className="w-3 h-3" />
            <Wifi className="w-3 h-3" />
            <Battery className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Scrollable Screen Content */}
        <div className="flex-1 overflow-y-auto bg-[#f8fafc] text-slate-800 relative scrollbar-none pb-10 px-2 sm:px-3 pt-2">
          {children}
        </div>

        {/* Bottom Navigation Bar Indicator */}
        <div className="bg-[#f8fafc] py-1.5 flex justify-center shrink-0 z-30">
          <div className="w-28 h-1 bg-slate-300 rounded-full" />
        </div>

      </div>
    </div>
  );
};
