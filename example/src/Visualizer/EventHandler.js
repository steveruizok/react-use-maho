import React from "react"
import { MachineContext } from "./index"
import { uniqueId } from "lodash-es"
import { Code } from "./Code"

export function EventHandler({ event }) {
  const [machine] = React.useContext(MachineContext)

  let { if: conds, do: acts, wait: delay, to: transition } = event
  const parts = []

  let handlerCanRun = true

  const collection = {
    if: [],
    do: []
  }

  // Conditions

  if (conds !== undefined) {
    conds = Array.isArray(conds) ? conds : Array(conds)
    let c
    for (let cond of conds) {
      let condCanPass = true
      if (typeof cond === "string") {
        c = machine.conditions[cond]
        if (!c(machine.data)) {
          condCanPass = false
          handlerCanRun = false
        }
      } else {
        c = cond
        if (!cond(machine.data)) {
          condCanPass = false
          handlerCanRun = false
        }
      }
      const str = typeof cond === "string" ? cond : "{...}"
      collection.if.push(
        <span
          key={uniqueId()}
          style={{
            border: "1px solid #333",
            padding: "2px 8px 3px 8px",
            borderRadius: 12,
            color: condCanPass ? "#fff" : "#ccc",
            position: "relative",
            top: 1
          }}
          onClick={() => console.log(c)}
        >
          {str}
        </span>
      )
    }
  }

  // Actions

  if (acts !== undefined) {
    let a
    acts = Array.isArray(acts) ? acts : Array(acts)
    for (let act of acts) {
      if (typeof act === "string") {
        a = machine.actions[act]
      } else {
        a = act
      }
      const str = typeof act === "string" ? act : "{...}"
      collection.do.push(
        <div
          key={uniqueId()}
          style={{
            display: "inline-block",
            border: "1px solid #333",
            padding: "2px 8px 3px 8px",
            borderRadius: 12,
            position: "relative",
            top: 1
          }}
          onClick={() => console.log(a)}
        >
          {str}
        </div>
      )
    }
  }

  // Lego time

  if (collection.do.length > 0) {
    parts.push("do ( ", ...collection.do, " ) ")
  }

  if (transition) {
    parts.push(
      <div
        key={uniqueId()}
        style={{
          display: "inline-block",
          border: "1px solid #333",
          padding: "2px 8px 3px 8px",
          borderRadius: 12
        }}
      >
        to → {transition}
      </div>,
      " "
    )
  }

  if (collection.if.length > 0) {
    parts.unshift("if ( ", ...collection.if, " ) { ")
    parts.push("} ")
  }

  if (delay !== undefined) {
    parts.unshift(`wait ( ${delay} ) { `)
    parts.push("}")
  }

  parts.unshift("▸ ")

  return (
    <div
      style={{
        color: handlerCanRun ? "#fff" : "#aaa",
        fontSize: 14,
        paddingTop: 8
      }}
    >
      <div>{parts}</div>
    </div>
  )
}
