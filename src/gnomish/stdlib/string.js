module.exports = {
  registerTypes (t, symbolTable, methodRegistry) {
    t.registerType('String')
  },

  registerMethods (t, symbolTable, methodRegistry) {
    methodRegistry.register(
      t.String, 'length', [], t.Int,
      ({ receiver }) => receiver.length
    ).markPure()

    methodRegistry.register(
      t.String, 'empty', [], t.Bool,
      ({ receiver }) => receiver.length === 0
    ).markPure()

    const substringBody = ({ receiver }, start, length) => {
      return receiver.substr(start, length)
    }

    methodRegistry.register(
      t.String, 'substring', [t.Int, t.Int], t.String,
      substringBody).markPure()
    methodRegistry.register(
      t.String, 'substring', [t.Int], t.String,
      substringBody).markPure()

    methodRegistry.register(
      t.String, '+', [t.String], t.String,
      ({ receiver }, operand) => receiver + operand
    ).markPure()

    methodRegistry.register(
      t.String, 'copy', [], t.String,
      ({ receiver }) => receiver
    )

    methodRegistry.register(
      t.String, 'compose', [], t.Composer,
      ({ receiver }) => {
        return { string: receiver.split(/[ \t\r\n]+/).filter(s => s.length > 0).join(' ') }
      }
    )
  }
}
