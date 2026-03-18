
import React from 'react';
import { PowerBIReport } from '../UI/PowerBIReport';

export const PaperLocation: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden relative">
        <PowerBIReport 
          embedUrl="https://app.powerbi.com/view?r=eyJrIjoiYTZhNDY3YmItMjgzOC00ZTU3LTg4MDQtZmZkMjE3MDBiMWFlIiwidCI6ImI4YjEyY2UxLTk2NDAtNDg3OC04YWE3LWFkMmY1NDlmNzljZSIsImMiOjEwfQ%3D%3D&pageName=050c64902e76542390e3"
          title="VỊ TRÍ KHO GIẤY"
        />
      </div>
    </div>
  );
};
