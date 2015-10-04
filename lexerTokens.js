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

export default [
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
    r: /^-?\d+/,
    n: 'INTEGER'
  },
  {
    r: /^-?\d+\.\d+/,
    n: 'FLOAT'
  },
  {
    r: /^(true|false)/,
    n: 'BOOLEAN'
  },
  {
    // string dont support using double quotes within in, escaped or otherwise
    // the reason is, if I have to do that, then I have to handle it at parse stage
    // and not at lex stage since regular expression cannot match balance quotes
    // so there is no way at the lex level to enforce that string must be within
    // a pair of double quotes without making double quotes illegal withing the
    // string body
    // TODO: Write a string parse and remove this from here
    // Instead, lex double quotes as separate token and then use 'em in string parser
    // and implement all logic there
    r: /^"([^"]*)"/,
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
  },
  {
    r: /^\\/,
    n: 'BACKSLASH'
  }
]
