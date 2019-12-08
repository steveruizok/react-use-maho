import React from "react"
import { Checkbox } from "./components/checkbox"
import { CheckboxGroup } from "./components/checkbox_group"
import { RadioGroup } from "./components/radio_group"

export function Inputs() {
  return (
    <div>
      <h1>Components</h1>
      <h2>Checkbox</h2>
      <div>
        <Checkbox /> Label
      </div>
      <div>
        <Checkbox checked /> Label
      </div>
      <h2>Checkbox Group</h2>
      <CheckboxGroup
        checked={["sun", "stars"]}
        options={["sun", "moon", "stars"]}
      />
      <Checkbox checked />
      <h2>Radio Group</h2>
      <RadioGroup />
      <hr />
    </div>
  )
}
