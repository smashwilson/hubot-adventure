const { World } = require('./world')
const { error } = require('../errors')

class Universe {
  constructor () {
    this.worldsByName = new Map()
    this.worldsByChannel = new Map()
    this.gamesByChannel = new Map()
  }

  createWorld (name, channel) {
    if (this.worldsByName.has(name)) {
      error(`Duplicate world name: ${name}`)
        .withUserMessage(`Sorry, a world called '${name}' already exists.`)
        .raise()
    }

    const existing = this.worldsByChannel.get(channel)
    if (existing) {
      error(`Duplicate channel name: ${channel}`)
        .withUserMessage(
          `This channel is already the control channel for the world ${existing.name}. ` +
          'Please create your world in a new channel or delete this world first.'
        )
        .raise()
    }

    const entry = {
      world: new World(),
      name: name,
      channel: channel,
      gameEntries: new Set()
    }

    this.worldsByName.set(name, entry)
    this.worldsByChannel.set(channel, entry)

    return entry.world
  }

  listWorlds () {
    return Array.from(this.worldsByName.values())
  }

  deleteWorld (name, force) {
    const entry = this.worldsByName.get(name)
    if (entry) {
      if (entry.gameEntries.size !== 0) {
        if (!force) {
          error(`World ${name} has active games`)
            .withUserMessage(
              `World ${name} has active games and may not be deleted. ` +
              'Stop those games and try again or use --force to stop them all at once.'
            )
            .withData('game channels', Array.from(entry.gameEntries, gameEntry => gameEntry.channel).join(', '))
            .raise()
        }

        for (const gameEntry of Array.from(entry.gameEntries)) {
          this.deleteGame(gameEntry.channel)
        }
      }

      this.worldsByName.delete(entry.name)
      this.worldsByChannel.delete(entry.channel)
    } else {
      error(`No world named: ${name}`)
        .withUserMessage(`No world called '${name}' exists.`)
        .raise()
    }
  }

  worldNamed (name) {
    const entry = this.worldsByName.get(name)
    return entry ? entry.world : null
  }

  worldForChannel (channel) {
    const entry = this.worldsByChannel.get(channel)
    return entry ? entry.world : null
  }

  createGame (worldName, channel) {
    const worldEntry = this.worldsByName.get(worldName)
    if (!worldEntry) {
      error(`No world named: ${worldName}`)
        .withUserMessage(`No world called '${worldName}' exists.`)
        .raise()
    }

    const existing = this.gamesByChannel.get(channel)
    if (existing) {
      error(`Channel '${channel}' is already a play channel`)
        .withUserMessage(
          `This channel is already running a game in the world of ${existing.worldEntry.name}. ` +
          'Please play in a different channel or stop the existing game first.'
        )
        .raise()
    }

    const entry = {
      game: worldEntry.world.createGame(channel),
      worldEntry,
      channel
    }

    worldEntry.gameEntries.add(entry)
    this.gamesByChannel.set(channel, entry)

    return entry.game
  }

  listGames () {
    return Array.from(this.gamesByChannel.values())
  }

  gameForChannel (channel) {
    const existing = this.gamesByChannel.get(channel)
    return existing ? existing.game : null
  }

  deleteGame (channel) {
    const entry = this.gamesByChannel.get(channel)
    if (entry) {
      this.gamesByChannel.delete(channel)
    } else {
      error(`No active game in ${channel}`)
        .withUserMessage('This channel is not currently playing any games.')
        .raise()
    }
  }
}

module.exports = { Universe }
