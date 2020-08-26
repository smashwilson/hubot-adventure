// Visitor that renders a Gnomish AST as S-expressions.

const { Visitor } = require('./visitor')

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
    if (node.getElse()) {
      this.result += ' '
      this.visit(node.getElse())
    }
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
    this.result += `(let`
    if (node.isGame()) this.result += 'game'
    this.result += ` ${node.getName()} : `
    if (node.getTypeNode()) {
      this.visit(node.getTypeNode())
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
    if (node.getTypeNode()) {
      this.result += ' : '
      this.visit(node.getTypeNode())
    }
    if (node.isRepeatable()) this.result += '*'
    if (node.getDefault()) {
      this.result += ' = '
      this.visit(node.getDefault())
    }
    this.result += ')'
  }

  visitCall (node) {
    this.result += '(call '
    this.visit(node.getReceiver())
    this.result += ` ${node.getName()}`
    for (const arg of node.getArgs()) {
      this.result += ' '
      this.visit(arg)
    }
    this.result += ')'
  }

  visitInt (node) {
    this.result += `(${node.getStaticValue()})`
  }

  visitReal (node) {
    this.result += `(${node.getStaticValue()})`
  }

  visitString (node) {
    const escaped = node.getStaticValue().replace(/[\\"]/g, '\\$&')
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
    if (node.isRepeatable()) this.result += ' *'
    if (node.isSplat()) this.result += ' ...'
    this.result += ')'
  }
}

module.exports = { SexpVisitor }
