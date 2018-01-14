/* eslint-env mocha */

const {assert} = require('chai')
const {parse} = require('../../src/gnomish')
const {assertSexp} = require('./helper')

function onlyExpr (node) {
  assert.lengthOf(node.exprs, 1)
  return node.exprs[0]
}

describe('Gnomish literals', function () {
  describe('integers', function () {
    it('parses positive integers', function () {
      const root = parse('42')
      assert.equal(onlyExpr(root.node).value, 42)
      assert.equal(root.sexp(), '(exprlist (42))')
    })

    it('parses negative integers', function () {
      const root = parse('-12')
      assert.equal(onlyExpr(root.node).value, -12)
      assert.equal(root.sexp(), '(exprlist (-12))')
    })
  })

  describe('reals', function () {
    it('parses real numbers', function () {
      const root = parse('123.456')
      assert.equal(onlyExpr(root.node).value, 123.456)
      assert.equal(root.sexp(), '(exprlist (123.456))')
    })

    it('parses real numbers between -1 and 1', function () {
      const root = parse('0.344')
      assert.equal(onlyExpr(root.node).value, 0.344)
      assert.equal(root.sexp(), '(exprlist (0.344))')
    })

    it('parses negative real numbers', function () {
      const root = parse('-5.34')
      assert.equal(onlyExpr(root.node).value, -5.34)
      assert.equal(root.sexp(), '(exprlist (-5.34))')
    })
  })

  describe('strings', function () {
    it('parses double-quote delimited strings', function () {
      const root = parse('"hi"')
      assert.equal(onlyExpr(root.node).value, 'hi')
      assert.equal(root.sexp(), '(exprlist ("hi"))')
    })

    it('allows escaped internal quotes', function () {
      const root = parse('"foo \\" bar"')
      assert.equal(onlyExpr(root.node).value, 'foo " bar')
      assert.equal(root.sexp(), '(exprlist ("foo \\" bar"))')
    })

    // eslint-disable-next-line no-template-curly-in-string
    it('supports interpolated expressions')

    it('supports multiple interpolated expressions')
  })

  describe('vars', function () {
    it('parses a variable reference', function () {
      const root = parse('foo')
      assert.equal(onlyExpr(root.node).name, 'foo')
      assert.equal(root.sexp(), '(exprlist (var foo))')
    })
  })

  describe('blocks', function () {
    it('parses the empty block', function () {
      const root = parse('{}')
      assert.equal(root.sexp(), '(exprlist (block (exprlist)))')
    })

    it('parses a block that accepts variables with type annotations', function () {
      const root = parse('{ x: Int, y: Int | y }')
      assert.equal(root.sexp(), '(exprlist (block (arg x : (type Int)) (arg y : (type Int)) (exprlist (var y))))')
    })

    it('parses a block that accepts a variable with a default value', function () {
      assertSexp('{ x = 42 | x }', `
        (exprlist
          (block (arg x = (42)) (exprlist (var x))))
      `)
    })

    it('parses a block that accepts a variable with a type and a default value', function () {
      assertSexp('{ x: Int = 42 | x }', `
        (exprlist
          (block (arg x : (type Int) = (42)) (exprlist (var x))))
      `)
    })

    it('parses a block containing an expression', function () {
      assertSexp('{ 3 + 4 }', `
        (exprlist
          (block (exprlist (call (3) + (4)))))
      `)
    })

    it('parses a block containing several expressions', function () {
      assertSexp(`
        {
          3 + 4
          "hello" + " world"
        }
      `, `
        (exprlist
          (block
            (exprlist
              (call (3) + (4))
              (call ("hello") + (" world")))))
      `)
    })

    it('parses a block with an empty variable list and an initial assignment', function () {
      assertSexp('{| x = 7 }', `
        (exprlist
          (block
            (exprlist
              (assign x (7)))))
      `)
    })
  })
})
