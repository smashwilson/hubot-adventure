const {makeType} = require('../type')

module.exports = {
  registerTypes (t, symbolTable, methodRegistry) {
    //
  },

  registerMethods (t, symbolTable, methodRegistry) {
    const installEnumMethods = (enumType, methodRegistry) => {
      methodRegistry.register(
        enumType, 'toString', [], t.String,
        ({receiver}) => receiver.name)
    }

    methodRegistry.register(
      t.World, 'defineEnum', [t.String, t.String.repeatable()], t.Type,
      (_, enumName, ...enumValues) => {
        let enumType
        if (symbolTable.has(enumName)) {
          enumType = symbolTable.at(enumName)
        } else {
          enumType = makeType(enumName)
          // TODO define on game symbol table
          symbolTable.setStatic(enumName, t.Type, enumType)
          installEnumMethods(enumType, methodRegistry)
        }

        for (let i = 0; i < enumValues.length; i++) {
          const value = { name: enumValues[i], ordinal: i }
          symbolTable.setStatic(enumValues[i], enumType, value)
        }

        return enumType
      }
    ).setStaticCallback(({astNode, symbolTable, methodRegistry}) => {
      if (!astNode.getArgs().every(argNode => argNode.hasStaticValue())) return

      const enumName = astNode.getArgs()[0].getStaticValue()
      const enumType = makeType(enumName)
      // TODO define on game symbol table
      symbolTable.setStatic(enumName, t.Type, enumType)
      installEnumMethods(enumType, methodRegistry)

      for (let i = 1; i < astNode.getArgs().length; i++) {
        const argNode = astNode.getArgs()[i]
        if (!argNode.hasStaticValue()) {
          continue
        }

        const value = { name: argNode.getStaticValue(), ordinal: i }
        symbolTable.setStatic(argNode.getStaticValue(), enumType, value)
      }

      astNode.setStaticValue(enumType)
    })
  }
}
