import { useRef, useEffect, useState } from 'react';
import { UseStreamChat } from './components/useStreamChat';

interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;  // 流式返回时可能是片段，拼完再 JSON.parse
  };
}
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
}

export function ChatPage() {
  const { status, content, toolCalls, error, stop, sendMessage } = UseStreamChat({
    url: '/api/chat',
    maxTimeMs: 30000,
  });

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  // 每次消息变化自动滚到底部
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, content, toolCalls]);

  const handleSend = () => {
    const prompt = input.trim();
    if (!prompt || status === 'loading') return;

    const userMsg: Message = {
      id: String(++idRef.current),
      role: 'user',
      content: prompt,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // 先占一个空的 assistant 消息，后面用 content / toolCalls 填充
    setMessages(prev => [
      ...prev,
      { id: String(++idRef.current), role: 'assistant', content: '' },
    ]);

    sendMessage(prompt);
  };

  const isLoading = status === 'loading';

  return (
    <div className="chat-page">
      {/* 消息列表 */}
      <div ref={listRef} className="message-list">
        {messages.map((msg, idx) => {
          const isLastAssistant =
            msg.role === 'assistant' && idx === messages.length - 1;

          const displayContent = isLastAssistant ? content : msg.content;
          const displayToolCalls =
            isLastAssistant && toolCalls.length > 0 ? toolCalls : msg.toolCalls;

          return (
            <div key={msg.id} className={`message ${msg.role}`}>
              {msg.role === 'user' ? (
                <div className="bubble user">{msg.content}</div>
              ) : (
                <div className="bubble assistant">
                  {displayContent && <div className="text">{displayContent}</div>}

                  {displayToolCalls?.map((tc, i) => (
                    <div key={tc.id || i} className="tool-call">
                      🔧 {tc.function.name}
                      {tc.function.arguments && (
                        <pre>{tc.function.arguments}</pre>
                      )}
                    </div>
                  ))}

                  {isLastAssistant && status === 'loading' && !displayContent && (
                    <span className="typing">正在生成…</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 异常提示 */}
      {error && (
        <div className="error-banner">
          {error}
          {status === 'error' && (
            <button onClick={() => sendMessage(input)}>重试</button>
          )}
        </div>
      )}

      {/* 输入区 */}
      <div className="input-bar">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={isLoading}
          placeholder={isLoading ? '正在生成中…' : '输入消息'}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        {isLoading ? (
          <button className="stop-btn" onClick={stop}>
            停止
          </button>
        ) : (
          <button
            className="send-btn"
            disabled={!input.trim() || isLoading}
            onClick={handleSend}
          >
            发送
          </button>
        )}
      </div>
    </div>
  );
}