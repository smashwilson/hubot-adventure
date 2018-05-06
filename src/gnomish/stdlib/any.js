const util = require('util')
const {makeType} = require('../type')

module.exports = {
  registerTypes (t, symbolTable, methodRegistry) {
    //
  },

  registerMethods (t, symbolTable, methodRegistry) {
    const tA = makeType("'A")

    methodRegistry.register(
      tA, 'getType', [], t.Type,
      ({receiverType}) => receiverType
    ).markPure()

    methodRegistry.register(
      tA, '==', [tA], t.Bool,
      ({receiver}, arg) => receiver === arg
    ).markPure()

    methodRegistry.register(
      tA, '!=', [tA], t.Bool,
      ({receiver, interpreter, astNode}, arg) => {
        const rType = astNode.getReceiver().getType()
        const aTypes = astNode.getArgs().map(argNode => argNode.getType())

        const equals = methodRegistry.lookup(symbolTable, rType, '==', aTypes)
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
      ({receiver, receiverType}) => {
        console.log(`${util.inspect(receiver, {breakLength: 100})}: ${receiverType}`)
        return receiver
      }
    ).markPure()
  }
}
