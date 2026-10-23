// 我要干什么：
// 前端如何接收和渲染服务端的流式数据（SSE/Stream），封装fetch的ReadableStream读取逻辑，
// 解决请求竞态问题（防止旧请求覆盖新请求）
// 手动中断，自动中断功能

import { useState, useCallback, useEffect, useRef } from 'react'
// 
interface UseStreamChatOptions {
  url: string;
  body?: any;
  maxTimeMs?: number
}

type chatStatusType = 'idle' | 'loading' | 'success' | 'error' | 'aborted' // 有限状态机设计

interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;  // 流式返回时可能是片段，拼完再 JSON.parse
  };
}

interface UseStreamChatReturn {
  status: chatStatusType
  content: string
  error: string | null
  toolCalls: ToolCall[];
  stop: () => void
  sendMessage: (promt: string) => void
}


export function UseStreamChat({ url, body, maxTimeMs = 3000 }: UseStreamChatOptions): UseStreamChatReturn {
  const [status, setStatus] = useState<chatStatusType>('idle');
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null)
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null)

  // timerRef请求超时，自动断开连接
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  const abortReasonRef = useRef<'user' | 'timer' | null>(null)
  // 状态锁
  const isLoadingRef = useRef<boolean>(false)

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortReasonRef.current = 'user'
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null;
      }
      abortControllerRef.current.abort();
      // 先abort再解锁，先干掉就请求，再解锁，允许新请求进来
      isLoadingRef.current = false;
    }
  }, [])

  const getErrorText = (status: number, message: string) => {
    if (status === 401) {
      return '登录已过期或鉴权失败，请重新登录';
    }

    if (status === 403) {
      return '没有权限执行此操作';
    }

    if (status === 429) {
      return '请求过于频繁，请稍后再试';
    }

    const lower = message.toLowerCase();
    if (
      lower.includes('context_length_exceeded') ||
      lower.includes('context length exceeded') ||
      lower.includes('token limit') ||
      lower.includes('maximum context length') ||
      lower.includes('prompt is too long') ||
      lower.includes('token 超长') ||
      lower.includes('上下文超长')
    ) {
      return '输入内容过长，请缩短后重试';
    }

    if (status >= 500) {
      return '服务暂时不可用，请稍后重试';
    }

    return message || '请求发生错误，请稍后重试';
  };

  const sendMessage = useCallback(
    async (prompt: string) => {

      // 上锁状态，不开门，不允许发起心情求
      if (isLoadingRef.current) {
        return
      }

      // 上锁
      isLoadingRef.current = true;

      // 发送消息前，检查上一个请求是否还在继续，如果还在，先中断
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      // 创建新的控制器AbortController实例
      const controller = new AbortController();
      abortControllerRef.current = controller;

      timerRef.current = setTimeout(() => {
        abortReasonRef.current = 'timer'
        abortControllerRef.current?.abort()
      }, maxTimeMs)

      // 重置数据
      setStatus('loading')
      setContent('')
      setError(null)
      setToolCalls([]);

      try {
        // 发起请求
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, prompt }),
          signal: controller.signal,
        })

        if (!response.ok) {
          let message = '';

          try {
            const result = await response.json();

            message =
              result?.error?.message ??
              result?.message ??
              result?.error ??
              '';

            if (typeof message !== 'string') {
              message = JSON.stringify(message);
            }
          } catch {
            // 错误响应体不是合法 JSON 时，继续使用状态码判断
          }

          throw new Error(
            getErrorText(response.status, message)
          );
        }
        if (!response.body) throw new Error('ReadableStream not supported');

        // 拿到数据
        const reader = response.body.getReader();
        // 解码器实例
        const decoder = new TextDecoder();
        // 保存数据
        let buffer = '';
        // 
        let isDone = false;

        // 对lines是否处理完毕，完毕后跳出while循环
        while (true) {
          const { value, done } = await reader.read();
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';


          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                setStatus('success')
                isDone = true
                break
              } else {
                try {
                  // const pared = JSON.parse(data)
                  // setContent(pre => pre + pared)
                  try {
                    const json = JSON.parse(data);

                    if (json.tool_calls && Array.isArray(json.tool_calls)) {
                      // 工具调用分支
                      setToolCalls(prev => [...prev, ...json.tool_calls]);
                    } else if (json.content) {
                      // 普通文本分支
                      setContent(prev => prev + json.content);
                    } else {
                      // 兜底：无法识别的结构，当普通文本追加
                      setContent(prev => prev + data);
                    }
                  } catch {
                    // 不是 JSON，直接当普通文本（兼容纯文本 SSE）
                    setContent(prev => prev + data);
                  }
                } catch (e: unknown) {
                  console.warn('跳过无法解析的 JSON 数据：', data, e);
                  continue;
                }
              }
            }


          }

          if (isDone) break;

        }

      } catch (err: any) {
        // 5. catch 捕获错误，区分 AbortError 和普通网络错误
        if (err.name === 'AbortError') {
          if (abortReasonRef.current === 'timer') {
            setStatus('error');
            setError('请求超时')
          } else {
            setStatus('aborted');

          }
          // 用户主动停止，通常不需要显示错误信息，或者显示“已停止”
        } else {
          setStatus('error');
          setError(err.message || '请求发生错误');
        }
      } finally {
        isLoadingRef.current = false;
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null;
        }

        // 请求结束或中断后，清理 ref
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }

      }


    }, [url, body]
  )

  // 组件卸载，关闭流式数据接收的实例
  // 4. useEffect 清理函数，组件卸载执行 abort
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    status,
    content,
    error,
    stop,
    sendMessage,
    toolCalls,
  }
}
