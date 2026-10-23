/**
 * 手写题演练场：把 src/handwrite 下实现好的函数接进来跑一遍。
 *
 * 目前接入：debounce（用输入框搜索的场景演示）
 */
import { useEffect, useMemo, useRef, useState } from 'react'

import { debounce } from '../handwrite'

import './HandwritePlayground.css'

const WAIT = 500

interface RunLog {
  id: number
  time: string
  text: string
}

function HandwritePlayground() {
  const [keyword, setKeyword] = useState('')
  const [leading, setLeading] = useState(false)
  const [trailing, setTrailing] = useState(true)
  const [triggerCount, setTriggerCount] = useState(0)
  const [runCount, setRunCount] = useState(0)
  const [logs, setLogs] = useState<RunLog[]>([])

  const logId = useRef(0)
  const triggerCountRef = useRef(0)

  // search 模拟「真正发出去的请求」：只有它执行了，runCount 才会涨
  const search = useMemo(
    () =>
      debounce(
        (value: string) => {
          setRunCount((count) => count + 1)
          setLogs((prev) =>
            [
              {
                id: (logId.current += 1),
                time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                text: value === '' ? '（空字符串）' : value,
              },
              ...prev,
            ].slice(0, 6),
          )
          return value
        },
        WAIT,
        { leading, trailing },
      ),
    [leading, trailing],
  )

  // 组件卸载或配置变化时，丢掉上一轮还没执行的调用
  useEffect(() => () => search.cancel(), [search])

  function handleInput(value: string) {
    setKeyword(value)
    triggerCountRef.current += 1
    setTriggerCount(triggerCountRef.current)
    search(value)
  }

  function handleCancel() {
    search.cancel()
    triggerCountRef.current = 0
    setTriggerCount(0)
    setRunCount(0)
    setLogs([])
  }

  return (
    <section className="playground">
      <h1>手写题演练场</h1>

      <article className="playground__card">
        <h2>debounce 防抖</h2>
        <p className="playground__tip">
          每敲一个字符都会调用一次 <code>search()</code>，但只有停止输入 {WAIT}ms
          后才会真正执行。对比下面的「触发次数」和「执行次数」就能看出效果；
          两个开关对应 <code>leading</code> / <code>trailing</code> 选项。
        </p>

        <input
          className="playground__input"
          value={keyword}
          placeholder="随便输点什么，比如 react"
          onChange={(event) => handleInput(event.target.value)}
        />

        <div className="playground__options">
          <label>
            <input
              type="checkbox"
              checked={leading}
              onChange={(event) => setLeading(event.target.checked)}
            />
            leading（首次立即执行，即 immediate）
          </label>
          <label>
            <input
              type="checkbox"
              checked={trailing}
              onChange={(event) => setTrailing(event.target.checked)}
            />
            trailing（停止后补执行最后一次）
          </label>
        </div>

        <div className="playground__actions">
          <button
            type="button"
            onClick={() => {
              search.flush()
            }}
          >
            flush（立刻执行挂起的调用）
          </button>
          <button type="button" onClick={handleCancel}>
            cancel（取消并清空）
          </button>
        </div>

        <dl className="playground__stats">
          <div>
            <dt>触发次数</dt>
            <dd>{triggerCount}</dd>
          </div>
          <div>
            <dt>执行次数</dt>
            <dd>{runCount}</dd>
          </div>
        </dl>

        <ol className="playground__log">
          {logs.length === 0 && <li className="playground__empty">还没有执行记录</li>}
          {logs.map((log) => (
            <li key={log.id}>
              <span className="playground__time">{log.time}</span>
              <span>search("{log.text}")</span>
            </li>
          ))}
        </ol>
      </article>
    </section>
  )
}

export default HandwritePlayground
