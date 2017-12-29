/* eslint-env mocha */

const {assert} = require('chai')
const {parse} = require('../../src/gnomish')
const Tracer = require('pegjs-backtrace')

function assertSexp (text, expected) {
  const tracer = new Tracer(text, {
    showTrace: process.env.GNOMISH_TRACE === 'on'
  })
  try {
    const actual = parse(text, {tracer}).sexp()
    const normalize = str => str.trim().replace(/\s+/g, ' ')
    assert.equal(normalize(actual), normalize(expected))
  } catch (e) {
    console.error(tracer.getBacktraceString())
    assert.fail(null, null, `Unable to parse expression: ${e.message}`)
  }
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

  describe('comparison operators', function () {
    it('parses comparison operator application', function () {
      assertSexp('a == b', `
        (exprlist
          (call (var a) == (var b)))
      `)
    })

    it('is non-associative')

    it('has lower precedence than assignment')
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
