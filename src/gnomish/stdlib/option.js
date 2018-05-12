const {makeType} = require('../type')

class Some {
  constructor (value) {
    this.value = value
  }

  hasValue () {
    return true
  }

  getValue () {
    return this.value
  }
}

const none = {
  hasValue () {
    return false
  },

  getValue () {
    throw new Error('Attempt to unwrap value from None')
  }
}

module.exports = {
  Some,
  none,

  registerTypes (t, symbolTable, methodRegistry) {
    t.registerType('Option')
  },

  registerMethods (t, symbolTable, methodRegistry) {
    const tA = makeType("'A")
    const tB = makeType("'B")
    const tOptionA = makeType(t.Option, [tA])
    const tListA = makeType(t.List, [tA])

    // Construction

    methodRegistry.register(t.World, 'some', [tA], tOptionA, (_, value) => {
      return new Some(value)
    }).markPure()

    symbolTable.setStatic('none', tOptionA, none)

    // Comparison

    methodRegistry.register(tOptionA, '==', [tOptionA], t.Bool,
      ({receiver, receiverType, interpreter}, operand) => {
        if (receiver.hasValue() !== operand.hasValue()) {
          return false
        }

        const recArgType = receiverType.getParams()[0]
        if (receiver.hasValue()) {
          const m = methodRegistry.lookup(symbolTable, recArgType, '==', [recArgType])
          return m.invoke({
            receiver: receiver.getValue(),
            selector: '==',
            interpreter
          }, operand.getValue())
        } else {
          return true
        }
      }).markPure()

    // Direct form
    methodRegistry.register(tOptionA, 'or', [tA], tA, ({receiver}, alt) => {
      if (receiver.hasValue()) {
        return receiver.getValue()
      } else {
        return alt
      }
    }).markPure()

    // Block form
    methodRegistry.register(tOptionA, 'or', [makeType(t.Block, [tA])], tA, ({receiver, interpreter}, blk) => {
      if (receiver.hasValue()) {
        return receiver.getValue()
      } else {
        return blk.evaluate(interpreter)
      }
    })

    // Map

    methodRegistry.register(
      tOptionA, 'map', [makeType(t.Block, [tB, tA])], makeType(t.Option, [tB]),
      ({receiver, interpreter}, blk) => {
        if (receiver.hasValue()) {
          return new Some(blk.evaluate(interpreter, [receiver.getValue()]))
        } else {
          return none
        }
      })

    // Concatenation

    methodRegistry.register(
      tOptionA, '+', [tOptionA], tListA,
      ({receiver}, other) => {
        const result = []
        if (receiver.hasValue()) result.push(receiver.getValue())
        if (other.hasValue()) result.push(other.getValue())
        return result
      }).markPure()

    methodRegistry.register(
      tOptionA, '+', [tListA], tListA,
      ({receiver}, list) => {
        if (receiver.hasValue()) {
          return [receiver.getValue()].concat(list)
        } else {
          return list
        }
      })

    // Conversion

    methodRegistry.register(
      tOptionA, 'toList', [], tListA,
      ({receiver}) => {
        return receiver.hasValue() ? [receiver.getValue()] : []
      })

    // Copying

    methodRegistry.register(
      tOptionA, 'copy', [], tOptionA,
      ({receiver, receiverType, interpreter}) => {
        if (!receiver.hasValue()) {
          return receiver
        }

        const recArgType = receiverType.getParams()[0]
        const m = methodRegistry.lookup(symbolTable, recArgType, 'copy', [])

        return new Some(m.invoke({
          receiver: receiver.getValue(),
          selector: 'copy',
          interpreter
        }))
      }
    )
  }
}
