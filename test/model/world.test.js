/* eslint-env mocha */

const { assert } = require('chai')
const { World } = require('../../src/model/world')

describe('World', function () {
  it('bootstraps a symbol table and method registry with the standard library', function () {
    const w = new World()

    const st = w.getSymbolTable()
    assert.isTrue(st.has('Int'))
    assert.isTrue(st.has('String'))
    assert.isTrue(st.has('Type'))

    const tInt = st.at('Int').getValue()
    const binding = w.getMethodRegistry().lookup(st, tInt, 'toReal', [])
    assert.strictEqual(binding.invoke({ receiver: 1 }), 1.0)
  })

  it('shares stdlib bindings and method registry', function () {
    const w0 = new World()
    const w1 = new World()

    assert.strictEqual(w0.getSymbolTable().getRoot(), w1.getSymbolTable().getRoot())
    assert.strictEqual(w0.getMethodRegistry().parent, w1.getMethodRegistry().parent)
  })

  it('binds "world" and "this" to itself', function () {
    const w0 = new World()

    assert.strictEqual(w0.getSymbolTable().at('world').getValue(), w0)
    assert.strictEqual(w0.getSymbolTable().at('this').getValue(), w0)

    const w1 = new World()

    assert.strictEqual(w1.getSymbolTable().at('world').getValue(), w1)
    assert.strictEqual(w1.getSymbolTable().at('this').getValue(), w1)
  })

  it('creates a Game with its symbol table and method registry', function () {
    const w = new World()
    const g = w.createGame('C1234')

    assert.deepEqual(w.getGames(), [g])
    assert.strictEqual(w.getGame('C1234'), g)

    const gSt = g.getSymbolTable()
    assert.strictEqual(gSt.getGame(), w.getSymbolTable())

    assert.strictEqual(g.getMethodRegistry(), w.getMethodRegistry())
  })

  it('compiles and executes Gnomish code with a prototypical game slot frame', function () {
    const w = new World()

    assert.lengthOf(w.prototypeSlots, 0)

    const { result: result0 } = w.execute(`
      letgame x = 1
      letgame y = "yes"

      x
    `)
    assert.strictEqual(result0, 1)

    const st = w.getSymbolTable()
    assert.isFalse(st.at('x').isStatic())
    assert.strictEqual(st.at('x').getSlot(), 0)
    assert.isFalse(st.at('y').isStatic())
    assert.strictEqual(st.at('y').getSlot(), 1)

    assert.lengthOf(w.prototypeSlots, 2)
    assert.strictEqual(w.prototypeSlots[0], 1)
    assert.strictEqual(w.prototypeSlots[1], 'yes')

    const { result: result1 } = w.execute(`
      letgame z = x + 10
      z * 5
    `)
    assert.strictEqual(result1, 55)

    assert.isFalse(st.at('z').isStatic())
    assert.strictEqual(st.at('z').getSlot(), 2)

    assert.lengthOf(w.prototypeSlots, 3)
    assert.strictEqual(w.prototypeSlots[0], 1)
    assert.strictEqual(w.prototypeSlots[1], 'yes')
    assert.strictEqual(w.prototypeSlots[2], 11)
  })

  it('constructs Games with a new game slot frame', function () {
    const w = new World()

    w.execute('letgame x = 10')

    const g = w.createGame('C123')
    const { result: gResult } = g.execute('x = x * 2 ; x')
    assert.strictEqual(gResult, 20)

    const { result: wResult } = w.execute('x')
    assert.strictEqual(wResult, 10)
  })
})
