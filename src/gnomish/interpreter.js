const {Visitor} = require('./visitor')

class Interpreter extends Visitor {
  constructor () {
    super()
    this.stack = new Map()
  }

  setSlot (frame, slot, value) {
    this.stack.get(frame)[slot] = value
  }

  getSlot (frame, slot) {
    return this.stack.get(frame)[slot]
  }

  visitExprList (node) {
    this.stack.set(node, [])
    const result = super.visitExprList(node)
    this.stack.delete(node)
    return result
  }

  visitIf (node) {
    if (this.visit(node.getCondition().getBody()) === true) {
      return this.visit(node.getThen().getBody())
    } else {
      return this.visit(node.getElse().getBody())
    }
  }

  visitAssign (node) {
    const v = this.visit(node.getValue())
    this.setSlot(node.getFrame(), node.getSlot(), v)
    return v
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
    if (node.hasStaticValue()) {
      return node.getStaticValue()
    } else {
      return this.getSlot(node.getFrame(), node.getSlot())
    }
  }
}

module.exports = {Interpreter}
