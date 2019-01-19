const util = require('util')
const { makeType } = require('../type')

module.exports = {
  registerTypes (t, symbolTable, methodRegistry) {
    //
  },

  registerMethods (t, symbolTable, methodRegistry) {
    const tA = makeType("'A")

    methodRegistry.register(
      tA, 'getType', [], t.Type,
      ({ receiverType }) => receiverType
    ).markPure()

    methodRegistry.register(
      tA, '==', [tA], t.Bool,
      ({ receiver }, arg) => receiver === arg
    ).markPure()

    methodRegistry.register(
      tA, '!=', [tA], t.Bool,
      ({ receiver, interpreter, receiverType, argumentTypes }, arg) => {
        const equals = methodRegistry.lookup(symbolTable, receiverType, '==', argumentTypes)
        return !equals.invoke({
          receiver,
          selector: '==',
          interpreter,
          astNode: null
        }, arg)
      }
    )

    methodRegistry.register(
      tA, 'debug', [], tA,
      ({ receiver, receiverType }) => {
        console.log(`${util.inspect(receiver, {breakLength: 100})}: ${receiverType}`)
        return receiver
      }
    ).markPure()
  }
}
