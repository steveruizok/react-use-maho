// @ts-check
import React from "react"
import { useMaho } from "react-use-maho"

const ItemCounter = ({ min = 0, max = 10 }) => {
  const [count, setCount] = React.useState(min)

  function handleIncrement() {
    if (count < max) {
      setCount(count + 1)
    }
  }

  function handleDecrement() {
    if (count > min) {
      setCount(count - 1)
    }
  }

  function handleAdjustCount(value) {
    const next = value + count
    if (next >= min && next <= max) {
      setCount(next)
    }
  }

  function handleSetCount(value) {
    if (value >= min && value <= max) {
      setCount(value)
    }
  }

  function handleClearCount() {
    if (count > min) {
      setCount(min)
    }
  }

  return (
    <div>
      <h2>Count: {count}</h2>
      <button onClick={handleIncrement}>Add Item</button>
      <button onClick={handleDecrement}>Remove Item</button>
      <button onClick={() => handleAdjustCount(5)}>Add 5 Items</button>
      <button onClick={() => handleSetCount(max)}>Add Max</button>
      <button onClick={handleClearCount}>Clear</button>
    </div>
  )
}

export default ItemCounter
