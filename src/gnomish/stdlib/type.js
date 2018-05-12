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

      methodRegistry.register(
        enumType, 'copy', [], enumType,
        ({receiver}) => receiver)
    }

    methodRegistry.register(
      t.World, 'defineEnum', [t.String, t.String.repeatable()], t.Type,
      (_, enumName, ...enumValues) => {
        const gameTable = symbolTable.getGame()
        let enumType
        if (gameTable.has(enumName)) {
          enumType = gameTable.at(enumName).getValue()
        } else {
          enumType = makeType(enumName)
          gameTable.setStatic(enumName, t.Type, enumType)
          installEnumMethods(enumType, methodRegistry)
        }

        for (let i = 0; i < enumValues.length; i++) {
          const value = { name: enumValues[i], ordinal: i }
          gameTable.setStatic(enumValues[i], enumType, value)
        }

        return enumType
      }
    ).setStaticCallback(({astNode, symbolTable, methodRegistry}) => {
      if (!astNode.getArgs()[0].hasStaticValue()) return
      const gameTable = symbolTable.getGame()

      const enumName = astNode.getArgs()[0].getStaticValue()
      const enumType = makeType(enumName)
      gameTable.setStatic(enumName, t.Type, enumType)
      installEnumMethods(enumType, methodRegistry)

      for (let i = 1; i < astNode.getArgs().length; i++) {
        const argNode = astNode.getArgs()[i]
        if (!argNode.hasStaticValue()) {
          continue
        }

        const value = { name: argNode.getStaticValue(), ordinal: i }
        gameTable.setStatic(argNode.getStaticValue(), enumType, value)
      }

      astNode.setStaticValue(enumType)
    })
  }
}
