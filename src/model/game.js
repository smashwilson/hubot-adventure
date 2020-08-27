const { parse } = require('../gnomish')
const { Interpreter } = require('../gnomish/interpreter')
const { Some, none } = require('../gnomish/stdlib/option')

const CURRENT_ROOM_ID_SLOT = 'currentRoomID'

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

  setCurrentRoom (id) {
    const entry = this.getSymbolTable().at(CURRENT_ROOM_ID_SLOT)
    this.slots[entry.getSlot()] = new Some(id)
  }

  getCurrentRoom () {
    const entry = this.getSymbolTable().at(CURRENT_ROOM_ID_SLOT)
    const idOpt = this.slots[entry.getSlot()]
    if (!idOpt.hasValue()) {
      return none
    }

    const roomOpt = this.world.getRoom(idOpt.getValue())
    if (!roomOpt.hasValue()) {
      return this.world.getDefaultRoom()
    }

    return roomOpt
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

Game.prototype.CURRENT_ROOM_ID_SLOT = CURRENT_ROOM_ID_SLOT

module.exports = { Game }
