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

  visitWhile (node) {
    let v = null
    while (this.visit(node.getCondition().getBody()) === true) {
      v = this.visit(node.getAction().getBody())
    }
    return v
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

  visitCall (node) {
    const receiver = this.visit(node.getReceiver())
    const args = node.getArgs().map(arg => this.visit(arg))

    return node.getCallback()({
      receiver,
      selector: node.getName(),
      interpreter: this
    }, ...args)
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