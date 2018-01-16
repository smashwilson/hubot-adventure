const {Visitor} = require('./visitor')

class Interpreter extends Visitor {
  constructor () {
    super()
    this.stack = []
    this.currentFrame = null
  }

  setSlot (frame, slot, value) {
    if (frame === this.currentFrame) {
      this.stack[this.stack.length - 1][slot] = value
    }
    //
  }

  getSlot (frame, slot) {
    if (frame === this.currentFrame) {
      return this.stack[this.stack.length - 1][slot]
    }
    //
  }

  visitExprList (node) {
    const lastFrame = this.currentFrame
    this.stack.push([])
    this.currentFrame = node

    const result = super.visitExprList(node)

    this.stack.pop()
    this.currentFrame = lastFrame

    return result
  }

  visitLet (node) {
    const v = this.visit(node.getValue())
    this.setSlot(node.getFrame(), node.getSlot(), v)
    return v
  }

  visitInt (node) {
    return node.getStaticValue()
  }

  visitReal (node) {
    return node.getStaticValue()
  }

  visitString (node) {
    return node.getStaticValue()
  }

  visitVar (node) {
    return this.getSlot(node.getFrame(), node.getSlot())
  }
}

module.exports = {Interpreter}
