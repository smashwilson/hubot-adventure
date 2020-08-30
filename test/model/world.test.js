/* eslint-env mocha */

const { assert } = require('chai')

const { World } = require('../../src/model/world')
const { Block } = require('../../src/gnomish/stdlib/block')
const { ExprListNode, StringNode } = require('../../src/gnomish/ast')
const { Interpreter } = require('../../src/gnomish/interpreter')
const { none } = require('../../src/gnomish/stdlib/option')

describe('World', function () {
  function makeBlock (s) {
    return new Block([], new ExprListNode([new StringNode({ chars: [s] })]))
  }

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
      w.defineRoom('id', 'room')
      const g = w.createGame('C1234')

      assert.deepEqual(w.getGames(), [g])
      assert.strictEqual(w.getGame('C1234'), g)

      const gSt = g.getSymbolTable()
      assert.strictEqual(gSt.getGame(), w.getSymbolTable())

      assert.strictEqual(g.getMethodRegistry(), w.getMethodRegistry())
    })

    it('compiles and executes Gnomish code with a prototypical game slot frame', function () {
      const w = new World()

      assert.lengthOf(w.prototypeSlots, 1)

      const { result: result0 } = w.execute(`
        letgame x = 1
        letgame y = "yes"

        x
      `)
      assert.strictEqual(result0, 1)

      const st = w.getSymbolTable()
      assert.isFalse(st.at('x').isStatic())
      assert.strictEqual(st.at('x').getSlot(), 1)
      assert.isFalse(st.at('y').isStatic())
      assert.strictEqual(st.at('y').getSlot(), 2)

      assert.lengthOf(w.prototypeSlots, 3)
      assert.strictEqual(w.prototypeSlots[0], none)
      assert.strictEqual(w.prototypeSlots[1], 1)
      assert.strictEqual(w.prototypeSlots[2], 'yes')

      const { result: result1 } = w.execute(`
        letgame z = x + 10
        z * 5
      `)
      assert.strictEqual(result1, 55)

      assert.isFalse(st.at('z').isStatic())
      assert.strictEqual(st.at('z').getSlot(), 3)

      assert.lengthOf(w.prototypeSlots, 4)
      assert.strictEqual(w.prototypeSlots[0], none)
      assert.strictEqual(w.prototypeSlots[1], 1)
      assert.strictEqual(w.prototypeSlots[2], 'yes')
      assert.strictEqual(w.prototypeSlots[3], 11)
    })

    it('constructs Games with a new game slot frame', function () {
      const w = new World()
      w.defineRoom('id', 'room')

      w.execute('letgame x = 10')

      const g = w.createGame('C123')
      const { result: gResult } = g.execute('x = x * 2 ; x')
      assert.strictEqual(gResult, 20)

      const { result: wResult } = w.execute('x')
      assert.strictEqual(wResult, 10)
    })

    it('deep-copies game slots for each game', function () {
      const w = new World()
      w.defineRoom('id', 'room')
      w.execute('letgame x = list("a")')

      const g0 = w.createGame('C0')
      const g1 = w.createGame('C1')

      g0.execute('x << "in game g0"')
      g1.execute('x << "in game g1"')

      const { result: g0Result } = g0.execute('x')
      assert.deepEqual(g0Result, ['a', 'in game g0'])

      const { result: g1Result } = g1.execute('x')
      assert.deepEqual(g1Result, ['a', 'in game g1'])
    })

    it('begins each new Game with a current room set to the World default', function () {
      const w = new World()
      w.defineRoom('id0', 'zero')
      const r1 = w.defineRoom('id1', 'one')
      const r2 = w.defineRoom('id2', 'two')

      w.setDefaultRoomID('id1')
      const g0 = w.createGame('C0')
      assert.strictEqual(g0.getCurrentRoom().getValue(), r1)

      w.setDefaultRoomID('id2')
      const g1 = w.createGame('C1')
      assert.strictEqual(g0.getCurrentRoom().getValue(), r1)
      assert.strictEqual(g1.getCurrentRoom().getValue(), r2)
    })

    it('deletes Games', function () {
      const w = new World()
      w.defineRoom('id', 'room')

      const g0 = w.createGame('A123')
      const g1 = w.createGame('B456')

      assert.deepEqual(w.getGames(), [g0, g1])

      assert.isTrue(w.deleteGame('B456'))
      assert.isFalse(w.deleteGame('C000'))

      assert.deepEqual(w.getGames(), [g0])
    })
  })

  describe('global commands', function () {
    it('creates a new command', function () {
      const w = new World()

      w.defineCommand('jump', makeBlock('no'))

      assert.deepEqual(w.getCommands(), ['jump'])
    })

    it('executes a command', function () {
      const w = new World()
      w.defineCommand('jump', makeBlock('no'))

      const i = new Interpreter()
      assert.strictEqual(w.executeCommand('jump', i), 'no')
    })

    it('overrides an existing command', function () {
      const w = new World()
      w.defineCommand('jump', makeBlock('no'))
      w.defineCommand('jump', makeBlock('yes'))

      const i = new Interpreter()
      assert.strictEqual(w.executeCommand('jump', i), 'yes')
    })

    it('executes a default fall-through command', function () {
      const w = new World()

      const said = []
      const i = new Interpreter({ say (line) { said.push(line) } })

      w.executeCommand('jump', i)
      assert.deepEqual(said, ["I don't know how to do that."])
    })

    it('executes a configured fall-through command', function () {
      const w = new World()
      w.setFallThroughCommand(makeBlock('caught it'))

      const i = new Interpreter()
      assert.strictEqual(w.executeCommand('unknown', i), 'caught it')
    })

    it('deletes a command', function () {
      const w = new World()
      w.setFallThroughCommand(makeBlock('deleted'))
      w.defineCommand('jump', makeBlock('no'))

      assert.isTrue(w.deleteCommand('jump'))
      assert.isFalse(w.deleteCommand('what'))

      const i = new Interpreter()
      assert.strictEqual(w.executeCommand('jump', i), 'deleted')
    })
  })

  describe('Rooms', function () {
    it('creates a Room', function () {
      const w = new World()

      const r = w.defineRoom('id0', 'The First Room')
      assert.strictEqual(r.getID(), 'id0')
      assert.strictEqual(r.getName(), 'The First Room')

      assert.deepEqual(w.getRooms(), [r])
    })

    it('returns an existing Room if one already exists with a given ID', function () {
      const w = new World()

      const r0 = w.defineRoom('000', 'The Original Room')
      const r1 = w.defineRoom('000', 'The New Room')

      assert.strictEqual(r0, r1)

      assert.strictEqual(r0.getID(), '000')
      assert.strictEqual(r0.getName(), 'The New Room')
    })

    it('deletes Rooms', function () {
      const w = new World()

      const r0 = w.defineRoom('000', 'Room Zero')
      const r1 = w.defineRoom('001', 'Room One')

      assert.deepEqual(w.getRooms(), [r0, r1])

      assert.isTrue(w.deleteRoom('000'))
      assert.isFalse(w.deleteRoom('000'))

      assert.deepEqual(w.getRooms(), [r1])
    })

    it('designates a default Room', function () {
      const w = new World()

      assert.isFalse(w.getDefaultRoom().hasValue())

      const r0 = w.defineRoom('id0', 'zero')
      const r1 = w.defineRoom('id1', 'one')

      assert.strictEqual(w.getDefaultRoom().getValue(), r0)

      w.setDefaultRoomID('id1')
      assert.strictEqual(w.getDefaultRoom().getValue(), r1)

      w.deleteRoom('id1')
      assert.strictEqual(w.getDefaultRoom().getValue(), r0)

      w.deleteRoom('id0')
      assert.isFalse(w.getDefaultRoom().hasValue())
    })
  })
})
