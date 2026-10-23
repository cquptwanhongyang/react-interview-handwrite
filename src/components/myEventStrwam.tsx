// 使用myUseSSE组件
// 传出url，maxCount入参给myUseSSE
// 拿到现在的状态，内容，在dom渲染完成后，实现打字机滚动
import { StreamEmitter } from './myUseSSE';
import { useRef, useEffect, type JSX } from 'react';

interface EventoptionsType {
  url: string
  maxCount: number
}


export function Dom(Eventoptions: EventoptionsType) {
  const { url, maxCount = 5 } = Eventoptions;
  const { status, content, close, toolCalls } = StreamEmitter({ url, maxCount })
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [content])

  return (<div>
    <div
    >
      {status}
    </div>
    {
      toolCalls && toolCalls?.length > 0 ? (
        <div>
          工具调用中。。。
        </div>
      ) : (
        <div ref={containerRef}>
          {content}
        </div>
      )
    }


    <div onClick={close}>
      断开连接
    </div>
  </div>)
}