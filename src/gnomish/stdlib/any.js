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
      ({receiver, astNode}) => {
        return astNode.getReceiver().getType()
      })

    methodRegistry.register(
      tA, '==', [tA], t.Bool,
      ({receiver}, arg) => receiver === arg)

    methodRegistry.register(
      tA, 'debug', [], tA,
      ({receiver, astNode}) => {
        const type = astNode ? astNode.getReceiver().getType() : '<unknown>'
        console.log(`${util.inspect(receiver, {breakLength: 100})}: ${type}`)
        return receiver
      })
  }
}
