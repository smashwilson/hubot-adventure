const {Visitor} = require('./visitor')
const {Block} = require('./stdlib/block')
const {Some, none} = require('./stdlib/option')

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
    if (!this.stack.has(node)) this.stack.set(node, [])
    const result = super.visitExprList(node)
    this.stack.delete(node)
    return result
  }

  visitIf (node) {
    const condition = this.visit(node.getCondition().getBody()) === true

    if (node.getElse()) {
      if (condition) {
        return this.visit(node.getThen().getBody())
      } else {
        return this.visit(node.getElse().getBody())
      }
    } else {
      if (condition) {
        return new Some(this.visit(node.getThen().getBody()))
      } else {
        return none
      }
    }
  }

  visitWhile (node) {
    let v = none
    while (this.visit(node.getCondition().getBody()) === true) {
      v = this.visit(node.getAction().getBody())
    }
    return v === none ? v : new Some(v)
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

  visitBlock (node) {
    const b = new Block(node.getArgs(), node.getBody())
    for (const frame of node.getCaptures()) {
      b.captureFrame(frame, this.stack.get(frame))
    }
    return b
  }

  visitCall (node) {
    const receiver = this.visit(node.getReceiver())
    const args = node.getArgs().map(arg => this.visit(arg))

    return node.getCallback()({
      receiver,
      selector: node.getName(),
      interpreter: this,
      astNode: node
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

  evaluateBlock (block, args) {
    const bodyNode = block.getBodyNode()
    this.stack.set(bodyNode, [])

    const argNodes = block.getArgNodes()
    for (let i = 0; i < argNodes.length; i++) {
      const argValue = args[i] ? args[i] : this.visit(argNodes[i].getDefault())
      this.setSlot(argNodes[i].getFrame(), argNodes[i].getSlot(), argValue)
    }

    return this.visit(bodyNode)
  }
}

module.exports = {Interpreter}
