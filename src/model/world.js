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
    const tOption = this.symbolTable.at('Option').getValue()
    const tString = this.symbolTable.at('String').getValue()
    const tOptionString = makeType(tOption, [tString])

    this.symbolTable.setStatic('world', tWorld, this)
    this.symbolTable.setStatic('this', tWorld, this)

    this.currentRoomSlot = this.symbolTable.allocateSlot(Game.prototype.CURRENT_ROOM_ID_SLOT, tOptionString)
    this.prototypeSlots = [none]

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
    const copyMatches = new Map()
    const replicated = []
    this.symbolTable.withSlotTypes(this.prototypeSlots, (value, type) => {
      let match = copyMatches.get(type)
      if (!match) {
        match = this.methodRegistry.lookup(this.symbolTable, type, 'copy', [])
        copyMatches.set(type, match)
      }
      replicated.push(match.invoke({ receiver: value, selector: 'copy' }))
    })
    return replicated
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
      if (!this.getDefaultRoom().hasValue()) {
        this.setDefaultRoomID(id)
      }
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
    const defaultRoomID = this.getDefaultRoomID()
    const wasDefaultRoom = defaultRoomID.hasValue() && defaultRoomID.getValue() === id
    const result = this.rooms.delete(id)
    if (wasDefaultRoom) {
      const first = this.rooms.firstValue() || null
      if (first) {
        this.setDefaultRoomID(first.getID())
      } else {
        this.prototypeSlots[this.currentRoomSlot.getSlot()] = none
      }
    }
    return result
  }

  getDefaultRoomID () {
    return this.prototypeSlots[this.currentRoomSlot.getSlot()]
  }

  getDefaultRoom () {
    const idOpt = this.getDefaultRoomID()
    return idOpt.hasValue() ? this.getRoom(idOpt.getValue()) : none
  }

  setDefaultRoomID (id) {
    const roomOpt = this.getRoom(id)
    if (!roomOpt.hasValue()) {
      return false
    }

    this.prototypeSlots[this.currentRoomSlot.getSlot()] = new Some(id)
    return true
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

  execute (source, context) {
    const program = parse(source).analyze(this.symbolTable, this.methodRegistry)
    program.setContext(context)
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
        return none
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
      t.World, 'defineCommand', [tStringList, tArglessBlock], t.World,
      ({ receiver }, commands, block) => {
        for (const command of commands) {
          receiver.defineCommand(command, block)
        }
        return receiver
      }
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
