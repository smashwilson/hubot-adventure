const { makeType } = require('../gnomish/type')

class Noun {
  constructor (room, name) {
    this.room = room
    this.name = name
  }

  getName () {
    return this.name
  }

  defineVerb (verb, block) {
    this.room.defineCommand(`${verb} ${this.name}`, block)
    return this
  }

  deleteVerb (verb) {
    return this.room.deleteCommand(`${verb} ${this.name}`)
  }

  static registerTypes (t, symbolTable, methodRegistry) {
    t.registerType('Noun')
  }

  static registerMethods (t, symbolTable, methodRegistry) {
    const tR = makeType("'R")
    const tBlockR = makeType(t.Block, [tR])
    const tStringList = makeType(t.List, [t.String])

    methodRegistry.register(
      t.Noun, 'getName', [], t.String,
      ({ receiver }) => receiver.getName()
    )

    methodRegistry.register(
      t.Noun, 'verb', [t.String, tBlockR], t.Noun,
      ({ receiver }, verb, block) => receiver.defineVerb(verb, block)
    )
    methodRegistry.register(
      t.Noun, 'verb', [tStringList, tBlockR], t.Noun,
      ({ receiver }, verbs, block) => {
        for (const verb of verbs) {
          receiver.defineVerb(verb, block)
        }
        return receiver
      }
    )

    methodRegistry.register(
      t.Noun, 'deleteVerb', [t.String], t.Bool,
      ({ receiver }, verb, block) => receiver.deleteVerb(verb, block)
    )
  }
}

module.exports = { Noun }
