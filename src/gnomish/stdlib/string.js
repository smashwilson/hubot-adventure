module.exports = {
  registerTypes (t, symbolTable, methodRegistry) {
    t.registerType('String')
  },

  registerMethods (t, symbolTable, methodRegistry) {
    methodRegistry.register(
      t.String, 'length', [], t.Int,
      ({receiver}) => receiver.length)

    methodRegistry.register(
      t.String, 'empty', [], t.Bool,
      ({receiver}) => receiver.length === 0)

    const substringBody = ({receiver}, start, length) => {
      return receiver.substr(start, length)
    }

    methodRegistry.register(
      t.String, 'substring', [t.Int, t.Int], t.String,
      substringBody)
    methodRegistry.register(
      t.String, 'substring', [t.Int], t.String,
      substringBody)

    methodRegistry.register(
      t.String, '+', [t.String], t.String,
      ({receiver}, operand) => receiver + operand)
  }
}
