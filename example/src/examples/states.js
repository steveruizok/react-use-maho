import React from "react"
import { useMaho } from "react-use-maho"

const ItemCounter = ({ min = 0, max = 10 }) => {
  const [state, send, { can, isIn }] = useMaho({
    data: {
      count: min
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
          REMOVE: {
            do: "decrement",
            if: "aboveMin"
          },
          ADJUST: {
            do: "adjustCount",
            if: "resultIsInRange"
          },
          SET: {
            do: "setCountToValue",
            if: "valueIsInRange"
          },
          CLEAR: {
            do: "setCountToMin",
            if: "aboveMin"
          }
        }
      }
    },
    actions: {
      increment: data => data.count++,
      decrement: data => data.count--,
      setCountToValue: (data, value) => (data.count = value),
      adjustCount: (data, delta) => (data.count += delta),
      setCountToMin: data => (data.count = min)
    },
    conditions: {
      aboveMin: data => data.count > min,
      belowMax: data => data.count < max,
      valueIsInRange: (_, value) => value >= min && value <= max,
      resultIsInRange: (data, delta) => {
        const result = data.count + delta
        return result >= min && result <= max
      }
    },
    computed: {
      lastModified: () => new Date()
    }
  })

  return (
    <div>
      <h2>Current State: {state.current.name}</h2>
      <h2>Count: {state.data.count}</h2>
      <h4>Last Modified: {state.computed.lastModified.toLocaleTimeString()}</h4>
      <button disabled={!can("TURN_ON")} onClick={() => send("TURN_ON")}>
        Turn on
      </button>
      <button disabled={!can("TURN_OFF")} onClick={() => send("TURN_OFF")}>
        Turn off
      </button>
      <hr />
      {isIn("active") && (
        <>
          <button disabled={!can("ADD")} onClick={() => send("ADD")}>
            Add Item
          </button>
          <button disabled={!can("REMOVE")} onClick={() => send("REMOVE")}>
            Remove Item
          </button>
          <button
            disabled={!can("ADJUST", 5)}
            onClick={() => send("ADJUST", 5)}
          >
            Add 5 Items
          </button>
          <button disabled={!can("SET", max)} onClick={() => send("SET", max)}>
            Add Max
          </button>
          <button disabled={!can("CLEAR")} onClick={() => send("CLEAR")}>
            Clear
          </button>{" "}
        </>
      )}
    </div>
  )
}

export default ItemCounter
