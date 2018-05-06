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

  const RIGHT = Symbol('right')
  const right = () => RIGHT

  const WRONG = Symbol('wrong')
  const wrong = () => WRONG

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

      assert.strictEqual(registry.lookup(st, tString, 'selector', [tInt, tInt]).invoke(), RIGHT)
    })

    it('unifies the receiver and argument types', function () {
      const tA = makeType("'A")

      registry.register(makeType(tOption, [tA]), 'selector', [tInt, tA], tString, right)
      registry.register(makeType(tOption, [tString]), 'selector', [tInt, tA], tString, wrong)
      registry.register(makeType(tOption, [tA]), 'selector', [tInt, tString], tString, wrong)

      assert.strictEqual(registry.lookup(st, makeType(tOption, [tReal]), 'selector', [tInt, tReal]).invoke(), RIGHT)
    })

    describe('priority', function () {
      it('prefers exact matches over parameter assignments', function () {
        const tA = makeType("'A")

        registry.register(tInt, 'selector', [tInt], tBool, right)
        registry.register(tInt, 'selector', [tA], tBool, wrong)

        assert.strictEqual(registry.lookup(st, tInt, 'selector', [tInt]).invoke(), RIGHT)
      })

      it('prefers the greatest number of exact type matches', function () {
        const tA = makeType("'A")

        registry.register(tInt, 'selector', [tA, tA], tBool, wrong)
        registry.register(tInt, 'selector', [tInt, tA], tBool, right)

        assert.strictEqual(registry.lookup(st, tInt, 'selector', [tInt, tInt]).invoke(), RIGHT)
      })

      it('among signatures with the same exact type match count, prefers the fewest bindings created', function () {
        const tA = makeType("'A")
        const tB = makeType("'B")

        registry.register(tInt, 'selector', [tA, tB], tBool, wrong)
        registry.register(tInt, 'selector', [tA, tA], tBool, right)

        assert.strictEqual(registry.lookup(st, tInt, 'selector', [tInt, tInt]).invoke(), RIGHT)
      })

      it('prefers exact enumerations to repeated type matches', function () {
        registry.register(tInt, 'selector', [tInt.repeatable()], tBool, wrong)
        registry.register(tInt, 'selector', [tInt, tInt, tInt], tBool, right)

        assert.strictEqual(registry.lookup(st, tInt, 'selector', [tInt, tInt, tInt]).invoke(), RIGHT)
      })

      it('gives the lowest priority to splat matches', function () {
        const tA = makeType("'A")

        const SPLAT = Symbol('splat')
        const splat = () => SPLAT
        const EXACT = Symbol('exact')
        const exact = () => EXACT

        registry.register(tInt, 'selector', [tA.splat()], tBool, splat)
        registry.register(tInt, 'selector', [tInt, tString], tBool, exact)

        assert.strictEqual(registry.lookup(st, tInt, 'selector', [tInt, tString]).invoke(), EXACT)
        assert.strictEqual(registry.lookup(st, tInt, 'selector', [tInt, tString, tBool]).invoke(), SPLAT)
        assert.strictEqual(registry.lookup(st, tInt, 'selector', [tInt]).invoke(), SPLAT)
        assert.strictEqual(registry.lookup(st, tInt, 'selector', [tInt, tBool]).invoke(), SPLAT)
      })

      it('includes compound type bases as exact type matches', function () {
        const tA = makeType("'A")
        const tOptionA = makeType(tOption, [tA])

        const FALLBACK = Symbol('fallback')
        const fallback = () => FALLBACK
        const COMPOUND = Symbol('compound')
        const compound = () => COMPOUND

        registry.register(tA, 'selector', [tA], tBool, fallback)
        registry.register(tOptionA, 'selector', [tOptionA], tBool, compound)

        assert.strictEqual(registry.lookup(st, tInt, 'selector', [tInt]).invoke(), FALLBACK)
        assert.strictEqual(
          registry.lookup(st, makeType(tOption, [tInt]), 'selector', [makeType(tOption, [tInt])]).invoke(),
          COMPOUND
        )
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
      assert.strictEqual(match.invoke(), RIGHT)
    })

    it('collects all methods from the parent and local registries to find a match', function () {
      const parent = new MethodRegistry()
      parent.register(tInt, 'toString', [], tBool, right)

      const child = parent.push()
      parent.register(makeType("'A"), 'toString', [], tBool, wrong)

      const match = child.lookup(st, tInt, 'toString', [])
      assert.strictEqual(match.invoke(), RIGHT)
    })
  })

  describe('Match', function () {
    it('invokes the matched callback with the receiver and argument types', function () {
      let arg = null
      const cb = a => {
        arg = a
      }

      const r = new MethodRegistry()
      r.register(tInt, 'somethingCool', [tInt, makeType("'A")], tString, cb)

      const match = r.lookup(st, tInt, 'somethingCool', [tInt, tReal])
      match.invoke({extra: true})

      assert.strictEqual(arg.receiverType, tInt)
      assert.deepEqual(arg.argumentTypes, [tInt, tReal])
      assert.isTrue(arg.extra)
    })
  })
})
