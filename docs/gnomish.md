# Gnomish

"Gnomish" is the programming language used by game masters to determine what happens when commands are typed by players, which can range anywhere from "respond with some amusing text" the whole way up to puzzles of arbitrary complexity. Gnomish is entered in the _command channel_, which is determined by channel in which the `hubot: adventure create world` or `hubot: adventure edit world` commands are executed. Each world may have many command channels, but each command channel may edit only one active adventure world.

Game masters execute gnomish by typing it between triple backticks (\`\`\`) on their own line in a command channel. This matches Slack's "format as code" markup. Longer sections of Gnomish code can also be executed from a [GitHub gist](https://gist.github.com/) by providing its URL to a `hubot: adventure eval` command.

## Model

### World

In Gnomish, a *World* encompasses everything that belongs to a specific game in progress. Multiple Worlds can coexist within the same bot as long as each has its own _play channel_ and _command channel(s)_. A World defines a scope for variables and functions that can be used anywhere within that game. Worlds may also have globally applicable Commands that players may invoked in any room, and the fallback block that's executed when no command is matched.

### Room

Each World is composed of at least one _Room_. A Room is a virtual location that players inhabit. The _play channel_ will always have a single active Room that any given commands are matched against.

Rooms are identified within a World by an integer ID. Every Room must have a (not necessarily unique) name and many will have a description that is displayed upon entry to inform the players where they are or in response to the command `> look`.

Points of further interactivity within a Room are designated as Nouns. The Nouns mentioned within a Room's description will be displayed in ALL-CAPS to highlight them to players.

Rooms are linked together spatially by movement commands (`> north`, `> south`, `> up`). These relationships need not be reflexive, however.

### Noun

A *Noun* is an object within a Room that players can interact with. They provide hints about the Commands that will be understood within that Room. Each Noun within a Room has at least one _verb_ associated with it to perform an action on or with it.

### Command

### Player

## Language

### Literals

Gnomish accepts the following literal objects:

* Int: `1`, `-40`.
* Real: `0.45`, `-4.5`. Note that the `0.` prefix is necessary for numbers between 0 and 1.
* String: `"Bounded by double quotes"`.
  * Strings that contain internal double quotes must escape them with \\: `"Foo \" Bar"`.
  * Strings may also contain subexpressions with ${}: `"Foo ${3 + 4} Bar"`. The result of the internal expression will be converted to a String using an `expr.toString()` function in the current scope, if present.
* Enum: `[value]`. Enumerated constants are the members of an _enum type_ defined by the language or the user in the current scope. For example, `[true]` and `[false]` are the members of the `Bool` type.
* Block: `{ 3 + 4 }`. Blocks contain one or more Gnomish expressions which are evaluated when the block is executed. The result of the final expression is returned from the block.
  * Blocks can accept arguments by beginning with an argument list: `{ a: Int, b: Int | a + b }`.
  * Arguments may be given default values with =, in which case its type will often be inferred: `{ a = 1, b: Int | a * b }`.
  * Argument types are mandatory, but may themselves be variables defined in some outer scope. `{ A = Int; { a: A | a } }`.
  * An argument type may also be left _unbound_, to be inferred at each caller. Unbound type arguments must begin with \`: `{ a: 'A | a }`
  * Empty blocks are inferred to return `none`.

Technically, all of the top-level code is an anonymous Block literal with no arguments.

### Variables

Variables are introduced into the current scope with "let": `let x = 1`. "x" may then be referenced in later code to access its current value or be reassigned. Its type is inferred by its (mandatory) initialization.

Variables introduced within a Block are visible for the duration of that Block. Variables introduced at the top level of a Gnomish script are visible within the entire current Room. It is an error to attempt to introduce a variable when there is no current Room.

By convention, variables that hold types should begin with a capital letter.

It is an error to name a variable that conflicts with a system type or method or to redefine a variable within the same Block. Redefining a variable within a Room replaces the old variable's definition and type with the new one, invalidating any Blocks that referenced the old variable. Variables may also be shadowed by definitions within nested Blocks.

To explicitly reference a shadowed World variable from a Room scope, prefix it with `world@`. Similarly, to access a Room variable from a method that shadows it, prefix it with `room@`.

### Expressions

Each line of code is composed of an Expression that may include other Expressions. Every Expression has a type and a value.

* "if": `if { } then { } else { }`. The "if" block must return a Bool enum. The type of the Expression is the return type of the "then" and "else" blocks, which must agree, and its value is the value of the executed branch.
* "while": `while { } do { }`. The "while" block must return a Bool enum. The type of the Expression is the return type of the "do" block and its value is the return value of the final iteration.
* Method call: `foo.toString()`. Calling a method with no receiver will call a method on the current Room (if any) or World: `createRoom()`.
* Operator call: `a * b`. Operators are distinguished by ending with a recognized operator punctuation (`+`, `-`, `*`, `/`, `&`, `|`, `=`, `<`, `>`, `@`, `^`, `%`, `?`) although they may or may not include other characters. The final character determines the operator's precedence, which follows ordinary mathematical convention. Examples: `+`, `**`, `int/`.
