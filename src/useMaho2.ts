import * as React from "react";
import { Draft } from "immer";
import { useImmer } from "use-immer";

/* -------------------------------------------------- */
/*                        Types                       */
/* -------------------------------------------------- */

/* --------------------- Events --------------------- */

type Condition<D> = (data: Draft<D> | undefined, payload?: any) => boolean;

type SerializedConditions<D> = Record<string, Condition<D>>;

type Action<D> = (data: Draft<D>, payload?: any) => any;

type SerializedActions<D> = Record<string, Action<D>>;

type Event<D, SC, SA> = {
  if?:
    | ((keyof SC & string) | Condition<D>)
    | ((keyof SC & string) | Condition<D>)[];
  do?: ((keyof SA & string) | Action<D>) | ((keyof SA & string) | Action<D>)[];
};

type Events<D, SC, SA> = Record<string, Event<D, SC, SA>>;

/* --------------------- States --------------------- */

type State<D, SC, SA> = {
  name: string;
  type: "leaf" | "parent" | "parallel";
  parent?: State<D, SC, SA>;
  states?: State<D, SC, SA>[][];
  on?: Events<D, SC, SA>;
};

type StateConfig<D, SC, SA> = {
  on?: Events<D, SC, SA>;
  initial?: string;
  states?: StateBranchConfig<D, SC, SA>;
};

type StateBranchConfig<D, SC, SA> = Record<string, StateConfig<D, SC, SA>>;

type StateTreeConfig<D, SC, SA> =
  | StateBranchConfig<D, SC, SA>
  | StateBranchConfig<D, SC, SA>[];

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
  const { path } = getPath(current);
  for (let state of path) {
    if (state.on !== undefined) {
      if (state.on[name]) {
        return state.on[name];
      }
    }
  }

  console.log("Could not find an event in the current state path.");
  return;
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
        return state;
      } else if (state.states) {
        const result = getStateDown(state.states, target, [...path, state]);

        if (result !== undefined) {
          return result;
        }
      }
    }
  }

  return;
}

function getPath<D, SC, SA>(
  state: State<D, SC, SA>,
  path: State<D, SC, SA>[] = []
): { state: State<D, SC, SA>; path: State<D, SC, SA>[] } {
  if (state.parent === undefined) {
    return { state, path };
  }

  return getPath(state.parent, [...path, state]);
}

function getStateUp<D, SC, SA>(
  state: State<D, SC, SA>,
  target: string
): State<D, SC, SA> | undefined {
  if (state.parent === undefined) {
    return;
  }

  return state.name === target ? state : getStateUp(state.parent, target);
}

/**
 * @param tree A state tree.
 * @param name The path name to search, either a single state's name (e.g. "active") or a dot-separated path (e.g. "active.running.warm").
 */
function getStateByName<D, SC, SA>(
  tree: State<D, SC, SA>[][],
  name: string
): State<D, SC, SA> | undefined {
  let targets = name.includes(".") ? name.split(".") : [name];
  let first = targets.shift();

  if (first === undefined) {
    console.error("Failed to find first name from", name);
    return;
  }

  let current = getStateDown(tree, first);
  if (current === undefined) {
    console.error("Could not find a state named", first);
    return;
  }

  for (let name of targets) {
    if ((current as any).states === undefined) {
      console.error("Parent", (current as any).name, "has no states to search");
      return;
    }

    let next: State<D, SC, SA> | undefined = getStateDown(
      (current as any).states,
      name
    );

    if (next === undefined) {
      console.error(
        "Could not find state",
        name,
        "in parent",
        (current as any).name
      );
      return;
    }

    current = next;
  }

  return current;
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
  };

  let s = state as any;

  if (s.states !== undefined) {
    result.type = Array.isArray(s.states) ? "parallel" : "parent";
    result.states = convertStateTree((state as any).states, result);
  }

  return result;
}

function convertStateBranch<D, SC, SA>(
  branch: StateBranchConfig<D, SC, SA>,
  parent?: State<D, SC, SA>
): State<D, SC, SA>[] {
  return Object.keys(branch).map(key => convertState(key, branch[key], parent));
}

function convertStateTree<D, SC, SA>(
  tree: StateTreeConfig<D, SC, SA>,
  parent?: State<D, SC, SA>
): State<D, SC, SA>[][] {
  if (!Array.isArray(tree)) tree = [tree];
  return tree.map(branch => convertStateBranch(branch, parent));
}
/* ---------------------- Reducer ---------------------- */

type Options<D, SC, SA> = {
  data?: D;
  on?: Events<D, SC, SA>;
  initial?: string;
  states?: StateTreeConfig<D, SC, SA>;
  actions?: SA;
  conditions?: SC;
};

type MachineState<D, SC, SA> = {
  data?: D;
  on?: Events<D, SC, SA>;
  current?: State<D, SC, SA>;
  states?: State<D, SC, SA>[][];
  actions?: SA;
  conditions?: SC;
};

function init<D, SC, SA>(options: Options<D, SC, SA>): MachineState<D, SC, SA> {
  const { data, on, actions, conditions } = options;

  let tree: State<D, SC, SA>[][] | undefined;
  let current: State<D, SC, SA> | undefined;

  if (options.states !== undefined) {
    tree = convertStateTree(options.states);
    if (options.initial !== undefined) {
      const state = getStateByName(tree, options.initial as string);
      if (state !== undefined) {
        current = state;
      }
    }
  }

  return {
    data,
    on,
    actions,
    conditions,
    current,
    states: tree
  };
}
/* -------------------------------------------------- */
/*                        Hook                        */
/* -------------------------------------------------- */

export function useMaho<
  D extends object,
  SA extends SerializedActions<D>,
  SC extends SerializedConditions<D>
>(options: Options<D, SC, SA>) {
  const [state, update] = useImmer<MachineState<D, SC, SA>>(init(options));

  const send = React.useCallback(
    function send(event: string, payload?: any) {
      update(draft => {
        let { current, data, on, actions, conditions } = draft;

        // Helpers
        function getPath(
          state: any,
          path: any[] = []
        ): { state: State<D, SC, SA>; path: State<D, SC, SA>[] } {
          if (state.parent === undefined) {
            return { state, path };
          }

          return getPath(state.parent, [...path, state]);
        }

        /* ---------------- Get Event Handler(s) --------------- */

        // Event handlers ( multiple [ ], collectedInPath [ ]])
        let eventHandler: Event<D, SC, SA> | undefined;

        // Get event handler from current state
        if (current !== undefined) {
          const { path } = getPath(current);
          for (let state of path) {
            if (state.on !== undefined) {
              if (state.on[event] !== undefined) {
                eventHandler = state.on[event];
                break;
              }
            }
          }
        }

        // If none found, find event handler from machine
        if (eventHandler === undefined) {
          if (on !== undefined) {
            if (on[event] !== undefined) {
              eventHandler = on[event];
            }
          }
        }

        // Still no event handler, bail
        if (eventHandler === undefined) return;

        /* ------------- Evaluate Event Handler ------------- */

        // Condition (multiple [x], serialized [x])
        if (eventHandler.if !== undefined) {
          let eventConditions = Array.isArray(eventHandler.if)
            ? eventHandler.if
            : [eventHandler.if];

          for (let pCond of eventConditions) {
            let cond =
              typeof pCond === "string" && conditions !== undefined
                ? conditions[pCond]
                : (pCond as Condition<D>);

            if (!cond(data ? { ...data } : undefined, payload)) {
              return;
            }
          }
        }

        // Action (multiple [x], serialized [x])
        if (eventHandler.do !== undefined && data !== undefined) {
          let eventActions = Array.isArray(eventHandler.do)
            ? eventHandler.do
            : [eventHandler.do];

          for (let pAction of eventActions) {
            let action =
              typeof pAction === "string" && actions !== undefined
                ? actions[pAction]
                : (pAction as Action<D>);

            action(data, payload);
          }
        }

        // Transition (multiple [ ], serialized [ ])

        // Computed Values
      });
    },
    [update]
  );

  return [state, send] as const;
}
