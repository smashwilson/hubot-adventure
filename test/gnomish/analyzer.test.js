/* eslint-env mocha */

const {assert} = require('chai')
const {parse} = require('../../src/gnomish')
const {Analyzer} = require('../../src/gnomish/analyzer')
const {makeType} = require('../../src/gnomish/type')
const {SymbolTable, SlotEntry, StaticEntry} = require('../../src/gnomish/symboltable')
const {MethodRegistry} = require('../../src/gnomish/methodregistry')

describe('Analyzer', function () {
  let st, mr, analyzer
  let tInt, tReal, tString, tType

  beforeEach(function () {
    tInt = makeType('Int')
    tReal = makeType('Real')
    tString = makeType('String')
    tType = makeType('Type')

    st = new SymbolTable()
    st.put('Int', new StaticEntry(tType, tInt))
    st.put('Real', new StaticEntry(tType, tReal))
    st.put('String', new StaticEntry(tType, tString))
    st.put('Type', new StaticEntry(tType, tType))

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

    it('assigns a type from the symbol table to a VarNode', function () {
      st.put('variable', new SlotEntry(tString, 0))

      const root = parse('variable')
      analyzer.visit(root.node)

      assert.strictEqual(root.node.getType(), tString)
    })
  })
})