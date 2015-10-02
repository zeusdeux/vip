'use strict'

/* eslint no-console: 0, no-use-before-define: 0 */

/*

  -------------------------------------------------------
  Terminals
  -------------------------------------------------------

  KEYWORDS =  fn | if | else | for | of | let | import | from | export | as
  NUMBER = INTEGER | FLOAT
  ATOM = NUMBER | BOOLEAN | STRING | IDENTIFIER
  AOPS = + | - | / | * | ^
  LOPS = < | > | <= | >= | == | != | AND | OR | NOT
  BRACKETS = [ | ] | ( | )
  ASSGNMNT = =

*/

const tokens = [
  {
    r: /^[\t ]+/,
    n: 'WS'
  },
  {
    r: /^(\n|\r\n)+/,
    n: 'NEWLINE'
  },
  {
    r: /^:/,
    n: 'COLON'
  },
  {
    r: /^,/,
    n: 'COMMA'
  },
  /* Assignment */
  {
    r: /^=/,
    n: 'ASSIGN'
  },
  /* Keywords */
  {
    r: /^fn/,
    n: 'FN'
  },
  {
    r: /^if/,
    n: 'IF'
  },
  {
    r: /^else/,
    n: 'ELSE'
  },
  {
    r: /^for/,
    n: 'FOR'
  },
  {
    r: /^of/,
    n: 'OF'
  },
  {
    r: /^let/,
    n: 'LET'
  },
  {
    r: /^import/,
    n: 'IMPORT'
  },
  {
    r: /^export/,
    n: 'EXPORT'
  },
  {
    r: /^from/,
    n: 'FROM'
  },
  {
    r: /^as/,
    n: 'AS'
  },
  /* Atoms */
  {
    r: /^\d+/,
    n: 'INTEGER'
  },
  {
    r: /^\d+\.\d+/,
    n: 'FLOAT'
  },
  {
    r: /^(true|false)/,
    n: 'BOOLEAN'
  },
  {
    r: /^"(.*)"/,
    n: 'STRING'
  },
  {
    r: /^[_A-Za-z][A-Za-z\-_0-9]*/,
    n: 'IDENTIFIER'
  },
  /* Math ops */
  {
    r: /^\+/,
    n: 'ADDITION'
  },
  {
    r: /^\-/,
    n: 'SUBTRACTION'
  },
  {
    r: /^\*/,
    n: 'MULTIPLICATION'
  },
  {
    r: /^\//,
    n: 'DIVISION'
  },
  {
    r: /^\^/,
    n: 'EXPONENTIATION'
  },
  /* Logical ops */
  {
    r: /^</,
    n: 'LT'
  },
  {
    r: /^<=/,
    n: 'LTE'
  },
  {
    r: /^>/,
    n: 'GT'
  },
  {
    r: /^>=/,
    n: 'GTE'
  },
  {
    r: /^==/,
    n: 'EQ'
  },
  {
    r: /^!=/,
    n: 'NEQ'
  },
  {
    r: /^and/,
    n: 'AND'
  },
  {
    r: /^or/,
    n: 'OR'
  },
  {
    r: /^not/,
    n: 'NOT'
  },
  /* Brackets and parens */
  {
    r: /^\(/,
    n: 'OPENPARENS'
  },
  {
    r: /^\)/,
    n: 'CLOSEPARENS'
  },
  {
    r: /^\[/,
    n: 'OPENSQBKT'
  },
  {
    r: /^\]/,
    n: 'CLOSESQBKT'
  },
  {
    r: /^\{/,
    n: 'OPENCURLIES'
  },
  {
    r: /^\}/,
    n: 'CLOSECURLIES'
  }
]

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

function getLexer(tokenList) {
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
        let errorMsg = `Invalid syntax at line ${line}, column ${column + sourceString.length}:\n`

        throw new SyntaxError(errorMsg + sourceString + '\n' + '-'.repeat(sourceString.length) + '^')
      }
    }
    return result
  }
}

function createASTNode(type, value, line, column) {
  let node = Object.create(null)

  Object.defineProperties(node, {
    type: {
      enumerable: true,
      value: type
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

  return node
}


/*

  KEYWORDS =  fn | if | else | for | of | let
  NUMBER = INTEGER | FLOAT
  ATOM = NUMBER | BOOLEAN | STRING | IDENTIFIER
  AOPS = + | - | / | * | ^
  LOPS = < | > | <= | >= | == | != | AND | OR | NOT
  BRACKETS = [ | ] | ( | )
  ASSIGN = =

*/

/*

PROGRAM = EXPRESSION*

EXPRESSION = ATOM | ASSIGNMENTEXPR | INVOCATIONEXPR | OPERATOREXPR

ATOM = NUMBER | BOOLEAN | STRING | IDENTIFIER

NUMBER = INTEGER | FLOAT

ASSIGNMENTEXPR = LET WS+ IDENTIFIER WS* ASSIGN WS* EXPRESSION

*/

/* ATOMS */
function parseNumber(tokenList) {
  const token = tokenList[0]

  switch(token.type) {
  case 'INTEGER':
    return [createASTNode('NUMBER', parseInt(token.value, 10), token.line, token.column), tokenList.slice(1)]
  case 'FLOAT':
    return [createASTNode('NUMBER', parseFloat(token.value, 10), token.line, token.column), tokenList.slice(1)]
  default:
    return [null, tokenList]
  }
}

function parseBoolean(tokenList) {
  const token = tokenList[0]

  switch(token.type) {
  case 'BOOLEAN':
    let value = 'true' === token.value ? true : false

    return [createASTNode('BOOLEAN', value, token.line, token.column), tokenList.slice(1)]
  default:
    return [null, tokenList]
  }
}

function parseString(tokenList) {
  const token = tokenList[0]

  switch(token.type) {
  case 'STRING':
    return [createASTNode('STRING', token.value, token.line, token.column), tokenList.slice(1)]
  default:
    return [null, tokenList]
  }
}

function parseIdentifier(tokenList) {
  const token = tokenList[0]

  switch(token.type) {
  case 'IDENTIFIER':
    return [createASTNode('IDENTIFIER', token.value, token.line, token.column), tokenList.slice(1)]
  default:
    return [null, tokenList]
  }
}

function parseAtom(tokenList) {
  let result = null
  let productions = [parseNumber, parseBoolean, parseString, parseIdentifier]

  for (let production of productions) {
    result = production(tokenList)

    // since we know all products for Atom are terminals
    // we break on the first match and don't look for
    // longest match
    if (result[0]) break
  }

  return result
}

function parseExpressionWithinParens(tokenList) {
  if ('OPENPARENS' !== tokenList[0].type) return [null, tokenList]

  let result = parseExpression(tokenList.slice(1))

  tokenList = result[1]

  // should these smaller parsers throw errors? Cuz they know whats wrong right?
  // for e.g., this parser knows where there's a mismatched paren
  if (!tokenList[0] || 'CLOSEPARENS' !== tokenList[0].type) return [null, tokenList]

  return [result[0], tokenList.slice(1)]
}

function parseInvocationExpr(tokenList) {
  return [null, tokenList]
}

function parseExpression(tokenList) {
  let result = []
  // ordering of these productions matter
  // since we break on first match, longest matching production
  // MUST come first or else it's gg life wp world ttyl fml xyz
  let productions = [parseAtom, parseExpressionWithinParens]

  for (let production of productions) {
    result = production(tokenList)

    if (null !== result[0]) break
  }
  return result
}

function parseProgram(tokenList) {
  let exprs = []

  while(tokenList.length) {
    // console.log(`Tokens before parsing expression:\n${JSON.stringify(tokenList)}\n`)

    if (tokenList[0].type === 'NEWLINE') {
      tokenList.shift()
      continue
    }

    let result = parseExpression(tokenList)
    let node = result[0]

    tokenList = result[1]

    // console.log(`Tokens after parsing expression:\n${JSON.stringify(tokenList)}\n`)

    if (node) exprs.push(node)
    else {
      let firstToken = tokenList[0]
      let sourceString = tokenList.reduce((p, token) => p += token.value, '')
      let errorMsg = `Invalid syntax starting at line ${firstToken.line}, column ${firstToken.column}:\n${sourceString}`

      throw new SyntaxError(errorMsg)
    }
    // console.log(`exprs: ${JSON.stringify(exprs)}`)
    // console.log('-'.repeat(10))
  }

  return createASTNode('PROGRAM', exprs, 1, 1)
}

let lexer = getLexer(tokens)



// console.log(lexer('let a = 10'))
// console.log()
// console.log(lexer('if (true)\n  1\nelse\n  2'))
// console.log()
// console.log(lexer('"asd"'))
// console.log()
// console.log(lexer('1 + 2 + 4 * 2^5'))
// console.log()
// console.log(lexer('let iffn = 10'))
// console.log()
// console.log(lexer('let a = [1 2 3 4 "asd"]'))
// console.log()
// console.log(lexer('1 < 2'))
// console.log()
// console.log(lexer('10 >= 200'))
// console.log()
// console.log(lexer('(10)'))
// console.log()
// // should be parse error not lex error
// // console.log(lexer('let array = ["asd" 1'))
// // console.log()
// // Hash map below
// console.log(lexer(`let a = {
//   :a 10
//   :b "ads"
// }`))
// console.log()
// console.log(lexer('fn add(a, b)\r\n  print("what")\r\n  a + b\r\n'))
// console.log()
// console.log(lexer('add 10 20.0'))
// console.log()
// console.log(lexer('let a = (b == 10)'))
// // console.log(lexer('"Asd'))
// console.log()
// console.log(parseProgram(lexer('')))
// console.log(parseProgram(lexer('1')))
console.log('10.22\n123\ntrue\n"asd asd09"\nwhat\n', parseProgram(lexer('10.22\n123\ntrue\n"asd asd09"\nwhat')))
console.log()
console.log('(1)(("asd"))\n', parseProgram(lexer('(1)(("asd"))')))
