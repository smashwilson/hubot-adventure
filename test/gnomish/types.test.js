/* eslint-env mocha */

const {assert} = require('chai')
const {makeType, unify} = require('../../src/gnomish/type')
const {SymbolTable} = require('../../src/gnomish/symboltable')

describe('Type', function () {
  let st, tType, tInt, tString, tReal, tBool, tBlock, tList

  beforeEach(function () {
    st = new SymbolTable()
    tType = makeType('Type')
    st.setStatic('Type', tType, tType)

    tInt = makeType('Int')
    tString = makeType('String')
    tReal = makeType('Real')
    tBool = makeType('Bool')
    tBlock = makeType('Block')
    tList = makeType('List')

    st.setStatic('List', tType, tList)
  })

  describe('makeType', function () {
    it('constructs a simple type', function () {
      const t = makeType('Int')
      assert.isTrue(t.isSimple())
      assert.isFalse(t.isParameter())
      assert.isFalse(t.isCompound())
      assert.isFalse(t.isRepeatable())
      assert.isFalse(t.isSplat())
      assert.equal(t.toString(), 'Int')
    })

    it('constructs a type parameter', function () {
      const p = makeType("'A")
      assert.isFalse(p.isSimple())
      assert.isTrue(p.isParameter())
      assert.isFalse(p.isCompound())
      assert.isFalse(p.isRepeatable())
      assert.isFalse(p.isSplat())
      assert.equal(p.toString(), "'A")
    })

    it('constructs a repeatable type', function () {
      const p = makeType('Int').repeatable()
      assert.isTrue(p.isSimple())
      assert.isFalse(p.isParameter())
      assert.isFalse(p.isCompound())
      assert.isTrue(p.isRepeatable())
      assert.isFalse(p.isSplat())
      assert.equal(p.toString(), 'Int*')
    })

    it('constructs a repeatable type parameter', function () {
      const p = makeType("'A").repeatable()
      assert.isFalse(p.isSimple())
      assert.isTrue(p.isParameter())
      assert.isFalse(p.isCompound())
      assert.isTrue(p.isRepeatable())
      assert.isFalse(p.isSplat())
      assert.equal(p.toString(), "'A*")
    })

    it('constructs a splat type parameter', function () {
      const p = makeType("'As").splat()
      assert.isFalse(p.isSimple())
      assert.isTrue(p.isParameter())
      assert.isFalse(p.isCompound())
      assert.isFalse(p.isRepeatable())
      assert.isTrue(p.isSplat())
      assert.equal(p.toString(), "'As...")
    })

    it('constructs a compound type', function () {
      const c = makeType('Block', [tInt, makeType("'A"), tBool])
      assert.isFalse(c.isSimple())
      assert.isFalse(c.isParameter())
      assert.isTrue(c.isCompound())
      assert.isFalse(c.isRepeatable())
      assert.isFalse(c.isSplat())
      assert.equal(c.toString(), "Block(Int, 'A, Bool)")
    })
  })

  describe('resolve', function () {
    it('does nothing to simple types', function () {
      const t = makeType('Int')
      assert.deepEqual(t.resolve(st), [t])
    })

    it('resolves type parameters from the SymbolTable', function () {
      const tInt = makeType('Int')
      st.setStatic("'A", tType, tInt)

      const t = makeType("'A")
      assert.deepEqual(t.resolve(st), [tInt])
    })

    it('fails if the SymbolTable entry is non-static', function () {
      st.allocateSlot("'B", tType)

      const t = makeType("'B")
      assert.throws(() => t.resolve(st), /'B is not known at compile time/)
    })

    it('fails if the SymbolTable entry is not a Type', function () {
      st.setStatic("'C", makeType('Int'), 10)

      const t = makeType("'C")
      assert.throws(() => t.resolve(st), /'C is not a Type/)
    })

    it('leaves the type parameter as-is if no entry is present', function () {
      const t = makeType("'D")
      assert.deepEqual(t.resolve(st), [t])
    })

    it('resolves type parameters of compound types shallowly', function () {
      st.setStatic("'A", tType, tInt)
      st.setStatic("'B", tType, tInt)

      const tB = makeType("'B")
      const t0 = makeType("'A", [tB])

      const r = t0.resolve(st)
      assert.lengthOf(r, 1)
      const r0 = r[0]
      assert.isTrue(r0.isCompound())
      assert.strictEqual(r0.getBase(), tInt)
      assert.lengthOf(r0.getParams(), 1)
      assert.strictEqual(r0.getParams()[0], tB)
    })

    it('passes through repeatable types', function () {
      st.setStatic("'B", tType, tString)

      const t0 = tInt.repeatable()
      assert.deepEqual(t0.resolve(st), [t0])

      const t1 = makeType("'A").repeatable()
      const r1 = t1.resolve(st)
      assert.lengthOf(r1, 1)
      const r10 = r1[0]
      assert.isTrue(r10.isRepeatable())
      assert.isTrue(r10.isParameter())

      const t2 = makeType("'B").repeatable()
      const r2 = t2.resolve(st)
      assert.lengthOf(r2, 1)
      const r20 = r2[0]
      assert.isTrue(r20.isRepeatable())
      assert.isTrue(r20.isSimple())
      assert.strictEqual(r20.getInner(), tString)
    })

    it('passes through unbound splat types', function () {
      const t = makeType("'Args").splat()

      assert.deepEqual(t.resolve(st), [t])
    })

    it('replaces splats with the contents of a bound TypeList', function () {
      st.setStatic("'Args", makeType(tList, [tType]), [tInt, tBool, tReal])

      const t = makeType("'Args").splat()
      assert.deepEqual(t.resolve(st), [tInt, tBool, tReal])
    })

    it('flattens splats in type argument lists of compound types', function () {
      st.setStatic("'Args", makeType(tList, [tType]), [tInt, tBool, tReal])

      const t = makeType(tBlock, [tBool, makeType("'Args").splat(), tString, makeType("'Args").splat()])
      const r = t.resolveRecursively(st)
      assert.lengthOf(r, 1)
      const r0 = r[0]
      assert.isTrue(r0.isCompound())
      assert.strictEqual(r0.getBase(), tBlock)
      assert.deepEqual(r0.getParams(), [tBool, tInt, tBool, tReal, tString, tInt, tBool, tReal])
    })
  })

  describe('unify', function () {
    function unifyBothWays (t0s, t1s, block) {
      st = st.push()
      block(unify(st, t0s, t1s))
      st = st.pop()

      st = st.push()
      block(unify(st, t1s, t0s))
      st = st.pop()
    }

    it('unifies simple types that match', function () {
      const t0s = [makeType('Int')]

      unifyBothWays(t0s, t0s, u => {
        assert.isTrue(u.wasSuccessful())
        assert.deepEqual(u.getTypes(), t0s)
      })
    })

    it('fails to unify simple types that do not match', function () {
      const t0s = [makeType('Int')]
      const t1s = [makeType('Nah')]

      unifyBothWays(t0s, t1s, u => assert.isFalse(u.wasSuccessful()))
    })

    it('uses an existing binding to unify a type parameter', function () {
      const t0s = [makeType('Int')]
      const t1s = [makeType("'A")]

      st.setStatic("'A", tType, t0s[0])

      unifyBothWays(t0s, t1s, u => {
        assert.isTrue(u.wasSuccessful())
        assert.deepEqual(u.getTypes(), t0s)
        assert.lengthOf(u.bindings, 0)
      })
    })

    it('uses an existing binding to fail to unify a type parameter', function () {
      const t0s = [makeType('Int')]
      const t1s = [makeType("'A")]

      st.setStatic("'A", tType, makeType('Nope'))

      unifyBothWays(t0s, t1s, u => assert.isFalse(u.wasSuccessful()))
    })

    it('produces bindings for a new type parameter assignment', function () {
      const t0s = [makeType('Int')]
      const t1s = [makeType("'A")]

      unifyBothWays(t0s, t1s, u => {
        assert.isTrue(u.wasSuccessful())
        assert.deepEqual(u.getTypes(), t0s)

        assert.isFalse(st.has("'A"))
        assert.strictEqual(u.apply(st), u)

        const entry = st.at("'A")
        assert.isTrue(entry.isStatic())
        assert.strictEqual(entry.getType(), tType)
        assert.strictEqual(entry.getValue(), t0s[0])
      })
    })

    it('binds one symbol to an unbound one', function () {
      const t0s = [makeType("'A")]
      const t1s = [makeType("'B")]

      const u = unify(st, t0s, t1s)
      assert.isTrue(u.wasSuccessful())
      assert.deepEqual(u.getTypes(), t0s)

      assert.isFalse(st.has("'B"))
      u.apply(st)
      assert.strictEqual(st.at("'B").getValue(), t0s[0])
    })

    it('unifies compound types that match recursively', function () {
      const t0s = [makeType('Block', [tInt, tString])]
      unifyBothWays(t0s, t0s, u => {
        assert.isTrue(u.wasSuccessful())
        assert.deepEqual(u.getTypes(), t0s)
      })
    })

    it('fails to unify compound types that do not match', function () {
      const tInt = makeType('Int')
      const tString = makeType('String')
      const tReal = makeType('Real')

      const t0s = [makeType('Block', [tInt, tString])]
      const t1s = [makeType(t0s[0].getBase(), [tString, tInt])]
      const t2s = [makeType(t0s[0].getBase(), [tString, tInt])]
      const t3s = [makeType(t0s[0].getBase(), [tString, tInt, tReal])]
      const t4s = [makeType('Other', [tInt, tString])]

      for (const ts of [t1s, t2s, t3s, t4s]) {
        unifyBothWays(t0s, ts, u => assert.isFalse(u.wasSuccessful()))
      }
    })

    it('produces bindings for new recursive type parameter assignments', function () {
      const t0s = [makeType('Block', [makeType("'A")])]
      const t1s = [makeType(t0s[0].getBase(), [tReal])]
      unifyBothWays(t0s, t1s, u => {
        assert.isTrue(u.wasSuccessful())
        const ut = u.getTypes()[0]
        assert.strictEqual(ut.getBase(), t0s[0].getBase())
        assert.lengthOf(ut.getParams(), 1)
        assert.strictEqual(ut.getParams()[0], tReal)

        assert.isFalse(st.has("'A"))
        u.apply(st)
        assert.strictEqual(st.at("'A").getValue(), tReal)
      })
    })

    it('uses earlier bindings to match later type parameters', function () {
      const t0s = [makeType('Block', [makeType("'A"), tBool, makeType("'A")])]

      const t1s = [makeType(t0s[0].getBase(), [tInt, tBool, tInt])]
      unifyBothWays(t0s, t1s, u => {
        assert.isTrue(u.wasSuccessful())
        const ut = u.getTypes()[0]
        assert.strictEqual(ut.getBase(), t0s[0].getBase())
        assert.lengthOf(ut.getParams(), 3)
        assert.strictEqual(ut.getParams()[0], tInt)
        assert.strictEqual(ut.getParams()[1], tBool)
        assert.strictEqual(ut.getParams()[2], tInt)

        assert.isFalse(st.has("'A"))
        u.apply(st)
        assert.strictEqual(st.at("'A").getValue(), tInt)
      })

      const t2s = [makeType(t0s[0].getBase(), [tString, tBool, tString])]
      unifyBothWays(t0s, t2s, u => {
        assert.isTrue(u.wasSuccessful())
        const ut = u.getTypes()[0]
        assert.strictEqual(ut.getBase(), t0s[0].getBase())
        assert.lengthOf(ut.getParams(), 3)
        assert.strictEqual(ut.getParams()[0], tString)
        assert.strictEqual(ut.getParams()[1], tBool)
        assert.strictEqual(ut.getParams()[2], tString)

        assert.isFalse(st.has("'A"))
        u.apply(st)
        assert.strictEqual(st.at("'A").getValue(), tString)
      })

      const t3s = [makeType(t0s[0].getBase(), [tInt, tBool, tString])]
      unifyBothWays(t0s, t3s, u => {
        assert.isFalse(u.wasSuccessful())
      })
    })

    describe('repeatable types', function () {
      it('unifies with no matching types', function () {
        const t0s = [tInt, tBool.repeatable(), tString]
        const t1s = [tInt, tString]

        unifyBothWays(t0s, t1s, u => {
          assert.isTrue(u.wasSuccessful())
          assert.deepEqual(u.getTypes(), [tInt, tString])
        })
      })

      it('unifies with multiple matching types', function () {
        const t0s = [tInt.repeatable()]
        const t1s = [tInt, tInt, tInt, tInt]

        unifyBothWays(t0s, t1s, u => {
          assert.isTrue(u.wasSuccessful())
          assert.deepEqual(u.getTypes(), [tInt, tInt, tInt, tInt])
        })
      })

      it('fails to unify with non-matching types', function () {
        const t0s = [makeType("'A").repeatable()]
        const t1s = [tInt, tInt, tBool]

        unifyBothWays(t0s, t1s, u => assert.isFalse(u.wasSuccessful()))
      })

      it('produces a single binding', function () {
        const t0s = [makeType("'A").repeatable()]
        const t1s = [tInt, tInt, tInt]

        unifyBothWays(t0s, t1s, u => {
          assert.isTrue(u.wasSuccessful())
          assert.deepEqual(u.getTypes(), t1s)
          assert.lengthOf(u.bindings, 1)
          assert.deepEqual(u.bindings[0], ["'A", tType, tInt])
        })
      })
    })

    describe('splat types', function () {
      it('unifies against an empty list', function () {
        const t0s = [tInt, makeType("'As").splat()]
        const t1s = [tInt]

        unifyBothWays(t0s, t1s, u => {
          assert.isTrue(u.wasSuccessful())
          assert.deepEqual(u.getTypes(), [tInt])
          assert.lengthOf(u.bindings, 1)
          assert.strictEqual(u.bindings[0][0], "'As")
          assert.deepEqual(u.bindings[0][2], [])
        })
      })

      it('unifies against a list of types', function () {
        const t0s = [tBool, makeType("'Args").splat()]
        const t1s = [tBool, tInt, tString, tReal, tReal]

        unifyBothWays(t0s, t1s, u => {
          assert.isTrue(u.wasSuccessful())
          assert.deepEqual(u.getTypes(), [tBool, tInt, tString, tReal, tReal])
          assert.lengthOf(u.bindings, 1)
          assert.strictEqual(u.bindings[0][0], "'Args")
          assert.deepEqual(u.bindings[0][2], [tInt, tString, tReal, tReal])
        })
      })

      it('unifies an existing splat binding', function () {
        st.setStatic("'Args", makeType(tList, [tType]), [tInt, tBool, tBool])

        const t0s = [tBool, makeType("'Args").splat(), tString]
        const t1s = [tBool, tInt, tBool, tBool, tString]

        unifyBothWays(t0s, t1s, u => {
          assert.isTrue(u.wasSuccessful())
          assert.deepEqual(u.getTypes(), [tBool, tInt, tBool, tBool, tString])
          assert.lengthOf(u.bindings, 0)
        })
      })

      it('fails to unify with a conflicting splat binding', function () {
        st.setStatic("'Args", makeType(tList, [tType]), [tInt, tBool, tBool])

        const t0s = [tBool, makeType("'Args").splat(), tString]
        const t1s = [tBool, tInt, tReal, tBool, tString]

        unifyBothWays(t0s, t1s, u => assert.isFalse(u.wasSuccessful()))
      })
    })
  })
})
