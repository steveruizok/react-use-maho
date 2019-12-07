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

// Transition

type Transition = string | Draft<string>

// AutoEvent
type AutoEvent<D, SC, SA> = {
  if?:
    | ((keyof SC & string) | Condition<D>)
    | ((keyof SC & string) | Condition<D>)[]
  do?: ((keyof SA & string) | Action<D>) | ((keyof SA & string) | Action<D>)[]
}

// Event
type Event<D, SC, SA> = {
  if?:
    | ((keyof SC & string) | Condition<D>)
    | ((keyof SC & string) | Condition<D>)[]
  do?: ((keyof SA & string) | Action<D>) | ((keyof SA & string) | Action<D>)[]
  to?: Transition
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
  initial?: string
  states?: State<D, SC, SA>[][]
  on?: Events<D, SC, SA>
  onEvent?: Event<D, SC, SA>
  onEnter?: AutoEvent<D, SC, SA>
  onExit?: AutoEvent<D, SC, SA>
}

type StateConfig<D, SC, SA> = {
  on?: Events<D, SC, SA>
  initial?: string
  states?: StateBranchConfig<D, SC, SA>
  onEvent?: Event<D, SC, SA>
  onEnter?: AutoEvent<D, SC, SA>
  onExit?: AutoEvent<D, SC, SA>
}

type StateBranchConfig<D, SC, SA> = Record<string, StateConfig<D, SC, SA>>

type StateTreeConfig<D, SC, SA> =
  | StateBranchConfig<D, SC, SA>
  | StateBranchConfig<D, SC, SA>[]

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
    on: state.on,
    onEvent: state.onEvent,
    onEnter: state.onEnter,
    onExit: state.onExit
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
  onEvent?: Event<D, SC, SA>
  initial?: string
  states?: StateTreeConfig<D, SC, SA>
  actions?: SA
  conditions?: SC
  compute?: C
}

type MachineState<D, SC, SA, CR> = {
  data?: D
  on?: Events<D, SC, SA>
  onEvent?: Event<D, SC, SA>
  current?: State<D, SC, SA>
  states?: State<D, SC, SA>[][]
  actions?: SA
  conditions?: SC
  computed?: CR
}

function init<D, SC, SA, C, CR>(
  options: Options<D, SC, SA, C>
): MachineState<D, SC, SA, CR> {
  const {
    data,
    on,
    onEvent,
    actions,
    conditions,
    compute,
    states,
    initial
  } = options

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
    onEvent,
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
  type IAction = Action<D>
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
      return { state, path: [...path, state] }
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

  /* -------------------------------------------------- */
  /*                   Private Helpers                  */
  /* -------------------------------------------------- */

  function searchStateForTarget(
    states: IState[][] | undefined,
    target: string
  ) {
    if (states !== undefined) {
      for (let branch of states) {
        for (let state of branch) {
          if (state.name === target) {
            return state
          }
        }
      }
    }

    return
  }

  /* -------------------------------------------------- */
  /*                   Public Helpers                   */
  /* -------------------------------------------------- */

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

  const isIn = React.useCallback(
    function isIn(target: string) {
      if (state.current === undefined) {
        return false
      }

      function crawl(current: IState, target: string): boolean {
        if (current.name === target) {
          return true
        }

        if (current.parent === undefined) {
          return false
        } else {
          return crawl(current.parent, target)
        }
      }

      return crawl(state.current, target)
    },
    [state]
  )

  /* -------------------------------------------------- */
  /*                        Send                        */
  /* -------------------------------------------------- */

  const send = React.useCallback(
    function send(event: string, payload?: any) {
      update((draft: Draft<IMachineState>) => {
        let { compute } = options
        let { current, states, data, on, onEvent, actions, conditions } = draft
        let path = current === undefined ? [] : getPath(current).path

        /* ---------------- Get Event Handler(s) --------------- */

        // Get event handler from current state path
        const eventHandlers = path.reduce<Event<D, SC, SA>[]>((acc, state) => {
          if (state.on !== undefined) {
            const handler = state.on[event]
            pushContents(handler, acc)
          }
          return acc
        }, [])

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
        // These are dirty functions (for now)

        // Condition Functions

        function handleCondition(condition: string | ICondition) {
          let cond =
            typeof condition === "string" && conditions !== undefined
              ? conditions[condition]
              : (condition as ICondition)

          return cond(data ? { ...data } : undefined, payload)
        }

        function testEventConditions(eventHandler: IEvent) {
          if (eventHandler.if !== undefined) {
            let eventConditions = Array.isArray(eventHandler.if)
              ? eventHandler.if
              : [eventHandler.if]

            return eventConditions.every(cond => handleCondition(cond))
          }

          return true
        }

        // Action Functions

        function handleAction(action: string | IAction) {
          let rAction =
            typeof action === "string" && actions !== undefined
              ? actions[action]
              : (action as Action<D>)

          rAction(data, payload)
        }

        function handleEventActions(eventHandler: IEvent) {
          if (eventHandler.do !== undefined) {
            let eventActions = Array.isArray(eventHandler.do)
              ? eventHandler.do
              : [eventHandler.do]

            for (let action of eventActions) {
              handleAction(action)
            }
          }
        }

        // Transition Functions

        function findTarget(state: IState, target: string): IState | undefined {
          if (state.name === target) {
            return current
          }

          // If state has states, check those for the target
          const stateInBranch = searchStateForTarget(state.states, target)
          if (stateInBranch !== undefined) return stateInBranch

          // If no state found, and state has a parent,
          // evaluate the parent / parent's states
          if (state.parent !== undefined) {
            return findTarget(state.parent, target)
          }

          // If no parent, check the root states tree
          return searchStateForTarget(states, target)
        }

        function sinkIntoInitialState(state: IState): IState {
          if (state.onEnter !== undefined) {
            handleEventHandler(state.onEnter)
          }

          if (state.states !== undefined && state.initial !== undefined) {
            return sinkIntoInitialState(state.states[state.initial])
          }

          return state
        }

        function handleTransition(current: IState, target: IState) {
          if (current.onExit !== undefined) {
            handleEventHandler(current.onExit)
          }

          return sinkIntoInitialState(target)
        }

        function handleEventTransitions(eventHandler: IEvent) {
          if (eventHandler.to !== undefined && current !== undefined) {
            let targetState = findTarget(current, eventHandler.to)
            if (targetState !== undefined) {
              return handleTransition(current, targetState)
            }
          }
          return
        }

        function handleEventHandler(eventHandler: IEvent) {
          if (testEventConditions(eventHandler)) {
            handleEventActions(eventHandler)
            return handleEventTransitions(eventHandler)
          }

          return
        }

        // If an event handler results in a new state,
        // set that state and break -- events following
        // a transition are not allowed.

        // Run event handlers

        let didChange = false

        for (let eventHandler of eventHandlers) {
          const nextState = handleEventHandler(eventHandler)
          if (nextState !== undefined) {
            draft.current = nextState as any
            didChange = true
            break
          }
        }

        // If we transitioned, update the path
        if (didChange) {
          path = draft.current === undefined ? [] : getPath(draft.current).path
        }

        // Run onEvents based on path
        for (let state of path) {
          if (state.onEvent !== undefined) {
            const nextState = handleEventHandler(state.onEvent)
            if (nextState !== undefined) {
              draft.current = nextState as any
              break
            }
          }
        }

        // Run root-level onEvent
        if (onEvent !== undefined) {
          const nextState = handleEventHandler(onEvent)
          if (nextState !== undefined) {
            draft.current = nextState as any
          }
        }

        // Update computed Values
        if (compute !== undefined && data !== undefined) {
          for (let key in draft.computed) {
            draft.computed[key] = compute[key](data)
          }
        }
      })
    },
    [update]
  )

  return [state, send, { can, isIn }] as const
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
