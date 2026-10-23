import { useState, useEffect, useRef, useCallback } from 'react';

type ContentType = 'connecting' | 'connected' | 'open' | 'close' | 'error';

interface UseSSEOptions {
  url: string;
  maxReconnect?: number;
  customEvents?: Record<string, (data: string) => void>;
  onOpen?: () => void;
  onError?: (error: Event) => void;
}

interface UseSSEReturn {
  state: ContentType;
  content: string;
  close: () => void;
  isConnecting: boolean;
}

export function useSSE(options: UseSSEOptions): UseSSEReturn {
  const { url, maxReconnect = 5, customEvents, onOpen, onError } = options;

  const [state, setState] = useState<ContentType>('connecting');
  const [content, setContent] = useState('');

  const eventRef = useRef<EventSource | null>(null);
  // 增加最大重连次数配置 reconnectCountRef
  const reconnectCountRef = useRef(0);
  const closedRef = useRef(false);

  // 【修复】用 ref 保存回调，避免 connect 依赖 state 导致无限重建
  const onOpenRef = useRef(onOpen);
  const onErrorRef = useRef(onError);
  const customEventsRef = useRef(customEvents);

  // 保持 ref 同步
  useEffect(() => {
    onOpenRef.current = onOpen;
    onErrorRef.current = onError;
    customEventsRef.current = customEvents;
  }, [onOpen, onError, customEvents]);

  const connect = useCallback(() => {
    if (eventRef.current) {
      eventRef.current.close();
    }

    closedRef.current = false;
    const event = new EventSource(url);
    eventRef.current = event;

    event.onopen = () => {
      // 连接成功时重置重连计数器
      reconnectCountRef.current = 0;
      if (!closedRef.current) setState('connected');
      onOpenRef.current?.(); // 【修复】从 ref 取最新回调
    };

    // 当data:[DONE]  停止接收数据，关闭连接
    // 用try catch包裹取数据存数据，将之前的存保存文本改为先json转化为文本，从choices[0].delta.content这里拿
    // 当delta.data没有数据时，就不保存，跳过
    // 

    event.onmessage = (e: MessageEvent) => {

      if (typeof e.data !== 'string') return;
      if (!e.data.trim()) return;
      if (e.data.trim() === '[DONE]') {
        // 先设置标志位为true，因为event.close();会触发onerror，在onerror里会用到标志位。而 标志位必须是最新的状态
        closedRef.current = true;

        event.close();
        setState('close')
        return
      }

      try {
        const json = JSON.parse(e.data)
        const data = json.choices[0].delta.content
        if (data) {
          setContent((pre) => pre + data);
        } else {
          return
        }
      } catch (e: unknown) {
        console.warn('解析出错', e)
      }

      if (!closedRef.current) {
        setState((prev) => (prev !== 'open' ? 'open' : prev)); // 【修复】用函数式更新，不依赖外部 state
      }
    };

    event.onerror = (e) => {
      reconnectCountRef.current += 1;
      // 区分临时网络抖动和永久关闭两种场景
      // 场景1： 永久关闭
      if (event.readyState === EventSource.CLOSED) {
        if (!closedRef.current) setState('error');
      }

      // 场景2：临时网络抖动
      // 断连时累加计数，达到上限调用 close，停止重连
      if (reconnectCountRef.current >= maxReconnect) {
        event.close();
        if (!closedRef.current) setState('error');
      }

      onErrorRef.current?.(e); // 【修复】从 ref 取最新回调
    };

    // 监听自定义事件
    const currentCustomEvents = customEventsRef.current;
    if (currentCustomEvents) {
      Object.entries(currentCustomEvents).forEach(([eventName, handler]) => {
        event.addEventListener(eventName, (e: MessageEvent) => {
          if (typeof e.data === 'string') {
            handler(e.data);
          }
        });
      });
    }
  }, [url, maxReconnect]); // 【修复】不再依赖 state / onOpen / onError / customEvents

  // 【修复】依赖空数组，只挂载一次
  useEffect(() => {
    connect();

    return () => {
      closedRef.current = true;
      if (eventRef.current) {
        eventRef.current.close();
        eventRef.current = null;
      }
    };

  }, []);

  const close = useCallback(() => {
    closedRef.current = true;
    if (eventRef.current) {
      eventRef.current.close();
      eventRef.current = null;
    }
    setState('close');
  }, []);

  return {
    state,
    content,
    close,
    isConnecting: state === 'connecting',
  };
}