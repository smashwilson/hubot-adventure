const { Noun } = require('./noun')

class Room {
  constructor (world, id, name) {
    this.world = world
    this.id = id
    this.name = name

    this.fallThroughCommand = null
    this.localCommands = new Map()

    this.nouns = new Map()
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

  defineCommand (command, block) {
    this.localCommands.set(command, block)
  }

  deleteCommand (command) {
    return this.localCommands.delete(command)
  }

  setFallThroughCommand (block) {
    this.fallThroughCommand = block
  }

  getCommands () {
    return Array.from(this.localCommands.keys())
  }

  executeCommand (command, interpreter) {
    const localBlock = this.localCommands.get(command)
    if (localBlock) {
      return localBlock.evaluate(interpreter, [])
    }
    if (this.fallThroughCommand) {
      return this.fallThroughCommand.evaluate(interpreter, [command])
    }
    return this.world.fallThroughCommand.evaluate(interpreter, [command])
  }

  defineNoun (name) {
    if (this.nouns.has(name)) {
      return this.nouns.get(name)
    } else {
      const n = new Noun(this, name)
      this.nouns.set(name, n)
      return n
    }
  }

  deleteNoun (name) {
    return this.nouns.delete(name)
  }

  getNouns () {
    return Array.from(this.nouns.values())
  }

  clear () {
    this.localCommands.clear()
    this.nouns.clear()
    return this
  }

  static registerTypes (t, symbolTable, methodRegistry) {
    t.registerType('Room')
  }

  static registerMethods (t, symbolTable, methodRegistry) {
    //
  }
}

module.exports = { Room }
