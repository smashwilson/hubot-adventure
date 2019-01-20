/* eslint-env mocha */

const { assert } = require('chai')
const { World } = require('../../src/model/world')

describe('World', function () {
  it('bootstraps a symbol table and method registry with the standard library and the model library', function () {
    const w = new World()

    const st = w.getSymbolTable()
    assert.isTrue(st.has('Int'))
    assert.isTrue(st.has('String'))
    assert.isTrue(st.has('Type'))

    assert.isTrue(st.has('Room'))
    assert.isTrue(st.has('Noun'))

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

  describe('Games', function () {
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

    it('deletes Games', function () {
      const w = new World()

      const g0 = w.createGame('A123')
      const g1 = w.createGame('B456')

      assert.deepEqual(w.getGames(), [g0, g1])

      assert.isTrue(w.deleteGame('B456'))
      assert.isFalse(w.deleteGame('C000'))

      assert.deepEqual(w.getGames(), [g0])
    })
  })

  describe('Rooms', function () {
    it('creates a Room', function () {
      const w = new World()

      const r = w.createRoom('id0', 'The First Room')
      assert.strictEqual(r.getID(), 'id0')
      assert.strictEqual(r.getName(), 'The First Room')

      assert.deepEqual(w.getRooms(), [r])
    })

    it('returns an existing Room if one already exists with a given ID', function () {
      const w = new World()

      const r0 = w.createRoom('000', 'The Original Room')
      const r1 = w.createRoom('000', 'The New Room')

      assert.strictEqual(r0, r1)

      assert.strictEqual(r0.getID(), '000')
      assert.strictEqual(r0.getName(), 'The New Room')
    })

    it('deletes Rooms', function () {
      const w = new World()

      const r0 = w.createRoom('000', 'Room Zero')
      const r1 = w.createRoom('001', 'Room One')

      assert.deepEqual(w.getRooms(), [r0, r1])

      assert.isTrue(w.deleteRoom('000'))
      assert.isFalse(w.deleteRoom('000'))

      assert.deepEqual(w.getRooms(), [r1])
    })
  })
})
