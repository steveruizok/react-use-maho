import * as React from "react"
import { Draft } from "immer"
import { useImmer } from "use-immer"

/* -------------------------------------------------- */
/*                        Types                       */
/* -------------------------------------------------- */

/* --------------------- Events --------------------- */

// Condition
type Condition<D> = (
  data: Readonly<D | Draft<D>> | undefined,
  payload?: any
) => boolean

type SerializedConditions<D> = Record<string, Condition<D>>

// Action
type Action<D> = (data: Draft<D> | undefined, payload?: any) => any

type SerializedActions<D> = Record<string, Action<D>>

// Event
type Event<D, SC, SA> = {
  if?:
    | ((keyof SC & string) | Condition<D>)
    | ((keyof SC & string) | Condition<D>)[]
  do?: ((keyof SA & string) | Action<D>) | ((keyof SA & string) | Action<D>)[]
}

type Events<D, SC, SA> = Record<string, Event<D, SC, SA> | Event<D, SC, SA>[]>

/* ----------------- Computed Values ---------------- */

type ComputedValue<D> = (data: Readonly<D>) => any

type ComputedValues<D> = Record<string, ComputedValue<D>>

type ComputedReturns<D, C extends ComputedValues<D>> = {
  [key in keyof C]: ReturnType<C[key]>
}

/* --------------------- States --------------------- */

type State<D, SC, SA> = {
  name: string
  type: "leaf" | "parent" | "parallel"
  parent?: State<D, SC, SA>
  states?: State<D, SC, SA>[][]
  on?: Events<D, SC, SA>
}

type StateConfig<D, SC, SA> = {
  on?: Events<D, SC, SA>
  initial?: string
  states?: StateBranchConfig<D, SC, SA>
}

type StateBranchConfig<D, SC, SA> = Record<string, StateConfig<D, SC, SA>>

type StateTreeConfig<D, SC, SA> =
  | StateBranchConfig<D, SC, SA>
  | StateBranchConfig<D, SC, SA>[]

/* --------------------- Events -------------------- */

function getCondition() {}
function handleCondition() {}

function getAction() {}

// function handleAction<D, SC, SA>(action: Action<D, SC, SA>, data: D) {
//   action(data);
//   return data;
// }

function getTransition() {}
function handleTransition() {}

/**
 * @param name The name of the event to handle
 * @param current The current state
 */
function getEventHandler<D, SC, SA>(name: string, current: State<D, SC, SA>) {
  const { path } = getPath(current)
  for (let state of path) {
    if (state.on !== undefined) {
      if (state.on[name]) {
        return state.on[name]
      }
    }
  }

  console.log("Could not find an event in the current state path.")
  return
}

/* ---------------- Accessing States ---------------- */

/**
 * @param tree - A state tree
 * @param target - A target to find in the tree.
 */
function getStateDown<D, SC, SA>(
  tree: State<D, SC, SA>[][],
  target: string,
  path: State<D, SC, SA>[] = []
): State<D, SC, SA> | undefined {
  for (let branch of tree) {
    for (let state of branch) {
      if (state.name === target) {
        return state
      } else if (state.states) {
        const result = getStateDown(state.states, target, [...path, state])

        if (result !== undefined) {
          return result
        }
      }
    }
  }

  return
}

function getPath<D, SC, SA>(
  state: State<D, SC, SA>,
  path: State<D, SC, SA>[] = []
): { state: State<D, SC, SA>; path: State<D, SC, SA>[] } {
  if (state.parent === undefined) {
    return { state, path }
  }

  return getPath(state.parent, [...path, state])
}

function getStateUp<D, SC, SA>(
  state: State<D, SC, SA>,
  target: string
): State<D, SC, SA> | undefined {
  if (state.parent === undefined) {
    return
  }

  return state.name === target ? state : getStateUp(state.parent, target)
}

/**
 * @param tree A state tree.
 * @param name The path name to search, either a single state's name (e.g. "active") or a dot-separated path (e.g. "active.running.warm").
 */
function getStateByName<D, SC, SA>(
  tree: State<D, SC, SA>[][],
  name: string
): State<D, SC, SA> | undefined {
  let targets = name.includes(".") ? name.split(".") : [name]
  let first = targets.shift()

  if (first === undefined) {
    console.error("Failed to find first name from", name)
    return
  }

  let current = getStateDown(tree, first)
  if (current === undefined) {
    console.error("Could not find a state named", first)
    return
  }

  for (let name of targets) {
    if ((current as any).states === undefined) {
      console.error("Parent", (current as any).name, "has no states to search")
      return
    }

    let next: State<D, SC, SA> | undefined = getStateDown(
      (current as any).states,
      name
    )

    if (next === undefined) {
      console.error(
        "Could not find state",
        name,
        "in parent",
        (current as any).name
      )
      return
    }

    current = next
  }

  return current
}

/* ---------------- State Conversions --------------- */

function convertState<D, SC, SA>(
  name: string,
  state: StateConfig<D, SC, SA>,
  parent?: State<D, SC, SA>
): State<D, SC, SA> {
  let result: State<D, SC, SA> = {
    name,
    parent,
    type: "leaf",
    on: state.on
  }

  let s = state as any

  if (s.states !== undefined) {
    result.type = Array.isArray(s.states) ? "parallel" : "parent"
    result.states = convertStateTree((state as any).states, result)
  }

  return result
}

function convertStateBranch<D, SC, SA>(
  branch: StateBranchConfig<D, SC, SA>,
  parent?: State<D, SC, SA>
): State<D, SC, SA>[] {
  return Object.keys(branch).map(key => convertState(key, branch[key], parent))
}

function convertStateTree<D, SC, SA>(
  tree: StateTreeConfig<D, SC, SA>,
  parent?: State<D, SC, SA>
): State<D, SC, SA>[][] {
  if (!Array.isArray(tree)) tree = [tree]
  return tree.map(branch => convertStateBranch(branch, parent))
}
/* ---------------------- Reducer ---------------------- */

type Options<D, SC, SA, C> = {
  data?: D
  on?: Events<D, SC, SA>
  initial?: string
  states?: StateTreeConfig<D, SC, SA>
  actions?: SA
  conditions?: SC
  compute?: C
}

type MachineState<D, SC, SA, CR> = {
  data?: D
  on?: Events<D, SC, SA>
  current?: State<D, SC, SA>
  states?: State<D, SC, SA>[][]
  actions?: SA
  conditions?: SC
  computed?: CR
}

function init<D, SC, SA, C, CR>(
  options: Options<D, SC, SA, C>
): MachineState<D, SC, SA, CR> {
  const { data, on, actions, conditions, compute, states, initial } = options

  // Computed values (fuckin' typescript)
  let computed: CR | undefined = undefined
  let tree: State<D, SC, SA>[][] | undefined = undefined
  let current: State<D, SC, SA> | undefined = undefined

  if (states !== undefined) {
    tree = convertStateTree(states)
    if (initial !== undefined) {
      const state = getStateByName(tree, initial)
      if (state !== undefined) {
        current = state
      }
    }
  }

  if (compute !== undefined && data !== undefined) {
    computed = Object.entries(compute).reduce((acc, [key, value]) => {
      acc[key] = value({ ...data })
      return acc
    }, {} as CR)
  }

  return {
    data,
    on,
    actions,
    conditions,
    current,
    computed,
    states: tree
  }
}
/* -------------------------------------------------- */
/*                        Hook                        */
/* -------------------------------------------------- */

export function useMaho<
  D extends object,
  SA extends SerializedActions<D>,
  SC extends SerializedConditions<D>,
  C extends ComputedValues<Draft<D>>,
  CR = ComputedReturns<Draft<D>, C>
>(options: Options<D, SC, SA, C>) {
  type IState = State<D, SC, SA>
  type IEvent = Event<D, SC, SA>
  type ICondition = Condition<D>
  type IMachineState = MachineState<D, SC, SA, CR>
  type IEventsInPath = [string, IEvent | IEvent[]][]

  const [state, update] = useImmer<IMachineState>(init(options))

  // Helpers
  function getPath(
    state: IState,
    path: IState[] = []
  ): { state: IState; path: IState[] } {
    if (state.parent === undefined) {
      return { state, path }
    }

    return getPath(state.parent, [...path, state])
  }

  function getEventsInPath(state: IMachineState | Draft<IMachineState>) {
    const { current, on } = state

    let eventHandlers: IEventsInPath = []

    // If we have a current state, get the events from the path
    if (current !== undefined) {
      const { path } = getPath(current)

      eventHandlers = path.reduce<IEventsInPath>((acc, state) => {
        if (state.on !== undefined) {
          for (let key in state.on) {
            acc.push([key, state.on[key]])
          }
        }
        return acc
      }, [])
    }

    // If we have root-level event handlers, look there
    if (on !== undefined) {
      for (let key in on) {
        eventHandlers.push([key, on[key]])
      }
    }

    return eventHandlers
  }

  function isEventAvailable(
    state: IMachineState | Draft<IMachineState>,
    group: (IEvent | IEvent[])[],
    payload: any
  ) {
    return group.some(event => {
      const events = Array.isArray(event) ? event : Array(event)
      return events.some(event => {
        let conditions = event.if

        if (conditions === undefined) {
          return true
        }

        if (!Array.isArray(conditions)) {
          conditions = Array(conditions)
        }

        return conditions.every(condition => {
          let cond: ICondition | undefined = undefined

          if (typeof condition === "string") {
            if (state.conditions !== undefined) {
              cond = state.conditions[condition]
            } else {
              console.error("No serialized conditions!")
              return false
            }
          } else if (typeof condition === "function") {
            cond = condition
          }

          return cond === undefined ? true : cond(state.data, payload)
        })
      })
    })
  }

  function getAvailableEventsInPath(
    state: IMachineState | Draft<IMachineState>,
    events: IEventsInPath
  ) {
    return events.reduce<{ [key: string]: boolean }>((acc, [key, value]) => {
      const events = Array.isArray(value) ? value : Array(value)

      acc[key] = events.some(event => {
        let conditions = event.if

        if (conditions === undefined) {
          return true
        }

        if (!Array.isArray(conditions)) {
          conditions = Array(conditions)
        }

        return conditions.every(condition => {
          let cond: ICondition | undefined = undefined

          if (typeof condition === "string") {
            if (state.conditions !== undefined) {
              cond = state.conditions[condition]
            } else {
              console.error("No serialized conditions!")
              return false
            }
          } else if (typeof condition === "function") {
            cond = condition
          }

          return cond === undefined ? true : cond(state.data)
        })
      })

      return acc
    }, {})
  }

  const eventsInPath = React.useMemo(() => {
    return getEventsInPath(state)
  }, [state])

  const availableEventsInPath = React.useMemo(() => {
    return getAvailableEventsInPath(state, eventsInPath)
  }, [state, eventsInPath])

  const can = React.useCallback(
    function can(name: string, payload?: any) {
      const eventInPath = eventsInPath
        .filter(([key]) => key === name)
        .map(([key, value]) => value)

      if (!eventInPath) {
        return false
      }

      return isEventAvailable(state, eventInPath, payload)
    },
    [eventsInPath]
  )

  const send = React.useCallback(
    function send(event: string, payload?: any) {
      update(draft => {
        let { compute } = options
        let { current, data, on, actions, conditions } = draft

        /* ---------------- Get Event Handler(s) --------------- */

        // Event handlers ( multiple [x], collectedInPath [x])
        let eventHandlers: Event<D, SC, SA>[] = []

        // Get event handler from current state path
        if (current !== undefined) {
          const { path } = getPath(current)

          eventHandlers = path.reduce<Event<D, SC, SA>[]>((acc, state) => {
            if (state.on !== undefined) {
              const handler = state.on[event]
              pushContents(handler, acc)
            }
            return acc
          }, [])
        }

        // If we have root-level event handlers, look there
        if (on !== undefined) {
          const rootHandler = on[event]
          pushContents(rootHandler, eventHandlers)
        }

        // If we didn't find any events, bail
        if (eventHandlers.length === 0) {
          return
        }

        /* ------------- Evaluate Event Handler ------------- */

        for (let eventHandler of eventHandlers) {
          // Condition (multiple [x], serialized [x])
          if (eventHandler.if !== undefined) {
            let eventConditions = Array.isArray(eventHandler.if)
              ? eventHandler.if
              : [eventHandler.if]

            for (let pCond of eventConditions) {
              let cond =
                typeof pCond === "string" && conditions !== undefined
                  ? conditions[pCond]
                  : (pCond as Condition<D>)

              if (!cond(data ? { ...data } : undefined, payload)) {
                return
              }
            }
          }

          // Action (multiple [x], serialized [x])
          if (eventHandler.do !== undefined) {
            let eventActions = Array.isArray(eventHandler.do)
              ? eventHandler.do
              : [eventHandler.do]

            for (let pAction of eventActions) {
              let action =
                typeof pAction === "string" && actions !== undefined
                  ? actions[pAction]
                  : (pAction as Action<D>)

              action(data, payload)
            }
          }
        }

        // Auto events (onEnter [], onExit [], onChange [])

        // Transition (multiple [ ], serialized [ ])

        // Computed Values
        if (compute !== undefined && data !== undefined) {
          for (let key in draft.computed) {
            draft.computed[key] = compute[key](data)
          }
        }

        // Invoked Promises
      })
    },
    [update]
  )

  return [state, send, { can }] as const
}

/* -------------------------------------------------- */
/*                       Helpers                      */
/* -------------------------------------------------- */

const pushContents = <D>(source: D | D[] | undefined, target: D[]) => {
  if (source === undefined) {
    return
  }

  if (Array.isArray(source)) {
    target.push(...source)
  } else {
    target.push(source)
  }
}
