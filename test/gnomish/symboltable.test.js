/* eslint-env mocha */

const {assert} = require('chai')
const {SymbolTable, SlotEntry} = require('../../src/gnomish/symboltable')
const {makeType} = require('../../src/gnomish/type')

describe('SymbolTable', function () {
  describe('variable names', function () {
    it('stores and retrieves identifier information', function () {
      const st = new SymbolTable()

      const e = new SlotEntry(makeType('Int'), 0)
      st.put('foo', e)
      assert.strictEqual(st.at('foo'), e)
    })

    it('throws an error when an identifier is not found', function () {
      const st = new SymbolTable()
      assert.throws(() => st.at('nope'), /Identifier "nope" not found/)
    })
  })

  describe('scope heirarchy', function () {
    it('creates a child table', function () {
      const tInt = makeType('Int')

      const e0 = new SlotEntry(tInt, 0)
      const e1 = new SlotEntry(tInt, 1)
      const e2 = new SlotEntry(tInt, 2)
      const e3 = new SlotEntry(tInt, 3)

      const parent = new SymbolTable()

      parent.put('inherited', e0)
      parent.put('shadowed', e1)

      const child = parent.push()
      child.put('shadowed', e2)
      child.put('local', e3)

      assert.strictEqual(child.at('inherited'), e0)
      assert.strictEqual(child.at('shadowed'), e2)
      assert.strictEqual(child.at('local'), e3)
    })

    it('restores its parent table', function () {
      const parent = new SymbolTable()
      const child = parent.push()
      assert.strictEqual(child.pop(), parent)
    })

    it("doesn't allow you to pop the final table", function () {
      const root = new SymbolTable()
      assert.throws(() => root.pop(), /Attempt to pop root symbol table/)
    })
  })
})