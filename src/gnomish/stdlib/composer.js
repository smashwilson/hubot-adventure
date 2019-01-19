module.exports = {
  registerTypes (t, symbolTable, methodRegistry) {
    t.registerType('Composer')
  },

  registerMethods (t, symbolTable, methodRegistry) {
    methodRegistry.register(
      t.Composer, '<<', [t.String], t.Composer,
      ({ receiver }, operand) => {
        if (!/[ \t\r\n]$/.test(receiver.string)) {
          receiver.string += ' '
        }
        const processed = operand.split(/[ \t\r\n]+/).filter(s => s.length > 0).join(' ')
        receiver.string += processed
        return receiver
      }
    )

    methodRegistry.register(
      t.Composer, 'sep', [], t.Composer,
      ({ receiver }) => {
        receiver.string += '\n\n'
        return receiver
      }
    )

    methodRegistry.register(
      t.Composer, 'string', [], t.String,
      ({ receiver }) => receiver.string
    )
  }
}
