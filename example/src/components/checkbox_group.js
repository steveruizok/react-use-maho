// @ts-check
import React from "react"
import { useMaho } from "react-use-maho"
import { CheckboxDumb } from "./checkbox_dumb"

export function CheckboxGroup({
  checked = ["red"],
  options = ["red", "blue", "green"]
}) {
  const [state, send] = useMaho({
    data: {
      checked: options.reduce((acc, option) => {
        acc[option] = checked.includes(option)
        return acc
      }, {})
    },
    on: {
      CHECK: {
        do: "checkOption"
      }
    },
    actions: {
      checkOption: (data, { option, isChecked }) =>
        (data.checked[option] = isChecked)
    }
  })

  return (
    <div>
      {options.map((option, i) => (
        <div key={i}>
          <CheckboxDumb
            checked={state.data.checked[option]}
            onCheck={isChecked => send("CHECK", { option, isChecked })}
          />
          {option}
        </div>
      ))}
    </div>
  )
}
