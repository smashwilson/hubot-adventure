module.exports = {
  registerTypes (t, symbolTable, methodRegistry) {
    t.registerType('Int')
  },

  registerMethods (t, symbolTable, methodRegistry) {
    methodRegistry.register(t.Int, '+', [t.Int], t.Int, ({receiver}, operand) => receiver + operand)
    methodRegistry.register(t.Int, '-', [t.Int], t.Int, ({receiver}, operand) => receiver - operand)
    methodRegistry.register(t.Int, '*', [t.Int], t.Int, ({receiver}, operand) => receiver * operand)
    methodRegistry.register(t.Int, '/', [t.Int], t.Real, ({receiver}, operand) => receiver / operand)
    methodRegistry.register(t.Int, '//', [t.Int], t.Int, ({receiver}, operand) => Math.floor(receiver / operand))
    methodRegistry.register(t.Int, '^', [t.Int], t.Int, ({receiver}, operand) => Math.pow(receiver, operand))

    methodRegistry.register(t.Int, '==', [t.Int], t.Bool, ({receiver}, operand) => receiver === operand)
    methodRegistry.register(t.Int, '<', [t.Int], t.Bool, ({receiver}, operand) => receiver < operand)
    methodRegistry.register(t.Int, '<=', [t.Int], t.Bool, ({receiver}, operand) => receiver <= operand)
    methodRegistry.register(t.Int, '>', [t.Int], t.Bool, ({receiver}, operand) => receiver > operand)
    methodRegistry.register(t.Int, '>=', [t.Int], t.Bool, ({receiver}, operand) => receiver >= operand)
  }
}
