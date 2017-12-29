/* eslint-env mocha */

const {assert} = require('chai')
const {parse} = require('../../src/gnomish')

function assertSexp (actual, expected) {
  const normalize = str => str.trim().replace(/\s+/g, ' ')
  assert.equal(normalize(actual), normalize(expected))
}

describe('Gnomish expressions', function () {
  describe('if', function () {
    it('parses an if expression with only a then clause', function () {
      const node = parse('if {true} then {42}')
      assertSexp(node.sexp(), `
        (exprlist
          (if
            (block (exprlist (var true)))
            (block (exprlist (42)))
            (block (exprlist))))
      `)
    })

    it('parses an if expression with an else clause', function () {
      const node = parse('if {false} then {12} else {42}')
      assertSexp(node.sexp(), `
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
      const node = parse('while {true} do {something}')
      assertSexp(node.sexp(), `
        (exprlist
          (while
            (block (exprlist (var true)))
            (block (exprlist (var something)))))
      `)
    })
  })

  describe('assignment', function () {
    it('parses assignments to variables', function () {
      const node = parse('foo = 3')
      assertSexp(node.sexp(), `
        (exprlist
          (assign foo (3)))
      `)
    })

    it('is right-associative', function () {
      const node = parse('foo = bar = 42')
      assertSexp(node.sexp(), `
        (exprlist
          (assign foo (assign bar (42))))
      `)
    })
  })

  describe('comparison operators', function () {
    it('parses comparison operator application')

    it('is non-associative')

    it('has lower precedence than assignment')
  })

  describe('method calls', function () {
    it('parses a method call with an explicit receiver', function () {
      const node = parse('receiver.methodname(3, "x", true)')
      assertSexp(node.sexp(), `
        (exprlist
          (call (var receiver) methodname (3) ("x") (var true)))
      `)
    })

    it('parses a method call with no arguments', function () {
      const node = parse('receiver.methodname()')
      assertSexp(node.sexp(), `
        (exprlist
          (call (var receiver) methodname))
      `)
    })

    it('parses a method call with an implicit receiver', function () {
      const node = parse('methodname(3, 4)')
      assertSexp(node.sexp(), `
        (exprlist
          (call <implicit> methodname (3) (4)))
      `)
    })
  })
})
