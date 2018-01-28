function commonMethods (t, rt, mr) {
  mr.register(rt, '+', [rt], rt, ({receiver}, operand) => receiver + operand)
  mr.register(rt, '-', [rt], rt, ({receiver}, operand) => receiver - operand)
  mr.register(rt, '*', [rt], rt, ({receiver}, operand) => receiver * operand)
  mr.register(rt, '/', [rt], t.Real, ({receiver}, operand) => receiver / operand)
  mr.register(rt, '//', [rt], t.Int, ({receiver}, operand) => Math.floor(receiver / operand))
  mr.register(rt, '%', [rt], t.Int, ({receiver}, operand) => receiver % operand)
  mr.register(rt, '^', [rt], rt, ({receiver}, operand) => Math.pow(receiver, operand))

  mr.register(rt, '==', [rt], t.Bool, ({receiver}, operand) => receiver === operand)
  mr.register(rt, '<', [rt], t.Bool, ({receiver}, operand) => receiver < operand)
  mr.register(rt, '<=', [rt], t.Bool, ({receiver}, operand) => receiver <= operand)
  mr.register(rt, '>', [rt], t.Bool, ({receiver}, operand) => receiver > operand)
  mr.register(rt, '>=', [rt], t.Bool, ({receiver}, operand) => receiver >= operand)
}

module.exports = {
  registerTypes (t, symbolTable, methodRegistry) {
    t.registerType('Int')
    t.registerType('Real')
  },

  registerMethods (t, symbolTable, methodRegistry) {
    commonMethods(t, t.Int, methodRegistry)
    methodRegistry.register(t.Int, 'toReal', [], t.Real, ({receiver}) => receiver).markPure()

    commonMethods(t, t.Real, methodRegistry)
    methodRegistry.register(t.Real, 'round', [], t.Int, ({receiver}) => Math.round(receiver)).markPure()
    methodRegistry.register(t.Real, 'floor', [], t.Int, ({receiver}) => Math.floor(receiver)).markPure()
    methodRegistry.register(t.Real, 'ceiling', [], t.Int, ({receiver}) => Math.ceil(receiver)).markPure()
  }
}
