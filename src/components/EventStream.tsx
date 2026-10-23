import { useEffect, useRef } from 'react';
import { useSSE } from './useSSE';

type ContentType = 'connecting' | 'connected' | 'open' | 'close' | 'error';

const contentLabel: Record<ContentType, string> = {
  connecting: '连接中',
  connected: '已连接',
  open: '数据传输中',
  close: '已关闭',
  error: '未知错误',
};

export function EventStream() {
  const { state, content, close } = useSSE({
    url: '/api',
    maxReconnect: 5,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // 内容变化时自动滚动到底部
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [content]);

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
        {contentLabel[state]}
      </div>

      <div
        ref={containerRef}
        style={{
          maxHeight: '400px',
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
          border: '1px solid #ddd',
          padding: '12px',
          borderRadius: '4px',
        }}
      >
        {content || '等待数据...'}
      </div>

      <button onClick={close} style={{ marginTop: '8px' }}>
        关闭连接
      </button>
    </div>
  );
}