// @ts-check
import React from "react"
import { useMaho } from "react-use-maho"
import { Checkbox } from "./checkbox"

export function RadioGroup({
  selected = "red",
  options = ["red", "blue", "green"],
  onValueChange = checked => {}
}) {
  const [state, send] = useMaho({
    data: {
      selected: selected
    },
    onEvent: { do: "shareSelected" },
    on: {
      CHECK: {
        do: "setSelected",
        if: "selectingOption"
      }
    },
    actions: {
      shareSelected: data => onValueChange(data.selected),
      setSelected: (data, { option }) => (data.selected = option)
    },
    conditions: {
      selectingOption: (data, payload) => payload && payload.isChecked
    }
  })

  return (
    <div>
      {options.map((option, i) => (
        <div key={i}>
          <Checkbox
            checked={state.data.selected === option}
            onCheck={isChecked => send("CHECK", { option, isChecked })}
          />
          {option}
        </div>
      ))}
    </div>
  )
}
