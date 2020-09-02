/* eslint-env mocha */

const { assert } = require('chai')

const { World } = require('../../src/model/world')
const { Block } = require('../../src/gnomish/stdlib/block')
const { ExprListNode, IntNode } = require('../../src/gnomish/ast')
const { Interpreter } = require('../../src/gnomish/interpreter')

describe('Room', function () {
  let w, r

  beforeEach(function () {
    w = new World()
    r = w.defineRoom('id', 'Name')
  })

  function makeBlock (i) {
    return new Block([], new ExprListNode([new IntNode({ digits: [i.toString()] })]))
  }

  describe('commands', function () {
    it('defines a new command', function () {
      r.defineCommand('jump', makeBlock(10))

      assert.deepEqual(r.getCommands(), ['jump'])
    })

    it('executes an existing command', function () {
      r.defineCommand('jump', makeBlock(10))

      const i = new Interpreter()
      assert.strictEqual(r.executeCommand('jump', i), 10)
    })

    it('overwrites an existing command', function () {
      r.defineCommand('jump', makeBlock(10))
      r.defineCommand('jump', makeBlock(11))

      assert.deepEqual(r.getCommands(), ['jump'])

      const i = new Interpreter()
      assert.strictEqual(r.executeCommand('jump', i), 11)
    })

    it('executes a fall-through command for the Room', function () {
      r.setFallThroughCommand(makeBlock(12))

      assert.lengthOf(r.getCommands(), [])

      const i = new Interpreter()
      assert.strictEqual(r.executeCommand('blarf', i), 12)
    })

    it('executes a global command inherited from the World', function () {
      w.defineCommand('global', makeBlock(13))

      assert.lengthOf(r.getCommands(), [])

      const i = new Interpreter()
      assert.strictEqual(r.executeCommand('global', i), 13)
    })

    it('executes a fall-through command inherited from the World', function () {
      w.setFallThroughCommand(makeBlock(15))

      const i = new Interpreter()
      assert.strictEqual(r.executeCommand('blarf', i), 15)
    })

    it('deletes a command', function () {
      r.setFallThroughCommand(makeBlock(0))
      r.defineCommand('jump', makeBlock(5))
      assert.isTrue(r.deleteCommand('jump'))

      const i = new Interpreter()
      assert.strictEqual(r.executeCommand('jump', i), 0)
    })
  })

  describe('nouns', function () {
    it('defines a new noun', function () {
      const n = r.defineNoun('box')
      assert.deepEqual(r.getNouns(), [n])
    })

    it('accesses an already-existing noun', function () {
      const n0 = r.defineNoun('box')
      const n1 = r.defineNoun('box')
      assert.strictEqual(n0, n1)
    })

    it('deletes a noun', function () {
      const n0 = r.defineNoun('box')
      const n1 = r.defineNoun('candlestick')

      assert.deepEqual(r.getNouns(), [n0, n1])

      assert.isTrue(r.deleteNoun('box'))
      assert.isFalse(r.deleteNoun('rope'))

      assert.deepEqual(r.getNouns(), [n1])
    })
  })

  it('clears all commands and nouns', function () {
    r.defineCommand('one', makeBlock(1))
    r.defineCommand('two', makeBlock(1))

    r.defineNoun('box')
    r.defineNoun('candlestick')

    assert.strictEqual(r.clear(), r)

    assert.lengthOf(r.getCommands(), 0)
    assert.lengthOf(r.getNouns(), 0)
  })

  describe('description', function () {
    it('is omitted from "look" output by default', function () {
      const said = []
      const i = new Interpreter({ say (line) { said.push(line) } })

      r.executeCommand('look', i)
      assert.deepEqual(said, ['*Name*'])
    })

    it('is used in the output of the generated "look" command', function () {
      r.setDescription('Contains some stuff.')

      const said = []
      const i = new Interpreter({ say (line) { said.push(line) } })

      r.executeCommand('look', i)
      assert.deepEqual(said, ['*Name*\n\nContains some stuff.'])
    })

    it('automatically puts nouns in all caps', function () {
      r.setDescription('Contains some stuff.')
      r.defineNoun('stuff')

      const said = []
      const i = new Interpreter({ say (line) { said.push(line) } })

      r.executeCommand('look', i)
      assert.deepEqual(said, ['*Name*\n\nContains some STUFF.'])
    })
  })
})
