const {TypeRegistry} = require('../../../src/gnomish/typeregistry')
const {makeType} = require('../../../src/gnomish/type')
const {none} = require('../../../src/gnomish/stdlib/option')
const {assert} = require('chai')

module.exports = {
  register (symbolTable, methodRegistry) {
    const t = new TypeRegistry(symbolTable)
    t.registerType('Assert')
    const tA = makeType("'A")

    symbolTable.setStatic('assert', t.Assert, Symbol('assert'))

    methodRegistry.register(t.Assert, 'isTrue', [t.Bool], t.Option, (_, cond) => {
      assert.isTrue(cond)
      return none
    })
    methodRegistry.register(t.Assert, 'isFalse', [t.Bool], t.Option, (_, cond) => {
      assert.isFalse(cond)
      return none
    })
    methodRegistry.register(t.Assert, 'equal', [tA, tA], t.Option, (_, lhs, rhs) => {
      assert.strictEqual(lhs, rhs)
      return none
    })
  }
}
