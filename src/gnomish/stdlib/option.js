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
    const tOptionA = makeType(t.Option, [tA])

    // Comparison

    methodRegistry.register(tOptionA, '==', [tOptionA], t.Bool, ({receiver}, operand) => {
      if (receiver.hasValue() !== operand.hasValue()) {
        return false
      }

      if (receiver.hasValue()) {
        return receiver.getValue() === operand.getValue()
      } else {
        return true
      }
    })

    // Direct form
    methodRegistry.register(tOptionA, 'or', [tA], tA, ({receiver}, alt) => {
      if (receiver.hasValue()) {
        return receiver.getValue()
      } else {
        return alt
      }
    })

    // Block form
    methodRegistry.register(tOptionA, 'or', [makeType(t.Block, [tA])], tA, ({receiver, interpreter}, blk) => {
      if (receiver.hasValue()) {
        return receiver.getValue()
      } else {
        return blk.evaluate(interpreter)
      }
    })
  }
}
