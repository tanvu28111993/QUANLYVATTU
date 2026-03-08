
import React from 'react';
import { PowerBIReport } from '../UI/PowerBIReport';

export const Overview: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="flex-1 bg-slate-900/50 overflow-hidden relative">
        <PowerBIReport 
          embedUrl="https://app.powerbi.com/view?r=eyJrIjoiNzc1MjljYTYtYjdiMC00Y2E3LTgwMGItMzA4Y2ZiMmEzZGEzIiwidCI6ImI4YjEyY2UxLTk2NDAtNDg3OC04YWE3LWFkMmY1NDlmNzljZSIsImMiOjEwfQ%3D%3D&pageName=41cec83c67153dd83482"
          title="QLK GIAY TONG QUAN"
        />
      </div>
    </div>
  );
};
