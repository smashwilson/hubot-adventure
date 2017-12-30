// AST visitor superclass

class Visitor {
  visit (node) {
    return node.visitBy(this)
  }

  visitExprList (node) {
    for (const expr of node.getExprs()) {
      this.visit(expr)
    }
  }

  visitIf (node) {
    this.visit(node.getCondition())
    this.visit(node.getThen())
    this.visit(node.getElse())
  }

  visitWhile (node) {
    this.visit(node.getCondition())
    this.visit(node.getAction())
  }

  visitAssign (node) {
    this.visit(node.getValue())
  }

  visitLet (node) {
    this.visit(node.getType())
    this.visit(node.getValue())
  }

  visitBlock (node) {
    for (const arg of node.getArgs()) {
      this.visit(arg)
    }
    this.visit(node.getBody())
  }

  visitArg (node) {
    if (node.getType()) this.visit(node.getType())
    if (node.getDefault()) this.visit(node.getDefault())
  }

  visitCall (node) {
    if (node.getReceiver()) this.visit(node.getReceiver())
    for (const arg of node.getArgs()) {
      this.visit(arg)
    }
  }

  visitInt (node) {}

  visitReal (node) {}

  visitString (node) {}

  visitVar (node) {}

  visitType (node) {
    for (const param of node.getParams()) {
      this.visit(param)
    }
  }
}

module.exports = {Visitor}
