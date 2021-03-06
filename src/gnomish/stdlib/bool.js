module.exports = {
  registerTypes (t, symbolTable, methodRegistry) {
    t.registerType('Bool')
  },

  registerMethods (t, symbolTable, methodRegistry) {
    symbolTable.setStatic('true', t.Bool, true)
    symbolTable.setStatic('false', t.Bool, false)

    methodRegistry.register(
      t.Bool, '&&', [t.Bool], t.Bool,
      ({ receiver }, operand) => receiver && operand
    ).markPure()

    methodRegistry.register(
      t.Bool, '||', [t.Bool], t.Bool,
      ({ receiver }, operand) => receiver || operand
    ).markPure()

    methodRegistry.register(
      t.Bool, '!', [], t.Bool,
      ({ receiver }) => !receiver
    ).markPure()

    methodRegistry.register(
      t.Bool, 'copy', [], t.Bool,
      ({ receiver }) => receiver
    )

    methodRegistry.register(
      t.Bool, 'string', [], t.String,
      ({ receiver }) => receiver.toString()
    )
  }
}
