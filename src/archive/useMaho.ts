import * as React from "react"
import { Maho, MahoOptions, IData } from "./Maho"

export function useMaho<D extends IData>(
  options: MahoOptions<D>,
  debug = false
) {
  const maho = React.useMemo(
    () =>
      new Maho<D>(
        {
          ...options,
          onChange: () => {
            dispatch({ type: "UPDATE", payload: maho })
          }
        },
        debug
      ),
    []
  )

  const [state, dispatch] = React.useReducer(
    (current, action) => {
      switch (action.type) {
        case "UPDATE": {
          return {
            send: maho.send,
            current: maho.current,
            data: maho.data,
            computed: maho.computed,
            isIn: maho.isIn,
            can: maho.can
          }
        }
        default: {
          return current
        }
      }
    },
    {
      send: maho.send,
      current: maho.current,
      data: maho.data,
      computed: maho.computed,
      isIn: maho.isIn,
      can: maho.can
    }
  )

  return state
}
