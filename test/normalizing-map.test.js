/* eslint-env mocha */

const { assert } = require('chai')

const { NormalizingMap, UPPERCASE } = require('../src/normalizing-map')

describe('NormalizingMap', function () {
  it('delegates methods to its inner Map', function () {
    const m = new NormalizingMap()

    m.set('a', 'b')
    m.set('z', 'x')
    assert.strictEqual(m.get('a'), 'b')
    assert.isTrue(m.has('a'))

    assert.deepEqual(Array.from(m.keys()), ['a', 'z'])
    assert.deepEqual(Array.from(m.values()), ['b', 'x'])

    assert.isTrue(m.delete('a'))
    assert.isFalse(m.has('a'))

    m.clear()

    assert.lengthOf(Array.from(m.keys()), 0)
    assert.lengthOf(Array.from(m.values()), 0)
  })

  it('is case-insensitive', function () {
    const m = new NormalizingMap()

    m.set('aaa', 'b')

    assert.strictEqual(m.get('AAA'), 'b')
    assert.strictEqual(m.get('AaA'), 'b')
    assert.strictEqual(m.get('aaA'), 'b')
  })

  it('is resilient to changes in whitespace', function () {
    const m = new NormalizingMap()

    m.set('aaa bbb ccc', 'value')

    assert.strictEqual(m.get('   aaa \t bbb \n\n ccc   \n'), 'value')
  })

  it('normalizes on input', function () {
    const m = new NormalizingMap()

    m.set('\t\taaa\n\nbbb  ccc ', 'one')
    m.set('zz BBB', 'two')

    assert.deepEqual(Array.from(m.keys()), ['aaa bbb ccc', 'zz bbb'])
  })

  it('may be configured to normalize as uppercase', function () {
    const m = new NormalizingMap(UPPERCASE)

    m.set('\t\taaa\n\nbbb  ccc ', 'one')
    m.set('zz BBB', 'two')

    assert.deepEqual(Array.from(m.keys()), ['AAA BBB CCC', 'ZZ BBB'])
  })
})
