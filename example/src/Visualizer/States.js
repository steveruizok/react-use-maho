import React from "react"
import { StatesBranch } from "./StatesBranch"

export function States({ initial, states }) {
  return states.map((branch, i) => (
    <div
      key={i}
      style={{ padding: 8, display: "grid", gridAutoFlow: "row", gap: 8 }}
    >
      <StatesBranch initial={initial} branch={branch} />
    </div>
  ))
}
