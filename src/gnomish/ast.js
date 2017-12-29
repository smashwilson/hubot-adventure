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

class CallNode {
  constructor ({receiver, name, args}) {
    this.name = name
    this.receiver = receiver
    this.args = args
  }

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
  constructor ({name, type, def}) {
    this.name = name
    this.type = type
    this.def = def
  }

  getName () { return this.name }

  getType () { return this.type }

  getDefault () { return this.def }

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

module.exports = {
  ExprListNode,
  IfNode,
  WhileNode,
  CallNode,
  BlockNode,
  ArgNode,
  IntNode,
  RealNode,
  StringNode,
  VarNode
}
