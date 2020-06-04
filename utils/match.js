// A super small "pattern" match-like utility. You could just use a lookup table, if-statements or a
// switch. However I really like the syntax of this, especially if you see it being used in the JSX.
// Also, I have written this match function a thousand times. I've also written it in TypeScript and
// you can add Types to ensure that all possible cases (of an enum for example) are implemented
// (otherwise it won't even compile. This ensures that you don't miss things and nicely makes sure
// that things are in sync as well!). I can show this to you in the pair programming session 👀!
export function match(value, options = {}) {
  if (typeof options !== 'object' || options === null || !options.hasOwnProperty(value)) {
    throw new Error(
      `Tried to handle "${value}" but the only handled values are: ${Object.keys(options)
        .map((value) => JSON.stringify(value))
        .join(',')}`
    )
  }

  return options[value]
}
