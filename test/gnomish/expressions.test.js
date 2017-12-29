/* eslint-env mocha */

const {assert} = require('chai')
const {parse} = require('../../src/gnomish')
const Tracer = require('pegjs-backtrace')

function assertSexp (text, expected, shouldParse = true) {
  const tracer = new Tracer(text, {
    showTrace: process.env.GNOMISH_TRACE === 'on'
  })
  let actual = ''
  try {
    actual = parse(text, {tracer}).sexp()
    if (!shouldParse) {
      assert.fail(null, null, `Should not parse ${text}`)
    }
  } catch (e) {
    if (shouldParse) {
      console.error(tracer.getBacktraceString())
      assert.fail(null, null, `Unable to parse expression: ${e.message}`)
    }
  }

  const normalize = str => str.trim().replace(/\s+/g, ' ')
  assert.equal(normalize(actual), normalize(expected))
}

describe('Gnomish expressions', function () {
  describe('if', function () {
    it('parses an if expression with only a then clause', function () {
      assertSexp('if {true} then {42}', `
        (exprlist
          (if
            (block (exprlist (var true)))
            (block (exprlist (42)))
            (block (exprlist))))
      `)
    })

    it('parses an if expression with an else clause', function () {
      assertSexp('if {false} then {12} else {42}', `
        (exprlist
          (if
            (block (exprlist (var false)))
            (block (exprlist (12)))
            (block (exprlist (42)))))
      `)
    })
  })

  describe('while', function () {
    it('parses a while loop', function () {
      assertSexp('while {true} do {something}', `
        (exprlist
          (while
            (block (exprlist (var true)))
            (block (exprlist (var something)))))
      `)
    })
  })

  describe('let', function () {
    it('parses a let expression', function () {
      assertSexp('let x: Int = 42', `
        (exprlist
          (let x : (type Int) = (42)))
      `)
    })

    it('parses a let expression with an inferred type', function () {
      assertSexp('let x = 37', `
        (exprlist
          (let x : <inferred> = (37)))
      `)
    })
  })

  describe('assignment', function () {
    it('parses assignments to variables', function () {
      assertSexp('foo = 3', `
        (exprlist
          (assign foo (3)))
      `)
    })

    it('is right-associative', function () {
      assertSexp('foo = bar = 42', `
        (exprlist
          (assign foo (assign bar (42))))
      `)
    })
  })

  describe('logical or', function () {
    it('parses logical or application', function () {
      assertSexp('true || false', `
        (exprlist
          (call (var true) || (var false)))
      `)
    })

    it('is left-associative', function () {
      assertSexp('a || b || c', `
        (exprlist
          (call
            (call (var a) || (var b)) ||
            (var c)))
      `)
    })

    it('has higher precedence than comparison', function () {
      assertSexp('a == 4 || b == 7', `
        (exprlist
          (call
            (call (var a) == (4)) ||
            (call (var b) == (7))))
      `)
    })

    it('has lower precedence than logical and', function () {
      assertSexp('a && b || c', `
        (exprlist
          (call
            (call (var a) && (var b)) ||
            (var c)))
      `)
    })
  })

  describe('logical and', function () {
    it('parses logical and application', function () {
      assertSexp('a && b', `
        (exprlist
          (call (var a) && (var b)))
      `)
    })

    it('is left-associative', function () {
      assertSexp('a && b && c', `
        (exprlist
          (call
            (call (var a) && (var b)) &&
            (var c)))
      `)
    })
  })

  describe('comparison operators', function () {
    it('parses comparison operator application', function () {
      assertSexp('a == b', `
        (exprlist
          (call (var a) == (var b)))
      `)
    })

    it('is non-associative', function () {
      assertSexp('a == b < c', '', false)
    })

    it('has lower precedence than assignment', function () {
      assertSexp('x = y == 1', `
        (exprlist
          (assign x
            (call (var y) == (1))))
      `)
    })
  })

  describe('method calls', function () {
    it('parses a method call with an explicit receiver', function () {
      assertSexp('receiver.methodname(3, "x", true)', `
        (exprlist
          (call (var receiver) methodname (3) ("x") (var true)))
      `)
    })

    it('parses a method call with no arguments', function () {
      assertSexp('receiver.methodname()', `
        (exprlist
          (call (var receiver) methodname))
      `)
    })

    it('parses a method call with an implicit receiver', function () {
      assertSexp('methodname(3, 4)', `
        (exprlist
          (call <implicit> methodname (3) (4)))
      `)
    })
  })
})
