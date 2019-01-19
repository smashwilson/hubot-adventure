const parser = require('./gnomish')
const { SexpVisitor } = require('./sexpr')
const { Analyzer } = require('./analyzer')
const { Interpreter } = require('./interpreter')

class Program {
  constructor (node) {
    this.node = node
  }

  analyze (symbolTable, methodRegistry) {
    const analyzer = new Analyzer(symbolTable, methodRegistry)
    analyzer.visit(this.node)
    return this
  }

  interpret (frame, slots) {
    const interpreter = new Interpreter()
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
}

module.exports = {
  parse (...args) {
    return new Program(parser.parse(...args))
  }
}
