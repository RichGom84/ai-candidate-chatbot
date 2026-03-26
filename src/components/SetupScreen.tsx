import React, { useState } from 'react';
import { CandidateProfile, DataSource } from '../App';

type SetupScreenProps = {
  onComplete: (profile: CandidateProfile) => void;
};

const SetupScreen: React.FC<SetupScreenProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [sources, setSources] = useState<DataSource[]>([]);
  const [useAiKnowledge, setUseAiKnowledge] = useState(false);
  
  // 현재 입력 중인 자료
  const [currentType, setCurrentType] = useState<'pdf' | 'text' | 'web'>('pdf');
  const [currentTextData, setCurrentTextData] = useState('');
  const [currentWebUrl, setCurrentWebUrl] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileName = e.target.files[0].name;
      const newSource: DataSource = {
        id: Date.now().toString(),
        type: 'pdf',
        data: fileName
      };
      setSources((prev) => [...prev, newSource]);
      e.target.value = ''; // 폼 리셋
    }
  };

  const handleAddTextOrWeb = () => {
    if (currentType === 'text') {
      if (!currentTextData.trim()) return alert('텍스트를 입력해주세요.');
      setSources(prev => [...prev, { id: Date.now().toString(), type: 'text', data: currentTextData.trim() }]);
      setCurrentTextData('');
    } else if (currentType === 'web') {
      if (!currentWebUrl.trim()) return alert('URL을 입력해주세요.');
      setSources(prev => [...prev, { id: Date.now().toString(), type: 'web', data: currentWebUrl.trim() }]);
      setCurrentWebUrl('');
    }
  };

  const removeSource = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('후보자 이름을 입력해주세요.');
      return;
    }
    if (sources.length === 0 && !useAiKnowledge) {
      alert('공약 데이터를 최소 1개 이상 추가하시거나, [AI 자동 학습 모드]를 활성화해주세요.');
      return;
    }

    onComplete({
      name: name.trim(),
      sources,
      apiKey: apiKey.trim(),
      useAiKnowledge
    });
  };

  return (
    <div className="setup-container fade-in">
      <div className="setup-card">
        <h2>어떤 후보자와 대화하시겠습니까?</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.5' }}>
          가상 후보자 또는 대변인의 이름을 입력하고, 참조할 공약 문서, 정책, 웹페이지 링크를 자유롭게 추가해 주세요.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="input-group">
            <label htmlFor="candidate-name">후보자 이름</label>
            <input 
              id="candidate-name"
              type="text" 
              className="input-field" 
              placeholder="예: 홍길동 후보" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>공약 자료 추가하기</label>
            <div className="tabs">
              <button 
                type="button" 
                className={`tab-button ${currentType === 'pdf' ? 'active' : ''}`}
                onClick={() => setCurrentType('pdf')}
              >
                PDF 추가
              </button>
              <button 
                type="button" 
                className={`tab-button ${currentType === 'text' ? 'active' : ''}`}
                onClick={() => setCurrentType('text')}
              >
                직접 텍스트 추가
              </button>
              <button 
                type="button" 
                className={`tab-button ${currentType === 'web' ? 'active' : ''}`}
                onClick={() => setCurrentType('web')}
              >
                웹 링크 추가
              </button>
            </div>

            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--panel-border)', borderRadius: '8px', marginTop: '0.5rem' }}>
              {currentType === 'pdf' && (
                <div style={{ textAlign: 'center' }}>
                  <input 
                    type="file" 
                    accept=".pdf" 
                    id="pdf-upload" 
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <label htmlFor="pdf-upload" style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: 'bold' }}>
                    클릭하여 PDF 파일 브라우저에서 찾기
                  </label>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    정책 정책 자료집 등의 PDF를 선택하면 목록에 바로 추가됩니다.
                  </p>
                </div>
              )}

              {currentType === 'text' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <textarea 
                    className="input-field" 
                    placeholder="후보자의 주요 공약 내용을 적어주세요."
                    value={currentTextData}
                    onChange={(e) => setCurrentTextData(e.target.value)}
                    rows={4}
                  />
                  <button type="button" className="btn-secondary" onClick={handleAddTextOrWeb}>등록하기</button>
                </div>
              )}

              {currentType === 'web' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input 
                    type="url" 
                    className="input-field" 
                    placeholder="https://..." 
                    value={currentWebUrl}
                    onChange={(e) => setCurrentWebUrl(e.target.value)}
                  />
                  <button type="button" className="btn-secondary" onClick={handleAddTextOrWeb}>링크 등록하기</button>
                </div>
              )}
            </div>
          </div>

          <div className="input-group">
            <label>추가된 자료 목록 ({sources.length}개)</label>
            {sources.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>아직 등록된 자료가 없습니다.</p>
            ) : (
              <ul className="source-list">
                {sources.map(s => (
                  <li key={s.id} className="source-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge badge-primary">{s.type.toUpperCase()}</span>
                      <span className="source-data-preview">
                        {s.type === 'text' ? s.data.substring(0, 30) + (s.data.length > 30 ? '...' : '') : s.data}
                      </span>
                    </div>
                    <button type="button" className="btn-remove" onClick={() => removeSource(s.id)}>삭제</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="input-group" style={{ background: 'rgba(79, 70, 229, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(79, 70, 229, 0.3)' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={useAiKnowledge}
                onChange={(e) => setUseAiKnowledge(e.target.checked)}
                style={{ marginTop: '0.2rem', transform: 'scale(1.2)' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>AI 자체 지식(Web)으로 후보 자동 학습</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  체크하시면 첨부 자료를 넣지 않아도 AI가 지닌 후보 관련 지식을 총동원해 대화에 임합니다. (Gemini API Key 필수 권장)
                </span>
              </div>
            </label>
          </div>

          <div className="input-group" style={{ marginTop: '0.5rem', borderTop: '1px solid var(--panel-border)', paddingTop: '1.5rem' }}>
            <label htmlFor="api-key">
              실제 AI 연동용 Gemini API Key <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>(입력 시 실제 학습 데이터로 대답합니다)</span>
            </label>
            <input 
              id="api-key"
              type="password" 
              className="input-field" 
              placeholder="AI API Key (선택사항, 비워두면 더미 모드로 동작)" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
            위 자료들로 챗봇 생성하기
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"></path>
              <path d="M12 5l7 7-7 7"></path>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetupScreen;
