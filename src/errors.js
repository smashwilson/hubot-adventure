class ErrorBuilder {
  constructor (message) {
    this.message = message
    this.userMessage = message
    this.data = new Map()
  }

  withUserMessage (userMessage) {
    this.userMessage = userMessage
    return this
  }

  withData (key, value) {
    this.data.set(key, value)
    return this
  }

  raise () {
    const e = new Error(this.message)
    e.userMessage = this.userMessage
    e.data = this.data
    throw e
  }
}

function error (message) {
  return new ErrorBuilder(message)
}

function formatError (error) {
  if (error.userMessage) {
    let formatted = error.userMessage
    for (const [k, v] of (error.data || new Map())) {
      formatted += `\n${k}: ${v}`
    }
    return formatted
  } else {
    // Non-error() constructed exception.
    return `:fire: ${error.toString()}\n\`\`\`\n${error.stack}\n\`\`\`\n`
  }
}

module.exports = { error, formatError }
