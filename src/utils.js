export const invariant = (condition, message) => {
  if (!condition) {
    throw new Error(message)
  }
}

export const delimitString = (text, delimiter = ',') =>
  text
    .split(delimiter)
    .map(part => part.trim())
    .filter(part => part.length > 0)
