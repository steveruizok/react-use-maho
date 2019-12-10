import React from "react"
import { States } from "./States"
import { Label } from "./Label"
import { Events } from "./Events"
import { MachineContext } from "./index"
import { StateContainer, StateHeader } from "./styled"

export function State({ state, isInitial }) {
  const [machine] = React.useContext(MachineContext)
  const inPath = machine.path.includes(state)

  return (
    <StateContainer>
      <StateHeader inPath={inPath}>
        <b>
          {isInitial ? "⦿" : "○"} {state.name}
        </b>
        <Label>State</Label>
      </StateHeader>
      {state.on !== undefined && <Events inPath={inPath} handlers={state.on} />}{" "}
      {state.states !== undefined && (
        <States initial={state.initial} states={state.states} />
      )}
    </StateContainer>
  )
}
