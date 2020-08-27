const { makeType } = require('../gnomish/type')
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
    return this
  }

  deleteCommand (command) {
    return this.localCommands.delete(command)
  }

  setFallThroughCommand (block) {
    this.fallThroughCommand = block
    return this
  }

  getCommands () {
    return Array.from(this.localCommands.keys())
  }

  executeCommand (command, interpreter) {
    const localBlock = this.localCommands.get(command)
    if (localBlock) {
      return localBlock.evaluate(interpreter, [])
    }

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

    if (this.fallThroughCommand) {
      return this.fallThroughCommand.evaluate(interpreter, [command])
    }
    return this.world.executeCommand(command, interpreter)
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
    const tR = makeType("'R")
    const tBlockR = makeType(t.Block, [tR])
    const tStringBlock = makeType(t.Block, [tR, t.String])
    const tStringList = makeType(t.List, [t.String])
    const tNounList = makeType(t.List, [t.Noun])

    methodRegistry.register(
      t.Room, 'getID', [], t.String,
      ({ receiver }) => receiver.getID()
    )

    methodRegistry.register(
      t.Room, 'getName', [], t.String,
      ({ receiver }) => receiver.getName()
    )

    methodRegistry.register(
      t.Room, 'command', [t.String, tBlockR], t.Room,
      ({ receiver }, command, block) => receiver.defineCommand(command, block)
    )
    methodRegistry.register(
      t.Room, 'command', [tStringList, tBlockR], t.Room,
      ({ receiver }, commands, block) => {
        for (const command of commands) {
          receiver.defineCommand(command, block)
        }
        return receiver
      }
    )

    methodRegistry.register(
      t.Room, 'deleteCommand', [t.String], t.Bool,
      ({ receiver }, command) => receiver.deleteCommand(command)
    )

    methodRegistry.register(
      t.Room, 'fallThroughCommand', [tStringBlock], t.Room,
      ({ receiver }, block) => receiver.setFallThroughCommand(block)
    )

    methodRegistry.register(
      t.Room, 'executeCommand', [t.String], t.Room,
      ({ receiver, interpreter }, command) => receiver.executeCommand(command, interpreter)
    )

    methodRegistry.register(
      t.Room, 'getCommands', [], tStringList,
      ({ receiver }) => receiver.getCommands()
    )

    methodRegistry.register(
      t.Room, 'noun', [t.String], t.Noun,
      ({ receiver }, name) => receiver.defineNoun(name)
    )

    methodRegistry.register(
      t.Room, 'deleteNoun', [t.String], t.Bool,
      ({ receiver }, name) => receiver.deleteNoun(name)
    )

    methodRegistry.register(
      t.Room, 'getNouns', [], tNounList,
      ({ receiver }) => receiver.getNouns()
    )
  }
}

function rxSafe (input) {
  return input.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
}

module.exports = { Room }
