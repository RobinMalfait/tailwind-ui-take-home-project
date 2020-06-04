import { useContext, createContext, useMemo, useState, useRef, useCallback, useEffect } from 'react'

const NO_CONTEXT = Symbol('no-context')
const OptionContext = createContext(NO_CONTEXT)

// Emulating an enum here. Okay, the web dev community might not be ready for this, but hear me out.
// In the game industry, a lot of state is encoded in a single number. Bitmasking is used to combine
// states and check if the value is in a certain state (or multiple at the same time). This is
// efficient because you can just store a single number (granted, we don't need this performance per
// se, but hey it's a nice benefit). But the API it unlocks is quite interesting. I might totally
// lose you here or I might get you to fall in love with my solution. Either way, my goal was to
// experiment with a solution by thinking outside of the box. Just give it a minute or two!
const OptionState = {
  // Main states:
  Default: 1 << 0,
  Selected: 1 << 1,

  // Sub states:
  Active: 1 << 2, // You can think of it as "hover" but less technical.
  Focused: 1 << 3,
}

let id = 0
function generateId() {
  return ++id
}

// Note: This might not be 100% compatible with concurrent mode. But concurrent mode is still
// experimental, I am not going to implement it just yet because the API might change.
//
// You could use a ref here, but the useRef hook doesn't have an initializer function, useState does
// have an initializer function so the ID stays the same during multiple renders!
function useId(prefix) {
  const [id] = useState(generateId)
  return `${prefix}-${id}`
}

// This allows us to keep the ref the same object, but the `current` value inside will update with
// the new value all the time.
function useMemoizedFunctionRef(fn) {
  const memoizedFunctionRef = useRef(fn)
  useEffect(() => {
    memoizedFunctionRef.current = fn
  }, [fn])

  return memoizedFunctionRef
}

// ---

export function OptionGroup(props) {
  const { onChange, active, ...rest } = props

  // We can memoize the onChange here, this way we can update the internal ref all the time, this
  // also allows us to use this component as:
  //
  // <OptionGroup onChange={() => { /* Inline callback here */ }} />
  //
  // instead of passing a function that is implemented with the useCallback hook. This is an
  // optimization to fall into the pit of success!
  const memoizedOnChange = useMemoizedFunctionRef(onChange)

  // Let's keep track of all the options. We are going to use a ref because we don't want to
  // re-render the parent every time a child updates. We keep track of them so that we can use the
  // arrow keys to go back and forth between the options.
  const options = useRef([])

  // Creating functions that are "cached" as long as the dependencies don't change. This allows us
  // to keep the same identity when passing them through via context.
  const isSelected = useCallback((value) => value === active, [active])

  const select = useCallback(
    (optionId) => {
      // Find the bag with all the info in it.
      const bag = options.current.find((option) => option.optionId === optionId)

      // Let's call the onChange prop with the value we want to select.
      memoizedOnChange.current(bag.value)

      // Schedule to focus the correct DOM element. We schedule this so that we can ensure that the
      // UI has been rendered already when we are trying to focus the actual DOM element.
      //
      // Note: There is a chance that the OptionGroup has been unmounted when this callback fires.
      // However we are not setting state or anything so this should be fine. We can improve this by
      // keeping track of the returned handle and call cancelAnimationFrame(handle) on unmount.
      requestAnimationFrame(() => {
        // This is scheduled for a later point in time, so we can't assume that the actual DOM
        // element is still there.
        if (!bag.element.current) {
          return
        }

        bag.element.current.focus()
        bag.element.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })
    },
    [options, memoizedOnChange]
  )

  const registerOption = useCallback(
    (value, optionId, element) => {
      // A small bag containing all the necessary information. This way we can have a reference in
      // the cleanup function.
      const bag = { value, optionId, element }

      // Register the option in the list of options.
      options.current.push(bag)

      // Let's return a cleanup function, which we can use in the useEffect hook to remove the
      // registered option.
      return () => {
        const index = options.current.indexOf(bag)
        if (index !== -1) {
          options.current.splice(index, 1)
        }
      }
    },
    [options]
  )

  const selectPrevious = useCallback(() => {
    const activeIndex = options.current.findIndex(({ value }) => value === active)
    const previousIndex = (activeIndex + options.current.length - 1) % options.current.length

    return select(options.current[previousIndex].optionId)
  }, [options, active, select])

  const selectNext = useCallback(() => {
    const activeIndex = options.current.findIndex(({ value }) => value === active)
    const nextIndex = (activeIndex + 1) % options.current.length

    return select(options.current[nextIndex].optionId)
  }, [options, active, select])

  const groupId = useId('option-group')

  // We could do something similar to the groupId. However if we generate a labelId up front and
  // don't actually render an OptionGroupLabel component this would mean that we have an
  // aria-labelledby={labelId} referencing a label that doesn't actually exist.
  const [labelId, setLabelId] = useState(null)

  const registerLabel = useCallback(
    (labelId) => {
      setLabelId(labelId)

      // Let's return a cleanup function, which we can use in the useEffect hook to remove the registered
      // label ID.
      return () => {
        setLabelId(null)
      }
    },
    [setLabelId]
  )

  // We are passing through an object, but every render this will be a new object (by reference).
  // Therefore we will use the useMemo hook to ensure that we only need to change the identity of
  // the object when needed.
  const contextBag = useMemo(
    () => ({
      groupId,
      labelId,
      registerLabel,
      registerOption,
      isSelected,
      select,
      selectPrevious,
      selectNext,
    }),
    [
      groupId,
      labelId,
      registerLabel,
      registerOption,
      isSelected,
      select,
      selectPrevious,
      selectNext,
    ]
  )

  return (
    <OptionContext.Provider value={contextBag}>
      <div {...rest} />
    </OptionContext.Provider>
  )
}

OptionGroup.defaultProps = {
  // This is something I would enforce using TypeScript.
  get active() {
    throw new Error('The <OptionGroup /> component requires an `active` prop.')
  },
  get onChange() {
    throw new Error('The <OptionGroup /> component requires an `onChange` prop.')
  },
}

function useOptionContext() {
  // When there is no Provider, the "default" context is used, but we don't want that, we want to
  // enforce that the <OptionGroup /> is present!
  const context = useContext(OptionContext)

  // We just want to fall into the pit of success right? So instead of throwing an obscure error,
  // let's help the developers out by providing a nicer error. We _could_ add extra optimizations
  // here that ensure that this check is only done in development and not in production.
  if (context === NO_CONTEXT) {
    throw new Error('Used an <Option /> without an <OptionGroup />')
  }

  return context
}

// ---

export function Option(props) {
  // I am not a big fan to pass in random props, too many props or classNames to a component. But
  // this is mainly to prevent the introduction of implicit components (e.g.: Adding a font-size on
  // a badge which makes it a "big badge"). However this component is so low-level that I don't
  // really mind.
  const { value, children, ...rest } = props

  // We need access to the raw DOM element so that we can manage its focus or scroll it into view
  // when required.
  const element = useRef(null)

  // We can safely destructure the required properties because if the context was not available an
  // error would have been thrown at this point.
  const { groupId, isSelected, select, registerOption } = useOptionContext()

  // Let's generate an optionId based on the groupId. Not really necessary, but it is nice to see
  // the related ID's in the DOM.
  const optionId = useId(`${groupId}-option`)

  // Keep track of the option. We return the registerOption so that the cleanup function can run
  // when the cleanup of the effect is run.
  useEffect(() => registerOption(value, optionId, element), [
    value,
    optionId,
    element,
    registerOption,
  ])

  // So here is where it gets interesting. Let's introduce state as a single value. I named it
  // useGameState because of the aforementioned game industry ideas.
  const { flags, addFlag, removeFlag, hasFlag } = useGameState()

  // The way we implemented this option group means that we are at least in the Default or the
  // Selected state. There could be additional states (Active and Focused) but those are more
  // low-level states.
  useEffect(() => {
    const selected = isSelected(value)

    if (selected) {
      addFlag(OptionState.Selected)
    } else {
      addFlag(OptionState.Default)
    }

    return () => {
      if (selected) {
        removeFlag(OptionState.Selected)
      } else {
        removeFlag(OptionState.Default)
      }
    }
  }, [isSelected, value, addFlag, removeFlag, OptionState])

  return (
    <li
      // Spreading the incoming props first so that we ensure that we still have control over
      // certain a11y features.
      {...rest}
      id={optionId}
      ref={element}
      role="radio"
      tabIndex={
        // We want to make the selected item focusable (0), in all other cases, we don't want the
        // item to be focusable (-1). Otherwise you have to loop through all the options before you
        // can go to the next group, yikes.
        hasFlag(OptionState.Selected) ? 0 : -1
      }
      aria-checked={hasFlag(OptionState.Selected)}
      onClick={() => select(optionId)}
      onFocus={() => addFlag(OptionState.Focused)}
      onBlur={() => removeFlag(OptionState.Focused)}
      onMouseEnter={() => addFlag(OptionState.Active)}
      onMouseLeave={() => removeFlag(OptionState.Active)}
    >
      {children(flags)}
    </li>
  )
}

// This is something I would enforce using TypeScript.
Option.defaultProps = {
  get value() {
    throw new Error('The <Option /> component requires a `value` prop.')
  },
  get children() {
    throw new Error(
      'The <Option /> component requires a `children` prop (which must be a function).'
    )
  },
}

// I like to expose the state or variant or theme or whatever the explicit option is on my component
// itself. This way you can create components like:
//
// `<Button variant={Button.variant.Primary}>Primary Button</Button>`
Option.state = OptionState

// ---

// We could improve this further by ensuring that we only have a single OptionGroupLabel per
// OptionGroup. But for now, this is okay.
export function OptionGroupLabel(props) {
  const { registerLabel } = useOptionContext()

  const labelId = useId('option-group-label')
  useEffect(() => registerLabel(labelId), [labelId])

  return <label {...props} id={labelId} />
}

export function Options(props) {
  const { groupId, labelId, selectPrevious, selectNext } = useOptionContext()

  function handleKeyboardEvent(event) {
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault()
        selectPrevious()
        break

      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault()
        selectNext()
        break
    }
  }

  return (
    <ul
      {...props}
      id={groupId}
      tabIndex={-1}
      role="radiogroup"
      aria-labelledby={labelId}
      onKeyDown={handleKeyboardEvent}
    />
  )
}

/**
 * I made a small abstraction here. But this essentially mimics the multi-states in a single number
 * approach from the game industry. We probably wouldn't use this in a production application
 * because it might be too confusing. But why not experiment?
 */
function useGameState(initial_state = 0) {
  const [flags, setFlags] = useState(initial_state)

  /**
   * You can combine 2 bits by doing a bitwise "or" -> |
   *
   *   0001       I wrote this as `1 << 0` above.
   *   0010       I wrote this as `1 << 1` above.
   * | ----       Using bitwise "or".
   *   0011
   */
  const addFlag = useCallback((flag) => setFlags((flags) => flags | flag), [setFlags])

  /**
   * Imagine you now have that single number `0011`, and you want to check if `1 << 0` or `1 << 1`
   * is "inside" of it.
   *
   *   0011       The result of `(1 << 0) | (1 << 1)`.
   *   0001       The value `1 << 0`.
   * & ----       Using bitwise "and".
   *   0001       This contains a `1` this means that the value is greater than `0` and thus truthy!
   *
   *
   *   0011       The result of `(1 << 0) | (1 << 1)`.
   *   0010       The value `1 << 1`.
   * & ----       Using bitwise "and".
   *   0010       This contains a `1` this means that the value is greater than `0` and thus truthy!
   */
  const hasFlag = useCallback((flag) => Boolean(flags & flag), [flags])

  /**
   * Now, let's imagine that we want to "remove" a flag. You can do this with the bitwise "not" and
   * bitwise "and".
   *
   *   0010       The flag we want to remove.
   * ~ ----       Using bitwise "not".
   *   1101       The flag we want to remove, but now inverted.
   *              The result of `~(1 << 1)`. Note: JavaScript uses two's-complement notation.
   *
   *   0011       The result of `(1 << 0) | (1 << 1)`.
   *   1101       The result of the inverted flag we want to remove.
   * & ----       Using bitwise "and".
   *   0001       The value without the flag we wanted to remove!
   */
  const removeFlag = useCallback((flag) => setFlags((flags) => flags & ~flag), [setFlags])

  return { flags, addFlag, removeFlag, hasFlag }
}
