// @ts-check
import React from "react"
import { useMaho } from "react-use-maho"
import { Visualizer } from "../../docs/src/components/Visualizer"

const ItemCounter = ({ min = 0, max = 10 }) => {
  const [state, send, { isIn, can }] = useMaho({
    data: {
      count: min
    },
    initial: "inactive",
    states: {
      inactive: {
        on: {
          TURN_ON: [
            {
              to: "loading"
            }
          ]
        }
      },
      loading: {
        onEnter: {
          to: "active",
          wait: 0.5
        }
      },
      active: {
        initial: "ok",
        states: {
          ok: {
            initial: "red",
            states: {
              red: {},
              green: {}
            },
            on: {
              GET_SICK: {
                to: "notOk"
              }
            }
          },
          notOk: {
            on: {
              GET_WELL: {
                to: "ok"
              }
            }
          }
        },
        on: {
          TURN_OFF: {
            to: "inactive"
          },
          ADD_ITEM: {
            do: "increment",
            if: "belowMax"
          },
          REMOVE_ITEM: {
            do: "decrement",
            if: "aboveMin"
          },
          ADD_ITEMS: {
            do: "adjustCount",
            if: "resultIsInRange"
          },
          SET_ITEMS: {
            do: "setCountToValue",
            if: ["valueIsInRange", "valueIsNotCurrent"]
          },
          CLEAR_ITEMS: {
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
      setCountToValue: (data, value = 10) => (data.count = value),
      adjustCount: (data, delta = 5) => (data.count += delta),
      setCountToMin: data => (data.count = min)
    },
    conditions: {
      aboveMin: data => data.count > min,
      belowMax: data => data.count < max,
      valueIsInRange: (_, value = 10) => value >= min && value <= max,
      resultIsInRange: (data, delta = 5) => {
        const result = data.count + delta
        return result >= min && result <= max
      },
      valueIsNotCurrent: (data, value = 10) => data.count !== value
    },
    computed: {
      lastModified: () => new Date()
    }
  })

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gridAutoFlow: "column",
        gap: 32
      }}
    >
      <div>
        <h1 style={{ width: "fit-content" }}>Visualizer</h1>
        <Visualizer machine={state} send={send} />
      </div>
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
            <button
              disabled={!can("ADD_ITEM")}
              onClick={() => send("ADD_ITEM")}
            >
              Add Item
            </button>
            <button
              disabled={!can("REMOVE_ITEM")}
              onClick={() => send("REMOVE_ITEM")}
            >
              Remove Item
            </button>
            <button
              disabled={!can("ADD_ITEMS", 5)}
              onClick={() => send("ADD_ITEMS", 5)}
            >
              Add 5 Items
            </button>
            <button
              disabled={!can("SET_ITEMS", max)}
              onClick={() => send("SET_ITEMS", max)}
            >
              Add Max
            </button>
            <button
              disabled={!can("CLEAR_ITEMS")}
              onClick={() => send("CLEAR_ITEMS")}
            >
              Clear
            </button>{" "}
          </>
        )}
      </div>
    </div>
  )
}

export default ItemCounter
