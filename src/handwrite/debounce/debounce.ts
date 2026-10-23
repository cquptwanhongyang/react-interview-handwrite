/**
 * 手写题：防抖 debounce。
 *
 * 原理一句话：每次触发都把定时器往后推，只有「最后一次触发后静默 wait 毫秒」
 * 才真正执行 fn，所以连续高频触发最终只会执行一次。
 *
 * 面试里的几个追问点，都在下面的实现里对应处理了：
 * 1. 基础防抖 + 保留 this 与参数 —— 用闭包先把这一次调用包起来，定时器里再执行。
 * 2. leading（也就是很多教程里的 immediate）—— 首次触发立刻执行一次。
 * 3. cancel 取消 —— 把定时器 id 和挂起调用都清掉。
 * 4. 返回值 —— 异步执行拿不到「本次」返回值，所以缓存最近一次结果并额外提供 flush。
 *
 * 与节流的区别：节流保证「每隔一段时间必执行一次」（限制频率上限），
 * 防抖保证「停下来之后才执行」（等待静默期）。
 */

/** debounce 的可选配置。 */
export interface DebounceOptions {
  /**
   * 首次触发时是否立即执行一次，等价于很多教程里的 immediate，默认 false。
   * 与 trailing 同时开启时是「先执行一次 + 停止后再补一次」。
   */
  leading?: boolean
  /**
   * 停止触发后是否补执行最后一次，默认 true。
   * 设为 false 就是纯 leading 模式：只执行首次，等待期间的其他触发全部丢弃。
   */
  trailing?: boolean
}

/** debounce 包装后的函数：可以直接调用，另外挂载了 cancel / flush / pending。 */
export interface DebouncedFunction<Args extends unknown[], R> {
  (this: unknown, ...args: Args): R | undefined
  /** 取消等待中的调用，并清空缓存的返回值 */
  cancel(): void
  /** 有等待中的调用就立刻执行，并返回最后一次执行结果 */
  flush(): R | undefined
  /** 是否存在等待执行的调用 */
  pending(): boolean
}

/**
 * 防抖：连续触发时只在最后一次停下后的 wait 毫秒执行 fn。
 *
 * @param fn    需要防抖的函数
 * @param wait  静默等待时间，默认 300ms
 * @param options leading / trailing 配置
 * @returns     带 cancel / flush / pending 的防抖函数
 */
export function debounce<Args extends unknown[], R>(
  fn: (this: unknown, ...args: Args) => R,
  wait = 300,
  options: DebounceOptions = {},
): DebouncedFunction<Args, R> {
  const leading = options.leading ?? false
  const trailing = options.trailing ?? true

  let timer: ReturnType<typeof setTimeout> | null = null
  /**
   * 等待期间「最后一次调用」的快照。
   * 这里存闭包而不是存参数数组，好处是 this 和参数一起被捕获，
   * 也避免调用方之后修改参数影响本次执行。
   */
  let pendingCall: (() => void) | null = null
  /** 最近一次 fn 的返回值，debounced 的返回值就来自这里 */
  let result: R | undefined

  function clearTimer() {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  function runPendingCall() {
    if (pendingCall === null) return result
    const call = pendingCall
    pendingCall = null
    call()
    return result
  }

  /** 一轮等待结束：按 trailing 决定是补执行最后一次，还是直接丢弃 */
  function finishRound() {
    if (trailing) {
      runPendingCall()
    } else {
      pendingCall = null
    }
  }

  function startTimer() {
    clearTimer()
    timer = setTimeout(() => {
      timer = null
      finishRound()
    }, wait)
  }

  /**
   * 把「这一次调用」连同 this 一起包成闭包。
   * 直接在 debounced 里写 const thisArg = this 会触发 no-this-alias，
   * 用参数把 this 传进来更干净，效果一样。
   */
  function captureCall(thisArg: unknown, args: Args): () => void {
    return () => {
      result = fn.apply(thisArg, args)
    }
  }

  function debounced(this: unknown, ...args: Args): R | undefined {
    // timer 为空说明上一轮已经结束，这次调用开启新一轮
    const isNewRound = timer === null

    pendingCall = captureCall(this, args)

    if (isNewRound && leading) {
      // 立即执行，并顺手清掉它的「末次调用」身份，
      // 否则 wait 结束后 trailing 会把同一次调用重复执行一遍
      runPendingCall()
    }

    startTimer()
    return result
  }

  debounced.cancel = () => {
    clearTimer()
    pendingCall = null
    result = undefined
  }

  debounced.flush = () => {
    if (timer === null) return result
    clearTimer()
    finishRound()
    return result
  }

  debounced.pending = () => timer !== null

  return debounced
}

export default debounce
