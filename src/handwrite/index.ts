/**
 * 手写题统一出口。
 *
 * 已实现：
 * - debounce：防抖，支持 leading / trailing / cancel / flush / pending
 *
 * TODO: 其余题目实现完成后按同样方式导出，例如：
 *   export { default as MyPromise } from './promise/MyPromise'
 *   export { default as EventEmitter } from './pubsub/EventEmitter'
 *   export { throttle } from './throttle/throttle'
 */
export { debounce, debounce as default } from './debounce/debounce'
export type { DebouncedFunction, DebounceOptions } from './debounce/debounce'
