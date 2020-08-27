/* eslint-env mocha */

const { assert } = require('chai')

const { World } = require('../../src/model/world')

describe('Game', function () {
  let world, room0, room1

  beforeEach(function () {
    world = new World()
    room0 = world.defineRoom('id0', 'zero')
    room1 = world.defineRoom('id1', 'one')
  })

  it('executes Gnomish source in its own isolated context', function () {
    world.execute('letgame x = "original"')

    const game0 = world.createGame('C0')
    const game1 = world.createGame('C1')

    game0.execute('x = "game0"')
    game1.execute('x = "game1"')

    assert.strictEqual(world.execute('x').result, 'original')
    assert.strictEqual(game0.execute('x').result, 'game0')
    assert.strictEqual(game1.execute('x').result, 'game1')
  })

  it('dispatches commands to its current room', function () {
    world.execute('letgame x = ""')
    room0.defineCommand('aaa', world.execute('{ x = "ran in room0" }').result)
    room1.defineCommand('aaa', world.execute('{ x = "ran in room1" }').result)

    const game = world.createGame('0')

    game.setCurrentRoomID('id1')
    game.executeCommand('aaa')
    assert.strictEqual(game.execute('x').result, 'ran in room1')

    game.setCurrentRoomID('id0')
    game.executeCommand('aaa')
    assert.strictEqual(game.execute('x').result, 'ran in room0')
  })
})
