/* eslint-env mocha */

const {assert} = require('chai')
const {parse} = require('../../src/gnomish')
const {Analyzer} = require('../../src/gnomish/analyzer')
const {makeType} = require('../../src/gnomish/type')
const {SymbolTable, SlotEntry, StaticEntry} = require('../../src/gnomish/symboltable')
const {MethodRegistry} = require('../../src/gnomish/methodregistry')

describe('Analyzer', function () {
  let st, mr, analyzer
  let tInt, tReal, tString, tBool, tBlock, tType

  beforeEach(function () {
    tInt = makeType('Int')
    tReal = makeType('Real')
    tString = makeType('String')
    tBool = makeType('Bool')
    tBlock = makeType('Block')
    tType = makeType('Type')

    st = new SymbolTable()
    st.put('Int', new StaticEntry(tType, tInt))
    st.put('Real', new StaticEntry(tType, tReal))
    st.put('String', new StaticEntry(tType, tString))
    st.put('Bool', new StaticEntry(tType, tBool))
    st.put('Block', new StaticEntry(tType, tBlock))
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

    describe('ArgNode', function () {
      it('assigns a type from a type annotation', function () {
        const root = parse('{ x: Int | x }')
        analyzer.visit(root.node)

        const blockNode = root.node.getLastExpr()
        const argNode = blockNode.getArgs()[0]

        assert.strictEqual(argNode.getType(), tInt)
      })

      it('infers a type based on a default value', function () {
        const root = parse('{ x = "yes" | x }')
        console.log(root.sexp())
        analyzer.visit(root.node)

        const blockNode = root.node.getLastExpr()
        const argNode = blockNode.getArgs()[0]

        assert.strictEqual(argNode.getType(), tString)
      })

      it('fails when a type annotation and default value are inconsistent', function () {
        const root = parse('{ x : Bool = "yes" | 7 }')
        assert.throws(() => analyzer.visit(root.node), /Types "Bool" and "String" do not match/)
      })

      it('may be an unbound type parameter', function () {
        const root = parse("{ x : 'A | x }")
        analyzer.visit(root.node)

        const blockNode = root.node.getLastExpr()
        const argNode = blockNode.getArgs()[0]
        const argType = argNode.getType()

        assert.isTrue(argType.isParam())
        assert.equal(argType.getName(), "'A")
      })
    })

    describe('IfNode', function () {
      it('ensures that the condition clause of an IfNode evaluates to a Bool', function () {
        const success = parse('if {true} then {"no"} else {"uh"}')
        analyzer.visit(success)

        const failure = parse('if {6} then {3} else {"no"}')
        assert.throws(() => analyzer.visit(failure.node), /Types "Int" and "Bool" do not match/)
      })

      it('ensures that the "then" and "else" branches of an IfNode are consistent', function () {
        const success = parse('if {true} then {3} else {4}')
        analyzer.visit(success.node)
        assert.strictEqual(success.node.getType(), tInt)

        const failure = parse('if {true} then {3} else {"no"}')
        assert.throws(() => analyzer.visit(failure.node), /Types "Int" and "String" do not match/)
      })
    })
  })
})
