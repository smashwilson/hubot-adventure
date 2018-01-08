/* eslint-env mocha */

const {assert} = require('chai')
const {MethodRegistry} = require('../../src/gnomish/methodregistry')
const {makeType} = require('../../src/gnomish/type')

describe('MethodRegistry', function () {
  const tInt = makeType('Int')
  const tReal = makeType('Real')
  const tString = makeType('String')

  const right = () => {}
  const wrong = () => {}

  it('registers and looks up method signatures', function () {
    const registry = new MethodRegistry()

    registry.register(tString, 'selector', [tInt, tInt], tInt, right)
    registry.register(tString, 'selector', [tReal], tReal, wrong)
    registry.register(tInt, 'selector', [tInt, tInt], tString, wrong)

    assert.strictEqual(registry.lookup(tString, 'selector', [tInt, tInt]).getCallback(), right)
  })

  it('throws when no method is found', function () {
    const registry = new MethodRegistry()
    assert.throws(() => registry.lookup(tString, 'unknown', []), /Type String has no method "unknown"/)
  })
})