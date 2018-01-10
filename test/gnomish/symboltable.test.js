/* eslint-env mocha */

const {assert} = require('chai')
const {SymbolTable} = require('../../src/gnomish/symboltable')
const {makeType} = require('../../src/gnomish/type')

describe('SymbolTable', function () {
  const ROOT = Symbol('root')
  const CHILD = Symbol('child')

  describe('variable names', function () {
    it('stores and retrieves identifier information', function () {
      const st = new SymbolTable(ROOT)

      const e = st.allocateSlot('foo', makeType('Int'))
      assert.strictEqual(e.getSlot(), 0)
      assert.strictEqual(st.at('foo'), e)
      assert.strictEqual(st.binding('foo').entry, e)
      assert.strictEqual(st.binding('foo').frame, ROOT)
    })

    it('throws an error when an identifier is not found', function () {
      const st = new SymbolTable(ROOT)
      assert.throws(() => st.at('nope'), /Identifier "nope" not found/)
      assert.throws(() => st.binding('nope'), /Identifier "nope" not found/)
    })
  })

  describe('scope heirarchy', function () {
    it('creates a child table', function () {
      const tInt = makeType('Int')

      const parent = new SymbolTable(ROOT)

      const e0 = parent.allocateSlot('inherited', tInt)
      const e1 = parent.allocateSlot('shadowed', tInt)
      assert.strictEqual(e0.getSlot(), 0)
      assert.strictEqual(e1.getSlot(), 1)

      const child = parent.push(CHILD)
      const e2 = child.allocateSlot('shadowed', tInt)
      const e3 = child.allocateSlot('local', tInt)
      assert.strictEqual(e2.getSlot(), 0)
      assert.strictEqual(e3.getSlot(), 1)

      assert.deepEqual(child.binding('inherited'), {entry: e0, frame: ROOT})
      assert.deepEqual(child.binding('shadowed'), {entry: e2, frame: CHILD})
      assert.deepEqual(child.binding('local'), {entry: e3, frame: CHILD})
    })

    it('restores its parent table', function () {
      const parent = new SymbolTable(ROOT)
      const child = parent.push()
      assert.strictEqual(child.pop(), parent)
    })

    it("doesn't allow you to pop the final table", function () {
      const root = new SymbolTable(ROOT)
      assert.throws(() => root.pop(), /Attempt to pop root symbol table/)
    })
  })
})
