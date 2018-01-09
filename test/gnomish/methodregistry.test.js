/* eslint-env mocha */

const {assert} = require('chai')
const {MethodRegistry} = require('../../src/gnomish/methodregistry')
const {SymbolTable, StaticEntry} = require('../../src/gnomish/symboltable')
const {makeType} = require('../../src/gnomish/type')

describe('MethodRegistry', function () {
  const tInt = makeType('Int')
  const tReal = makeType('Real')
  const tString = makeType('String')
  const tOption = makeType('Option')

  const right = () => {}
  const wrong = () => {}

  let st, registry

  beforeEach(function () {
    st = new SymbolTable()

    const tType = makeType('Type')
    st.put('Type', new StaticEntry(tType, tType))

    registry = new MethodRegistry()
  })

  describe('registration and search', function () {
    it('uses an exact match', function () {
      registry.register(tString, 'selector', [tInt, tInt], tInt, right)
      registry.register(tString, 'selector', [tReal], tReal, wrong)
      registry.register(tInt, 'selector', [tInt, tInt], tString, wrong)

      assert.strictEqual(registry.lookup(st, tString, 'selector', [tInt, tInt]).getCallback(), right)
    })

    it('unifies the receiver and argument types', function () {
      const tA = makeType("'A")

      registry.register(makeType(tOption, [tA]), 'selector', [tInt, tA], tString, right)
      registry.register(makeType(tOption, [tString]), 'selector', [tInt, tA], tString, wrong)
      registry.register(makeType(tOption, [tA]), 'selector', [tInt, tString], tString, wrong)

      assert.strictEqual(registry.lookup(st, makeType(tOption, [tReal]), 'selector', [tInt, tReal]).getCallback(), right)
    })
  })

  it('throws when no method is found', function () {
    assert.throws(() => registry.lookup(st, tString, 'unknown', []), /Type String has no method "unknown"/)
  })
})
