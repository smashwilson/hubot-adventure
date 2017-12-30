// Visitor that renders a Gnomish AST as S-expressions.

const {Visitor} = require('./visitor')

class SexpVisitor extends Visitor {
  constructor () {
    super()
    this.result = ''
  }

  visitExprList (node) {
    this.result += '(exprlist'
    for (const expr of node.getExprs()) {
      this.result += ' '
      this.visit(expr)
    }
    this.result += ')'
  }

  visitIf (node) {
    this.result += '(if '
    this.visit(node.getCondition())
    this.result += ' '
    this.visit(node.getThen())
    this.result += ' '
    this.visit(node.getElse())
    this.result += ')'
  }

  visitWhile (node) {
    this.result += '(while '
    this.visit(node.getCondition())
    this.result += ' '
    this.visit(node.getAction())
    this.result += ')'
  }

  visitAssign (node) {
    this.result += `(assign ${node.getName()} `
    super.visitAssign(node)
    this.result += ')'
  }

  visitLet (node) {
    this.result += `(let ${node.getName()} : `
    if (node.getType()) {
      this.visit(node.getType())
    } else {
      this.result += '<inferred>'
    }
    this.result += ' = '
    this.visit(node.getValue())
    this.result += ')'
  }

  visitBlock (node) {
    this.result += '(block'
    for (const arg of node.getArgs()) {
      this.result += ' '
      this.visit(arg)
    }
    this.result += ' '
    this.visit(node.getBody())
    this.result += ')'
  }

  visitArg (node) {
    this.result += `(arg ${node.getName()}`
    if (node.getType()) {
      this.result += ' : '
      this.visit(node.getType())
    }
    if (node.isRepeatable()) this.result += '*'
    if (node.getDefault()) {
      this.result += ' = '
      this.visit(node.getDefault())
    }
    this.result += ')'
  }

  visitCall (node) {
    this.result += `(call `
    if (node.getReceiver()) {
      this.visit(node.getReceiver())
    } else {
      this.result += '<implicit>'
    }
    this.result += ` ${node.getName()}`
    for (const arg of node.getArgs()) {
      this.result += ' '
      this.visit(arg)
    }
    this.result += ')'
  }

  visitInt (node) {
    this.result += `(${node.value})`
  }

  visitReal (node) {
    this.result += `(${node.value})`
  }

  visitString (node) {
    const escaped = node.value.replace(/[\\"]/g, '\\$&')
    this.result += `("${escaped}")`
  }

  visitVar (node) {
    this.result += `(var ${node.name})`
  }

  visitType (node) {
    this.result += `(type ${node.getName()}`
    for (const param of node.getParams()) {
      this.result += ' '
      this.visit(param)
    }
    if (node.isOptional()) this.result += '?'
    this.result += ')'
  }
}

module.exports = {SexpVisitor}
