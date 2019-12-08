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
type Action<D> = (data: D | Draft<D> | undefined, payload?: any) => any

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
    return { state, path: [...path, state] }
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
    initial: state.initial,
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
  computed?: C
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
  path: State<D, SC, SA>[]
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
    computed: computeds,
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

  if (computeds !== undefined && data !== undefined) {
    computed = Object.entries(computeds).reduce((acc, [key, value]) => {
      acc[key] = value({ ...data })
      return acc
    }, {} as CR)
  }

  const machineState = {
    data,
    on,
    onEvent,
    actions,
    conditions,
    current,
    computed,
    states: tree,
    initial,
    path: current === undefined ? [] : getPath(current).path
  }

  testMachine(machineState)

  return machineState
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
  type DMachineState = Draft<IMachineState>
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

  function getEventsInPath(state: IMachineState | DMachineState) {
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
    state: IMachineState | DMachineState,
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

  const eventsInPath = React.useMemo(() => {
    return getEventsInPath(state)
  }, [state])

  /* -------------------------------------------------- */
  /*                   Private Helpers                  */
  /* -------------------------------------------------- */

  function searchStateForTarget(
    m: IMachineState | DMachineState,
    target: string
  ) {
    if (m.states !== undefined) {
      for (let branch of m.states) {
        for (let state of branch) {
          if (state.name === target) {
            return state
          }
        }
      }
    }

    return
  }

  // Condition Functions

  function handleCondition(
    m: IMachineState | DMachineState,
    condition: string | ICondition,
    payload?: any
  ) {
    if (typeof condition === "string" && m.conditions === undefined) {
      console.error(
        `You defined a condition, ${condition}, but your machine has no serialized conditions. This will cause an error! Did you forget to define a conditions object?`
      )
    }

    let cond =
      typeof condition === "string" && m.conditions !== undefined
        ? m.conditions[condition]
        : (condition as ICondition)

    return cond(m.data ? m.data : undefined, payload)
  }

  function testEventConditions(
    m: IMachineState | DMachineState,
    eventHandler: IEvent,
    payload?: any
  ) {
    if (eventHandler.if !== undefined) {
      let eventConditions = Array.isArray(eventHandler.if)
        ? eventHandler.if
        : [eventHandler.if]

      return eventConditions.every(cond => handleCondition(m, cond, payload))
    }

    return true
  }

  // Action Functions

  function handleAction(
    m: IMachineState | DMachineState,
    action: string | IAction,
    payload?: any
  ) {
    let rAction =
      typeof action === "string" && m.actions !== undefined
        ? m.actions[action]
        : (action as Action<D>)

    rAction(m.data, payload)
  }

  function handleEventActions(
    m: IMachineState | DMachineState,
    eventHandler: IEvent,
    payload?: any
  ) {
    if (eventHandler.do !== undefined) {
      let eventActions = Array.isArray(eventHandler.do)
        ? eventHandler.do
        : [eventHandler.do]

      for (let action of eventActions) {
        handleAction(m, action, payload)
      }
    }
  }

  // Transition Functions

  function findTarget(
    m: IMachineState | DMachineState,
    state: IState,
    target: string
  ): IState | undefined {
    if (state.name === target) {
      return state
    }

    // If state has states, check those for the target
    const stateInBranch = searchStateForTarget(m, target)
    if (stateInBranch !== undefined) return stateInBranch

    // If no state found, and state has a parent,
    // evaluate the parent / parent's states
    if (state.parent !== undefined) {
      return findTarget(m, state.parent, target)
    }

    // If no parent, check the root states tree
    return searchStateForTarget(m, target)
  }

  function sinkIntoInitialState(
    m: IMachineState | DMachineState,
    state: IState,
    payload: any
  ): IState {
    if (state.onEnter !== undefined) {
      handleEventHandler(m, state.onEnter, payload)
    }

    if (state.states !== undefined && state.initial !== undefined) {
      const targetBranch = state.states.find(branch =>
        branch.find(s => s.name === state.initial)
      )
      if (targetBranch === undefined) {
        console.error("Could not find a branch for the initial state!")
      } else {
        const targetState = targetBranch.find(s => s.name === state.initial)
        if (targetState === undefined) {
          console.error("Could not find a state for the initial state!")
        } else {
          return sinkIntoInitialState(m, targetState, payload)
        }
      }
    }

    return state
  }

  function handleTransition(
    m: IMachineState | DMachineState,
    target: IState,
    payload?: any
  ) {
    if (m.current !== undefined && m.current.onExit !== undefined) {
      handleEventHandler(m, m.current.onExit, payload)
    }

    return sinkIntoInitialState(m, target, payload)
  }

  function handleEventTransitions(
    m: IMachineState | DMachineState,
    eventHandler: IEvent,
    payload?: any
  ) {
    if (eventHandler.to !== undefined && m.current !== undefined) {
      let targetState = findTarget(m, m.current, eventHandler.to)
      if (targetState !== undefined) {
        return handleTransition(m, targetState, payload)
      }
    }
    return
  }

  function handleEventHandler(
    m: IMachineState | DMachineState,
    eventHandler: IEvent,
    payload?: any
  ) {
    if (testEventConditions(m, eventHandler, payload)) {
      handleEventActions(m, eventHandler, payload)
      return handleEventTransitions(m, eventHandler, payload)
    }

    return
  }

  function handleAutoEventHandler(
    m: IMachineState | DMachineState,
    autoEvent: IEvent | undefined,
    payload?: any
  ) {
    if (autoEvent !== undefined) {
      const nextState = handleEventHandler(m, autoEvent, payload)
      if (nextState !== undefined) {
        m.current = nextState as any
        return true
      }
    }
    return false
  }

  function collectEventHandlers(
    m: IMachineState | DMachineState,
    event: string
  ) {
    let path = m.current === undefined ? [] : getPath(m.current).path

    const eventHandlers = path.reduce<Event<D, SC, SA>[]>((acc, state) => {
      if (state.on !== undefined) {
        const handler = state.on[event]
        pushContents(handler, acc)
      }
      return acc
    }, [])

    // If we have root-level event handlers, look there
    if (m.on !== undefined) {
      const rootHandler = m.on[event]
      pushContents(rootHandler, eventHandlers)
    }

    return eventHandlers
  }

  // Computed values

  function updateComputedValues(
    m: IMachineState | DMachineState,
    computed: C | undefined
  ) {
    if (
      computed !== undefined &&
      m.computed !== undefined &&
      m.data !== undefined
    ) {
      for (let key in computed as any) {
        m.computed[key] = computed[key](m.data as any)
      }
    }
  }

  // Path

  function getCurrentPath(m: IMachineState | DMachineState) {
    return m.current === undefined ? [] : getPath(m.current).path
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
  /*                         Set                        */
  /* -------------------------------------------------- */

  // Force a change to the machine's state

  const set = React.useCallback(
    function set(target: string) {
      if (state.states === undefined) {
        // No states in this machine
        return
      }

      const next = getStateByName(state.states, target)

      if (next === undefined) {
        // No state with that name
        return
      }

      update(draft => {})
    },
    [state, update]
  )

  /* -------------------------------------------------- */
  /*                        Send                        */
  /* -------------------------------------------------- */

  // Submit an event to the machine

  const send = React.useCallback(
    function send(event: string, payload?: any) {
      update((draft: Draft<IMachineState>) => {
        let path = getCurrentPath(draft)

        /* ---------------- Get Event Handler(s) --------------- */

        // Get event handler from current state path
        const eventHandlers = collectEventHandlers(draft, event)

        // If we didn't find any events, bail
        if (eventHandlers.length === 0) {
          return
        }

        // Run event handlers
        for (let eventHandler of eventHandlers) {
          // Mutates!
          const nextState = handleEventHandler(draft, eventHandler, payload)
          if (nextState !== undefined) {
            draft.current = nextState as any
            break
          }
        }

        // If we transitioned, update the path
        path = getCurrentPath(draft)

        // Run onEvents based on path
        for (let state of path) {
          // Mutates!
          if (handleAutoEventHandler(draft, state.onEvent, payload)) {
            break
          }
        }

        // Run root-level onEvent (Mutates!)
        handleAutoEventHandler(draft, draft.onEvent, payload)

        // Update computed Values
        updateComputedValues(draft, options.computed)

        draft.path = getCurrentPath(draft) as any
      })
    },
    [update]
  )

  return [state, send, { can, isIn }] as const
}

/* -------------------------------------------------- */
/*               Generic Helpers                      */
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

/* -------------------------------------------------- */
/*                       Testing                      */
/* -------------------------------------------------- */

function testMachine(m: MachineState<any, any, any, any>) {
  function testEvents(
    on: Record<string, Event<any, any, any> | Event<any, any, any>[]>
  ) {
    for (let key in on) {
      let e = on[key]
      let eventHandlers = Array.isArray(e) ? e : Array(e)

      for (let eventHandler of eventHandlers) {
        let { if: cond, do: action } = eventHandler
        if (cond !== undefined) {
          cond = Array.isArray(cond) ? cond : Array(cond)
          for (let c of cond) {
            if (typeof c === "string") {
              if (m.conditions === undefined) {
                console.error(
                  `${key}: Warning! You've included a serialized condition named "${c}" but your machine has no serialized conditions. This will cause an error! Did you forget to define a conditions object?`
                )
              } else {
                if (m.conditions[c] === undefined) {
                  console.error(
                    `${key}: Warning! You've included a serialized condition named "${c}" but your machine's conditions do not include this condition. This will cause an error! Did you forget to add a condition named ${c}?`
                  )
                }
              }
            }
          }
        }

        if (action !== undefined) {
          action = Array.isArray(action) ? action : Array(action)
          for (let a of action) {
            if (typeof a === "string") {
              if (m.actions === undefined) {
                console.error(
                  `${key}: Warning! You've included a serialized action named "${a}" but your machine has no serialized actions. This will cause an error! Did you forget to define a actions object?`
                )
              } else {
                if (m.actions[a] === undefined) {
                  console.error(
                    `${key}: Warning! You've included a serialized action named "${a}" but your machine's actions do not include this action. This will cause an error! Did you forget to add an action named ${a}?`
                  )
                }
              }
            }
          }
        }
      }
    }
  }

  if (m.states !== undefined) {
    for (let state of m.states) {
      for (let branch of state) {
        if (branch.on !== undefined) {
          testEvents(branch.on)
        }
      }
    }
  }

  if (m.on !== undefined) {
    testEvents(m.on)
  }
}
