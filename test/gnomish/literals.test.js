/* eslint-env mocha */

const {assert} = require('chai')
const {parse} = require('../../src/gnomish')

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

    it('parses an empty block that accepts variables', function () {
      const root = parse('{ x: Int, y: Int | }')
      assert.equal(root.sexp(), '(exprlist (block (arg x : (var Int)) (arg y : (var Int)) (exprlist)))')
    })
  })
})