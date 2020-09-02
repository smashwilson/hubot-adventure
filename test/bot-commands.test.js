/* eslint-env mocha */

const { Harness } = require('hubot-harness')

describe('Hubot commands', function () {
  let hubot

  beforeEach(function () {
    hubot = new Harness({ name: 'bot' })
    hubot.load(__dirname, '../src/index')
  })

  describe('worlds', function () {
    it('creates a new world', async function () {
      hubot.say('bot: adventure create world Avalon')
      await hubot.waitForResponse(/The world 'Avalon' has been created and this is its control channel./)
    })

    it('fails to create a new world if one with the same name already exists', async function () {
      const otherRoom = hubot.createRoom('other-room')

      otherRoom.say('bot: adventure create world Avalon')
      await otherRoom.waitForResponse(/has been created/)

      hubot.say('bot: adventure create world Avalon')
      await hubot.waitForResponse("Sorry, a world called 'Avalon' already exists.")
    })

    it('fails to create a new world if the current channel is already a control channel', async function () {
      hubot.say('bot: adventure create world Avalon')
      await hubot.waitForResponse(/has been created/)

      hubot.say('bot: adventure create world Faerun')
      await hubot.waitForResponse(
        'This channel is already the control channel for the world Avalon. ' +
        'Please create your world in a new channel or delete this world first.')
    })

    it('lists available worlds', async function () {
      hubot.say('bot: adventure list world')
      await hubot.waitForResponse(
        'Available worlds:\n_None created._\n' +
        'Use `bot: adventure create world <name>` to create a new world controlled from the current channel.'
      )

      const avalonRoom = hubot.createRoom('avalon-control')
      avalonRoom.say('bot: adventure create world Avalon')
      await avalonRoom.waitForResponse(/has been created/)

      const faerunRoom = hubot.createRoom('faerun-room')
      faerunRoom.say('bot: adventure create world Faerun')
      await faerunRoom.waitForResponse(/has been created/)

      hubot.say('bot: adventure list world')
      await hubot.waitForResponse('Available worlds:\nAvalon\nFaerun')
    })

    it('deletes an existing world', async function () {
      hubot.say('bot: adventure create world Avalon')
      await hubot.waitForResponse(/has been created/)

      hubot.say('bot: adventure delete world Avalon')
      await hubot.waitForResponse("The world 'Avalon' has been deleted.")
    })

    it('tells you if you attempt to delete a non-existent world', async function () {
      hubot.say('bot: adventure delete world Atlantis')
      await hubot.waitForResponse(/No world called 'Atlantis' exists./)
    })
  })

  describe('world code execution', function () {
    let avalon

    beforeEach(async function () {
      avalon = hubot.createRoom('avalon-control')
      avalon.say('bot: adventure create world Avalon')
      await avalon.waitForResponse(/has been created/)
    })

    it('executes gnomish code in control rooms', async function () {
      avalon.say('```\n3 + 4\n```\n')
      await avalon.waitForResponse('```\n7\n```\n')
    })
  })

  describe('games', function () {
    let avalonControl, avalonPlay, faerunControl, faerunPlay

    beforeEach(async function () {
      avalonControl = hubot.createRoom('avalon-control')
      avalonControl.say('bot: adventure create world Avalon')
      await avalonControl.waitForResponse(/has been created/)

      avalonControl.say('```\ndefineRoom("home", "Home")\n```\n')
      await avalonControl.waitForResponse(/Room\("home", "Home"\)/)

      avalonPlay = hubot.createRoom('avalon-play')

      faerunControl = hubot.createRoom('faerun-control')
      faerunControl.say('bot: adventure create world Faerun')
      await faerunControl.waitForResponse(/has been created/)

      faerunControl.say('```\ndefineRoom("neverwinter", "Neverwinter")\n```\n')
      await faerunControl.waitForResponse(/Room\("neverwinter", "Neverwinter"\)/)

      faerunPlay = hubot.createRoom('faerun-play')
    })

    it('creates a new game of a named world', async function () {
      avalonPlay.say('bot: adventure create game Avalon')
      await avalonPlay.waitForResponse(/Welcome to Avalon/)
    })

    it('fails to create a new game if the named world does not exist', async function () {
      avalonPlay.say('bot: adventure create game Atlantis')
      await avalonPlay.waitForResponse("No world called 'Atlantis' exists.")
    })

    it('fails to create a new game if the current channel already has one', async function () {
      avalonPlay.say('bot: adventure create game Avalon')
      await avalonPlay.waitForResponse(/Welcome to Avalon/)

      avalonPlay.say('bot: adventure create game Faerun')
      await avalonPlay.waitForResponse(/This channel is already running a game in the world of Avalon/)
    })

    it('lists running games', async function () {
      hubot.say('bot: adventure list games')
      await hubot.waitForResponse(
        'Running games:\n' +
        '_None_\n' +
        'Run `bot: adventure create game <World Name>` to begin playing a game in this channel.'
      )

      avalonPlay.say('bot: adventure create game Avalon')
      await avalonPlay.waitForResponse(/Welcome to Avalon/)

      faerunPlay.say('bot: adventure create game Faerun')
      await faerunPlay.waitForResponse(/Welcome to Faerun/)

      hubot.say('bot: adventure list games')
      await hubot.waitForResponse(
        'Running games:\n' +
        'avalon-play (Avalon)\n' +
        'faerun-play (Faerun)'
      )
    })

    it('stops a running game', async function () {
      avalonPlay.say('bot: adventure create game Avalon')
      await avalonPlay.waitForResponse(/Welcome to Avalon/)

      avalonPlay.say('bot: adventure delete game')
      await avalonPlay.waitForResponse(/game has been stopped/)
    })

    it('tells you if you attempt to stop a game when there is none', async function () {
      avalonPlay.say('bot: adventure delete game')
      await avalonPlay.waitForResponse('This channel is not currently playing any games.')
    })
  })

  describe('game commands', function () {
    let control, play

    beforeEach(async function () {
      control = hubot.createRoom('avalon-control')
      control.say('bot: adventure create world Avalon')
      await control.waitForResponse(/has been created/)

      control.say(
        '```\n' +
        'let room = defineRoom("home", "Home")\n' +
        'room.command("call", "and answer")\n' +
        'room\n' +
        '```\n'
      )
      await control.waitForResponse(/Room\("home", "Home"\)/)

      play = hubot.createRoom('avalon-play')
      play.say('bot: adventure create game Avalon')
      await play.waitForResponse(/Welcome to Avalon/)
    })

    it('interprets blockquotes in play rooms as commands', async function () {
      play.say('> call')
      await play.waitForResponse('and answer')
    })
  })
})
