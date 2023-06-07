const jsonify = (almostJson: string) => {
  try {
    return JSON.parse(almostJson)
  } catch (e) {
    // eslint-disable-next-line no-useless-escape
    almostJson = almostJson.replace(/([a-zA-Z0-9_$]+\s*):/g, '"$1":').replace(/'([^']+?)'([\s,\]\}])/g, '"$1"$2')
    return JSON.parse(almostJson)
  }
}

const chars = {
  '[': ']',
  '{': '}',
}

type StrIterator = (char: string, index: number, all: string) => undefined | boolean

const any = (iteree: string, iterator: StrIterator) => {
  let result
  for (let i = 0; i < iteree.length; i++) {
    result = iterator(iteree[i], i, iteree)
    if (result) {
      break
    }
  }
  return result
}

const extract = (str: string) => {
  // eslint-disable-next-line no-useless-escape
  const startIndexRgex = /[\{\[]/
  const startIndex = str.search(startIndexRgex)
  if (startIndex === -1) {
    return null
  }

  const openingChar = str[startIndex] as keyof typeof chars
  const closingChar = chars[openingChar]
  let endIndex = -1
  let count = 0

  str = str.substring(startIndex)
  any(str, (letter, i) => {
    if (letter === openingChar) {
      count++
    } else if (letter === closingChar) {
      count--
    }

    if (!count) {
      endIndex = i
      return true
    }
  })

  if (endIndex === -1) {
    return null
  }

  return str.substring(0, endIndex + 1)
}

export function extractJsonFromString(str: string) {
  let nStr = str
  let result
  const objects = []
  while ((result = extract(nStr)) !== null) {
    try {
      const obj = jsonify(result)
      objects.push(obj)
    } catch (e) {
      // Do nothing
    }
    nStr = nStr.replace(result, '')
  }

  return objects
}
