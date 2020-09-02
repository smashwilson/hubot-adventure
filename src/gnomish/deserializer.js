// Reconstruct an AST from the structure created by a Serializer.

const { error } = require('../errors')
const {
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
} = require('./ast')

class Deserializer0 {
  constructor (payload) {
    this.cursor = payload.root
  }

  deserialize () {
    return this.visit(this.cursor)
  }

  visit (node) {
    if (node === undefined || node === null) {
      return null
    }

    const capitalized = node.kind[0].toUpperCase() + node.kind.slice(1)
    return this[`visit${capitalized}`](node)
  }

  visitExprList (node) {
    return new ExprListNode(
      node.exprs.map(expr => this.visit(expr))
    )
  }

  visitIf (node) {
    return new IfNode({
      condition: this.visit(node.condition),
      thenb: this.visit(node.then),
      elseb: this.visit(node.else)
    })
  }

  visitWhile (node) {
    return new WhileNode({
      condition: this.visit(node.condition),
      action: this.visit(node.action)
    })
  }

  visitAssign (node) {
    return new AssignNode({
      name: node.name,
      value: this.visit(node.value)
    })
  }

  visitLet (node) {
    return new LetNode({
      name: node.name,
      type: this.visit(node.type),
      value: this.visit(node.value),
      game: node.scope === 'game'
    })
  }

  visitBlock (node) {
    return new BlockNode({
      args: node.args.map(arg => this.visit(arg)),
      body: this.visit(node.body)
    })
  }

  visitArg (node) {
    return new ArgNode({
      name: node.name,
      type: this.visit(node.type),
      repeatable: node.repeatable === true ? '*' : null,
      def: this.visit(node.default)
    })
  }

  visitCall (node) {
    return new CallNode({
      name: node.name,
      receiver: this.visit(node.receiver),
      args: node.args.map(arg => this.visit(arg))
    })
  }

  visitInt (node) {
    return new IntNode({
      minus: node.value < 0 ? '-' : '',
      digits: [Math.abs(node.value).toString(10)]
    })
  }

  visitReal (node) {
    return new RealNode({
      value: node.value
    })
  }

  visitString (node) {
    return new StringNode({
      chars: [node.value]
    })
  }

  visitVar (node) {
    return new VarNode({
      name: node.name
    })
  }

  visitType (node) {
    let attr = null
    if (node.repeatable) {
      attr = '*'
    }
    if (node.splat) {
      attr = '...'
    }

    return new TypeNode({
      name: node.name,
      params: (node.params || []).map(param => this.visit(param)),
      attr
    })
  }
}

function deserializer (payload) {
  switch (payload.version) {
    case 0:
      return new Deserializer0(payload)
    default:
      error(`Unrecognized serialized AST version: ${payload.version}`).raise()
  }
}

module.exports = { deserializer }
