import { useAppDispatch, useAppSelector } from './hooks';
import { increment, decrement, reset } from './counterSlice';

// 组件一：负责读取状态
function CountDisplay() {
  const count = useAppSelector(
    (state) => state.counter.value
  );

  return <h2>当前计数：{count}</h2>;
}

// 组件二：负责修改状态
function CounterActions() {
  const dispatch = useAppDispatch();

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <button onClick={() => dispatch(decrement())}>
        -1
      </button>

      <button onClick={() => dispatch(increment())}>
        +1
      </button>

      <button onClick={() => dispatch(reset())}>
        重置
      </button>
    </div>
  );
}

// 页面组件
export default function CounterPage() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Redux Toolkit 计数器</h1>

      <CountDisplay />

      <CounterActions />
    </div>
  );
}