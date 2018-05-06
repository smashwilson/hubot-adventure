/* eslint-env mocha */

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

    methodRegistry.register(
      t.World, 'describe', [t.String, makeType(t.Block, [tA])], t.World,
      ({receiver, interpreter}, message, blk) => {
        describe(message, function () {
          blk.evaluate(interpreter)
        })
        return receiver
      })

    methodRegistry.register(
      t.World, 'it', [t.String, makeType(t.Block, [tA])], t.World,
      ({receiver, interpreter}, message, blk) => {
        it(message, function () {
          blk.evaluate(interpreter)
        })
        return receiver
      })

    methodRegistry.register(
      t.Assert, 'isTrue', [t.Bool], t.Option,
      (_, cond) => {
        assert.isTrue(cond)
        return none
      })

    methodRegistry.register(
      t.Assert, 'isFalse', [t.Bool], t.Option,
      (_, cond) => {
        assert.isFalse(cond)
        return none
      })

    methodRegistry.register(
      t.Assert, 'equal', [tA, tA], t.Option,
      ({argumentTypes, interpreter}, lhs, rhs) => {
        const [lType, rType] = argumentTypes

        const m = methodRegistry.lookup(symbolTable, lType, '==', [rType])
        const result = m.invoke({
          receiver: lhs,
          selector: '==',
          interpreter,
          astNode: null
        }, rhs)

        if (!result) {
          const message = `${lhs}:${lType} and ${rhs}:${rType} are not equal`
          assert.fail(lhs, rhs, message, '==')
        }
        return none
      })
  }
}
