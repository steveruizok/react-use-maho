// @ts-check
import React from "react";
import { useMaho } from "react-use-maho";

const App = () => {
  const [state, send] = useMaho({
    data: {
      count: 0
    },
    on: {
      ADD_ITEM: {
        if: "underMax",
        do: "incrementCount"
      },
      REMOVE_ITEM: {
        if: "overMin",
        do: "decrementCount"
      },
      RESET_ITEMS: {
        do: "setCount",
        if: "inRange"
      }
    },
    conditions: {
      underMax: data => data.count < 10,
      overMin: data => data.count > 0,
      inRange: (_, payload) => payload > 0 && payload < 10
    },
    actions: {
      incrementCount: data => data.count++,
      decrementCount: data => data.count--,
      setCount: (data, payload) => (data.count = payload)
    }
  });

  console.log(state);

  return (
    <div>
      <h1>Loaded ok</h1>
      <h2>{state.data.count}</h2>
      <button onClick={() => send("ADD_ITEM")}>Add Item</button>
      <button onClick={() => send("REMOVE_ITEM")}>Remove Item</button>
      <button onClick={() => send("RESET_ITEMS", 0)}>Reset</button>
    </div>
  );
};
export default App;
