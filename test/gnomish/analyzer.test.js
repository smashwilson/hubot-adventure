/* eslint-env mocha */

const {assert} = require('chai')
const {parse} = require('../../src/gnomish')
const {Analyzer} = require('../../src/gnomish/analyzer')
const {Type} = require('../../src/gnomish/type')
const {SymbolTable, StaticEntry} = require('../../src/gnomish/symboltable')
const {MethodRegistry} = require('../../src/gnomish/methodregistry')

describe('Analyzer', function () {
  let st, mr, analyzer
  let tInt, tReal, tString, tType, tBlock

  beforeEach(function () {
    tInt = new Type('Int')
    tReal = new Type('Real')
    tString = new Type('String')
    tType = new Type('Type')
    tBlock = new Type('Block')

    st = new SymbolTable()
    st.put('Int', new StaticEntry(tType, tInt))
    st.put('Real', new StaticEntry(tType, tReal))
    st.put('String', new StaticEntry(tType, tString))
    st.put('Type', new StaticEntry(tType, tType))
    st.put('Block', new StaticEntry(tType, tBlock))

    mr = new MethodRegistry()

    analyzer = new Analyzer(st, mr)
  })

  describe('typechecking', function () {
    it('assigns Int to IntNodes', function () {
      const root = parse('3')
      analyzer.visit(root.node)

      assert.strictEqual(root.node.getType(), tInt)
    })

    it('assigns Real to RealNodes', function () {
      const root = parse('12.34')
      analyzer.visit(root.node)

      assert.strictEqual(root.node.getType(), tReal)
    })

    it('assigns String to StringNodes', function () {
      const root = parse('"wat"')
      analyzer.visit(root.node)

      assert.strictEqual(root.node.getType(), tString)
    })

    it('assigns Blocks a type based on its return and argument types', function () {
      const root = parse('{ x: Int, y: Real | 3; "hurf durf" }')
      analyzer.visit(root.node)

      const blockNode = root.node.getLastExpr()
      assert.equal(blockNode.getType().toString(), 'Block(String, Int, Real)')
    })
  })
})
