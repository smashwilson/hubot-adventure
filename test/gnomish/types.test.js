/* eslint-env mocha */

const {assert} = require('chai')
const {makeType, unify} = require('../../src/gnomish/type')
const {SymbolTable} = require('../../src/gnomish/symboltable')

describe('Type', function () {
  let st, tType, tInt, tString, tReal, tBool

  beforeEach(function () {
    st = new SymbolTable()
    tType = makeType('Type')
    st.setStatic('Type', tType, tType)

    tInt = makeType('Int')
    tString = makeType('String')
    tReal = makeType('Real')
    tBool = makeType('Bool')
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
      assert.strictEqual(t.resolve(st), t)
    })

    it('resolves type parameters from the SymbolTable', function () {
      const tInt = makeType('Int')
      st.setStatic("'A", tType, tInt)

      const t = makeType("'A")
      assert.strictEqual(t.resolve(st), tInt)
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
      assert.strictEqual(t.resolve(st), t)
    })

    it('resolves type parameters of compound types shallowly', function () {
      st.setStatic("'A", tType, tInt)
      st.setStatic("'B", tType, tInt)

      const tB = makeType("'B")
      const t0 = makeType("'A", [tB])

      const r = t0.resolve(st)
      assert.isTrue(r.isCompound())
      assert.strictEqual(r.getBase(), tInt)
      assert.lengthOf(r.getParams(), 1)
      assert.strictEqual(r.getParams()[0], tB)
    })
  })

  describe('unify', function () {
    function unifyBothWays (t0, t1, block) {
      st = st.push()
      block(unify(st, t0, t1))
      st = st.pop()

      st = st.push()
      block(unify(st, t1, t0))
      st = st.pop()
    }

    it('unifies simple types that match', function () {
      const t0 = makeType('Int')

      unifyBothWays(t0, t0, u => {
        assert.isTrue(u.wasSuccessful())
        assert.strictEqual(u.getType(), t0)
      })
    })

    it('fails to unify simple types that do not match', function () {
      const t0 = makeType('Int')
      const t1 = makeType('Nah')

      unifyBothWays(t0, t1, u => assert.isFalse(u.wasSuccessful()))
    })

    it('uses an existing binding to unify a type parameter', function () {
      const t0 = makeType('Int')
      const t1 = makeType("'A")

      st.setStatic("'A", tType, t0)

      unifyBothWays(t0, t1, u => {
        assert.isTrue(u.wasSuccessful())
        assert.strictEqual(u.getType(), t0)
        assert.lengthOf(u.bindings, 0)
      })
    })

    it('uses an existing binding to fail to unify a type parameter', function () {
      const t0 = makeType('Int')
      const t1 = makeType("'A")

      st.setStatic("'A", tType, makeType('Nope'))

      unifyBothWays(t0, t1, u => assert.isFalse(u.wasSuccessful()))
    })

    it('produces bindings for a new type parameter assignment', function () {
      const t0 = makeType('Int')
      const t1 = makeType("'A")

      unifyBothWays(t0, t1, u => {
        assert.isTrue(u.wasSuccessful())
        assert.strictEqual(u.getType(), t0)

        assert.isFalse(st.has("'A"))
        assert.strictEqual(u.apply(st), u)

        const entry = st.at("'A")
        assert.isTrue(entry.isStatic())
        assert.strictEqual(entry.getType(), tType)
        assert.strictEqual(entry.getValue(), t0)
      })
    })

    it('binds one symbol to an unbound one', function () {
      const t0 = makeType("'A")
      const t1 = makeType("'B")

      const u = unify(st, t0, t1)
      assert.isTrue(u.wasSuccessful())
      assert.strictEqual(u.getType(), t0)

      assert.isFalse(st.has("'B"))
      u.apply(st)
      assert.strictEqual(st.at("'B").getValue(), t0)
    })

    it('unifies compound types that match recursively', function () {
      const t0 = makeType('Block', [tInt, tString])
      unifyBothWays(t0, t0, u => {
        assert.isTrue(u.wasSuccessful())
        assert.strictEqual(u.getType(), t0)
      })
    })

    it('fails to unify compound types that do not match', function () {
      const tInt = makeType('Int')
      const tString = makeType('String')
      const tReal = makeType('Real')

      const t0 = makeType('Block', [tInt, tString])
      const t1 = makeType(t0.getBase(), [tString, tInt])
      const t2 = makeType(t0.getBase(), [tString, tInt])
      const t3 = makeType(t0.getBase(), [tString, tInt, tReal])
      const t4 = makeType('Other', [tInt, tString])

      for (const t of [t1, t2, t3, t4]) {
        unifyBothWays(t0, t, u => assert.isFalse(u.wasSuccessful()))
      }
    })

    it('produces bindings for new recursive type parameter assignments', function () {
      const t0 = makeType('Block', [makeType("'A")])
      const t1 = makeType(t0.getBase(), [tReal])
      unifyBothWays(t0, t1, u => {
        assert.isTrue(u.wasSuccessful())
        const ut = u.getType()
        assert.strictEqual(ut.getBase(), t0.getBase())
        assert.lengthOf(ut.getParams(), 1)
        assert.strictEqual(ut.getParams()[0], tReal)

        assert.isFalse(st.has("'A"))
        u.apply(st)
        assert.strictEqual(st.at("'A").getValue(), tReal)
      })
    })

    it('uses earlier bindings to match later type parameters', function () {
      const t0 = makeType('Block', [makeType("'A"), tBool, makeType("'A")])

      const t1 = makeType(t0.getBase(), [tInt, tBool, tInt])
      unifyBothWays(t0, t1, u => {
        assert.isTrue(u.wasSuccessful())
        const ut = u.getType()
        assert.strictEqual(ut.getBase(), t0.getBase())
        assert.lengthOf(ut.getParams(), 3)
        assert.strictEqual(ut.getParams()[0], tInt)
        assert.strictEqual(ut.getParams()[1], tBool)
        assert.strictEqual(ut.getParams()[2], tInt)

        assert.isFalse(st.has("'A"))
        u.apply(st)
        assert.strictEqual(st.at("'A").getValue(), tInt)
      })

      const t2 = makeType(t0.getBase(), [tString, tBool, tString])
      unifyBothWays(t0, t2, u => {
        assert.isTrue(u.wasSuccessful())
        const ut = u.getType()
        assert.strictEqual(ut.getBase(), t0.getBase())
        assert.lengthOf(ut.getParams(), 3)
        assert.strictEqual(ut.getParams()[0], tString)
        assert.strictEqual(ut.getParams()[1], tBool)
        assert.strictEqual(ut.getParams()[2], tString)

        assert.isFalse(st.has("'A"))
        u.apply(st)
        assert.strictEqual(st.at("'A").getValue(), tString)
      })

      const t3 = makeType(t0.getBase(), [tInt, tBool, tString])
      unifyBothWays(t0, t3, u => {
        assert.isFalse(u.wasSuccessful())
      })
    })
  })
})
