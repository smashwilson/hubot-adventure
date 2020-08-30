class Node {
  constructor (staticValue = null) {
    this.type = null
    this.staticValue = staticValue
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

  hasStaticValue () {
    return this.staticValue !== null
  }

  setStaticValue (value) {
    this.staticValue = value
  }

  getStaticValue () {
    if (this.staticValue === null) {
      throw new Error(`${this.constructor.name} has not been assigned a static value`)
    }
    return this.staticValue
  }
}

class SlotNode extends Node {
  constructor (value = null) {
    super(value)
    this.frame = null
    this.slot = null
  }

  setSlot (frame, slot) {
    this.frame = frame
    this.slot = slot
  }

  getFrame () {
    if (this.frame === null) {
      throw new Error(`${this.constructor.name} has not been assigned a frame yet`)
    }
    return this.frame
  }

  getSlot () {
    if (this.slot === null) {
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
  constructor ({ condition, thenb, elseb }) {
    super()
    this.condition = condition
    this.thenb = thenb
    this.elseb = elseb
  }

  getCondition () { return this.condition }

  getThen () { return this.thenb }

  getElse () { return this.elseb }

  visitBy (visitor) {
    return visitor.visitIf(this)
  }
}

class WhileNode extends Node {
  constructor ({ condition, action }) {
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
  constructor ({ name, value }) {
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
  constructor ({ name, type, value, game = false }) {
    super()
    this.name = name
    this.typeNode = type
    this.value = value
    this.game = game
  }

  getName () { return this.name }

  getTypeNode () { return this.typeNode }

  getValue () { return this.value }

  isGame () { return this.game }

  visitBy (visitor) {
    return visitor.visitLet(this)
  }
}

class CallNode extends Node {
  constructor ({ receiver, name, args }) {
    super()
    this.name = name
    this.receiver = receiver
    this.args = args || []
    this.match = null
  }

  getName () { return this.name }

  getReceiver () { return this.receiver }

  getArgs () { return this.args }

  setMatch (match) {
    this.match = match
  }

  getMatch () {
    if (this.match === null) {
      throw new Error(`${this.constructor.name} has not been resolved yet`)
    }
    return this.match
  }

  visitBy (visitor) {
    return visitor.visitCall(this)
  }
}

class BlockNode extends Node {
  constructor ({ args, body }) {
    super()
    this.args = args || []
    this.body = body || new ExprListNode([])
    this.captures = new Set()
  }

  getArgs () {
    return this.args
  }

  getBody () {
    return this.body
  }

  getCaptures () {
    return this.captures
  }

  captureFrames (frames) {
    for (const frame of frames) {
      this.captures.add(frame)
    }
  }

  visitBy (visitor) {
    return visitor.visitBlock(this)
  }
}

class ArgNode extends SlotNode {
  constructor ({ name, type, repeatable, def }) {
    super()
    this.name = name
    this.typeNode = type
    this.repeatable = repeatable !== null
    this.def = def
  }

  getName () { return this.name }

  getTypeNode () { return this.typeNode }

  getDefault () { return this.def }

  isRepeatable () { return this.repeatable }

  visitBy (visitor) {
    return visitor.visitArg(this)
  }
}

class IntNode extends Node {
  constructor ({ minus, digits }) {
    super(parseInt((minus || '') + digits.join(''), 10))
  }

  visitBy (visitor) {
    return visitor.visitInt(this)
  }
}

class RealNode extends Node {
  constructor ({ minus, whole, fraction }) {
    super(parseFloat((minus || '') + whole.join('') + '.' + fraction.join('')))
  }

  visitBy (visitor) {
    return visitor.visitReal(this)
  }
}

class StringNode extends Node {
  constructor ({ chars }) {
    super(chars.join(''))
  }

  visitBy (visitor) {
    return visitor.visitString(this)
  }
}

class VarNode extends SlotNode {
  constructor ({ name }) {
    super()
    this.name = name
  }

  getName () { return this.name }

  visitBy (visitor) {
    return visitor.visitVar(this)
  }
}

class TypeNode extends Node {
  constructor ({ name, params, attr }) {
    super()
    this.name = name
    this.params = params || []
    this.splat = attr && attr === '...'
    this.repeatable = attr && attr === '*'
  }

  getName () { return this.name }

  getParams () { return this.params }

  isSplat () { return this.splat }

  isRepeatable () { return this.repeatable }

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
