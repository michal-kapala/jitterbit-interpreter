// -----------------------------------------------------------
// --------------          AST TYPES        ------------------
// ---     Defines the structure of our languages AST      ---
// -----------------------------------------------------------

export type NodeType =
  // STATEMENTS
  | "Program"
  | "VarDeclaration"
  // EXPRESSIONS
  | "AssignmentExpr"
  | "MemberExpr"
  | "CallExpr"
  // Literals
  | "Property"
  | "ObjectLiteral"
  | "NumericLiteral"
  | "Identifier"
  | "BinaryExpr";

/**
 * Statements do not result in a value at runtime.
 They contain one or more expressions internally */
export interface Stmt {
  kind: NodeType;
}

/**
 * Defines a block which contains many statements.
 * -  Only one program will be contained in a file.
 */
export interface Program extends Stmt {
  kind: "Program";
  body: Stmt[];
}

export interface VarDeclaration extends Stmt {
  kind: "VarDeclaration";
  constant: boolean;
  identifier: string;
  value?: Expr;
}

/**  Expressions will result in a value at runtime unlike Statements */
export interface Expr extends Stmt {}

export interface AssignmentExpr extends Expr {
  kind: "AssignmentExpr";
  assignee: Expr;
  value: Expr;
}

/**
 * A operation with two sides seperated by a operator.
 * Both sides can be ANY Complex Expression.
 * - Supported Operators -> + | - | / | * | %
 * - Leftover operators -> <, >, <=, >=, ==, !=, &&, ||
 */
export interface BinaryExpr extends Expr {
  kind: "BinaryExpr";
  left: Expr;
  right: Expr;
  operator: string; // needs to be of type BinaryOperator
}

export interface CallExpr extends Expr {
  kind: "CallExpr";
  args: Expr[];
  // caller is Expr only because of MemberExpr calls feature (to be changed as jb only suports API calls)
  caller: Expr;
}

export interface MemberExpr extends Expr {
  kind: "MemberExpr";
  object: Expr;
  property: Expr;
  computed: boolean;
}

// LITERAL / PRIMARY EXPRESSION TYPES
/**
 * Represents a user-defined variable or symbol in source.
 */
// to be changed to support local/global/system vars
export interface Identifier extends Expr {
  kind: "Identifier";
  symbol: string;
}

/**
 * Represents a numeric constant inside the soure code.
 */
export interface NumericLiteral extends Expr {
  // to be extended with IntLiteral and FloatLiteral
  kind: "NumericLiteral";
  value: number;
}

// to be yoinked, global/system variable identifiers to be changed
export interface Property extends Expr {
  kind: "Property";
  key: string;
  value?: Expr;
}

// to be changed to suppport arrays and dictionaries
export interface ObjectLiteral extends Expr {
  kind: "ObjectLiteral";
  // To be changed:
  // arrays: Expr[]
  // dictionaries: Map<string, Expr>
  properties: Property[];
}
