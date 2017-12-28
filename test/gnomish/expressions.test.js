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
  })
})
