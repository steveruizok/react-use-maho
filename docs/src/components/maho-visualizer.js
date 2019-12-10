//@
import React from "react"
import { Visualizer } from "./Visualizer"
import { useMaho } from "react-use-maho"

const defaultMachine = {
  data: {
    count: 0,
    min: 0,
    max: 10
  },
  initial: "inactive",
  states: {
    inactive: {
      on: {
        TURN_ON: {
          to: "active"
        }
      }
    },
    active: {
      on: {
        TURN_OFF: {
          to: "inactive"
        },
        ADD: {
          do: "increment",
          if: "belowMax"
        },
        SUBTRACT: {
          do: "decrement",
          if: "aboveMin"
        }
      }
    }
  },
  actions: {
    increment: data => data.count++,
    decrement: data => data.count--
  },
  conditions: {
    belowMax: data => data.count < data.max,
    aboveMin: data => data.count > data.min
  }
}

function MahoVisualizer({ machine = defaultMachine }) {
  const [state, send] = useMaho(machine)

  return (
    <div>
      <Visualizer machine={state} send={send} />
    </div>
  )
}

export default MahoVisualizer
