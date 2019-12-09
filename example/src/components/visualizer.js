// @ts-check
import React from "react"

const MachineContext = React.createContext(null)

export function Visualizer({ machine }) {
  return (
    <MachineContext.Provider value={machine}>
      <div
        style={{
          border: "1px solid #000",
          borderBottom: "1px solid #777",
          borderRadius: 8,
          overflow: "hidden",
          width: "fit-content"
        }}
      >
        <div
          style={{
            padding: 8,
            backgroundColor: "#333",
            color: "#fff",
            borderBottom: "1px solid #777"
          }}
        >
          Machine
        </div>
        {machine.states !== undefined && (
          <div
            style={{
              borderBottom: "1px solid #000",
              position: "relative"
            }}
          >
            <Label>States</Label>
            <States initial={machine.initial} states={machine.states} />
          </div>
        )}
        {machine.on !== undefined && (
          <Events inPath={true} handlers={machine.on} />
        )}

        {machine.data !== undefined && (
          <div
            style={{
              backgroundColor: "#fcfcfc",
              padding: 8,
              borderBottom: "1px solid #000",
              position: "relative"
            }}
          >
            <Label>Data</Label>
            {Object.keys(machine.data).map((key, i) => (
              <div key={i}>
                <b>{key}</b>: {JSON.stringify(machine.data[key])}
              </div>
            ))}
          </div>
        )}
        {machine.computed !== undefined && (
          <div
            style={{
              backgroundColor: "#fcfcfc",
              padding: 8,
              position: "relative"
            }}
          >
            <Label>Computed</Label>
            {Object.keys(machine.computed).map((key, i) => (
              <div key={i}>
                <b>{key}</b>: {JSON.stringify(machine.computed[key])}
              </div>
            ))}
          </div>
        )}
      </div>
    </MachineContext.Provider>
  )
}

function Label({ children }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 11,
        right: 8,
        fontSize: 12
      }}
    >
      {children}
    </div>
  )
}

function States({ initial, states }) {
  return states.map((branch, i) => (
    <div
      key={i}
      style={{ padding: 8, display: "grid", gridAutoFlow: "row", gap: 8 }}
    >
      <StatesBranch initial={initial} branch={branch} />
    </div>
  ))
}

function StatesBranch({ initial, branch }) {
  return branch.map((state, i) => (
    <State key={i} state={state} isInitial={initial === state.name} />
  ))
}

function State({ state, isInitial }) {
  const machine = React.useContext(MachineContext)
  const inPath = machine.path.includes(state)

  return (
    <div
      style={{
        border: "1px solid #000",
        borderRadius: 8,
        overflow: "hidden",
        width: "fit-content",
        backgroundColor: inPath ? "#fffddf" : "#fff",
        boxShadow: "1px 1px 0px #333",
        position: "relative"
      }}
    >
      <Label>State</Label>
      <div
        style={{
          backgroundColor: inPath ? "#ffd84c" : "#eee",
          borderBottom: "1px solid #000",
          padding: 8,
          paddingRight: 60
        }}
      >
        ▪︎ {isInitial ? <b>{state.name}</b> : state.name}
      </div>
      {state.on !== undefined && <Events inPath={inPath} handlers={state.on} />}{" "}
      {state.states !== undefined && (
        <States initial={state.initial} states={state.states} />
      )}
    </div>
  )
}

function Events({ inPath, handlers }) {
  return (
    <div style={{ position: "relative" }}>
      <Label>Events</Label>
      {Object.keys(handlers).map((key, i) => (
        <EventHandlers
          key={i}
          name={key}
          inPath={inPath}
          handlers={handlers[key]}
        />
      ))}
    </div>
  )
}

function EventHandlers({ name, inPath, handlers }) {
  const machine = React.useContext(MachineContext)
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
    <div
      style={{ borderBottom: "2px dotted #ddd", padding: 12, paddingRight: 60 }}
    >
      <span
        style={{
          backgroundColor: inPath && canRun ? "#99dd66" : "#efefef",
          padding: "2px 8px 2px 8px",
          border: `1px solid ${canRun ? "#99dd66" : "#fff"}`,
          borderRadius: 6,
          fontSize: 16
        }}
      >
        {" "}
        {name}
      </span>
      {handlers.map((h, i) => (
        <EventHandler key={i} event={h} />
      ))}
    </div>
  )
}

function EventHandler({ event }) {
  const machine = React.useContext(MachineContext)
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
        color: handlerCanRun ? "#000" : "#777",
        fontSize: 14,
        paddingTop: 8
      }}
    >
      {string}
    </div>
  )
}
