module.exports = {
  registerTypes (t, symbolTable, methodRegistry) {
    t.registerType('World')
  },

  registerMethods (t, symbolTable, methodRegistry) {
    const w = {}
    symbolTable.setStatic('world', t.World, w)
    symbolTable.setStatic('this', t.World, w)
  }
}
