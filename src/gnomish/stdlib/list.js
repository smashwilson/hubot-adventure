const {makeType} = require('../type')
const {Some, none} = require('./option')

module.exports = {
  registerTypes (t, symbolTable, methodRegistry) {
    t.registerType('List')
  },

  registerMethods (t, symbolTable, methodRegistry) {
    const tA = makeType("'A")
    const tB = makeType("'B")
    const tR = makeType("'R")
    const tListA = makeType(t.List, [tA])
    const tListB = makeType(t.List, [tB])
    const tOptionA = makeType(t.Option, [tA])
    const tOptionB = makeType(t.Option, [tB])

    // Construction

    methodRegistry.register(
      t.World, 'list', [tA.repeatable()], tListA,
      (_, ...args) => args)

    // Accessors

    methodRegistry.register(
      tListA, 'length', [], t.Int,
      ({receiver}) => receiver.length)

    methodRegistry.register(
      tListA, 'empty', [], t.Bool,
      ({receiver}) => receiver.length === 0)

    methodRegistry.register(
      tListA, 'at', [t.Int], tOptionA,
      ({receiver}, arg) => {
        const v = receiver[arg]
        return v ? new Some(v) : none
      }
    )

    methodRegistry.register(
      tListA, 'first', [], tOptionA,
      ({receiver}, arg) => receiver.length > 0 ? new Some(receiver[0]) : none)

    methodRegistry.register(
      tListA, 'last', [], tOptionA,
      ({receiver}, arg) => receiver.length > 0 ? new Some(receiver[receiver.length - 1]) : none)

    // Comparison

    methodRegistry.register(
      tListA, '==', [tListA], t.Bool,
      ({receiver}, arg) => receiver.length === arg.length && receiver.every((l, i) => l === arg[i]))

    // Mutation

    methodRegistry.register(
      tListA, '<<', [tA], tListA,
      ({receiver}, arg) => {
        receiver.push(arg)
        return receiver
      })

    methodRegistry.register(
      tListA, 'put', [t.Int, tA], tListA,
      ({receiver}, index, arg) => {
        receiver[index] = arg
        return receiver
      })

    // Iteration

    methodRegistry.register(
      tListA, 'do', [makeType(t.Block, [tR, tA])], tListA,
      ({receiver, interpreter}, blk) => {
        for (let i = 0; i < receiver.length; i++) {
          blk.evaluate(interpreter, [receiver[i]])
        }
        return receiver
      })

    methodRegistry.register(
      tListA, 'do', [makeType(t.Block, [tR, tA, t.Int])], tListA,
      ({receiver, interpreter}, blk) => {
        for (let i = 0; i < receiver.length; i++) {
          blk.evaluate(interpreter, [receiver[i], i])
        }
        return receiver
      })

    methodRegistry.register(
      tListA, 'map', [makeType(t.Block, [tB, tA])], makeType(t.List, [tB]),
      ({receiver, interpreter}, blk) => receiver.map(each => blk.evaluate(interpreter, [each])))

    methodRegistry.register(
      tListA, 'map', [makeType(t.Block, [tB, tA, t.Int])], tListB,
      ({receiver, interpreter}, blk) => receiver.map((each, index) => blk.evaluate(interpreter, [each, index])))

    methodRegistry.register(
      tListA, 'flatMap', [makeType(t.Block, [tListB, tA])], tListB,
      ({receiver, interpreter}, blk) => {
        return receiver.reduce((acc, each) => {
          acc.push(...blk.evaluate(interpreter, [each]))
          return acc
        }, [])
      })

    methodRegistry.register(
      tListA, 'flatMap', [makeType(t.Block, [tListB, tA, t.Int])], tListB,
      ({receiver, interpreter}, blk) => {
        return receiver.reduce((acc, each, index) => {
          acc.push(...blk.evaluate(interpreter, [each, index]))
          return acc
        }, [])
      })

    methodRegistry.register(
      tListA, 'flatMap', [makeType(t.Block, [tOptionB, tA])], tListB,
      ({receiver, interpreter}, blk) => {
        return receiver.reduce((acc, each) => {
          const v = blk.evaluate(interpreter, [each])
          if (v.hasValue()) {
            acc.push(v.getValue())
          }
          return acc
        }, [])
      })

    methodRegistry.register(
      tListA, 'flatMap', [makeType(t.Block, [tOptionB, tA, t.Int])], tListB,
      ({receiver, interpreter}, blk) => {
        return receiver.reduce((acc, each, index) => {
          const v = blk.evaluate(interpreter, [each, index])
          if (v.hasValue()) {
            acc.push(v.getValue())
          }
          return acc
        }, [])
      })

    const reduceBody = ({receiver, interpreter}, initial, blk) => {
      return receiver.reduce((acc, each, index) => blk.evaluate(interpreter, [acc, each, index]))
    }

    methodRegistry.register(
      tListA, 'reduce', [tB, makeType(t.Block, [tB, tA])], tB,
      reduceBody)
    methodRegistry.register(
      tListA, 'reduce', [tB, makeType(t.Block, [tB, tA, t.Int])], tB,
      reduceBody)
  }
}
