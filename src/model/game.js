const { parse } = require('../gnomish')

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

  getCurrentRoom () {
    const roomOpt = this.world.getRoom(this.currentRoomID)
    return roomOpt.hasValue() ? roomOpt.getValue() : this.world.getDefaultRoom()
  }

  execute (source, context) {
    return parse(source)
      .setContext(context)
      .analyze(this.getSymbolTable(), this.getMethodRegistry())
      .interpret(this.getSymbolTable().getFrame(), this.slots)
  }
}

module.exports = { Game }
