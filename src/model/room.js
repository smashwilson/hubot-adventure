class Room {
  constructor (id, name) {
    this.id = id
    this.name = name
  }

  getID () {
    return this.id
  }

  getName () {
    return this.name
  }

  setName (name) {
    this.name = name
  }

  static registerTypes (t, symbolTable, methodRegistry) {
    t.registerType('Room')
  }

  static registerMethods (t, symbolTable, methodRegistry) {
    //
  }
}

module.exports = { Room }
