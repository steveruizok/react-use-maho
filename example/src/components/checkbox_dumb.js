// @ts-check
import React from "react"
import { useMaho } from "react-use-maho"

export function CheckboxDumb({ checked = false, onCheck = isChecked => {} }) {
  return (
    <span onClick={() => onCheck(!checked)}>{checked ? "[x]" : "[ ]"}</span>
  )
}
