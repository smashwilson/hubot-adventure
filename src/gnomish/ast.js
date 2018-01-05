class Node {
  constructor () {
    this.type = null
  }

  setType (type) {
    this.type = type
  }

  getType () {
    if (!this.type) {
      throw new Error(`${this.constructor.name} has not been assigned a type yet`)
    }
    return this.type
  }
}

class SlotNode extends Node {
  constructor () {
    super()
    this.slot = null
  }

  setSlot (slot) {
    this.slot = slot
  }

  getSlot () {
    if (!this.slot) {
      throw new Error(`${this.constructor.name} has not been assigned a slot index yet`)
    }
    return this.slot
  }
}

class ExprListNode extends Node {
  constructor (exprs) {
    super()
    this.exprs = exprs
  }

  getExprs () {
    return this.exprs
  }

  getLastExpr () {
    if (this.exprs.length === 0) return null
    return this.exprs[this.exprs.length - 1]
  }

  visitBy (visitor) {
    return visitor.visitExprList(this)
  }
}

class IfNode extends Node {
  constructor ({condition, thenb, elseb}) {
    super()
    this.condition = condition
    this.thenb = thenb
    this.elseb = elseb || new BlockNode({})
  }

  getCondition () { return this.condition }

  getThen () { return this.thenb }

  getElse () { return this.elseb }

  visitBy (visitor) {
    return visitor.visitIf(this)
  }
}

class WhileNode extends Node {
  constructor ({condition, action}) {
    super()
    this.condition = condition
    this.action = action
  }

  getCondition () { return this.condition }

  getAction () { return this.action }

  visitBy (visitor) {
    return visitor.visitWhile(this)
  }
}

class AssignNode extends SlotNode {
  constructor ({name, value}) {
    super()
    this.name = name
    this.value = value
  }

  getName () { return this.name }

  getValue () { return this.value }

  visitBy (visitor) {
    return visitor.visitAssign(this)
  }
}

class LetNode extends SlotNode {
  constructor ({name, type, value}) {
    super()
    this.name = name
    this.type = type
    this.value = value
  }

  getName () { return this.name }

  getType () { return this.type }

  getValue () { return this.value }

  visitBy (visitor) {
    return visitor.visitLet(this)
  }
}

class CallNode extends Node {
  constructor ({receiver, name, args}) {
    super()
    this.name = name
    this.receiver = receiver
    this.args = args || []
  }

  getName () { return this.name }

  getReceiver () { return this.receiver }

  getArgs () { return this.args }

  visitBy (visitor) {
    return visitor.visitCall(this)
  }
}

class BlockNode extends Node {
  constructor ({args, body}) {
    super()
    this.args = args || []
    this.body = body || new ExprListNode([])
  }

  getArgs () {
    return this.args
  }

  getBody () {
    return this.body
  }

  visitBy (visitor) {
    return visitor.visitBlock(this)
  }
}

class ArgNode extends SlotNode {
  constructor ({name, type, repeatable, def}) {
    super()
    this.name = name
    this.type = type
    this.repeatable = repeatable !== null
    this.def = def
  }

  getName () { return this.name }

  getType () { return this.type }

  getDefault () { return this.def }

  isRepeatable () { return this.repeatable }

  visitBy (visitor) {
    return visitor.visitArg(this)
  }
}

class IntNode extends Node {
  constructor ({minus, digits}) {
    super()
    this.value = parseInt((minus || '') + digits.join(''), 10)
  }

  visitBy (visitor) {
    return visitor.visitInt(this)
  }
}

class RealNode extends Node {
  constructor ({minus, whole, fraction}) {
    super()
    this.value = parseFloat((minus || '') + whole.join('') + '.' + fraction.join(''))
  }

  visitBy (visitor) {
    return visitor.visitReal(this)
  }
}

class StringNode extends Node {
  constructor ({chars}) {
    super()
    this.value = chars.join('')
  }

  visitBy (visitor) {
    return visitor.visitString(this)
  }
}

class VarNode extends SlotNode {
  constructor ({name}) {
    super()
    this.name = name
  }

  getName () { return this.name }

  visitBy (visitor) {
    return visitor.visitVar(this)
  }
}

class TypeNode extends Node {
  constructor ({name, params, optional}) {
    super()
    this.name = name
    this.params = params || []
    this.optional = optional !== null
  }

  getName () { return this.name }

  getParams () { return this.params }

  isOptional () { return this.optional }

  visitBy (visitor) {
    return visitor.visitType(this)
  }
}

module.exports = {
  ExprListNode,
  IfNode,
  WhileNode,
  AssignNode,
  LetNode,
  CallNode,
  BlockNode,
  ArgNode,
  IntNode,
  RealNode,
  StringNode,
  VarNode,
  TypeNode
}
