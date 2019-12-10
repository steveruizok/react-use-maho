// @ts-check
import React from "react"
import { Label } from "./Label"
import { States } from "./States"
import { Events } from "./Events"
import { MachineContainer, MachineHeader } from "./styled"

export const MachineContext = React.createContext(null)

export function Visualizer({ machine, send }) {
  return (
    <MachineContext.Provider value={[machine, send]}>
      <MachineContainer>
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
              padding: 8,
              borderTop: "1px solid #000",
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
      </MachineContainer>
    </MachineContext.Provider>
  )
}
