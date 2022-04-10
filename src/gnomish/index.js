const parser = require('./gnomish')
const { SexpVisitor } = require('./sexpr')
const { serializeAST } = require('./serializer')
const { Analyzer } = require('./analyzer')
const { Interpreter } = require('./interpreter')
const { deserializeAST } = require('./deserializer')

class Program {
  constructor (node) {
    this.node = node
    this.context = null
  }

  setContext (context) {
    this.context = context
    return this
  }

  analyze (symbolTable, methodRegistry) {
    const analyzer = new Analyzer(symbolTable, methodRegistry)
    analyzer.visit(this.node)
    return this
  }

  interpret (frame, slots) {
    const interpreter = new Interpreter(this.context)
    if (frame && slots) {
      interpreter.addFrame(frame, slots)
    }
    const result = interpreter.visit(this.node)
    return { result, interpreter }
  }

  sexp () {
    const visitor = new SexpVisitor()
    visitor.visit(this.node)
    return visitor.result
  }

  serialize () {
    return serializeAST(this.node)
  }
}

module.exports = {
  parse (...args) {
    return new Program(parser.parse(...args))
  },

  deserialize (payload) {
    return new Program(deserializeAST(payload))
  },

  serializeAST,

  deserializeAST
}
