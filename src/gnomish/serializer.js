// Visitor that renders a Gnomish AST as to a serializable, versioned JSON structure.

const { Visitor } = require('./visitor')

class SerializingVisitor extends Visitor {
  constructor () {
    super()
    this.result = { version: 0, root: {} }
    this.cursor = this.result.root
  }

  visitExprList (node) {
    this.cursor.kind = 'exprList'
    this.cursor.exprs = []
    for (const expr of node.getExprs()) {
      const next = {}
      this.cursor.exprs.push(next)
      this.pushCursor(next, () => this.visit(expr))
    }
  }

  visitIf (node) {
    this.cursor.kind = 'if'
    this.pushCursor(this.cursor.condition = {}, () => this.visit(node.getCondition()))
    this.pushCursor(this.cursor.then = {}, () => this.visit(node.getThen()))
    if (node.getElse()) {
      this.pushCursor(this.cursor.else = {}, () => this.visit(node.getElse()))
    }
  }

  visitWhile (node) {
    this.cursor.kind = 'while'
    this.pushCursor(this.cursor.condition = {}, () => this.visit(node.getCondition()))
    this.pushCursor(this.cursor.action = {}, () => this.visit(node.getAction()))
  }

  visitAssign (node) {
    this.cursor.kind = 'assign'
    this.cursor.name = node.getName()
    this.pushCursor(this.cursor.value = {}, () => this.visit(node.getValue()))
  }

  visitLet (node) {
    this.cursor.kind = 'let'
    this.cursor.scope = node.isGame() ? 'game' : 'block'
    this.cursor.name = node.getName()
    if (node.getTypeNode()) {
      this.pushCursor(this.cursor.type = {}, () => this.visit(node.getTypeNode()))
    }
    this.pushCursor(this.cursor.value = {}, () => this.visit(node.getValue()))
  }

  visitBlock (node) {
    this.cursor.kind = 'block'
    this.cursor.args = []
    for (const arg of node.getArgs()) {
      const next = {}
      this.cursor.args.push(next)
      this.pushCursor(next, () => this.visit(arg))
    }
    this.pushCursor(this.cursor.body = {}, () => this.visit(node.getBody()))
  }

  visitArg (node) {
    this.cursor.kind = 'arg'
    this.cursor.name = node.getName()
    if (node.getTypeNode()) {
      this.pushCursor(this.cursor.type = {}, () => this.visit(node.getTypeNode()))
    }
    if (node.isRepeatable()) {
      this.cursor.repeatable = true
    }
    if (node.getDefault()) {
      this.pushCursor(this.cursor.default = {}, () => this.visit(node.getDefault()))
    }
  }

  visitCall (node) {
    this.cursor.kind = 'call'
    this.cursor.name = node.getName()
    this.pushCursor(this.cursor.receiver = {}, () => this.visit(node.getReceiver()))
    this.cursor.args = []
    for (const arg of node.getArgs()) {
      const next = {}
      this.cursor.args.push(next)
      this.pushCursor(next, () => this.visit(arg))
    }
  }

  visitInt (node) {
    this.cursor.kind = 'int'
    this.cursor.value = node.getStaticValue()
  }

  visitReal (node) {
    this.cursor.kind = 'real'
    this.cursor.value = node.getStaticValue()
  }

  visitString (node) {
    this.cursor.kind = 'string'
    this.cursor.value = node.getStaticValue()
  }

  visitVar (node) {
    this.cursor.kind = 'var'
    this.cursor.name = node.getName()
  }

  visitType (node) {
    this.cursor.kind = 'type'
    this.cursor.name = node.getName()

    if (node.getParams().length > 0) {
      this.cursor.params = []
      for (const param of node.getParams()) {
        const next = {}
        this.cursor.params.push(next)
        this.pushCursor(next, () => this.visit(param))
      }
    }

    if (node.isRepeatable()) {
      this.cursor.repeatable = true
    }

    if (node.isSplat()) {
      this.cursor.splat = true
    }
  }

  pushCursor (next, during) {
    const original = this.cursor
    this.cursor = next
    during()
    this.cursor = original
  }
}

function serializeAST (node) {
  const visitor = new SerializingVisitor()
  visitor.visit(node)
  return visitor.result
}

module.exports = { SerializingVisitor, serializeAST }
