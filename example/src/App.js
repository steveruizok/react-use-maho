// @ts-check
import React from "react"
import { useMaho } from "react-use-maho"
import { Visualizer } from "./Visualizer"

const ItemCounter = ({ checked = true }) => {
  const [state, send, { isIn, can }] = useMaho({
    data: {
      disabled: false
    },
    initial: checked ? "checked" : "notChecked",
    states: {
      checked: {
        on: {
          TOGGLE: {
            to: "notChecked.deepB",
            if: "isntDisabled"
          }
        }
      },
      notChecked: {
        on: {
          TOGGLE: {
            to: "checked",
            if: "isntDisabled"
          }
        },
        initial: "deepA",
        states: {
          deepA: {},
          deepB: {}
        }
      }
    },
    on: {
      SET_DISABLED: {
        do: "setDisabled"
      },
      SET_CHECKED: [
        {
          to: "checked",
          if: "isChecked"
        },
        {
          to: "unchecked",
          if: "isChecked"
        }
      ]
    },
    actions: {
      setDisabled: (data, isDisabled) => (data.disabled = isDisabled)
    },
    conditions: {
      isntDisabled: data => !data.disabled,
      isChecked: (_, isChecked) => isChecked
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
        <input
          type="checkbox"
          checked={isIn("checked")}
          onChange={() => send("TOGGLE")}
          style={{
            marginTop: 32,
            transform: "scale(4)"
          }}
        />
      </div>
    </div>
  )
}

export default ItemCounter
