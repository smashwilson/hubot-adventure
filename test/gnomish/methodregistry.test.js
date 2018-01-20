/* eslint-env mocha */

const {assert} = require('chai')
const {MethodRegistry} = require('../../src/gnomish/methodregistry')
const {SymbolTable} = require('../../src/gnomish/symboltable')
const {makeType} = require('../../src/gnomish/type')

describe('MethodRegistry', function () {
  const tInt = makeType('Int')
  const tReal = makeType('Real')
  const tString = makeType('String')
  const tBool = makeType('Bool')
  const tOption = makeType('Option')
  const tBlock = makeType('Block')
  const tList = makeType('List')

  const right = () => {}
  const wrong = () => {}

  let st, registry

  beforeEach(function () {
    st = new SymbolTable()

    const tType = makeType('Type')
    st.setStatic('Type', tType, tType)
    st.setStatic('List', tType, tList)

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

    it('derives the signature return type from bound type variables', function () {
      const tA = makeType("'A")
      const tB = makeType("'B")

      registry.register(makeType(tOption, [tA]), 'selector', [tInt, tB], makeType(tBlock, [tB, tA]), right)

      const signature = registry.lookup(st, makeType(tOption, [tString]), 'selector', [tInt, tBool])
      const retType = signature.getReturnType()
      assert.isTrue(retType.isCompound())
      assert.strictEqual(retType.getBase(), tBlock)
      assert.lengthOf(retType.getParams(), 2)
      assert.strictEqual(retType.getParams()[0], tBool)
      assert.strictEqual(retType.getParams()[1], tString)
    })
  })

  it('throws when no method is found', function () {
    assert.throws(() => registry.lookup(st, tString, 'unknown', []), /Type String has no method "unknown"/)
  })
})
