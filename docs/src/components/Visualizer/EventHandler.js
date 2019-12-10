import React from "react"
import { MachineContext } from "./index"

export function EventHandler({ event }) {
  const [machine] = React.useContext(MachineContext)
  let conditions = []
  let actions = []
  let handlerCanRun = true

  let string = ""

  // Conditions

  let { if: conds } = event
  if (conds !== undefined) {
    conds = Array.isArray(conds) ? conds : Array(conds)
    for (let cond of conds) {
      if (typeof cond === "string") {
        console.log(machine.conditions[cond])
        const c = machine.conditions[cond]
        if (!c(machine.data)) {
          handlerCanRun = false
        }
      } else {
        if (!cond(machine.data)) {
          handlerCanRun = false
        }
      }
      conditions.push(typeof cond === "string" ? cond : "{...}")
    }
  }

  // Actions

  let { do: acts } = event
  if (acts !== undefined) {
    acts = Array.isArray(acts) ? acts : Array(acts)
    for (let act of acts) {
      actions.push(typeof act === "string" ? act : "{...}")
    }
  }

  const actionsString =
    actions.length > 0 ? "do ( " + actions.join(", ") + " )" : undefined

  // Transitions
  let { to: transition } = event

  const transitionString =
    transition === undefined ? undefined : `to → ${transition}`

  string = [transitionString, actionsString].filter(v => v).join(", ")

  // Delays

  let { wait: delay } = event

  if (conditions.length > 0) {
    string = `if ( ${conditions.join(", ")} ) { ${string} }`
  }

  if (delay !== undefined) {
    string = `wait ( ${delay} ) { ${string} }`
  }

  string = "▸ " + string

  return (
    <div
      style={{
        color: handlerCanRun ? "#fff" : "#aaa",
        fontSize: 14,
        paddingTop: 8
      }}
    >
      {string}
    </div>
  )
}
