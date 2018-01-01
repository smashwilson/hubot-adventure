/* eslint-env mocha */

const {assert} = require('chai')
const {MethodRegistry} = require('../../src/gnomish/methodregistry')
const {Type} = require('../../src/gnomish/type')

describe('MethodRegistry', function () {
  const tInt = new Type('Int')
  const tReal = new Type('Real')
  const tString = new Type('String')

  const right = () => {}
  const wrong = () => {}

  it('registers and looks up method signatures', function () {
    const registry = new MethodRegistry()

    registry.register(right, tString, 'selector', [tInt, tInt])
    registry.register(wrong, tString, 'selector', [tReal])
    registry.register(wrong, tInt, 'selector', [tInt, tInt])

    assert.strictEqual(registry.lookup(tString, 'selector', [tInt, tInt]), right)
  })

  it('throws when no method is found', function () {
    const registry = new MethodRegistry()
    assert.throws(() => registry.lookup(tString, 'unknown', []), /Type String has no method "unknown"/)
  })
})
