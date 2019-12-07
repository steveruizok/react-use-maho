// @ts-check
import React from "react"
import { useMaho } from "react-use-maho"

const App = () => {
  const [state, send] = useMaho({
    data: {
      count: 0
    }
  })

  console.log(state)

  return (
    <div>
      <h1>Count: {state.data.count}</h1>
    </div>
  )
}

export default App
