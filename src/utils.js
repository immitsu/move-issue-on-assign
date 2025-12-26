class InvariantError extends Error {
  constructor(message) {
    super(message)
    this.name = 'InvariantError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvariantError)
    }
  }
}

export const invariant = (condition, message) => {
  if (!condition) {
    throw new InvariantError(message)
  }
}

export const delimitString = (text, delimiter = ',') =>
  text
    .split(delimiter)
    .map(part => part.trim())
    .filter(part => part.length > 0)
