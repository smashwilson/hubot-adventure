const {Visitor} = require('./visitor')

// Static analysis phase, to be performed immediately after parsing an AST, but before interpreting it. Responsible for:
//
// * Assigning each LetNode and ArgNode to the storage slot it should write.
// * Resolving each VarNode to the storage slot it should read.
// * Assigning a Type to each AST node.
// * Ensuring Type consistency within each expression.
// * Unify Types to resolve unbound type parameters and resolve inferred LetNode and ArgNode types.
// * Perform method lookup.
class Analyzer extends Visitor {
  constructor (symbolTable, methodRegistry) {
    super()
    this.nextSlot = 0
    this.symbolTable = symbolTable
    this.methodRegistry = methodRegistry
  }

  visitExprList (node) {
    super.visitExprList(node)
    node.setType(node.getLastExpr().getType())
  }

  visitInt (node) {
    node.setType(this.symbolTable.at('Int').getValue())
  }
}

module.exports = {Analyzer}
