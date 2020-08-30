const { registerCommandMethods } = require('./commands')

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
    methodRegistry.register(
      t.Noun, 'getName', [], t.String,
      ({ receiver }) => receiver.getName()
    )

    registerCommandMethods({
      t,
      methodRegistry,
      methodName: 'verb',
      receiverType: t.Noun,
      receiverMethod: 'defineVerb'
    })

    methodRegistry.register(
      t.Noun, 'deleteVerb', [t.String], t.Bool,
      ({ receiver }, verb, block) => receiver.deleteVerb(verb, block)
    )
  }
}

module.exports = { Noun }
