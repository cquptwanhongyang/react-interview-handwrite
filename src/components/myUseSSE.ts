// 接收后端接口，暴露后端传输到客户端的数据，暴露关闭连接函数close，暴露连接状态
// 状态和内容，变化了就需要重新渲染
// 连接回调和关闭回调如果变化了，不需要重新渲染页面，使用ref，跨render来读取
// EventSource实例跨render读取，onopen连接上,onmessage传输了数据，onerror连接出现问题,自定义事件用监听事件

import { useState, useEffect, useCallback, useRef } from 'react';

type Status = 'connecting' | 'open' | 'connected' | 'close' | 'error'

interface UseSSEOptions {
  url: string;
  onOpen?: () => void;
  onClose?: (e: Event) => void;
  maxCount?: number;
  customEvents?: Record<string, (data: string) => void>;
}

interface ToolCall {
  id: string;
  name: string;
  arguments: string;
}

type ToolCalls = Map<string, ToolCall>

interface UseSSEReturn {
  status: Status;
  content: string;
  close: () => void;
  isConnecting: boolean;
  toolCalls: ToolCall[] | null;
}



// 课时5实践题
// tool_call 存在的时候，保存增量参数，连接结束的时候，统一包装返回
// 新增变量，副作用函数，返回值


export function StreamEmitter(options: UseSSEOptions): UseSSEReturn {
  const [status, setStatus] = useState<Status>('connecting')
  const [content, setContent] = useState<string>('')
  // 保存tool_call工具
  const [toolCalls, setToolCalls] = useState<ToolCall[] | null>(null)


  const { url, onOpen, onClose, maxCount = 5, customEvents } = options;

  const sourceRef = useRef<EventSource | null>(null);
  const curReconnectCount = useRef(0);
  const isConnectRef = useRef(true);
  // 用ref保存增量arguments，防止闭包
  const toolCallRef = useRef<ToolCalls>(new Map());

  // 使用ref，这样在connect函数中，不需要去讲onOpen等回调函数作为依赖项
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  const customEventsRef = useRef(customEvents);

  useEffect(() => {
    onOpenRef.current = onOpen;
    onCloseRef.current = onClose;
    customEventsRef.current = customEvents;
  }, [onOpen, onClose, customEvents])

  const connect = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.close();
    }
    isConnectRef.current = true;
    curReconnectCount.current = 0;
    setContent('')
    setStatus('connecting')
    setToolCalls(null)

    const source = new EventSource(url);
    sourceRef.current = source;

    curReconnectCount.current = 0;
    isConnectRef.current = true;

    // 删除掉旧的sse，重连后就是新的
    source.onopen = () => {
      console.log('连接成功了！')
      if (isConnectRef.current) setStatus('open')
      onOpenRef.current?.()
    }

    // 接收到的消息，保存下来 onmessage
    source.onmessage = (e: MessageEvent) => {
      if (typeof e.data !== 'string') {
        return
      }
      if (!e.data.trim()) {
        return
      }
      // [DONE]的时候，关闭连接，不去拼接content
      // 其它情况用delta.content拼接content
      if (e.data.trim() === '[DONE]') {
        isConnectRef.current = false;
        source.close();

        const vals = Array.from(toolCallRef.current.values())?.map((item) => {
          try {
            const parsed = JSON.parse(item.arguments);
            return {
              ...item,
              arguments: JSON.stringify(parsed, null, 2)
            }
          } catch {
            return item
          }
        }) ?? null;

        setToolCalls(vals)
        return
      }

      try {
        // 如果存在tool_calls_属性，则走入调用工具
        const delta = JSON.parse(e.data)?.choices[0].delta
        const tools = delta?.tool_calls
        if (tools && Array.isArray(tools) && tools.length > 0) {
          setStatus(pre => pre === 'connected' ? pre : 'connected');

          for (const tool of tools) {
            let current = toolCallRef.current.get(tool.id)
            if (current) {
              current.arguments += tool.arguments;
            } else {
              current = {
                id: tool?.id ?? '',
                name: tool?.name ?? '',
                arguments: tool?.arguments ?? ''
              }
              toolCallRef.current.set(tool?.id, current);
            }
          }
          setToolCalls(Array.from(toolCallRef.current.values()))

          // 文本和工具 互斥
          return
        }

        // 文本增量
        const content = JSON.parse(e.data)?.choices[0].delta?.content
        if (content) {
          setStatus(pre => pre === 'connected' ? pre : 'connected');
          setContent(pre => pre + content);
        }
      } catch (e: unknown) {
        console.warn(e)
      }

      console.log('传输数据中。。。')
    }

    // 发生断链 onerror
    source.onerror = (e: Event) => {
      // 重连加1
      curReconnectCount.current += 1;
      if (source.readyState === EventSource.CLOSED) {
        if (isConnectRef.current) setStatus('error')
        isConnectRef.current = false;
      } else if (curReconnectCount.current > maxCount) {
        source.close();  // [改] 停掉 SSE 自动重连
        if (isConnectRef.current) setStatus('error')
        isConnectRef.current = false
      }

      onCloseRef.current?.(e);
    }

    // 服务端自定义事件 eventCallbacks
    const events = customEventsRef.current;
    if (events) {
      Object.entries(events).forEach(([eventname, handle]) => {
        source.addEventListener(eventname, (e: MessageEvent) => {
          if (typeof e.data === 'string') {
            handle(e.data)
          }
        })
      })
    }
  }, [url, maxCount])

  // 关闭连接 onclose
  const close = useCallback(() => {
    isConnectRef.current = false;
    setStatus('close')
    if (sourceRef.current) {
      sourceRef.current.close();
      sourceRef.current = null;
    }
  }, [])

  useEffect(() => {
    connect();

    return () => {
      // 组件卸载，要将sse关闭
      isConnectRef.current = false;
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }
    }
  }, [connect])

  return {
    // 状态，内容，关闭函数
    status,
    content,
    close,
    isConnecting: status === 'connecting',
    toolCalls,
  }
}