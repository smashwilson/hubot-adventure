const parser = require('./gnomish')
const {SexpVisitor} = require('./sexpr')
const {Analyzer} = require('./analyzer')

class Program {
  constructor (node) {
    this.node = node
  }

  analyze (symbolTable, methodRegistry) {
    const analyzer = new Analyzer(symbolTable, methodRegistry)
    analyzer.visit(this.node)
    return this
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
