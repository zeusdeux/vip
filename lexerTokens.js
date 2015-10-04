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
  },
  {
    r: /^\\/,
    n: 'BACKSLASH'
  }
]
