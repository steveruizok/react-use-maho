import React from "react"
import { EventHandler } from "./EventHandler"
import { MachineContext } from "./index"

export function EventHandlers({ name, inPath, handlers }) {
  const [machine, send] = React.useContext(MachineContext)
  if (!Array.isArray(handlers)) handlers = Array(handlers)

  let canRun = handlers.every(handler => {
    let { if: conds } = handler
    if (conds !== undefined) {
      conds = Array.isArray(conds) ? conds : Array(conds)
      return conds.every(cond => {
        if (typeof cond === "string") {
          return machine.conditions[cond](machine.data)
        } else {
          return cond(machine.data)
        }
      })
    } else {
      return true
    }
  })

  return (
    <div style={{ padding: 12, paddingRight: 60 }}>
      <button
        onClick={() => inPath && send(name)}
        style={{
          color: "#fff",
          backgroundColor: inPath && canRun ? "#3e7eff" : "#48484a",
          padding: "4px 12px 4px 12px",
          borderRadius: 32,
          border: "none",
          cursor: "pointer",
          outline: "none"
        }}
      >
        {name}
      </button>
      {handlers.map((h, i) => (
        <EventHandler key={i} event={h} />
      ))}
    </div>
  )
}
