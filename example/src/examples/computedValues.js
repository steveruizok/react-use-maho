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
        do: data => data.count++
      },
      DECREMENT: {
        do: data => data.count--
      }
    },
    compute: {
      halfCount: data => data.count / 2,
      lastModified: () => Date.now()
    }
  })

  console.log(state)

  return (
    <div>
      <h1>Loaded ok</h1>
      <h2>{state.data.count}</h2>
      <p>Half of the current count: {state.computed.halfCount}</p>
      <p>
        Last modified:{" "}
        {new Date(state.computed.lastModified).toLocaleString("en-gb")}
      </p>
      <button onClick={() => send("INCREMENT")}>Add Item</button>
      <button onClick={() => send("DECREMENT")}>Remove Item</button>
    </div>
  )
}
export default App
