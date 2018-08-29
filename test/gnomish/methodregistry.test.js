/* eslint-env mocha */

const { assert } = require('chai')
const { MethodRegistry } = require('../../src/gnomish/methodregistry')
const { SymbolTable } = require('../../src/gnomish/symboltable')
const { makeType } = require('../../src/gnomish/type')

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

    describe('priority', function () {
      it('prefers exact matches over parameter assignments', function () {
        const tA = makeType("'A")

        registry.register(tInt, 'selector', [tInt], tBool, right)
        registry.register(tInt, 'selector', [tA], tBool, wrong)

        assert.strictEqual(registry.lookup(st, tInt, 'selector', [tInt]).getCallback(), right)
      })

      it('prefers the greatest number of exact type matches', function () {
        const tA = makeType("'A")

        registry.register(tInt, 'selector', [tA, tA], tBool, wrong)
        registry.register(tInt, 'selector', [tInt, tA], tBool, right)

        assert.strictEqual(registry.lookup(st, tInt, 'selector', [tInt, tInt]).getCallback(), right)
      })

      it('among signatures with the same exact type match count, prefers the fewest bindings created', function () {
        const tA = makeType("'A")
        const tB = makeType("'B")

        registry.register(tInt, 'selector', [tA, tB], tBool, wrong)
        registry.register(tInt, 'selector', [tA, tA], tBool, right)

        assert.strictEqual(registry.lookup(st, tInt, 'selector', [tInt, tInt]).getCallback(), right)
      })

      it('prefers exact enumerations to repeated type matches', function () {
        registry.register(tInt, 'selector', [tInt.repeatable()], tBool, wrong)
        registry.register(tInt, 'selector', [tInt, tInt, tInt], tBool, right)

        assert.strictEqual(registry.lookup(st, tInt, 'selector', [tInt, tInt, tInt]).getCallback(), right)
      })

      it('gives the lowest priority to splat matches', function () {
        const tA = makeType("'A")

        const splat = () => {}
        const exact = () => {}

        registry.register(tInt, 'selector', [tA.splat()], tBool, splat)
        registry.register(tInt, 'selector', [tInt, tString], tBool, exact)

        assert.strictEqual(registry.lookup(st, tInt, 'selector', [tInt, tString]).getCallback(), exact)
        assert.strictEqual(registry.lookup(st, tInt, 'selector', [tInt, tString, tBool]).getCallback(), splat)
        assert.strictEqual(registry.lookup(st, tInt, 'selector', [tInt]).getCallback(), splat)
        assert.strictEqual(registry.lookup(st, tInt, 'selector', [tInt, tBool]).getCallback(), splat)
      })

      it('includes compound type bases as exact type matches', function () {
        const tA = makeType("'A")
        const tOptionA = makeType(tOption, [tA])

        const fallback = () => {}
        const compound = () => {}

        registry.register(tA, 'selector', [tA], tBool, fallback)
        registry.register(tOptionA, 'selector', [tOptionA], tBool, compound)

        assert.strictEqual(registry.lookup(st, tInt, 'selector', [tInt]).getCallback(), fallback)
        assert.strictEqual(registry.lookup(st, makeType(tOption, [tInt]), 'selector', [makeType(tOption, [tInt])]).getCallback(), compound)
      })
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

  describe('inheritance', function () {
    it('finds methods in a parent registry', function () {
      const parent = new MethodRegistry()
      parent.register(tInt, 'even', [], tBool, right)

      const child = parent.push()
      const match = child.lookup(st, tInt, 'even', [])
      assert.strictEqual(match.getCallback(), right)
    })

    it('collects all methods from the parent and local registries to find a match', function () {
      const parent = new MethodRegistry()
      parent.register(tInt, 'toString', [], tBool, right)

      const child = parent.push()
      parent.register(makeType("'A"), 'toString', [], tBool, wrong)

      const match = child.lookup(st, tInt, 'toString', [])
      assert.strictEqual(match.getCallback(), right)
    })
  })
})
