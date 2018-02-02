/* eslint-env mocha */

const {assert} = require('chai')
const {World} = require('../../src/model/world')

describe('World', function () {
  it('bootstraps a symbol table and method registry with the standard library', function () {
    const w = new World()

    const st = w.getSymbolTable()
    assert.isTrue(st.has('Int'))
    assert.isTrue(st.has('String'))
    assert.isTrue(st.has('Type'))
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

  it('creates a Game with a child symbol table and method registry', function () {
    const w = new World()
    const g = w.createGame('C1234')

    assert.deepEqual(w.getGames(), [g])

    const gSt = g.getSymbolTable()
    assert.strictEqual(gSt.pop(), w.getSymbolTable())
    assert.strictEqual(gSt.getGame(), gSt)

    assert.notStrictEqual(g.getMethodRegistry(), w.getMethodRegistry())
    assert.strictEqual(g.getMethodRegistry().parent, w.getMethodRegistry())
  })
})
