/* eslint-env mocha */

const {assert} = require('chai')
const {parse} = require('./helper')
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

    st.put('true', new StaticEntry(tBool, true))
    st.put('false', new StaticEntry(tBool, false))

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

        assert.isTrue(argType.isParameter())
        assert.equal(argType.getName(), "'A")
      })
    })

    describe('BlockNode', function () {
      it('infers the return type from the final expression', function () {
        const root = parse(`
          {
            3
            "sup"
          }
        `)
        analyzer.visit(root.node)

        const blockType = root.node.getLastExpr().getType()
        assert.isTrue(blockType.isCompound())
        assert.strictEqual(blockType.getBase(), tBlock)
        assert.lengthOf(blockType.getParams(), 1)
        assert.strictEqual(blockType.getParams()[0], tString)
      })

      it('parameterizes its type with its return value, then argument types', function () {
        const root = parse(`
          { x : Int, y = "foo" | "yep" ; true }
        `)
        analyzer.visit(root.node)

        const blockType = root.node.getLastExpr().getType()
        assert.isTrue(blockType.isCompound())
        assert.strictEqual(blockType.getBase(), tBlock)
        assert.lengthOf(blockType.getParams(), 3)
        assert.strictEqual(blockType.getParams()[0], tBool)
        assert.strictEqual(blockType.getParams()[1], tInt)
        assert.strictEqual(blockType.getParams()[2], tString)
      })

      it('may have an unbound argument parameter', function () {
        const root = parse("{ x : 'A | 3 }")
        analyzer.visit(root.node)

        const blockType = root.node.getLastExpr().getType()
        assert.isTrue(blockType.isCompound())
        assert.strictEqual(blockType.getBase(), tBlock)
        assert.lengthOf(blockType.getParams(), 2)
        assert.strictEqual(blockType.getParams()[0], tInt)
        assert.isTrue(blockType.getParams()[1].isParameter())
        assert.equal(blockType.getParams()[1].getName(), "'A")
      })

      it('may have a return type expressed in type parameters', function () {
        const root = parse("{ x : 'A | x }")
        analyzer.visit(root.node)

        const blockType = root.node.getLastExpr().getType()
        assert.isTrue(blockType.isCompound())
        assert.strictEqual(blockType.getBase(), tBlock)
        assert.lengthOf(blockType.getParams(), 2)
        assert.isTrue(blockType.getParams()[0].isParameter())
        assert.equal(blockType.getParams()[0].getName(), "'A")
        assert.strictEqual(blockType.getParams()[1], blockType.getParams()[0])
      })
    })

    describe('IfNode', function () {
      it('ensures that the condition clause of an IfNode evaluates to a Bool', function () {
        const success = parse('if {true} then {"no"} else {"uh"}')
        analyzer.visit(success.node)

        const failure = parse('if {6} then {3} else {"no"}')
        assert.throws(() => analyzer.visit(failure.node), /Types "Block\(Bool\)" and "Block\(Int\)" do not match/)
      })

      it('ensures that the "then" and "else" branches of an IfNode are consistent', function () {
        const success = parse('if {true} then {3} else {4}')
        analyzer.visit(success.node)
        assert.strictEqual(success.node.getType(), tInt)

        const failure = parse('if {true} then {3} else {"no"}')
        assert.throws(() => analyzer.visit(failure.node), /Types "Block\(Int\)" and "Block\(String\)" do not match/)
      })
    })
  })
})
