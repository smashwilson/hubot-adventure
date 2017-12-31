/* eslint-env mocha */

const {assert} = require('chai')
const {Type} = require('../../src/gnomish/type')

describe('Type', function () {
  it('prints itself for nice debugging', function () {
    const t = new Type('Block', [
      new Type("'R"),
      new Type('List', [new Type("'A")]),
      new Type("'A"),
      new Type('Int')
    ])

    assert.equal(t.toString(), "Block('R, List('A), 'A, Int)")
  })

  it('detects itself as a type parameter', function () {
    const t = new Type("'A")
    assert.isTrue(t.isParameter())

    const u = new Type('Int')
    assert.isFalse(u.isParameter())
  })
})
