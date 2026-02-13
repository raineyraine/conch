import ast from "../ast";

interface Node {
	readonly span: vector;
}

export type Scope =
	| {
			up?: Scope;
			root: true;
			vars: Map<string, unknown>;
	  }
	| {
			up: Scope;
			root: false;
			vars: Map<string, unknown>;
	  };

export type Trace =
	| {
			readonly fn: (...args: Array<unknown>) => void;
			readonly fn_name?: string;
			readonly origin: "luau";
	  }
	| {
			readonly fn: (...args: Array<unknown>) => void;
			readonly fn_name?: string;
			readonly origin: "conch";
			readonly line: number;
	  };

export interface ExecutionState {
	globals: Map<string, unknown>;
	trace: Array<Trace>;
	scope: Scope;
	last_statement?: { scope: Scope; node: ast.LastStatement };
}

type Expression = ast.Expression | ast.ExpressionCommand;

export type ExecutionResult =
	| {
			ok: true;
			values: undefined | Array<unknown>;
	  }
	| {
			ok: false;
			err: string;
	  };

export function create_state(): ExecutionState;
export function execute(
	state: ExecutionState,
	ast: ast.Ast,
): { err: string; ok: false } | { ok: true; values?: Array<unknown> };
