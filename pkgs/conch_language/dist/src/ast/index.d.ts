export type Issue = {
	why: string;
	span: vector;
};

export interface Output {
	issues: Array<Issue>;
	result?: Ast;
}

export type Span = vector;

export type Token<T = TokenKind> = {
	readonly kind: T;
	readonly text: string;
	readonly span: Span;
};

export type TokenKindText = "identifier" | "string" | "number" | "error";

export type BinaryOperator =
	// operators
	| "=="
	| "!="
	| "~="
	| ">"
	| "<"
	| ">="
	| "<="
	// arithmetic
	| "*"
	| "/"
	| "-"
	| "+"
	| "//"
	| "^"
	| "%"
	| ".."
	// ternary
	| "and"
	| "or";

export type UnaryOperator = "-" | "!";

export type TokenKindRest =
	| BinaryOperator
	| UnaryOperator
	// symbols
	| "&"
	| "="
	| "("
	| ")"
	| "$"
	| ","
	| "{"
	| "}"
	| "["
	| "]"
	| "|"
	| "."
	// keywords
	| "true"
	| "false"
	| "nil"
	| "if"
	| "else"
	| "elseif"
	| "while"
	| "for"
	| "return"
	| "break"
	| "continue"
	// line endings
	| "\n"
	| ";"
	// whitespace
	| "eof"
	| "whitespace"
	| "comment";

export type TokenKind = TokenKindRest | TokenKindText;

export type Separated<T> = Array<{
	value: T;
	separator?: Token<",">;
	span: Span;
}>;

export interface Delimited<LEFT, VALUE, RIGHT> {
	readonly left: Token<LEFT>;
	readonly value: VALUE;
	readonly right?: Token<RIGHT>;
}

export interface ExpressionNil {
	readonly kind: "nil";
	readonly token: Token<"nil">;
	readonly span: Span;
}

export interface ExpressionBoolean {
	readonly kind: "boolean";
	readonly token: Token<"true"> | Token<"false">;
	readonly span: Span;
}

export interface ExpressionNumber {
	readonly kind: "number";
	readonly token: Token<"number">;
	readonly span: Span;
}

export interface ExpressionBinary {
	readonly kind: "binary";
	readonly left: Expression;
	readonly operator: Token<BinaryOperator>;
	readonly right: Expression | undefined;
	readonly span: Span;
}

export interface ExpressionString {
	readonly kind: "string";
	readonly token: Token<"string"> | Token<"identifier">;
	readonly span: Span;
}

export interface ExpressionLambda {
	readonly kind: "lambda";
	readonly span: Span;
	readonly body: FunctionBody;
}

export interface FunctionBody {
	readonly arguments: Delimited<
		"|",
		Separated<Token<"identifier"> | false>,
		"|"
	>;
	readonly block?: Delimited<"{", Block, "}">;
	readonly span: Span;
}

export interface ExpressionVector {
	readonly kind: "vector";
	readonly contents: Delimited<
		"[",
		Separated<(Expression | undefined) | ExpressionCommand>,
		"]"
	>;
	readonly span: Span;
}

export type ExpressionUnary = {
	readonly kind: "unary";
	readonly operator: Token<UnaryOperator>;
	readonly value: Expression | undefined;
	readonly span: Span;
};

export type ExpressionEvaluate = {
	readonly kind: "evaluate";
	readonly command: Delimited<
		"(",
		(Expression | undefined) | ExpressionCommand,
		")"
	>;
	readonly span: Span;
};

export type Command = {
	readonly kind: "command";
	readonly span: Span;
	readonly var: Var;
	readonly arguments: Array<SimpleExpression>;
};

export type ExpressionCommand = {
	readonly kind: "command";
	readonly prefix: Token<"&">;
	readonly command: Command | undefined;
	readonly span: Span;
};

export type SimpleExpression =
	| ExpressionNil
	| ExpressionBoolean
	| ExpressionNumber
	| ExpressionString
	| ExpressionTable
	| ExpressionLambda
	| ExpressionEvaluate
	| Var
	| ExpressionUnary
	| ExpressionVector
	| Token<"error">;

export type Expression = SimpleExpression | ExpressionBinary;

export type VarRootGlobal = {
	readonly kind: "global";
	readonly token: Token<"identifier">;
	readonly span: Span;
};

export type VarRootVariable = {
	readonly kind: "name";
	readonly span: Span;
	readonly var: Token<"$">;
	readonly name?: Token<"identifier">;
};

export type VarRootParen = {
	readonly kind: "paren";
	readonly span: Span;
	readonly var: Token<"$">;
	readonly node: Delimited<
		"(",
		Expression | (ExpressionCommand | undefined),
		")"
	>;
};

export type VarRoot = VarRootGlobal | VarRootVariable | VarRootParen;

export type VarSuffixNameIndex = {
	readonly kind: "name_index";
	readonly span: Span;
	readonly period: Token<".">;
	readonly name?: Token<"identifier">;
};

export type VarSuffixExpressionIndex = {
	readonly kind: "expression_index";
	readonly span: Span;
	readonly period: Token<".">;
	readonly node: Delimited<
		"[",
		(Expression | undefined) | ExpressionCommand,
		"]"
	>;
};

export type VarSuffix = VarSuffixNameIndex | VarSuffixExpressionIndex;

export type Var = {
	readonly kind: "var";
	readonly root: VarRoot;
	readonly suffixes: Array<VarSuffix>;
	readonly span: Span;
};

export type TableFieldNameKey = {
	readonly kind: "name_key";
	readonly name: Token<"identifier">;
	readonly equals: Token<"=">;
	readonly value: Expression | (ExpressionCommand | undefined);
	readonly span: Span;
};

export type TableFieldExpressionKey = {
	readonly kind: "expression_key";

	readonly key?: Delimited<
		"[",
		Expression | (ExpressionCommand | undefined),
		"]"
	>;
	readonly equals?: Token<"=">;
	readonly value: Expression | (ExpressionCommand | undefined);

	readonly span: Span;
};
export type TableFieldNoKey = {
	readonly kind: "nokey";
	readonly value: Expression | (ExpressionCommand | undefined);

	readonly span: Span;
};

export type TableField =
	| TableFieldNoKey
	| TableFieldExpressionKey
	| TableFieldNameKey;

export type ExpressionTable = {
	readonly kind: "table";
	readonly values: Delimited<"{", Separated<TableField>, "}">;
	readonly span: Span;
};

export type Continue = {
	readonly kind: "continue";
	readonly token: Token<"continue">;
	readonly span: Span;
};

export type Break = {
	readonly kind: "break";
	readonly token: Token<"break">;
	readonly span: Span;
};
export type Return = {
	readonly kind: "return";
	readonly token: Token<"return">;
	readonly values: Separated<(Expression | undefined) | ExpressionCommand>;
	readonly span: Span;
};

export type LastStatement = Continue | Break | Return;

export type IfBranch = {
	readonly condition?: Delimited<
		"(",
		(Expression | ExpressionCommand) | undefined,
		")"
	>;
	readonly block?: Delimited<"{", Block, "}">;
	readonly span: Span;
};

export type ElseIfBranch = {
	readonly ifelse: Token<"elseif">;
	readonly branch: IfBranch;
	readonly span: Span;
};

export type ElseBranch = {
	readonly token: Token<"else">;
	readonly block?: Delimited<"{", Block, "}">;
	readonly span: Span;
};

export type Assign = {
	readonly kind: "assign";
	readonly identifier: Token<"identifier">;
	readonly equals: Token<"=">;
	readonly value: Expression | (ExpressionCommand | undefined);
	readonly span: Span;
};

export type If = {
	readonly kind: "if";
	readonly token: Token<"if">;

	readonly first_branch: IfBranch;
	readonly branches: Array<ElseIfBranch>;

	readonly else_branch: ElseBranch | undefined;

	readonly span: Span;
};

export type While = {
	readonly kind: "while";
	readonly token: Token<"while">;
	readonly condition?: Delimited<
		"(",
		(Expression | ExpressionCommand) | undefined,
		")"
	>;
	readonly block?: Delimited<"{", Block, "}">;
	readonly span: Span;
};

export type For = {
	readonly kind: "for";
	readonly token: Token<"for">;
	readonly expression?: Delimited<
		"(",
		(Expression | ExpressionCommand) | undefined,
		")"
	>;
	readonly body: Expression | (ExpressionCommand | undefined);
	readonly span: Span;
};

export type Statement = If | While | For | Command | Assign;

export type Block = {
	readonly body: Array<Statement>;
	readonly last_statement: LastStatement | undefined;
	readonly span: Span;
};

export type Ast = {
	block: Block;
};

export function parse(input: buffer): Output;
