import { useState } from 'react';
import SetupScreen from './components/SetupScreen';
import ChatScreen from './components/ChatScreen';

export type DataSource = {
  id: string;
  type: 'pdf' | 'text' | 'web';
  data: string;
};

export type CandidateProfile = {
  name: string;
  sources: DataSource[];
  apiKey?: string;
  useAiKnowledge?: boolean;
};

function App() {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);

  const handleStartChat = (newProfile: CandidateProfile) => {
    setProfile(newProfile);
  };

  const handleLeaveChat = () => {
    if (confirm('현재 대화를 종료하고 설정을 초기화하시겠습니까?')) {
      setProfile(null);
    }
  };

  return (
    <div className="app-container">
      <header className="glass-header">
        <h1 className="title">AI 가상 후보자</h1>
        {profile && (
          <button 
            style={{ 
              background: 'transparent', 
              border: '1px solid var(--panel-border)', 
              color: 'var(--text-muted)',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
            onClick={handleLeaveChat}
          >
            기록 초기화
          </button>
        )}
      </header>
      
      {profile ? (
        <ChatScreen profile={profile} />
      ) : (
        <SetupScreen onComplete={handleStartChat} />
      )}

      <footer className="app-footer">
        <div className="footer-content">
          <p><strong>권혁용 연구위원</strong> (AI선거전략연구소)</p>
          <div className="footer-links">
            <a href="mailto:hukyoung84@naver.com">이메일(hukyoung84@naver.com)</a> | 
            <a href="https://www.youtube.com/@KwonT_AI" target="_blank" rel="noopener noreferrer">유튜브</a> | 
            <a href="https://litt.ly/levelupai" target="_blank" rel="noopener noreferrer">홈페이지</a> | 
            <a href="https://win-ai.kr/" target="_blank" rel="noopener noreferrer">AI선거전략연구소</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
