const { SymbolTable } = require('../gnomish/symboltable')
const { MethodRegistry } = require('../gnomish/methodregistry')
const { TypeRegistry } = require('../gnomish/typeregistry')
const { makeType } = require('../gnomish/type')
const { Some, none } = require('../gnomish/stdlib/option')
const { parse } = require('../gnomish')
const { Game } = require('./game')
const { Room } = require('./room')
const { Noun } = require('./noun')
const { NormalizingMap } = require('../normalizing-map')

const stdlib = require('../gnomish/stdlib')

const rootTable = SymbolTable.root()
const rootRegistry = new MethodRegistry()

class World {
  constructor () {
    this.symbolTable = SymbolTable.game(rootTable)
    this.methodRegistry = rootRegistry.push()

    const tWorld = this.symbolTable.at('World').getValue()

    this.symbolTable.setStatic('world', tWorld, this)
    this.symbolTable.setStatic('this', tWorld, this)

    this.prototypeSlots = []

    this.games = new Map()
    this.rooms = new NormalizingMap()

    this.globalCommands = new NormalizingMap()
    this.fallThroughCommand = this.execute(`
      { command: String | say("I don't know how to do that.") }
    `).result
  }

  getSymbolTable () { return this.symbolTable }

  getMethodRegistry () { return this.methodRegistry }

  createGameSlots () {
    return this.prototypeSlots.slice()
  }

  createGame (channel) {
    const g = new Game(this, channel)
    this.games.set(channel, g)
    return g
  }

  getGames () {
    return Array.from(this.games.values())
  }

  hasGame (room) {
    return this.games.has(room)
  }

  getGame (room) {
    return this.games.get(room)
  }

  deleteGame (channel) {
    return this.games.delete(channel)
  }

  defineRoom (id, name) {
    const existing = this.rooms.get(id)
    if (existing) {
      existing.setName(name)
      return existing
    } else {
      const created = new Room(this, id, name)
      this.rooms.set(id, created)
      return created
    }
  }

  getRooms () {
    return Array.from(this.rooms.values())
  }

  getRoom (id) {
    const existing = this.rooms.get(id)
    if (existing) {
      return new Some(existing)
    } else {
      return none
    }
  }

  deleteRoom (id) {
    return this.rooms.delete(id)
  }

  defineCommand (command, block) {
    this.globalCommands.set(command, block)
    return this
  }

  deleteCommand (command) {
    return this.globalCommands.delete(command)
  }

  getCommands () {
    return Array.from(this.globalCommands.keys())
  }

  setFallThroughCommand (block) {
    this.fallThroughCommand = block
    return this
  }

  getFallThroughCommand () {
    return this.fallThroughCommand
  }

  executeCommand (command, interpreter) {
    const globalCommand = this.globalCommands.get(command)
    if (globalCommand) {
      return globalCommand.evaluate(interpreter, [])
    } else {
      return this.fallThroughCommand.evaluate(interpreter, [command])
    }
  }

  execute (source) {
    const program = parse(source).analyze(this.symbolTable, this.methodRegistry)
    return program.interpret(this.symbolTable.getFrame(), this.prototypeSlots)
  }

  static register (symbolTable, methodRegistry) {
    const t = new TypeRegistry(symbolTable)
    const classes = [this, Room, Noun]

    for (const c of classes) {
      c.registerTypes(t, symbolTable, methodRegistry)
    }

    for (const c of classes) {
      c.registerMethods(t, symbolTable, methodRegistry)
    }
  }

  static registerTypes (t, symbolTable, methodRegistry) {
    //
  }

  static registerMethods (t, symbolTable, methodRegistry) {
    const tR = makeType("'R")
    const tArglessBlock = makeType(t.Block, [tR])
    const tStringBlock = makeType(t.Block, [tR, t.String])
    const tStringList = makeType(t.List, [t.String])

    methodRegistry.register(
      t.World, 'say', [t.String], t.Option,
      ({ interpreter }, text) => {
        const context = interpreter.getContext()
        if (context && context.say) {
          context.say(text)
        } else {
          console.log(text)
        }
      }
    )

    methodRegistry.register(
      t.World, 'defineRoom', [t.String, t.String], t.Room,
      ({ receiver }, id, name) => receiver.defineRoom(id, name)
    )

    methodRegistry.register(
      t.World, 'deleteRoom', [t.String], t.Bool,
      ({ receiver }, id) => receiver.deleteRoom(id)
    )

    methodRegistry.register(
      t.World, 'getRooms', [], makeType(t.List, [t.Room]),
      ({ receiver }) => receiver.getRooms()
    )

    methodRegistry.register(
      t.World, 'getRoom', [t.String], makeType(t.Option, [t.Room]),
      ({ receiver }, id) => receiver.getRoom(id)
    )

    methodRegistry.register(
      t.World, 'defineCommand', [t.String, tArglessBlock], t.World,
      ({ receiver }, command, block) => receiver.defineCommand(command, block)
    )

    methodRegistry.register(
      t.World, 'deleteCommand', [t.String], t.Bool,
      ({ receiver }, command) => receiver.deleteCommand(command)
    )

    methodRegistry.register(
      t.World, 'executeCommand', [t.String], t.World,
      ({ receiver, interpreter }, command) => {
        receiver.executeCommand(command, interpreter)
        return receiver
      }
    )

    methodRegistry.register(
      t.World, 'getCommands', [], tStringList,
      ({ receiver }) => receiver.getCommands()
    )

    methodRegistry.register(
      t.World, 'defineFallThroughCommand', [tStringBlock], t.World,
      ({ receiver }, block) => receiver.setFallThroughCommand(block)
    )
  }
}

stdlib.register(rootTable, rootRegistry)
World.register(rootTable, rootRegistry)

World.prototype.rootTable = rootTable
World.prototype.rootRegistry = rootRegistry

module.exports = { World }
