// @ts-check
import React from "react"
import { useMaho } from "react-use-maho"
let i = 0

export function Checkbox({ checked = false, onCheck = isChecked => {} }) {
  const [state, send, { isIn }] = useMaho({
    initial: checked ? "checked" : "unchecked",
    states: {
      checked: {
        onEnter: {
          do: "shareChecked"
        },
        on: {
          CLICK: {
            to: "unchecked"
          }
        }
      },
      unchecked: {
        onEnter: {
          do: "shareUnchecked"
        },
        on: {
          CLICK: {
            to: "checked"
          }
        }
      },
      indeterminate: {
        on: {
          CLICK: {
            to: "unchecked"
          }
        }
      }
    },
    on: {
      SET: [
        {
          to: "checked",
          if: "checking"
        },
        {
          to: "unchecked",
          if: "unchecking"
        }
      ]
    },
    actions: {
      shareChecked: () => onCheck(true),
      shareUnchecked: () => onCheck(false)
    },
    conditions: {
      checking: (_, isChecked) => isChecked,
      unchecking: (_, isChecked) => !isChecked
    }
  })

  React.useEffect(() => {
    send("SET", checked)
  }, [checked])

  return (
    <span onClick={() => send("CLICK")} style={{ userSelect: "none" }}>
      {isIn("checked") ? "[x]" : isIn("indeterminate") ? "[-]" : "[ ]"}
    </span>
  )
}
