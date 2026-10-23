import { useState, useEffect, useRef } from 'react'

export function AutoCounter() {
  const [count, setCount] = useState<number>(0);
  const [step, setStep] = useState<number>(1);

  const stepRef = useRef<number>(1);

  useEffect(() => {
    stepRef.current = step
  }, [step])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCount(prev => prev + stepRef.current)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <>
      {count}
      <button onClick={() => {
        setStep(5)
        stepRef.current = 5
      }}>
        增加5
      </button>
    </>
  )
}