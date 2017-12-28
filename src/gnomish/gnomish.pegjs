// PEG grammer for the Gnomish language

{
  const {
    ExprListNode,
    IfNode, WhileNode,
    IntNode, RealNode, StringNode, BlockNode, ArgNode, VarNode
  } = require('./ast')
}

// Expressions ////////////////////////////////////////////////////////////////////////////////////////////////////////

exprlist
  = first:expr rest:( _ ( ';' / '\n' ) _ each:expr _ { return each } )*
    { return new ExprListNode([first, ...rest]) }

expr "expression"
  = if
  / while
  / literal

while
  = 'while' _ condition:block _ 'do' _ action:block
    { return new WhileNode({condition, action}) }

if
  = 'if' _ condition:block _ 'then' _ thenb:block elseb:( _ 'else' _ e:block { return e } )?
    { return new IfNode({condition, thenb, elseb}) }

// Literals ///////////////////////////////////////////////////////////////////////////////////////////////////////////

literal
  = real
  / int
  / string
  / var
  / block

real
  = minus:'-'? whole:[0-9]+ '.' fraction:[0-9]+
    { return new RealNode({minus, whole, fraction}) }

int "integer"
  = minus:'-'? digits:[0-9]+
    { return new IntNode({minus, digits}) }

string
  = '"' chars:( '\\' char:. { return char } / [^"] )* '"'
    { return new StringNode({chars}) }

var
  = name:identifier
    { return new VarNode({name}) }

identifier
  = $ ( [a-zA-Z] [0-9a-zA-Z_]* )

// Blocks

block
  = '{' _ args:blockargs? _ body:exprlist? _ '}'
    { return new BlockNode({args, body}) }

blockargs "block arguments"
  = first:blockarg rest:(_ ',' _ arg:blockarg { return arg } )* _ '|'
    { return [first, ...rest] }

blockarg "block argument"
  = name:identifier type:(_ ':' _ t:expr { return t })? def:(_ '=' _ d:expr { return d })?
    { return new ArgNode({name, type, def}) }

// Whitespace /////////////////////////////////////////////////////////////////////////////////////////////////////////

_ "optional whitespace"
  = [ \t\r\n]*
