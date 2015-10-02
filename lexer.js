'use strict'

function createToken(tokenClass, value, line, column) {
  let token = Object.create(null)

  Object.defineProperties(token, {
    type: {
      enumerable: true,
      value: tokenClass
    },
    value: {
      enumerable: true,
      value
    },
    line: {
      enumerable: true,
      value: line
    },
    column: {
      enumerable: true,
      value: column
    }
  })

  return token
}

export default function getLexer(tokenList) {
  return (sourceString) => {
    let result = []
    // 1 indexed line and column numbers
    let line = 1
    let column = 1

    while (sourceString.length) {
      let matchedClass
      let matchedValue = null
      let longestMatchedClass = ''
      let longestMatchedValue = ['']
      let longestMatchLine = 0
      let longestMatchCol = 0

      for (let { r, n } of tokenList) {
        let tokenRegex = r

        matchedValue = tokenRegex.exec(sourceString)

        // if there was a match check if is longest
        // if so, store it
        // also store the line and column details
        if (matchedValue) {
          matchedClass = n

          if (matchedValue[0].length > longestMatchedValue[0].length) {
            longestMatchedValue = matchedValue
            longestMatchedClass = matchedClass
            longestMatchLine = line
            longestMatchCol = column
          }

          // if we match a newline, increment line number and reset column to 1
          // TODO: Figure out a way to remove this hardcoded class name check
          if (matchedClass === 'NEWLINE') {
            line += 1
            column = 1 // reset column for new line
          }
        }
      }
      if (longestMatchedValue[0].length) {
        result.push(
          createToken(
            longestMatchedClass,
            longestMatchedValue[1] || longestMatchedValue[0],
            longestMatchLine,
            longestMatchCol
          )
        )
        sourceString = sourceString.slice(longestMatchedValue[0].length)

        if (longestMatchedClass !== 'NEWLINE') column += longestMatchedValue[0].length // column = column + length of matched string
      }
      else {
        // TODO: Better error message reporting
        let errorMsg = `Invalid syntax at line ${line}, column ${column + sourceString.length}:\n`

        throw new SyntaxError(errorMsg + sourceString + '\n' + '-'.repeat(sourceString.length) + '^')
      }
    }
    return result
  }
}
