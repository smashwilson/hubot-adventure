class Noun {
  constructor (room, name) {
    this.room = room
    this.name = name
  }

  getName () {
    return this.name
  }

  defineCommand (verb, block) {
    return this.room.defineCommand(`${verb} ${this.name}`, block)
  }

  deleteCommand (verb) {
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
  }
}

module.exports = { Noun }
