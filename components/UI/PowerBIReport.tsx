import React, { useState } from 'react';
import { PowerBIEmbed } from 'powerbi-client-react';
import { models } from 'powerbi-client';
import { Loader2 } from 'lucide-react';

interface PowerBIReportProps {
  embedUrl: string;
  title?: string;
  mobileLayout?: boolean;
}

export const PowerBIReport: React.FC<PowerBIReportProps> = ({ embedUrl, title, mobileLayout = false }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="w-full h-full flex flex-col relative bg-slate-900/50">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-900/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
            <span className="text-sm text-gray-400">Đang tải báo cáo...</span>
          </div>
        </div>
      )}
      
      <PowerBIEmbed
        embedConfig={{
          type: 'report',
          embedUrl: embedUrl,
          accessToken: undefined, // Publish to Web does not use a token
          tokenType: models.TokenType.Embed,
          settings: {
            panes: {
              filters: {
                visible: false
              },
              pageNavigation: {
                visible: false
              }
            },
            background: models.BackgroundType.Transparent,
            layoutType: mobileLayout ? models.LayoutType.MobilePortrait : models.LayoutType.Master,
          }
        }}
        eventHandlers={
          new Map([
            ['loaded', function () {
              setIsLoading(false);
              console.log('Report loaded');
            }],
            ['rendered', function () {
              setIsLoading(false);
              console.log('Report rendered');
            }],
            ['error', function (event) {
              console.error('PowerBI Error:', event?.detail);
              setIsLoading(false);
            }]
          ])
        }
        cssClassName="w-full h-full"
        getEmbeddedComponent={(embeddedReport) => {
          // Store reference if needed
        }}
      />
    </div>
  );
};
