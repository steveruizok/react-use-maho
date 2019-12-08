// @ts-check
import React from "react"
import { useMaho } from "react-use-maho"
import { Visualizer } from "./components/visualizer"
import { Checkbox } from "./components/checkbox"
import { CheckboxGroup } from "./components/checkbox_group"
import { RadioGroup } from "./components/radio_group"

const ItemCounter = ({ min = 0, max = 10 }) => {
  const [state, send, { isIn, can }] = useMaho({
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
        initial: "ok",
        states: {
          ok: {},
          notOkay: {}
        },
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
    on: {
      RESET: {
        do: "setCountToMin"
      }
    },
    actions: {
      increment: data => data.count++,
      decrement: data => data.count--,
      setCountToValue: (data, value = 0) => (data.count = value),
      adjustCount: (data, delta = 5) => (data.count += delta),
      setCountToMin: data => (data.count = min)
    },
    conditions: {
      aboveMin: data => data.count > min,
      belowMax: data => data.count < max,
      valueIsInRange: (_, value = 0) => value >= min && value <= max,
      resultIsInRange: (data, delta = 5) => {
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
      {/*<h1>Components</h1>
      <h2>Checkbox</h2>
      <div>
        <Checkbox /> Label
      </div>
      <div>
        <Checkbox checked /> Label
      </div>
      <h2>Checkbox Group</h2>
      <CheckboxGroup
        checked={["sun", "stars"]}
        options={["sun", "moon", "stars"]}
      />
      <Checkbox checked />
      <h2>Radio Group</h2>
      <RadioGroup />
      <hr />
      */}
      <h1>Visualizer</h1>
      <Visualizer machine={state} />
      <hr />
      <div>
        <h2>Current State: {state.current.name}</h2>
        <h2>Count: {state.data.count}</h2>
        <h4>
          Last Modified: {state.computed.lastModified.toLocaleTimeString()}
        </h4>
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
            <button
              disabled={!can("SET", max)}
              onClick={() => send("SET", max)}
            >
              Add Max
            </button>
            <button disabled={!can("CLEAR")} onClick={() => send("CLEAR")}>
              Clear
            </button>{" "}
          </>
        )}
      </div>
    </div>
  )
}

export default ItemCounter
