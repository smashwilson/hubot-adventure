class Block {
  constructor (argNodes, bodyNode) {
    this.argNodes = argNodes
    this.bodyNode = bodyNode
    this.captures = new Map()
  }

  captureFrame (frame, slots) {
    this.captures.set(frame, slots)
  }

  getSlot (frame, slot) {
    return this.captures.get(frame)[slot]
  }

  evaluate (interpreter) {
    return interpreter.visit(this.bodyNode)
  }
}

module.exports = {
  Block,

  registerTypes (t, symbolTable, methodRegistry) {
    t.registerType('Block')
  },

  registerMethods (t, symbolTable, methodRegistry) {
    //
  }
}
