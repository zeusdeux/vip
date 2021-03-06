'use strict'

/* eslint no-console: 0, no-use-before-define: 0 */

import debug from 'debug'
import getLexer from './lexer'
import tokenRules from './lexerTokens'
import { inspect } from 'util'

const dpa   = debug('vip:parser:parseArray')
const dpat  = debug('vip:parser:parseAtom')
const dpp   = debug('vip:parser:parseProgram')
const dphm  = debug('vip:parser:parseHashMap')
const dpe   = debug('vip:parser:parseExpression')
const dpi   = debug('vip:parser:parseIdentifier')
const dpewp = debug('vip:parser:parseExpressionWithinParens')
const dpie = debug('vip:parser:parseInvocationExpression')


class ASTNode {}
function createASTNode(type, value, line, columnStart, columnEnd) {
  let node = Object.create(ASTNode.prototype)

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
    columnStart: {
      enumerable: true,
      value: columnStart
    },
    columnEnd: {
      enumerable: true,
      value: columnEnd
    }
  })

  return node
}


/*

  KEYWORDS =  fn | if | else | for | of | let
  NUMBER = INTEGER | FLOAT
  ARRAY = "[" (WS|NEWLINE)? (EXPR (WS|NEWLINE)+)* "]"
  HASHMAP = "{" (WS|NEWLINE)? (":" ID WS+ EXPR)* "}"
  ATOM = NUMBER | BOOLEAN | STRING | ARRAY | HASHMAP | IDENTIFIER
  AOPS = + | - | / | * | ^
  LOPS = < | > | <= | >= | == | != | AND | OR | NOT
  BRACKETS = [ | ] | ( | )
  ASSIGN = =

*/

/*

PROGRAM = EXPRESSION*

EXPRESSION = ATOM | ASSIGNMENTEXPR | INVOCATIONEXPR | OPERATOREXPR | LAMBDAEXPR

ATOM = NUMBER | BOOLEAN | STRING | IDENTIFIER

NUMBER = INTEGER | FLOAT

INVOCATIONEXPR = IDENTIFIER (WS+ EXPR)*

ASSIGNMENTEXPR = LET WS+ IDENTIFIER WS* ASSIGN WS* EXPRESSION

*/

/* ATOMS */
function parseNumber(tokenList) {
  const token = tokenList[0]

  switch(token.type) {
  case 'INTEGER':
    return [createASTNode('NUMBER', parseInt(token.value, 10), token.line, token.column, token.column + token.value.length - 1), tokenList.slice(1)]
  case 'FLOAT':
    return [createASTNode('NUMBER', parseFloat(token.value, 10), token.line, token.column, token.column + token.value.length - 1), tokenList.slice(1)]
  default:
    return [null, tokenList]
  }
}

function parseBoolean(tokenList) {
  const token = tokenList[0]

  switch(token.type) {
  case 'BOOLEAN':
    let value = 'true' === token.value ? true : false

    return [createASTNode('BOOLEAN', value, token.line, token.column, token.column + token.value.length - 1), tokenList.slice(1)]
  default:
    return [null, tokenList]
  }
}

function parseString(tokenList) {
  const token = tokenList[0]

  switch(token.type) {
  case 'STRING':
    // the -1 is cuz columns are 1 indexed and the +2 is for the "" that bound the string and are pruned by the lexer
    return [createASTNode('STRING', token.value, token.line, token.column, token.column + token.value.length - 1 + 2), tokenList.slice(1)]
  default:
    return [null, tokenList]
  }
}

function parseIdentifier(tokenList) {
  const token = tokenList[0]

  dpi('Incoming token list', tokenList)
  dpi('Token', token)

  switch(token.type) {
  case 'IDENTIFIER':
    return [createASTNode('IDENTIFIER', token.value, token.line, token.column, token.column + token.value.length - 1), tokenList.slice(1)]
  default:
    return [null, tokenList]
  }
}

function parseArray(tokenList) {
  let values       = []
  let parseSuccess = true
  let token        = tokenList[0]
  let line, columnStart, columnEnd
  let errorObj = { message: 'Missing a closing ] probably' }
  let node

  dpa('Incoming tokenList\n', tokenList)

  if ('OPENSQBKT' !== token.type) return [null, tokenList]

  // line and column where open sqbkt was matched
  // ARRAY ast node will have these as line and column values
  line = token.line
  columnStart = token.column

  // remove open sqbkt from token list
  tokenList.shift()

  dpa('Token list after matching "["\n', tokenList)

  // now that you have parsed a square bracket, if things fail,
  // error from here array has had a partial match so something is amiss
  parseSuccess = false

  while(tokenList.length) {

    token = tokenList[0]

    dpa('Token\n', token)

    if ('WS' === token.type || 'NEWLINE' === token.type) {
      tokenList.shift() // remove WS token and continue
      continue
    }
    if ('CLOSESQBKT' === token.type) {
      parseSuccess = true
      columnEnd = token.column
      tokenList = tokenList.slice(1) // remove "]" from token list
      break
    }
    try {
      // as the second parameter to parseExpression, pass the parse functions
      // for expressions that are invalid in an array.
      // For example: parseAssignmentExpression
      [node, tokenList] = parseExpression(tokenList/* , [parseAssignmentExpression] */)
      values.push(node)
      dpa('Values\n', values)
    }
    catch(e) {
      errorObj = e
      break
    }
  }

  dpa('Array parse successful?', parseSuccess)
  dpa('Token before returning', token)
  dpa('Token list before returning or erroring', tokenList)

  if (parseSuccess) return [createASTNode('ARRAY', values, line, columnStart, columnEnd), tokenList]
  // else
  errorObj.line = errorObj.line || token.line
  // if there are still some token in the list,
  // that means that the error occured while parsing a token and not cuz we ran out of tokens
  // in that case token will be the token we errored out on
  // try to assign it's column (we are 1 indexed so don't worry about 0 being falsy)
  // if we were out of tokens then token = undefined and then we'll end up using
  // where the last match ended as out error column
  errorObj.column = errorObj.column || tokenList.length && token && token.column || node.columnEnd

  dpa('Error object before throwing', errorObj, node)

  throw errorObj
}

function parseHashMap(tokenList) {
  let node
  let values = []
  let token = tokenList[0]
  let parseSuccess = true
  let line, columnStart, columnEnd
  let errorObj = { message: 'Missing a closing } probably' }

  dphm('Incoming token list\n', tokenList)

  // match for "{"
  if ('OPENCURLIES' !== token.type) return [null, tokenList]

  // line and column where open sqbkt was matched
  // HASHMAP ast node will have these as line and column values
  line = token.line
  columnStart = token.column

  // remove open curlies from token list
  tokenList.shift()

  dphm('Token list after matching "{"\n', tokenList)

  // now that you have parsed a square bracket, if things fail,
  // error from here array has had a partial match so something is amiss
  parseSuccess = false

  while(tokenList.length) {
    token = tokenList[0]

    dphm('Token\n', token)

    try {
      if ('WS' === token.type || 'NEWLINE' === token.type) {
        tokenList.shift() // remove WS token and continue
        continue
      }
      // match for "}"
      else if ('CLOSECURLIES' === token.type) {
        parseSuccess = true
        columnEnd = token.column
        tokenList = tokenList.slice(1) // remove "]" from token list
        break
      }
      else if ('COLON' === token.type) {
        let key, value, temp

        tokenList = tokenList.slice(1)
        // :a 20
        temp = parseIdentifier(tokenList) // get 'a' from ':a'

        key = temp[0]
        tokenList = temp[1]

        dphm('Key', key)

        if (!key) {
          let failedAtToken = tokenList[0]

          errorObj = new Error(`Expected an identifier and found ${inspect(failedAtToken.value)}`)
          errorObj.line = failedAtToken.line
          errorObj.column = failedAtToken.column
          throw errorObj
        }

        while ('WS' === tokenList[0].type) tokenList.shift() // skip whitespaces between key and value

        temp = parseExpression(tokenList/* , [parseAssignmentExpression] */)

        value = temp[0]
        tokenList = temp[1]

        dphm('Value', value)

        if (!value) {
          let failedAtToken = tokenList[0]

          errorObj = new Error(`Expected an expression and found ${inspect(failedAtToken.value)}`)
          errorObj.line = failedAtToken.line
          errorObj.column = failedAtToken.column
          throw errorObj
        }

        values.push({ key, value })
      }
      else {
        let failedAtToken = tokenList[0]

        errorObj = new Error(`Expected a : and instead found ${inspect(failedAtToken.value)}`)
        errorObj.line = failedAtToken.line
        errorObj.column = failedAtToken.column
        throw errorObj
      }

      dphm('Values\n', values)
    }
    catch(e) {
      errorObj = e
      break
    }
  }

  dphm('Hashmap parse successful?', parseSuccess)
  dphm('Token before returning', token)
  dphm('Token list before returning or erroring', tokenList)

  if (parseSuccess) return [createASTNode('HASHMAP', values, line, columnStart, columnEnd), tokenList]
  // else
  errorObj.line = errorObj.line || token.line
  // if there are still some token in the list,
  // that means that the error occured while parsing a token and not cuz we ran out of tokens
  // in that case token will be the token we errored out on
  // try to assign it's column (we are 1 indexed so don't worry about 0 being falsy)
  // if we were out of tokens then token = undefined and then we'll end up using
  // where the last match ended as out error column
  // If we have already set the column, then leave it be
  errorObj.column = errorObj.column || tokenList.length && token && token.column || node.columnEnd

  dphm('Error object before throwing', errorObj, node)

  throw errorObj
}

function parseAtom(tokenList) {
  let result = null
  let productions = [parseNumber, parseBoolean, parseString, parseIdentifier, parseArray, parseHashMap]

  dpat('Incoming token list\n', tokenList)

  for (let production of productions) {
    dpat('Trying production', production.name)

    result = production(tokenList)

    // since we know all products for Atom are terminals
    // we break on the first match and don't look for
    // longest match
    if (result[0]) break
  }

  dpat('Result\n', result)
  return result
}

function parseExpressionWithinParens(tokenList) {
  let result
  let token = tokenList[0]
  let tempTokenList = []
  // keep track of whether the parens inside the parenthesized expression are balanced
  // so that we can capture stuff between the correct matching parens
  // For example in (print (add 10 20))
  // without unbalanced counter, captured tempTokenList will be [print, (, add, 10, 20]
  // instead of [print, (, add, 10, 20, )]
  let unbalanced = 0

  dpewp('Incoming token list\n', tokenList)

  try {
    // match "("
    if ('OPENPARENS' !== token.type) return [null, tokenList]

    // remove open parens
    tokenList.shift()

    // point token to new first token
    token = tokenList[0]

    dpewp('Token list after shifting out (\n', tokenList)
    dpewp('Token', token)

    // make a list of tokens between the parens
    while(token && ('CLOSEPARENS' !== token.type || unbalanced)) {
      let tempToken = tokenList.shift()

      dpewp('temp token', tempToken)

      if (!tempToken) break

      if ('OPENPARENS' === tempToken.type) unbalanced++
      if ('CLOSEPARENS' === tempToken.type) unbalanced--

      tempTokenList.push(tempToken)

      dpewp('temp token list\n', tempTokenList)
      dpewp('Balance count', unbalanced)

      token = tokenList[0]
    }

    dpewp('Final temp token list\n', tempTokenList)

    dpewp('Remaining tokens\n', tokenList)

    // look for ")"
    if (!tokenList.length || !tokenList[0] || unbalanced || 'CLOSEPARENS' !== tokenList[0].type) throw new SyntaxError('Missing )')

    // shift out the closing parens ")"
    tokenList.shift()

    dpewp('Remaining tokens after shifting out ")"\n', tokenList)

    result = parseExpression(tempTokenList) // parse only token between parens for expression
    result[1] = tokenList // put back where token list should continue from in the result

    dpewp('Result\n', result)

    return result
  }
  catch(e) {
    token = tempTokenList[tempTokenList.length - 1]
    e.line = e.line || token.line
    e.column = e.column || token.column

    dpewp('Error object before throwing', e)
    throw e
  }
}

function parseInvocationExpression(tokenList) {
  let token = tokenList[0]
  let values = []
  let identifier
  let argCount = 0
  let line = token.line
  let columnStart = token.column
  let columnEnd = token.column
  let result

  dpie('Incoming token list\n', tokenList)
  dpie('Token', token)

  if ('IDENTIFIER' !== token.type) return [null, tokenList]

  let temp = parseIdentifier(tokenList)

  identifier = temp[0]
  tokenList = temp[1]

  dpie('Identifier', identifier)

  values.push(identifier)
  columnEnd = identifier.columnEnd

  dpie('Values', values)

  while(tokenList.length) {
    let expr

    token = tokenList[0]

    if ('NEWLINE' === token.type) {
      tokenList.shift()
      break
    }
    if ('WS' === token.type) {
      tokenList.shift()
      continue
    }

    [expr, tokenList] = parseExpression(tokenList)
    values.push(expr)

    dpie('Expression\n', expr)

    columnEnd = expr.columnEnd
    argCount++
  }

  values.push({ argCount })

  dpie('Values', values)

  result = [createASTNode('INVOCATIONEXPRESSION', values, line, columnStart, columnEnd), tokenList]

  dpie('Result\n', result)

  return result
}

// productionsToSkip is an array of productions or parse functions
// that we want to skip
function parseExpression(tokenList, productionsToSkip = []) {
  let result = []
  // ordering of these productions matter
  // since we break on first match, longest matching production
  // MUST come first or else it's gg life wp world ttyl fml xyz
  let productions = [parseInvocationExpression, parseAtom, parseExpressionWithinParens]

  dpe('Token list\n', tokenList)

  if (!tokenList.length) return [[], tokenList]

  // remove those productions that we want to skip
  if (productionsToSkip.length) {
    productions = productions.filter(production => {
      for (let i = 0; i < productionsToSkip.length; i++) {
        if (production === productionsToSkip[i]) return false
        return true
      }
    })
  }


  for (let production of productions) {
    dpe('Trying production', production.name)

    result = production(tokenList)

    if (null !== result[0]) break // break on first production that matches
  }

  dpe('Result\n', result)
  if (!result[0]) {
    let err = new SyntaxError(`Unexpected token ${inspect(result[1][0].value)}`)

    err.line = tokenList[0].line
    err.column = tokenList[0].column

    throw err
  }
  return result
}

function parseProgram(tokenList) {
  let lastToken = tokenList[tokenList.length - 1]
  let sourceLength = lastToken.column + lastToken.value.length - 1 // since columns are 1-indexed
  let exprs = []
  let result

  while(tokenList.length) {
    dpp(`Tokens before parsing expression:\n${JSON.stringify(tokenList)}\n`)

    // ignore new lines
    if (tokenList[0].type === 'NEWLINE') {
      tokenList.shift()
      continue
    }

    try {
      dpp(`Tokens before calling parseExpression\n${JSON.stringify(tokenList)}`)

      result = parseExpression(tokenList.slice()) // [ astNode, remaining token list ]

      dpp('Result\n', result)

      let node = result[0]

      tokenList = result[1] // new token list

      dpp(`Tokens after parsing expression:\n${JSON.stringify(tokenList)}\n`)

      // if we got a node, push to our exprs array else error
      if (node && node instanceof ASTNode) exprs.push(node)

      dpp(`exprs: ${JSON.stringify(exprs)}\n${'-'.repeat(10)}`)

    }
    catch(e) {
      dpp('Token list before erroring out\n', tokenList, e)
      return yellError(tokenList, e)
    }
  }

  return createASTNode('PROGRAM', exprs, 1, 1, sourceLength)
}

function yellError(tokenList, e) {
  let sourceString = tokenList.reduce((p, token) => {
    if (token.line !== e.line || 'NEWLINE' === token.type) return p // skip lines on which we dont have the error or have newlines bruv
    if ('STRING' === token.type) p += '"' + token.value + '"'
    else p += token.value
    return p
  }, '')
  let errorMsg = `SyntaxError: Invalid syntax at line ${e.line}, column ${e.column}: ${e.message}\n${sourceString}\n${'-'.repeat(e.column - 1)}^`

  console.log(errorMsg)
  process.exit(1)
}

let lexer = getLexer(tokenRules)


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

// console.log('\n', parseProgram(lexer('')))
// console.log('-'.repeat(80))
// console.log('1\n', parseProgram(lexer('1')))
// console.log('-'.repeat(80))
// console.log('10.22\n123\ntrue\n"asd asd09"\nwhat\n', parseProgram(lexer('10.22\n123\ntrue\n"asd asd09"\nwhat')))
// console.log('-'.repeat(80))
// console.log('(1)(("asd"))\n', parseProgram(lexer('(1)(("asd"))')))
// console.log('-'.repeat(80))
// console.log('[]\n', JSON.stringify(parseProgram(lexer('[]')), null, 4))
// console.log()

/* Arrays */

// console.log('[1 2 3 4]\n', JSON.stringify(parseProgram(lexer('[1 2 3 4]')), null, 4))
// console.log('-'.repeat(80))
// console.log('[1 [1 -20.12 3]]\n', JSON.stringify(parseProgram(lexer('[1 [1 -20.12 3]]')), null, 4))
// console.log('-'.repeat(80))
// console.log('[1 2 3 4 [5 "dude" true [90.11]]]', JSON.stringify(parseProgram(lexer('[1 2 3 4 [5 "dude" true [90.11]]]')), null, 4))
// console.log('-'.repeat(80))
// console.log('[\n  1\n  2\n]', JSON.stringify(parseProgram(lexer('[\n  1\n  2\n]')), null, 4))
// console.log('-'.repeat(80))
// console.log('[\n  1\n  2\n["a" "b"]]', JSON.stringify(parseProgram(lexer('[\n  1\n  2\n["a" "b"]]')), null, 4))
// console.log('-'.repeat(80))
// console.log('[ 1 2 3 4 ]\n', JSON.stringify(parseProgram(lexer('[ 1 2 3 4 ]')), null, 4))

/* Hashmaps */

// console.log('{ :a 20 :b "dude" }\n', JSON.stringify(parseProgram(lexer('{ :a 20 :b "dude" }\n')), null, 4))
// console.log('-'.repeat(80))
// console.log('{\n  :a 20\n  :b "dude"\n}\n', JSON.stringify(parseProgram(lexer('{\n  :a 20\n  :b "dude"\n}\n')), null, 4))
// console.log('-'.repeat(80))
// console.log('{\n  :a [1 "test man" -123]\n  :b "dude"\n}\n', JSON.stringify(parseProgram(lexer('{\n  :a 20\n  :b "dude"\n}\n')), null, 4))
// console.log('-'.repeat(80))
// console.log('{\n  :a [1 "test man" -123]\n  :b "dude" :c {:_goat "https://what.org" :as123 (((0)))}\n}\n', JSON.stringify(parseProgram(lexer('{\n  :a [1 "test man" -123]\n  :b "dude" :c {:_goat "https://what.org" :as123 (((0)))}\n}\n')), null, 4))


/* Invocations */

// console.log('-'.repeat(80))
// console.log('add 10 20\n', JSON.stringify(parseProgram(lexer('add 10 20\n')), null, 4))
// console.log('-'.repeat(80))
// console.log('(add 10 20)\n', JSON.stringify(parseProgram(lexer('(add 10 20\n)')), null, 4))

/* Mix */

// console.log('-'.repeat(80))
// console.log('add\n', JSON.stringify(parseProgram(lexer('add\n')), null, 4))
// console.log('-'.repeat(80))
// console.log('add 10 20\n[1 2 3]\n{\n:a -123.123\n}', JSON.stringify(parseProgram(lexer('add 10 20\n[1 2 3]\n{\n:a -123.123\n}')), null, 4))
// console.log('-'.repeat(80))
// console.log('print (add 10 20)\n', JSON.stringify(parseProgram(lexer('print (add 10 20)\n')), null, 4))
// console.log('-'.repeat(80))
// console.log('(print (add "mud"))\n', JSON.stringify(parseProgram(lexer('(print (add "mud"))\n')), null, 4))
// console.log('-'.repeat(80))
// console.log('(add (sub 10 "mud") ["a" "b" { :name "mudit" :age 27 :x -123.0129 :y 292} (((1098391)))] ((((10)))))\n', JSON.stringify(parseProgram(lexer('(add (sub 10 "mud") ["a" "b" { :name "mudit" :age 27 :x -123.0129 :y 292} (((1098391)))] ((((10)))))\n')), null, 4))



/* errors */

// console.log('-'.repeat(80))
// console.log('(11', parseProgram(lexer('(11')))
// console.log('-'.repeat(80))
// console.log('[1 2 3 4]\n', JSON.stringify(parseProgram(lexer('[1 2 3 4')), null, 4))
// console.log('-'.repeat(80))
// console.log('[1 [1 2 3]\n', JSON.stringify(parseProgram(lexer('[1 [1 2 3]')), null, 4))
// console.log('-'.repeat(80))
// console.log('[1 2 3 4 [5 "dude" true [90.11]]', JSON.stringify(parseProgram(lexer('[1 2 3 4 [5 "dude" true [90.11]]')), null, 4))
// console.log('-'.repeat(80))
// console.log(', 12]', JSON.stringify(parseProgram(lexer(', 12]')), null, 4))
// console.log('-'.repeat(80))
// console.log('[1, 2]', JSON.stringify(parseProgram(lexer('[1, 2]')), null, 4))
// console.log('-'.repeat(80))
// console.log('-'.repeat(80))
// console.log('[\n  1\n  2,\n]', JSON.stringify(parseProgram(lexer('[\n  1\n  2,\n]')), null, 4))
// console.log('-'.repeat(80))
// console.log('{ : a 20 :b "dude" }\n', JSON.stringify(parseProgram(lexer('{ : a 20 :b "dude" }\n')), null, 4))
// console.log('-'.repeat(80))
// console.log('{\n  a 20\n  :b "dude"\n}\n', JSON.stringify(parseProgram(lexer('{\n  a 20\n  :b "dude"\n}\n')), null, 4))
// console.log('-'.repeat(80))
// console.log('{\n  :a 20 :b \n"dude"\n}\n', JSON.stringify(parseProgram(lexer('{\n  :a 20 :b \n"dude"\n}\n')), null, 4))
// console.log('-'.repeat(80))
// console.log('(add (sub 10 "mud") ["a" "b" { :name "mudit" :age 27 :x -123.0129 :y 292} (((1098391))] ((((10)))))\n', JSON.stringify(parseProgram(lexer('(add (sub 10 "mud") ["a" "b" { :name "mudit" :age 27 :x -123.0129 :y 292} (((1098391))] ((((10)))))\n')), null, 4))
// console.log('-'.repeat(80))
// console.log('((((((())))))', JSON.stringify(parseProgram(lexer('((((((())))))'), null, 4)))
// console.log('-'.repeat(80))
// console.log('[(])', parseProgram(lexer('[(])')))
// console.log('-'.repeat(80))
console.log('add 10 20\nprint "dude what"\n[(])\ntest [1 2 3 4] {:a 10 :b 20}', parseProgram(lexer('add 10 20\nprint "dude what"\n[(])\ntest [1 2 3 4] {:a 10 :b 20}')))
