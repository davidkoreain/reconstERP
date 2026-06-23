import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import AuthPage from './components/AuthPage.tsx';
import './index.css';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { AppProvider } from './context/AppContext.tsx';

const Root: React.FC = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'hsl(220 25% 8%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'hsl(220 15% 50%)',
        fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif",
        fontSize: '0.9rem',
      }}>
        세션 확인 중...
      </div>
    );
  }

  if (!session) return <AuthPage />;

  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </React.StrictMode>,
);
