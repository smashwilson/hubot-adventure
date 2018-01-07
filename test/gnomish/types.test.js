/* eslint-env mocha */

const {assert} = require('chai')
const {makeType, unify} = require('../../src/gnomish/type')
const {SymbolTable, StaticEntry, SlotEntry} = require('../../src/gnomish/symboltable')

describe('Type', function () {
  let st, tType

  beforeEach(function () {
    st = new SymbolTable()
    tType = makeType('Type')
    st.put('Type', new StaticEntry(tType, tType))
  })

  describe('makeType', function () {
    it('constructs a simple type', function () {
      const t = makeType('Int')
      assert.isTrue(t.isSimple())
      assert.isFalse(t.isParameter())
      assert.isFalse(t.isCompound())
      assert.equal(t.toString(), 'Int')
    })

    it('constructs a type parameter', function () {
      const p = makeType("'A")
      assert.isFalse(p.isSimple())
      assert.isTrue(p.isParameter())
      assert.isFalse(p.isCompound())
      assert.equal(p.toString(), "'A")
    })

    it('constructs a compound type', function () {
      const c = makeType('Block', [makeType('Int'), makeType("'A"), makeType('Bool')])
      assert.isFalse(c.isSimple())
      assert.isFalse(c.isParameter())
      assert.isTrue(c.isCompound())
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
      st.put("'A", new StaticEntry(tType, tInt))

      const t = makeType("'A")
      assert.strictEqual(t.resolve(st), tInt)
    })

    it('fails if the SymbolTable entry is non-static', function () {
      st.put("'B", new SlotEntry(tType, 0))

      const t = makeType("'B")
      assert.throws(() => t.resolve(st), /'B is not known at compile time/)
    })

    it('fails if the SymbolTable entry is not a Type', function () {
      st.put("'C", new StaticEntry(makeType('Int'), 10))

      const t = makeType("'C")
      assert.throws(() => t.resolve(st), /'C is not a Type/)
    })

    it('leaves the type parameter as-is if no entry is present', function () {
      const t = makeType("'D")
      assert.strictEqual(t.resolve(st), t)
    })

    it('resolves type parameters of compound types shallowly', function () {
      const tInt = makeType('Int')
      st.put("'A", new StaticEntry(tType, tInt))
      st.put("'B", new StaticEntry(tType, tInt))

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

      st.put("'A", new StaticEntry(tType, t0))

      unifyBothWays(t0, t1, u => {
        assert.isTrue(u.wasSuccessful())
        assert.strictEqual(u.getType(), t0)
        assert.lengthOf(u.bindings, 0)
      })
    })

    it('uses an existing binding to fail to unify a type parameter', function () {
      const t0 = makeType('Int')
      const t1 = makeType("'A")

      st.put("'A", new StaticEntry(tType, makeType('Nope')))

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
      const tInt = makeType('Int')
      const tString = makeType('String')

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

    it('produces SymbolTable bindings for new recursive type parameter assignments')

    it('uses earlier SymbolTable bindings to match later type parameters')
  })
})
