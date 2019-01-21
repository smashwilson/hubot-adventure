/* eslint-env mocha */

const { assert } = require('chai')

const { World } = require('../../src/model/world')
const { Block } = require('../../src/gnomish/stdlib/block')
const { ExprListNode, IntNode } = require('../../src/gnomish/ast')
const { Interpreter } = require('../../src/gnomish/interpreter')

describe('Noun', function () {
  let w, r, n

  function makeBlock (i) {
    return new Block([], new ExprListNode([new IntNode({ digits: [i.toString()] })]))
  }

  beforeEach(function () {
    w = new World()
    r = w.createRoom('id', 'Name')
    n = r.defineNoun('thingy')
  })

  describe('commands on its containing Room', function () {
    it('defines a new command', function () {
      n.defineCommand('push', makeBlock(10))

      assert.deepEqual(r.getCommands(), ['push thingy'])

      const i = new Interpreter()
      assert.strictEqual(r.executeCommand('push thingy', i), 10)
    })

    it('overwrites an existing command', function () {
      n.defineCommand('pull', makeBlock(10))
      n.defineCommand('pull', makeBlock(20))

      const i = new Interpreter()
      assert.strictEqual(r.executeCommand('pull thingy', i), 20)
    })

    it('deletes a command', function () {
      r.setFallThroughCommand(makeBlock(50))
      n.defineCommand('lift', makeBlock(30))
      n.deleteCommand('lift')

      assert.lengthOf(r.getCommands(), 0)

      const i = new Interpreter()
      assert.strictEqual(r.executeCommand('push thingy', i), 50)
    })
  })
})
