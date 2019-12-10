import React from "react"
import { State } from "./State"

export function StatesBranch({ initial, branch }) {
  return branch.map((state, i) => (
    <State key={i} state={state} isInitial={initial === state.name} />
  ))
}
