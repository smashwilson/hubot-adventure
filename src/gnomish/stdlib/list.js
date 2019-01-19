const { makeType } = require('../type')
const { Some, none } = require('./option')

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
      ({ receiver }) => receiver.length)

    methodRegistry.register(
      tListA, 'empty', [], t.Bool,
      ({ receiver }) => receiver.length === 0)

    methodRegistry.register(
      tListA, 'at', [t.Int], tOptionA,
      ({ receiver }, arg) => {
        const v = receiver[arg]
        return v ? new Some(v) : none
      })

    methodRegistry.register(
      tListA, 'first', [], tOptionA,
      ({ receiver }, arg) => receiver.length > 0 ? new Some(receiver[0]) : none)

    methodRegistry.register(
      tListA, 'last', [], tOptionA,
      ({ receiver }, arg) => receiver.length > 0 ? new Some(receiver[receiver.length - 1]) : none)

    // Comparison

    methodRegistry.register(
      tListA, '==', [tListA], t.Bool,
      ({ receiver, receiverType, interpreter }, arg) => {
        if (receiver.length !== arg.length) {
          return false
        }

        if (receiver.length === 0 && arg.length === 0) {
          return true
        }

        const memberType = receiverType.getParams()[0]
        const m = methodRegistry.lookup(symbolTable, memberType, '==', [memberType])
        return receiver.every((l, i) => m.invoke({receiver: l, selector: '==', interpreter}, arg[i]))
      })

    // Mutation

    methodRegistry.register(
      tListA, '<<', [tA], tListA,
      ({ receiver }, arg) => {
        receiver.push(arg)
        return receiver
      })

    methodRegistry.register(
      tListA, 'put', [t.Int, tA], tListA,
      ({ receiver }, index, arg) => {
        receiver[index] = arg
        return receiver
      })

    methodRegistry.register(
      tListA, '+', [tListA], tListA,
      ({ receiver }, otherList) => receiver.concat(otherList))

    methodRegistry.register(
      tListA, '+', [tOptionA], tListA,
      ({ receiver }, option) => {
        if (option.hasValue()) {
          return receiver.concat([option.getValue()])
        } else {
          return receiver
        }
      })

    // Iteration

    const doBody = ({ receiver, interpreter }, blk) => {
      for (let i = 0; i < receiver.length; i++) {
        blk.evaluate(interpreter, [receiver[i], i])
      }
      return receiver
    }

    methodRegistry.register(
      tListA, 'do', [makeType(t.Block, [tR, tA])], tListA,
      doBody)
    methodRegistry.register(
      tListA, 'do', [makeType(t.Block, [tR, tA, t.Int])], tListA,
      doBody)

    const mapBody = ({ receiver, interpreter }, blk) => {
      return receiver.map((each, index) => blk.evaluate(interpreter, [each, index]))
    }

    methodRegistry.register(
      tListA, 'map', [makeType(t.Block, [tB, tA])], makeType(t.List, [tB]),
      mapBody)
    methodRegistry.register(
      tListA, 'map', [makeType(t.Block, [tB, tA, t.Int])], tListB,
      mapBody)

    const flatMapListBody = ({ receiver, interpreter }, blk) => {
      return receiver.reduce((acc, each, index) => {
        acc.push(...blk.evaluate(interpreter, [each, index]))
        return acc
      }, [])
    }

    methodRegistry.register(
      tListA, 'flatMap', [makeType(t.Block, [tListB, tA])], tListB,
      flatMapListBody)
    methodRegistry.register(
      tListA, 'flatMap', [makeType(t.Block, [tListB, tA, t.Int])], tListB,
      flatMapListBody)

    const flatMapOptionBody = ({ receiver, interpreter }, blk) => {
      return receiver.reduce((acc, each, index) => {
        const v = blk.evaluate(interpreter, [each, index])
        if (v.hasValue()) {
          acc.push(v.getValue())
        }
        return acc
      }, [])
    }

    methodRegistry.register(
      tListA, 'flatMap', [makeType(t.Block, [tOptionB, tA])], tListB,
      flatMapOptionBody)
    methodRegistry.register(
      tListA, 'flatMap', [makeType(t.Block, [tOptionB, tA, t.Int])], tListB,
      flatMapOptionBody)

    const reduceBody = ({ receiver, interpreter }, initial, blk) => {
      return receiver.reduce((acc, each, index) => blk.evaluate(interpreter, [acc, each, index]), initial)
    }

    methodRegistry.register(
      tListA, 'reduce', [tB, makeType(t.Block, [tB, tB, tA])], tB,
      reduceBody)
    methodRegistry.register(
      tListA, 'reduce', [tB, makeType(t.Block, [tB, tB, tA, t.Int])], tB,
      reduceBody)

    const foldBody = ({ receiver, interpreter }, blk) => {
      return receiver.reduce((acc, each, index) => blk.evaluate(interpreter, [acc, each, index]))
    }

    methodRegistry.register(
      tListA, 'fold', [makeType(t.Block, [tA, tA])], tA,
      foldBody)
    methodRegistry.register(
      tListA, 'fold', [makeType(t.Block, [tA, tA, t.Int])], tA,
      foldBody)

    const filterBody = ({ receiver, interpreter }, blk) => {
      return receiver.filter((each, index) => blk.evaluate(interpreter, [each, index]))
    }

    methodRegistry.register(
      tListA, 'filter', [makeType(t.Block, [t.Bool, tA])], tListA,
      filterBody)
    methodRegistry.register(
      tListA, 'filter', [makeType(t.Block, [t.Bool, tA, t.Int])], tListA,
      filterBody)

    methodRegistry.register(
      tListA, 'copy', [], tListA,
      ({receiver, receiverType, interpreter}) => {
        if (receiver.length === 0) {
          return []
        }

        const recArgType = receiverType.getParams()[0]
        const m = methodRegistry.lookup(symbolTable, recArgType, 'copy', [])

        return receiver.map((each, i) => {
          return m.invoke({
            receiver: each,
            selector: 'copy',
            interpreter,
            astNode: null
          })
        })
      }
    )
  }
}
