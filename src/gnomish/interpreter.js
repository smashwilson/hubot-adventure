const { Visitor } = require('./visitor')
const { Block } = require('./stdlib/block')
const { Some, none } = require('./stdlib/option')

class Interpreter extends Visitor {
  constructor () {
    super()
    this.stack = new Map()
    this.currentBlock = null
  }

  addFrame (frame, slots) {
    this.stack.set(frame, slots)
  }

  visit (node) {
    if (node.hasStaticValue()) {
      return node.getStaticValue()
    }

    return super.visit(node)
  }

  setSlot (frame, slot, value) {
    const f = this.stack.get(frame)
    if (f) {
      f[slot] = value
    } else {
      this.currentBlock.setSlot(frame, slot, value)
    }
  }

  getSlot (frame, slot) {
    const f = this.stack.get(frame)
    if (f) {
      return f[slot]
    } else {
      return this.currentBlock.getSlot(frame, slot)
    }
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

    return node.getMatch().invoke({
      receiver,
      selector: node.getName(),
      interpreter: this,
      astNode: node
    }, ...args)
  }

  visitVar (node) {
    return this.getSlot(node.getFrame(), node.getSlot())
  }

  evaluateBlock (block, args) {
    const lastBlock = this.currentBlock
    this.currentBlock = block
    const bodyNode = block.getBodyNode()
    this.stack.set(bodyNode, [])

    const argNodes = block.getArgNodes()
    for (let i = 0; i < argNodes.length; i++) {
      const argValue = args[i] !== undefined ? args[i] : this.visit(argNodes[i].getDefault())
      this.setSlot(argNodes[i].getFrame(), argNodes[i].getSlot(), argValue)
    }

    const r = this.visit(bodyNode)
    this.currentBlock = lastBlock
    return r
  }
}

module.exports = { Interpreter }
