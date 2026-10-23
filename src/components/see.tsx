import { useState, useEffect, useRef } from 'react'

type contentType = 'connecting' | 'connected' | 'open' | 'close' | 'error'

/*
* SSE 流式文本展示组件

*通过 EventSource 来流式接收服务端的delta，
*实现打字机效果
**/

export function EventStream() {
  const [state, setState] = useState<contentType>('connecting');
  const [content, setContent] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const event = new EventSource('/api');
    let closed = false;
    let connectCount = 0;
    const MAX_RECONNECT = 5;

    event.onopen = () => {
      // 服务端已经链接成功
      console.log("服务端已经链接成功");
      if (!closed) setState('connected')
    }

    event.onmessage = (e: MessageEvent) => {
      if (typeof e.data !== 'string') return;

      if (!e.data.trim()) return;
      const delta: string = e.data
      // 避免每次发消息都更新状态
      if (!closed && state !== 'open') setState('open')
      // 服务端传送数据
      setContent((pre) => {
        const newContent = pre + delta;
        console.log("服务器新传的值：", newContent)
        return newContent
      })
    }

    event.onerror = (e: Event) => {
      connectCount++;
      if (connectCount > MAX_RECONNECT) {
        event.close();
      }
      if (closed) setState('error')
      if (event.readyState === EventSource.CONNECTING) {
        console.log('正在重连中。。。')
      } else if (event.readyState === EventSource.CLOSED) {
        console.log("连接已经断开")
      } else {
        console.log("未知错误", e)
      }
    }

    event.addEventListener('process', (e: MessageEvent) => {
      if (typeof e.data === 'string') {
        setContent(pre => pre + e.data)
      }
    })

    return () => {
      closed = true;
      // 组件销毁，sse结束
      event.close();
    }


  }, [])

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content])

  const contentLabel: Record<contentType, string> = {
    'connecting': '连接中',
    'connected': '已连接',
    'open': '数据传输中',
    'close': '已关闭',
    'error': '未知错误'
  }

  return (
    <div
      ref={contentRef}
    >
      {contentLabel[state]}
      {content}
    </div>
  )
}