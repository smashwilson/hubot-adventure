class Game {
  constructor (world, channel) {
    this.world = world
    this.channel = channel
    this.slots = []
  }

  getSymbolTable () {
    return this.world.getSymbolTable()
  }

  getMethodRegistry () {
    return this.world.getMethodRegistry()
  }
}

module.exports = {Game}
