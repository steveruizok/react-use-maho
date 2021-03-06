// @ts-check
import React from "react"

const ItemCounter = ({ min = 0, max = 10 }) => {
  const [count, dispatch] = React.useReducer((state, action) => {
    switch (action.type) {
      case "ADD": {
        if (state < max) {
          return state + 1
        }
        break
      }
      case "REMOVE": {
        if (state > min) {
          return state - 1
        }
        break
      }
      case "ADJUST": {
        const next = action.value + state
        if (next >= min && next <= max) {
          return next
        }
        break
      }
      case "SET": {
        const { value } = action
        if (value >= min && value <= max) {
          return value
        }
        break
      }
      case "CLEAR": {
        if (state > min) {
          return min
        }
        break
      }
    }

    return state
  }, min)

  return (
    <div>
      <h2>Count: {count}</h2>
      <button onClick={() => dispatch({ type: "ADD" })}>Add Item</button>
      <button onClick={() => dispatch({ type: "REMOVE" })}>Remove Item</button>
      <button onClick={() => dispatch({ type: "ADJUST", value: 5 })}>
        Add 5 Items
      </button>
      <button onClick={() => dispatch({ type: "SET", value: max })}>
        Add Max
      </button>
      <button onClick={() => dispatch({ type: "CLEAR" })}>Clear</button>
    </div>
  )
}

export default ItemCounter
