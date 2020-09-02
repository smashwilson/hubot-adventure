// Description:
//   Commands to interact with Adventure worlds and games.
//
// Commands:
//   hubot adventure create world <name> - Create a new adventure world with the current channel as its control channel
//   hubot adventure list worlds - Show existing adventure worlds
//   hubot adventure delete world <name> - Delete an adventure world if it has no active games
//   hubot adventure force delete world <name> - Delete an adventure world and stop all of its active games
//   hubot adventure create game <world name> - Begin a game in the named world with the current channel as its play channel
//   hubot adventure list games - Display active games and their play channels
//   hubot adventure delete game - Stop the game playing in the current channel

const { Universe } = require('./model')
const { formatError } = require('./errors')

function worldName (raw) {
  return raw.replace(/^['"]|['"]$/g, '')
}

function wrap (handler) {
  return msg => {
    try {
      handler(msg)
    } catch (e) {
      msg.send(formatError(e))
    }
  }
}

module.exports = function (robot) {
  const universe = new Universe()

  robot.respond(/adventure create world\s+(.+)/i, wrap(msg => {
    const name = worldName(msg.match[1])
    universe.createWorld(name, msg.envelope.room)
    msg.send(
      `The world '${name}' has been created and this is its control channel. ` +
      'Messages with code blocks (```) in this channel will be interpreted as Gnomish code. ' +
      'Go forth and create!'
    )
  }))

  robot.respond(/adventure list world(?:s)?\s*$/i, wrap(msg => {
    const entries = universe.listWorlds()
    if (entries.length === 0) {
      return msg.send(
        'Available worlds:\n_None created._\n' +
        `Use \`${robot.name}: adventure create world <name>\` to create a new world controlled from the ` +
        'current channel.'
      )
    }

    msg.send(`Available worlds:\n${entries.map(e => e.name).join('\n')}`)
  }))

  robot.respond(/adventure delete world\s*(.+)$/i, wrap(msg => {
    const name = worldName(msg.match[1])
    universe.deleteWorld(name, false)
    msg.send(`The world '${name}' has been deleted.`)
  }))

  robot.respond(/adventure force delete world\s*(.+)$/i, wrap(msg => {
    const name = worldName(msg.match[1])
    universe.deleteWorld(name, true)
    msg.send(`World '${name}' has been deleted and all of its active games have been stopped.`)
  }))

  robot.hear(/```\n?((?:[^`]|`[^`]|``[^`]|)+)\n?```/, wrap(msg => {
    const currentWorld = universe.worldForChannel(msg.envelope.room)
    if (!currentWorld) {
      return
    }

    const { result } = currentWorld.execute(msg.match[1], {
      say (output) {
        msg.send(output)
      }
    })
    msg.send('```\n' + result.toString() + '\n```')
  }))

  robot.respond(/adventure create game\s+(.+)/i, wrap(msg => {
    const name = worldName(msg.match[1])
    universe.createGame(name, msg.envelope.room)
    msg.send(
      `*Welcome to ${name}*\n` +
      `This is now the play channel for a game in the ${name} world. Any message here beginning with a blockquote ` +
      'character (`>`) will be interpreted as a command.'
    )
  }))

  robot.respond(/adventure list game(?:s)\s*$/i, wrap(msg => {
    const gameEntries = universe.listGames()
    if (gameEntries.length === 0) {
      return msg.send(
        'Running games:\n' +
        '_None_\n' +
        `Run \`${robot.name}: adventure create game <World Name>\` to begin playing a game in this channel.`
      )
    }

    let response = 'Running games:'
    for (const gameEntry of gameEntries) {
      response += `\n${gameEntry.channel} (${gameEntry.worldEntry.name})`
    }
    msg.send(response)
  }))

  robot.respond(/adventure delete game\s*$/i, wrap(msg => {
    universe.deleteGame(msg.envelope.room)
    msg.send('This game has been stopped. Thanks for playing!')
  }))

  robot.hear(/> ([^]+)/i, wrap(msg => {
    const currentGame = universe.gameForChannel(msg.envelope.room)
    if (!currentGame) {
      return
    }

    currentGame.executeCommand(msg.match[1], {
      say (output) {
        msg.send(output)
      }
    })
  }))
}
