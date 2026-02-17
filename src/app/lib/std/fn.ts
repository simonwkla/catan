type ApplyOptionalReturnType<I, O> = I extends undefined ? undefined : I extends null ? null : O;

/**
 * Applies a function to an input if the input is not undefined or null .
 * @param input - The input to apply the function to.
 * @param fn - The function to apply to the input.
 * @returns The result of the function application or undefined / null if the input is undefined / null.
 */
function applyOptional<I, O>(input: I, fn: (args: NonNullable<I>) => O): ApplyOptionalReturnType<I, O> {
  if (input === undefined) {
    return undefined as ApplyOptionalReturnType<I, O>;
  }

  if (input === null) {
    return null as ApplyOptionalReturnType<I, O>;
  }

  return fn(input) as ApplyOptionalReturnType<I, O>;
}

/**
 * Checks if the input is not null or undefined.
 * @param input - The input to check.
 * @returns True if the input is not null or undefined, false otherwise.
 */
function isNonNullable<P>(input: P): input is NonNullable<P> {
  return input !== null && input !== undefined;
}

/**
 * The identity function.
 * @param input - The input to return.
 * @returns The input.
 */
function identity<T>(input: T): T {
  return input;
}

export const fn = {
  applyOptional: applyOptional,
  isNonNullable: isNonNullable,
  identity: identity,
};
