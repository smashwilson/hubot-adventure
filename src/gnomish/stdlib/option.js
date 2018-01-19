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

    methodRegistry.register(makeType(t.Option, [tA]), 'or', [tA], tA, ({receiver}, alt) => {
      if (receiver.hasValue()) {
        return receiver.getValue()
      } else {
        return alt
      }
    })
  }
}
