const {SymbolTable} = require('../gnomish/symboltable')
const {MethodRegistry} = require('../gnomish/methodregistry')
const {parse} = require('../gnomish')
const {Game} = require('./game')

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

  execute (source) {
    const program = parse(source).analyze(this.symbolTable, this.methodRegistry)
    return program.interpret(this.symbolTable.getFrame(), this.prototypeSlots)
  }
}

stdlib.register(rootTable, rootRegistry)

World.prototype.rootTable = rootTable
World.prototype.rootRegistry = rootRegistry

module.exports = {World}
