const { parse } = require('../gnomish')
const { Interpreter } = require('../gnomish/interpreter')

class Game {
  constructor (world, channel) {
    this.world = world
    this.channel = channel
    this.slots = this.world.createGameSlots()
  }

  getSymbolTable () {
    return this.world.getSymbolTable()
  }

  getMethodRegistry () {
    return this.world.getMethodRegistry()
  }

  createInterpreter () {
    const i = new Interpreter()
    i.addFrame(this.getSymbolTable().getFrame(), this.slots)
    return i
  }

  execute (source) {
    const program = parse(source).analyze(this.getSymbolTable(), this.getMethodRegistry())
    const interpreter = this.createInterpreter()
    return { result: interpreter.visit(program.node) }
  }
}

module.exports = { Game }
