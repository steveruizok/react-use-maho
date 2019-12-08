// @ts-check
import React from "react"

const MachineContext = React.createContext(null)

export function Visualizer({ machine }) {
  return (
    <MachineContext.Provider value={machine}>
      <div>
        <div style={{ border: "1px solid #000", padding: 16 }}>
          machine
          <ul>
            {machine.states !== undefined && (
              <States initial={machine.initial} states={machine.states} />
            )}
            {machine.on !== undefined && (
              <EventHandlers handlers={machine.on} />
            )}
          </ul>
        </div>
      </div>
    </MachineContext.Provider>
  )
}

function States({ initial, states }) {
  return (
    <li>
      States
      {states.map((branch, i) => (
        <StatesBranch key={i} initial={initial} branch={branch} />
      ))}
    </li>
  )
}

function StatesBranch({ initial, branch }) {
  return (
    <ul>
      {branch.map((state, i) => (
        <State key={i} state={state} isInitial={initial === state.name} />
      ))}
    </ul>
  )
}

function State({ state, isInitial }) {
  const machine = React.useContext(MachineContext)
  const inPath = machine.path.includes(state)
  return (
    <li>
      <span style={{ backgroundColor: inPath ? "#ffd84c" : "#fff" }}>
        {isInitial ? <b>{state.name}</b> : state.name}
      </span>
      <ul>
        {state.on !== undefined && <EventHandlers handlers={state.on} />}{" "}
        {state.states !== undefined && (
          <States initial={state.initial} states={state.states} />
        )}
      </ul>
    </li>
  )
}

function EventHandlers({ handlers }) {
  return (
    <li>
      Events
      <ul>
        {Object.keys(handlers).map((key, i) => (
          <EventHandler key={i} name={key} event={handlers[key]} />
        ))}
      </ul>
    </li>
  )
}

function EventHandler({ name, event }) {
  const machine = React.useContext(MachineContext)
  let conditions = []
  let actions = []
  let canRun = true

  // Conditions

  let { if: conds } = event
  if (conds !== undefined) {
    conds = Array.isArray(conds) ? conds : Array(conds)
    for (let cond of conds) {
      if (typeof cond === "string") {
        const c = machine.conditions[cond]
        if (!c(machine.data)) {
          canRun = false
        }
      } else {
        if (!cond(machine.data)) {
          canRun = false
        }
      }
      conditions.push(typeof cond === "string" ? cond : "{...}")
    }
  }

  const conditionsString =
    conditions.length > 0 ? "if ( " + conditions.join(", ") + " )" : undefined

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
    transition === undefined ? undefined : `to -> ${transition}`

  const strings = [transitionString, actionsString, conditionsString]
    .filter(v => v)
    .join(" ")

  return (
    <li>
      {canRun ? name : <s>{name}</s>}{" "}
      {strings.length > 0 ? " : " + strings : ""}
    </li>
  )
}
