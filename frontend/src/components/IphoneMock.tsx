import React, { PropsWithChildren } from "react";

export default function IphoneMock({ children }: PropsWithChildren) {
  return (
    <div className="w-[min(92vw,420px)]">
      <div className="phone-shell" style={{ aspectRatio: "390/844" }}>
        {/* Dynamic Island удалили */}
        <div className="phone-screen">
          <div className="phone-content">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}