import { jsonrepair } from 'jsonrepair'

const jsonify = (almostJson: string) => {
  try {
    return JSON.parse(almostJson)
  } catch (e) {
    const tryRepairedJson = jsonrepair(almostJson)
    return JSON.parse(tryRepairedJson)
  }
}

const chars = {
  '[': ']',
  '{': '}',
}

const extract = (str: string) => {
  // eslint-disable-next-line no-useless-escape
  const startIndexRegx = /[\{\[]/
  const startIndex = str.search(startIndexRegx)
  if (startIndex === -1) {
    return null
  }

  const openingChar = str[startIndex] as keyof typeof chars
  const closingChar = chars[openingChar]
  let endIndex = -1
  let count = 0

  str = str.substring(startIndex)

  for (let i = 0; i < str.length; i++) {
    const letter = str[i]
    if (letter === openingChar) {
      count++
    } else if (letter === closingChar) {
      count--
    }

    if (!count) {
      endIndex = i
      break
    }
  }

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
