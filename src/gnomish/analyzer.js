const {Visitor} = require('./visitor')
const {makeType, unify} = require('./type')
const {SlotEntry} = require('./symboltable')

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
    this.symbolTable = symbolTable
    this.methodRegistry = methodRegistry

    this.tType = this.symbolTable.at('Type').getValue()
    this.tBlock = this.symbolTable.at('Block').getValue()
    this.tOption = this.symbolTable.at('Option').getValue()

    const tBool = this.symbolTable.at('Bool').getValue()
    this.condType = makeType(this.tBlock, [tBool])
  }

  visitExprList (node) {
    super.visitExprList(node)
    node.setType(node.getLastExpr().getType())
  }

  visitIf (node) {
    super.visitIf(node)

    this.unifyTypes(this.condType, node.getCondition().getType())

    const thType = node.getThen().getType()
    if (node.getElse()) {
      const elseType = node.getElse().getType()
      const ru = this.unifyTypes(thType, elseType)

      // Block return type
      node.setType(ru.getType().getParams()[0])
    } else {
      const optionType = makeType(this.tOption, [thType.getParams()[0]])
      node.setType(optionType)
    }
  }

  visitWhile (node) {
    super.visitWhile(node)

    this.unifyTypes(this.condType, node.getCondition().getType())

    node.setType(node.getAction().getType().getParams()[0])
  }

  visitAssign (node) {
    super.visitAssign(node)

    const bindingType = this.symbolTable.at(node.getName()).getType()
    const u = this.unifyTypes(bindingType, node.getValue().getType())
    node.setType(u.getType())
  }

  visitLet (node) {
    super.visitLet(node)

    if (node.getTypeNode()) {
      const u = this.unifyTypes(this.typeFromNode(node.getTypeNode()), node.getValue().getType())
      node.setType(u.getType())
    } else {
      node.setType(node.getValue().getType())
    }

    this.symbolTable.put(node.getName(), new SlotEntry(node.getType(), 0))
  }

  visitBlock (node) {
    super.visitBlock(node)

    const blockBase = this.symbolTable.at('Block').getValue()
    node.setType(makeType(blockBase, [
      node.getBody().getLastExpr().getType(),
      ...node.getArgs().map(arg => arg.getType())
    ]))
  }

  visitArg (node) {
    super.visitArg(node)

    let annotatedType = node.getTypeNode() && this.typeFromNode(node.getTypeNode())
    let defType = node.getDefault() && node.getDefault().getType()

    if (annotatedType && defType) {
      const u = unify(this.symbolTable, annotatedType, defType)
      if (!u.wasSuccessful()) {
        throw new Error(`Types "${annotatedType.toString()}" and "${defType.toString()}" do not match`)
      }
      u.apply(this.symbolTable)
      node.setType(u.getType())
    } else {
      node.setType(annotatedType || defType)
    }
    this.symbolTable.put(node.getName(), new SlotEntry(node.getType(), 0))
  }

  visitCall (node) {
    super.visitCall(node)

    const signature = this.methodRegistry.lookup(
      this.symbolTable,
      node.getReceiver().getType(),
      node.getName(),
      node.getArgs().map(a => a.getType())
    )
    node.setType(signature.getReturnType())
  }

  visitInt (node) {
    node.setType(this.symbolTable.at('Int').getValue())
  }

  visitReal (node) {
    node.setType(this.symbolTable.at('Real').getValue())
  }

  visitString (node) {
    node.setType(this.symbolTable.at('String').getValue())
  }

  visitVar (node) {
    node.setType(this.symbolTable.at(node.getName()).getType())
  }

  typeFromNode (node) {
    const base = this.getTypeNamed(node.getName())
    return makeType(base, node.getParams().map(p => this.typeFromNode(p)))
  }

  getTypeNamed (name) {
    if (name.startsWith("'")) {
      return makeType(name)
    }

    const entry = this.symbolTable.at(name)
    if (!entry.isStatic()) {
      throw new Error(
        `Identifier "${name}" is not available at compile time, so it may not appear in a type expression`)
    }
    if (entry.getType() !== this.tType) {
      throw new Error(
        `Identifier "${name}" does not name a type, so it may not appear in a type expression`)
    }
    return entry.getValue()
  }

  unifyTypes (lhs, rhs) {
    const u = unify(this.symbolTable, lhs, rhs)
    if (!u.wasSuccessful()) {
      throw new Error(
        `Types "${lhs.toString()}" and "${rhs.toString()}" do not match`)
    }
    return u
  }
}

module.exports = {Analyzer}
