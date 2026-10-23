import { createSlice } from '@reduxjs/toolkit';

interface CounterState {
  value: number;
}

const initialState: CounterState = {
  value: 0,
};

const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1;
    },

    decrement: (state) => {
      state.value -= 1;
    },

    reset: (state) => {
      state.value = 0;
    },
  },
});

// 导出自动生成的 Action Creator
export const { increment, decrement, reset } =
  counterSlice.actions;

// 导出 Reducer
export default counterSlice.reducer;