const {makeType} = require('../type')

module.exports = {
  registerTypes (t, symbolTable, methodRegistry) {
    //
  },

  registerMethods (t, symbolTable, methodRegistry) {
    const tA = makeType("'A")

    methodRegistry.register(tA, 'getType', [], t.Type, ({receiver, astNode}) => {
      return astNode.getReceiver().getType()
    })
  }
}
