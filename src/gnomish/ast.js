class ExprListNode {
  constructor (exprs) {
    this.exprs = exprs
  }

  getExprs () {
    return this.exprs
  }

  visitBy (visitor) {
    return visitor.visitExprList(this)
  }
}

class IfNode {
  constructor ({condition, thenb, elseb}) {
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

class WhileNode {
  constructor ({condition, action}) {
    this.condition = condition
    this.action = action
  }

  getCondition () { return this.condition }

  getAction () { return this.action }

  visitBy (visitor) {
    return visitor.visitWhile(this)
  }
}

class AssignNode {
  constructor ({name, value}) {
    this.name = name
    this.value = value
  }

  getName () { return this.name }

  getValue () { return this.value }

  visitBy (visitor) {
    return visitor.visitAssign(this)
  }
}

class LetNode {
  constructor ({name, type, value}) {
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

class CallNode {
  constructor ({receiver, name, args}) {
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

class BlockNode {
  constructor ({args, body}) {
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

class ArgNode {
  constructor ({name, type, repeatable, def}) {
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

class IntNode {
  constructor ({minus, digits}) {
    this.value = parseInt((minus || '') + digits.join(''), 10)
  }

  visitBy (visitor) {
    return visitor.visitInt(this)
  }
}

class RealNode {
  constructor ({minus, whole, fraction}) {
    this.value = parseFloat((minus || '') + whole.join('') + '.' + fraction.join(''))
  }

  visitBy (visitor) {
    return visitor.visitReal(this)
  }
}

class StringNode {
  constructor ({chars}) {
    this.value = chars.join('')
  }

  visitBy (visitor) {
    return visitor.visitString(this)
  }
}

class VarNode {
  constructor ({name}) {
    this.name = name
  }

  visitBy (visitor) {
    return visitor.visitVar(this)
  }
}

class TypeNode {
  constructor ({name, params, optional}) {
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
