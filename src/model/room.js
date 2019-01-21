const { Noun } = require('./noun')
const { NormalizingMap, UPPERCASE } = require('../normalizing-map')

class Room {
  constructor (world, id, name) {
    this.world = world
    this.id = id
    this.name = name
    this.description = ''

    this.fallThroughCommand = null
    this.localCommands = new NormalizingMap()

    this.nouns = new NormalizingMap(UPPERCASE)
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

  setDescription (description) {
    this.description = description
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
    if (command === 'look') {
      let lookCommand

      const finalName = this.name.replace(/"/g, '\\"')
      if (this.description.length > 0) {
        const nounsRx = new RegExp(
          Array.from(this.nouns.keys(), rxSafe).map(n => `\\b${n}\\b`).join('|'),
          'ig'
        )
        const finalDescription = this.description
          .replace(nounsRx, match => match.toUpperCase())
          .replace(/"/g, '\\"')

        lookCommand = this.world.execute(`{ say("**${finalName}**\n\n${finalDescription}") }`).result
      } else {
        lookCommand = this.world.execute(`{ say("**${finalName}**") }`).result
      }

      return lookCommand.evaluate(interpreter, [])
    }

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

function rxSafe (input) {
  return input.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
}

module.exports = { Room }
