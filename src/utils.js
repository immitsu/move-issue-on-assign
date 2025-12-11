export const invariant = (condition, message) => {
  if (!condition) {
    throw new Error(message)
  }
}

export const splitString = (text, delimiter = ',') =>
  text
    .split(delimiter)
    .map(part => part.trim())
    .filter(part => part.length > 0)
