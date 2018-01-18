const {TypeRegistry} = require('../typeregistry')
const builtins = ['./bool', './int', './real', './block', './option'].map(p => require(p))

module.exports = {
  register (symbolTable, methodRegistry) {
    const t = new TypeRegistry(symbolTable)

    for (const b of builtins) {
      b.registerTypes(t, symbolTable, methodRegistry)
    }

    for (const b of builtins) {
      b.registerMethods(t, symbolTable, methodRegistry)
    }
  }
}
