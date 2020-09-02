/* eslint-env mocha */

const { assert } = require('chai')
const { Universe } = require('../../src/model/universe')

describe('Universe', function () {
  let universe

  beforeEach(function () {
    universe = new Universe()
  })

  describe('worlds', function () {
    it('creates a new world', function () {
      assert.lengthOf(universe.listWorlds(), 0)
      const world = universe.createWorld('name', 'channel')

      assert.lengthOf(universe.listWorlds(), 1)
      assert.strictEqual(world, universe.worldNamed('name'))
      assert.strictEqual(world, universe.worldForChannel('channel'))
    })

    it('fails to create a new world with a duplicate name', function () {
      universe.createWorld('existing', 'channel0')

      assert.throws(() => universe.createWorld('existing', 'channel1'), /Duplicate world name/)
    })

    it('fails to create a new world with a duplicate channel', function () {
      universe.createWorld('name0', 'channel')

      assert.throws(() => universe.createWorld('name1', 'channel'), /Duplicate channel name/)
    })

    it('lists existing worlds', function () {
      const worlds = [
        universe.createWorld('zero', 'channel0'),
        universe.createWorld('one', 'channel1'),
        universe.createWorld('two', 'channel2')
      ]

      assert.deepEqual(universe.listWorlds().map(e => e.world), worlds)
    })

    it('deletes an existing world', function () {
      const w0 = universe.createWorld('existing0', 'channel0')
      universe.createWorld('existing1', 'channel1')
      const w2 = universe.createWorld('existing2', 'channel2')

      universe.deleteWorld('existing1', false)

      assert.deepEqual(universe.listWorlds().map(e => e.world), [w0, w2])
    })

    it('fails to delete a world that does not exist', function () {
      assert.throws(() => universe.deleteWorld('no', false), /No world named/)
    })
  })

  describe('games', function () {
    beforeEach(function () {
      universe.createWorld('the-world', 'control-channel')
      universe.createWorld('other-world', 'other-control-channel')
    })

    it('creates a new game', function () {
      assert.lengthOf(universe.listGames(), 0)
      const game = universe.createGame('the-world', 'play-channel')

      assert.lengthOf(universe.listGames(), 1)
      assert.strictEqual(universe.gameForChannel('play-channel'), game)
    })

    it('fails to create a new game for an unrecognized world', function () {
      assert.throws(() => universe.createGame('unknown-world', 'play-channel'), /No world named/)
    })

    it('fails to create a new game with a duplicate play channel', function () {
      universe.createGame('other-world', 'same-play-channel')

      assert.throws(() => universe.createGame('the-world', 'same-play-channel'), /already a play channel/)
    })

    it('lists existing games by channel', function () {
      const g0 = universe.createGame('the-world', 'play-channel-0')
      const g1 = universe.createGame('the-world', 'play-channel-1')
      const g2 = universe.createGame('other-world', 'play-channel-2')

      assert.deepEqual(universe.listGames().map(e => e.game), [g0, g1, g2])
      assert.deepEqual(universe.listGames().map(e => e.channel), ['play-channel-0', 'play-channel-1', 'play-channel-2'])
    })

    it('deletes an existing game', function () {
      universe.createGame('the-world', 'play-channel')

      universe.deleteGame('play-channel', false)

      assert.isNull(universe.gameForChannel('play-channel'))
    })

    it('fails to delete a game when none is playing', function () {
      assert.throws(() => universe.deleteGame('nothing-here', false), /No active game/)
    })

    it('fails to delete a world with active games', function () {
      universe.createWorld('new-world', 'new-world-control-channel')
      universe.createGame('new-world', 'new-world-play-channel')

      assert.throws(() => universe.deleteWorld('new-world', false), /active games/)
    })

    it('deletes a world and its active games if forced', function () {
      universe.createWorld('new-world', 'new-world-control-channel')

      const g0 = universe.createGame('the-world', 'play-channel-0')
      const g = universe.createGame('new-world', 'new-world-play-channel')
      const g1 = universe.createGame('other-world', 'play-channel-1')

      assert.deepEqual(universe.listWorlds().map(e => e.name), ['the-world', 'other-world', 'new-world'])
      assert.deepEqual(universe.listGames().map(e => e.game), [g0, g, g1])

      universe.deleteWorld('new-world', true)

      assert.deepEqual(universe.listWorlds().map(e => e.name), ['the-world', 'other-world'])
      assert.deepEqual(universe.listGames().map(e => e.game), [g0, g1])
    })
  })
})
