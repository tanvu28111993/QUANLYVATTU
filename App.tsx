
import React from 'react';
import { useAuth } from '@/contexts';
import { LoginScreen } from '@/components/Login/LoginScreen';
import { MainLayout } from '@/components/Layout/MainLayout';
import { AppProviders } from '@/components/AppProviders';
import { useDataSynchronizer, useGlobalShortcuts } from '@/hooks';

// Optimization: Authenticated Scope
// Component này chỉ render khi user đã đăng nhập.
// Đây là nơi lý tưởng để đặt các Global Logic Hooks (Sync, Shortcuts, WebSocket, etc.)
// thay vì nhét chúng vào UI Layout.
const AuthenticatedApp: React.FC = () => {
  // 1. Kích hoạt đồng bộ dữ liệu nền (Business Logic)
  useDataSynchronizer(true);

  // 2. Kích hoạt phím tắt toàn cục (UI Behavior)
  useGlobalShortcuts();

  // 3. Render giao diện chính
  return <MainLayout />;
};

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <AuthenticatedApp />;
};

const App: React.FC = () => {
  return (
    <AppProviders>
        <AppContent />
    </AppProviders>
  );
};

export default App;
