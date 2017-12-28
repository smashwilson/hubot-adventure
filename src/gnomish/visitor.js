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

  visitInt (node) {}

  visitReal (node) {}

  visitString (node) {}

  visitVar (node) {}
}

module.exports = {Visitor}
