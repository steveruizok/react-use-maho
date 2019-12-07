// @ts-check
import React from "react"
import { useMaho } from "react-use-maho"

const App = () => {
  const [state, send] = useMaho({
    data: {
      count: 0
    },
    on: {
      ADD: {
        do: data => data.count++
      },
      REMOVE: {
        do: data => data.count--
      }
    }
  })

  return (
    <div>
      <h2>Count: {state.data.count}</h2>
      <button onClick={() => send("ADD")}>Add Item</button>
      <button onClick={() => send("REMOVE")}>Remove Item</button>
    </div>
  )
}
export default App
