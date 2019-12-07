import React from "react"
import { useMaho } from "react-use-maho"

const App = () => {
  const [state, send] = useMaho({
    data: {
      count: 0
    },
    on: {
      ADJUST_COUNT: {
        if: "resultIsInRange",
        do: "adjustCount"
      },
      RESET_ITEMS: {
        do: "setCount",
        if: "isInRange"
      }
    },
    conditions: {
      isInRange: (_, value) => !(value < 0 || value > 10),
      resultIsInRange: (data, change) => {
        const next = data.count + change
        return !(next < 0 || next > 10)
      }
    },
    actions: {
      adjustCount: (data, change) => (data.count += change),
      setCount: (data, change) => (data.count = change)
    },
    compute: {
      halfCount: data => data.count / 2
    }
  })

  console.log(state)

  return (
    <div>
      <h1>Loaded ok</h1>
      <h2>{state.data.count}</h2>
      <p>Half of the current count: {state.computed.halfCount}</p>
      <button onClick={() => send("ADJUST_COUNT", 2)}>Add Double</button>
      <button onClick={() => send("ADJUST_COUNT", 1)}>Add Item</button>
      <button onClick={() => send("ADJUST_COUNT", -1)}>Remove Item</button>
      <button onClick={() => send("RESET_ITEMS", 0)}>Reset</button>
    </div>
  )
}

export default App
