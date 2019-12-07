// @ts-check
import React from "react"
import { useMaho } from "react-use-maho"

const App = () => {
  const [state, send] = useMaho({
    data: {
      count: 0
    },
    on: {
      INCREMENT: {
        do: "increment"
      },
      DECREMENT: {
        do: "decrement"
      }
    },
    actions: {
      increment: data => data.count++,
      decrement: data => data.count--
    }
  })

  console.log(state)

  return (
    <div>
      <h2>Count: {state.data.count}</h2>
      <button onClick={() => send("INCREMENT")}>Increment</button>
      <button onClick={() => send("DECREMENT")}>Decrement</button>
    </div>
  )
}
export default App
