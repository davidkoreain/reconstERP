import React, { useState } from 'react';
import { ShieldCheck, LogIn, UserPlus, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type AuthMode = 'login' | 'signup';

const AuthPage: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
    setError(null);
    setSuccessMsg(null);
    setShowPassword(false);
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    resetForm();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) { setError('이메일과 비밀번호를 입력해 주세요.'); return; }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) setError(error);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name || !email || !password) { setError('모든 항목을 입력해 주세요.'); return; }
    if (password.length < 6) { setError('비밀번호는 최소 6자 이상이어야 합니다.'); return; }
    if (password !== confirmPassword) { setError('비밀번호가 일치하지 않습니다.'); return; }
    setLoading(true);
    const { error } = await signUp(email, password, name);
    setLoading(false);
    if (error) { setError(error); return; }
    setSuccessMsg('계정이 생성되었습니다. 이메일 인증 후 로그인해 주세요.');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    backgroundColor: 'hsl(220 25% 12%)',
    border: '1px solid hsl(220 20% 22%)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.8rem',
    color: 'hsl(220 15% 60%)',
    marginBottom: '0.4rem',
    fontWeight: 500,
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'hsl(220 25% 8%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif",
      padding: '1.5rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
      }}>
        {/* Logo + Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '52px', height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, hsl(239 84% 67%), hsl(262 83% 58%))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: '1.4rem', fontWeight: 800, color: 'white',
            boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
          }}>P</div>
          <h1 style={{ color: 'white', fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>
            태평양 자산관리 ERP
          </h1>
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
            <ShieldCheck size={13} color="hsl(142 71% 45%)" />
            <span style={{ fontSize: '0.75rem', color: 'hsl(220 15% 50%)' }}>
              내부 관계자 전용 보안 시스템
            </span>
          </div>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: 'hsl(220 25% 11%)',
          border: '1px solid hsl(220 20% 18%)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid hsl(220 20% 18%)' }}>
            {(['login', 'signup'] as AuthMode[]).map(tab => (
              <button
                key={tab}
                onClick={() => switchMode(tab)}
                style={{
                  flex: 1, padding: '1rem',
                  backgroundColor: mode === tab ? 'hsl(220 25% 14%)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  color: mode === tab ? 'white' : 'hsl(220 15% 45%)',
                  fontSize: '0.875rem', fontWeight: mode === tab ? 600 : 400,
                  borderBottom: mode === tab ? '2px solid hsl(239 84% 67%)' : '2px solid transparent',
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                }}
              >
                {tab === 'login' ? <LogIn size={15} /> : <UserPlus size={15} />}
                {tab === 'login' ? '로그인' : '회원가입'}
              </button>
            ))}
          </div>

          {/* Form */}
          <div style={{ padding: '1.75rem' }}>
            {error && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'hsl(0 60% 10%)',
                border: '1px solid hsl(0 60% 25%)',
                borderRadius: '8px',
                marginBottom: '1.25rem',
                color: 'hsl(0 80% 65%)',
                fontSize: '0.8rem',
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                {error}
              </div>
            )}
            {successMsg && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'hsl(142 60% 8%)',
                border: '1px solid hsl(142 60% 22%)',
                borderRadius: '8px',
                marginBottom: '1.25rem',
                color: 'hsl(142 71% 55%)',
                fontSize: '0.8rem',
              }}>
                <CheckCircle size={15} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                {successMsg}
              </div>
            )}

            <form onSubmit={mode === 'login' ? handleLogin : handleSignup}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

                {mode === 'signup' && (
                  <div>
                    <label style={labelStyle}>이름</label>
                    <input
                      type="text"
                      placeholder="홍길동"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      style={inputStyle}
                      autoComplete="name"
                    />
                  </div>
                )}

                <div>
                  <label style={labelStyle}>이메일</label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={inputStyle}
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label style={labelStyle}>비밀번호</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={mode === 'signup' ? '6자 이상 입력' : '비밀번호'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      style={{ ...inputStyle, paddingRight: '2.75rem' }}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      style={{
                        position: 'absolute', right: '0.75rem', top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'hsl(220 15% 45%)', padding: '0.2rem',
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {mode === 'signup' && (
                  <div>
                    <label style={labelStyle}>비밀번호 확인</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="비밀번호 재입력"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      style={inputStyle}
                      autoComplete="new-password"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '0.85rem',
                    marginTop: '0.25rem',
                    background: loading
                      ? 'hsl(239 50% 35%)'
                      : 'linear-gradient(135deg, hsl(239 84% 67%), hsl(262 83% 58%))',
                    border: 'none', borderRadius: '8px',
                    color: 'white', fontSize: '0.9rem', fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    transition: 'opacity 0.15s',
                    boxShadow: loading ? 'none' : '0 4px 14px rgba(99,102,241,0.4)',
                  }}
                >
                  {loading ? (
                    <span style={{ opacity: 0.7 }}>처리 중...</span>
                  ) : mode === 'login' ? (
                    <><LogIn size={16} /> 로그인</>
                  ) : (
                    <><UserPlus size={16} /> 계정 생성</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.73rem', color: 'hsl(220 15% 35%)' }}>
          본 시스템은 승인된 내부 관계자만 접근할 수 있습니다.<br />
          모든 접속 기록은 회생감독 대장에 보관됩니다.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
