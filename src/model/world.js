const { SymbolTable } = require('../gnomish/symboltable')
const { MethodRegistry } = require('../gnomish/methodregistry')
const { TypeRegistry } = require('../gnomish/typeregistry')
const { parse } = require('../gnomish')
const { Game } = require('./game')
const { Room } = require('./room')
const { Noun } = require('./noun')

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
    //
  }
}

stdlib.register(rootTable, rootRegistry)
World.register(rootTable, rootRegistry)

World.prototype.rootTable = rootTable
World.prototype.rootRegistry = rootRegistry

module.exports = { World }
