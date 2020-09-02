const { makeType } = require('../type')

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

  setSlot (frame, slot, value) {
    this.captures.get(frame)[slot] = value
  }

  getArgNodes () { return this.argNodes }

  getBodyNode () { return this.bodyNode }

  evaluate (interpreter, args) {
    return interpreter.evaluateBlock(this, args)
  }

  toString () {
    return '[block]'
  }
}

module.exports = {
  Block,

  registerTypes (t, symbolTable, methodRegistry) {
    t.registerType('Block')
  },

  registerMethods (t, symbolTable, methodRegistry) {
    const tR = makeType("'R")
    const tArgsStar = makeType("'Args").splat()
    const tBlockRArgs = makeType(t.Block, [tR, tArgsStar])

    methodRegistry.register(
      tBlockRArgs, 'evaluate', [tArgsStar], tR,
      ({ receiver, interpreter }, ...args) => receiver.evaluate(interpreter, args))

    methodRegistry.register(
      tBlockRArgs, 'copy', [], tBlockRArgs,
      ({ receiver }) => receiver
    )
  }
}
