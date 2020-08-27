const { parse } = require('../gnomish')
const { Interpreter } = require('../gnomish/interpreter')

class Game {
  constructor (world, channel) {
    this.world = world
    this.channel = channel
    this.slots = this.world.createGameSlots()
    this.currentRoomID = this.world.getDefaultRoom().getID()
  }

  getSymbolTable () {
    return this.world.getSymbolTable()
  }

  getMethodRegistry () {
    return this.world.getMethodRegistry()
  }

  setCurrentRoom (id) {
    if (this.world.getRoom(id).hasValue()) {
      this.currentRoomID = id
    }
  }

  getCurrentRoom () {
    const roomOpt = this.world.getRoom(this.currentRoomID)
    return roomOpt.hasValue() ? roomOpt.getValue() : this.world.getDefaultRoom()
  }

  createInterpreter (context) {
    const interpreter = new Interpreter(context)
    interpreter.addFrame(this.getSymbolTable().getFrame(), this.slots)
    return interpreter
  }

  execute (source, context) {
    return parse(source)
      .setContext(context)
      .analyze(this.getSymbolTable(), this.getMethodRegistry())
      .interpret(this.getSymbolTable().getFrame(), this.slots)
  }

  executeCommand (command, context) {
    const interpreter = this.createInterpreter(context)
    const room = this.getCurrentRoom()
    return room.executeCommand(command, interpreter)
  }
}

module.exports = { Game }
