/* eslint-env mocha */

const { TypeRegistry } = require('../../src/gnomish/typeregistry')
const { makeType } = require('../../src/gnomish/type')
const { none } = require('../../src/gnomish/stdlib/option')
const { assert } = require('chai')

module.exports = {
  register (symbolTable, methodRegistry) {
    const t = new TypeRegistry(symbolTable)
    t.registerType('Assert')
    const tA = makeType("'A")

    symbolTable.setStatic('assert', t.Assert, Symbol('assert'))

    methodRegistry.register(
      t.World, 'describe', [t.String, makeType(t.Block, [tA])], t.World,
      ({ receiver, interpreter }, message, blk) => {
        describe(message, function () {
          blk.evaluate(interpreter)
        })
        return receiver
      })

    methodRegistry.register(
      t.World, 'describeonly', [t.String, makeType(t.Block, [tA])], t.World,
      ({ receiver, interpreter }, message, blk) => {
        describe.only(message, function () {
          blk.evaluate(interpreter)
        })
        return receiver
      })

    methodRegistry.register(
      t.World, 'it', [t.String, makeType(t.Block, [tA])], t.World,
      ({ receiver, interpreter }, message, blk) => {
        it(message, function () {
          blk.evaluate(interpreter)
        })
        return receiver
      })

    methodRegistry.register(
      t.World, 'itonly', [t.String, makeType(t.Block, [tA])], t.World,
      ({ receiver, interpreter }, message, blk) => {
        it.only(message, function () {
          blk.evaluate(interpreter)
        })
        return receiver
      })

    methodRegistry.register(
      t.World, 'beforeEach', [makeType(t.Block, [tA])], t.World,
      ({ receiver, interpreter }, blk) => {
        beforeEach(function () {
          blk.evaluate(interpreter)
        })
        return receiver
      }
    )

    methodRegistry.register(
      t.World, 'afterEach', [makeType(t.Block, [tA])], t.World,
      ({ receiver, interpreter }, blk) => {
        afterEach(function () {
          blk.evaluate(interpreter)
        })
        return receiver
      }
    )

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
      ({ argumentTypes, interpreter }, lhs, rhs) => {
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

    methodRegistry.register(
      t.Assert, 'same', [tA, tA], t.Option,
      ({ argumentTypes, interpreter }, lhs, rhs) => {
        const [lType, rType] = argumentTypes

        if (lhs !== rhs) {
          const message = `${lhs}:${lType} and ${rhs}:${rType} are not equal`
          assert.fail(lhs, rhs, message, 'same')
        }
        return none
      })

    methodRegistry.register(
      t.Assert, 'different', [tA, tA], t.Option,
      ({ argumentTypes, interpreter }, lhs, rhs) => {
        const [lType, rType] = argumentTypes

        if (lhs === rhs) {
          const message = `${lhs}:${lType} and ${rhs}:${rType} are not equal`
          assert.fail(lhs, rhs, message, 'different')
        }
        return none
      })

    methodRegistry.register(
      t.Assert, 'said', [t.String], t.Option,
      ({ interpreter }, needle) => {
        const context = interpreter.getContext()
        if (!context || !context.wasSaid) {
          assert.fail(null, null, 'assert.said may not be used without {wasSaid} in interpreter context')
        } else if (!context.wasSaid(needle)) {
          assert.fail(null, null, `"${needle}" was not passed to say()`)
        }
        return none
      }
    )
  }
}
