import React from "react"
import { EventHandlers } from "./EventHandlers"
import { Label } from "./Label"

export function Events({ inPath, handlers }) {
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
