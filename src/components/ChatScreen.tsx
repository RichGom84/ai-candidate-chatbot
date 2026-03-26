import React, { useState, useEffect, useRef } from 'react';
import { CandidateProfile } from '../App';

type Message = {
  id: string;
  sender: 'user' | 'bot';
  text: string;
};

type ChatScreenProps = {
  profile: CandidateProfile;
};

const ChatScreen: React.FC<ChatScreenProps> = ({ profile }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 초기 인사말
  useEffect(() => {
    const pdfCount = profile.sources.filter(s => s.type === 'pdf').length;
    const webCount = profile.sources.filter(s => s.type === 'web').length;
    const textCount = profile.sources.filter(s => s.type === 'text').length;
    
    let sourceTextParts = [];
    if (pdfCount > 0) sourceTextParts.push(`PDF 자료 ${pdfCount}건`);
    if (textCount > 0) sourceTextParts.push(`입력하신 텍스트 정책 ${textCount}건`);
    if (webCount > 0) sourceTextParts.push(`참고 웹페이지 ${webCount}건`);
    if (profile.useAiKnowledge) sourceTextParts.push(`[전반적인 사회/정치 웹 지식]`);

    const sourceText = sourceTextParts.join(', ');

    setMessages([
      {
        id: Date.now().toString(),
        sender: 'bot',
        text: `안녕하세요! ${profile.name}입니다. ${sourceText ? `전달해주신 데이터(${sourceText})를 꼼꼼히 학습했습니다.` : '모든 질문을 성심성의껏 듣겠습니다.'} 무엇이든 편하게 물어보세요!`
      }
    ]);
  }, [profile]);

  const handleDownloadChat = () => {
    const chatText = messages.map(m => `[${m.sender === 'bot' ? profile.name : '나'}] ${m.text}`).join('\n\n');
    const blob = new Blob([chatText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${profile.name}_가상토론내역.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    const query = inputValue.trim();
    const newUserMsg: Message = { id: Date.now().toString(), sender: 'user', text: query };
    
    // 이전 대화 기록 유지를 원한다면 여기서 배열 통째로 업데이트 전 저장
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsTyping(true);

    if (profile.apiKey) {
      // 실제 API 호출 모드
      try {
        const joinedSources = profile.sources.map(s => `[${s.type.toUpperCase()}] ${s.data}`).join('\n\n');
        let systemPrompt = '';
        if (profile.useAiKnowledge) {
          systemPrompt = `당신은 이름이 '${profile.name}'인 가상 정치인/후보자/대변인입니다. 
당신이 기존에 알고 있는 해당 인물의 인물 정보, 과거 이력, 발언, 정책 성향 등 웹 데이터를 총동원하여 완벽히 모방해 대답하세요. 
만약 추가로 제공된 공약/정책 데이터가 있다면 이를 최우선으로 반영하세요.
데이터에 없는 공격적인 질문에도 능청스럽게 방어하고 논리적으로 대답하세요. 강력한 어조로 확신에 차 있어야 합니다.

<추가된 데이터 (없을 수 있음)>
${joinedSources || '추가 데이터 없음'}
</추가된 데이터>`;
        } else {
          systemPrompt = `당신은 이름이 '${profile.name}'인 가상 정치인/후보자/대변인입니다. 
다음 제공된 공약 및 정책 정보를 완벽하게 숙지하고, 이에 기반하여 답변하세요.
데이터에 없는 내용이어도 능청스럽게 방어하거나 논리적으로 대답하세요.

<제공된 공약/정책 데이터>
${joinedSources}
</제공된 공약/정책 데이터>`;
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${profile.apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: query }] }]
          })
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error?.message || 'API 호출 실패');
        }

        const botText = data.candidates?.[0]?.content?.parts?.[0]?.text || "답변을 생성하지 못했습니다.";
        const newBotMsg: Message = { id: (Date.now() + 1).toString(), sender: 'bot', text: botText };
        setMessages(prev => [...prev, newBotMsg]);
      } catch (error: any) {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'bot', text: `[API 통신 오류] ${error.message}` }]);
      } finally {
        setIsTyping(false);
      }

    } else {
      // 더미 응답 로직 (API 키 없음)
      setTimeout(() => {
        let botResponse = '';
        const fallbacks = [
          `주신 질문에 대해 제가 학습한 총 ${profile.sources.length}건의 자료를 짚어보니 매우 흥미로운 관점입니다. 다각도로 고민하여 입체적인 결론을 도출해 내겠습니다!`,
          `그 질문은 제게도 뼈아픈 고민거리입니다. 하지만 공약 자료를 잘 살펴보시면 제가 줄기차게 주장해온 원칙을 발견하실 수 있을 겁니다!`,
          `하하, 예상치 못한 질문이네요! 제 정책적 입장(${profile.sources.map(s=>s.type).join(', ')})에 비추어 볼 때 긍정적으로 토론해볼 수 있는 주제입니다.`,
          `네, 그건 정말 중요한 지적이십니다. 제 데이터베이스를 재확인해보니, 저희 팀도 그 부분을 보완할 구체적 로드맵을 이미 짜고 있었습니다.`,
          `질문에 곧장 답을 드리자면, '원칙대로 간다'가 제 입장입니다. 상세한 내용은 제가 참고하고 있는 ${profile.sources.length}개의 데이터에 잘 나타나 있습니다.`,
          `매우 날카로운 질문입니다! 제 부족함을 채우기 위해 여러분의 목소리를 더 경청하겠습니다.`,
          `말씀하신 부분, 전적으로 동의합니다. 제가 그 문제를 풀 적임자임을 당당하게 밝히겠습니다!`
        ];

        const whereWhoWhens = [
          `저의 배경에 대해 물어보시는 거군요! 제 프로필과 기반 자료를 믿어주신다면 어디에 내놔도 부족함 없는 경쟁력이 있다고 자부합니다.`,
          `언제나, 어디서나 국민 곁에서 뛰겠다는 것이 제 변함없는 슬로건입니다!`,
        ];

        if (query.includes('공약') || query.includes('정책')) {
          botResponse = `제가 제시한 핵심 공약을 물어보셨군요. 제 공약 자료에 따르면, 국민의 실질적인 삶을 개선하기 위한 구체적인 로드맵을 지니고 있습니다. 만약 이 점이 부족해 보인다면, 더 나은 대안을 언제든 수용할 준비가 되어 있습니다!`;
        } else if (query.includes('논란') || query.includes('비판')) {
          botResponse = `그 부분에 대해서는 저도 뼈아프게 생각합니다. 하지만 사실과 다른 과장된 면도 분명 있습니다. 제가 걸어온 길을 공약 데이터로 살펴보시면, 일관되게 추진해온 가치를 확인하실 수 있을 겁니다.`;
        } else if (query.includes('바보') || query.includes('단점')) {
          botResponse = `하하, 그렇게 보실 수도 있겠네요! 기습적인 공격이지만 훌륭한 지적입니다. 저도 사람인지라 부족한 점이 많지만, 그 부족함을 채우기 위해 여러분의 목소리를 더 경청하겠습니다.`;
        } else if (query.includes('어디') || query.includes('누구') || query.includes('언제')) {
          botResponse = whereWhoWhens[Math.floor(Math.random() * whereWhoWhens.length)];
        } else {
          botResponse = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }

        const newBotMsg: Message = { id: (Date.now() + 1).toString(), sender: 'bot', text: botResponse };
        setMessages(prev => [...prev, newBotMsg]);
        setIsTyping(false);
      }, 1500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-container fade-in" style={{ position: 'relative' }}>
      
      {/* 텍스트 파일 다운로드 버튼 */}
      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 5 }}>
        <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)' }} onClick={handleDownloadChat}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          대화 내역 다운로드
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.sender}`}>
            {msg.sender === 'bot' && (
              <div className="avatar">
                {profile.name.charAt(0)}
              </div>
            )}
            <div className="bubble">
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="message bot">
            <div className="avatar">{profile.name.charAt(0)}</div>
            <div className="bubble" style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '38px' }}>
              <span style={{ width: '8px', height: '8px', background: 'var(--text-muted)', borderRadius: '50%', animation: 'fadeIn 1s infinite alternate' }}></span>
              <span style={{ width: '8px', height: '8px', background: 'var(--text-muted)', borderRadius: '50%', animation: 'fadeIn 1s infinite alternate 0.2s' }}></span>
              <span style={{ width: '8px', height: '8px', background: 'var(--text-muted)', borderRadius: '50%', animation: 'fadeIn 1s infinite alternate 0.4s' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <textarea 
          className="chat-input"
          placeholder={`${profile.name}에게 무엇이든 물어보세요 (Enter로 전송)`}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isTyping}
        />
        <button className="btn-send" onClick={() => handleSend()} disabled={!inputValue.trim() || isTyping}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatScreen;
