import React from 'react';
import { PowerBIEmbed } from 'powerbi-client-react';
import { models } from 'powerbi-client';

interface PowerBIReportProps {
  embedUrl: string;
  title?: string;
  mobileLayout?: boolean;
}

export const PowerBIReport: React.FC<PowerBIReportProps> = ({ embedUrl, title, mobileLayout = false }) => {
  return (
    <div className="w-full h-full flex flex-col relative !p-0">
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
              console.log('Report loaded');
            }],
            ['rendered', function () {
              console.log('Report rendered');
            }],
            ['error', function (event) {
              console.error('PowerBI Error:', event?.detail);
            }]
          ])
        }
        cssClassName="!w-full !h-full !p-0"
        getEmbeddedComponent={(embeddedReport) => {
          // Store reference if needed
        }}
      />
    </div>
  );
};
