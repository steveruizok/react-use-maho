export const counterActions = {
  data: {
    count: 0
  },
  on: {
    ADD_ITEM: {
      do: data => data.count++
    },
    REMOVE_ITEM: {
      do: data => data.count++
    },
    RESET_ITEMS: {
      do: (data, payload) => (data.count = payload)
    }
  }
};

export const counterConditions = {
  data: {
    count: 0
  },
  on: {
    ADD_ITEM: {
      if: data => data.count < 10,
      do: data => data.count++
    },
    REMOVE_ITEM: {
      if: data => data.count > 0,
      do: data => data.count++
    },
    RESET_ITEMS: {
      do: (data, payload) => (data.count = payload)
    }
  }
};

export const serializedActions = {
  data: {
    count: 0
  },
  on: {
    ADD_ITEM: {
      do: "incrementCount"
    },
    REMOVE_ITEM: {
      do: "decrementCount"
    },
    RESET_ITEMS: {
      do: "setCount"
    }
  },
  actions: {
    incrementCount: data => data.count++,
    decrementCount: data => data.count++,
    setCount: (data, payload) => (data.count = payload)
  }
};

export const serializedConditions = {
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
      do: "setCount"
    }
  },
  conditions: {
    underMax: data => data.count < 10,
    overMin: data => data.count > 0
  },
  actions: {
    incrementCount: data => data.count++,
    decrementCount: data => data.count--,
    setCount: (data, payload) => (data.count = payload)
  }
};
