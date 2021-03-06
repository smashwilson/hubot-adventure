/* eslint-env mocha */

const fs = require('fs')
const path = require('path')
const chai = require('chai')
const assert = require('../lib/assertion')
const { parse } = require('./helper')
const stdlib = require('../../src/gnomish/stdlib')
const { SymbolTable } = require('../../src/gnomish/symboltable')
const { MethodRegistry } = require('../../src/gnomish/methodregistry')

const rootTable = SymbolTable.root()
const methodRegistry = new MethodRegistry()
stdlib.register(rootTable, methodRegistry)
assert.register(rootTable, methodRegistry)

describe('Gnomish standard library', function () {
  function executeTestFile (testPath) {
    const testSource = fs.readFileSync(testPath, { encoding: 'utf8' })
    const normalized = testSource.replace(/\r\n/g, '\n')

    const gameTable = SymbolTable.game(rootTable)
    try {
      parse(normalized).analyze(gameTable, methodRegistry).interpret()
    } catch (e) {
      it(`cannot parse ${testPath}`, function () {
        chai.assert.fail(null, null, e.message)
      })
    }
  }

  const testDir = path.join(__dirname, 'stdlib')
  const testFiles = fs.readdirSync(testDir).filter(each => each.endsWith('.gn'))

  for (const testFile of testFiles) {
    describe(testFile, function () {
      executeTestFile(path.join(testDir, testFile))
    })
  }
})
