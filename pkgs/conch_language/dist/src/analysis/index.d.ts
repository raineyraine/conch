import { Issue } from "../ast";
import type { ExecutionState } from "../treewalker";

export interface Metadata {
	readonly name: string;
	readonly description: string;
	readonly type: string;
}
export interface LanguageVm {
	global_metadata: Map<string, Type>;
	vars_metadata: Map<string, Type>;

	state: ExecutionState;
}
export interface TypeAnalysisInfo {
	// Pretty sure this is a method?
	// remove: (self: TypeAnalysisInfo) => void;
	remove(): void;
}

/**
 * A value that can be evaluated by a basic treewalker.
 */
export type SimpleValue = number | string | boolean;

export interface Suggestion {
	readonly kind?: "expression" | "assign";
	readonly replace?: vector;
	readonly text: string;
	readonly display: string;
	readonly metadata?: Metadata;
}

/**
 * A literal type matches only the exact value.
 */
export interface LiteralType {
	readonly kind: "literal";
	readonly value: string | boolean | number | undefined;
}

/**
 * External; this is a strange type that does not match any existing type.
 */
export interface StrangeType {
	readonly kind: "strange";

	readonly type: string;
	readonly id: string;
	readonly convert?: (value: unknown) => unknown;

	readonly suggestions:
		| Type
		| ((arg0: string) => Array<Suggestion>)
		| undefined;
	readonly match: Type | ((arg0: unknown) => boolean) | undefined;
	readonly exact_match: Type | ((arg0: unknown) => boolean) | undefined;
}

/**
 * An union of types.
 */
export interface UnionType {
	readonly kind: "union";
	readonly fields: Array<Type>;
}

/**
 * An intersection of types
 */
export interface IntersectionType {
	readonly kind: "intersection";
	readonly fields: Array<Type>;
}

export interface TableType {
	readonly kind: "table";

	readonly fields_metadata?: Map<
		LiteralType,
		{ readonly description?: string }
	>;

	readonly fields?: Map<LiteralType, Type>;

	readonly indexer?: Type;
	readonly value?: Type;
}

export interface FunctionType {
	readonly kind: "function";

	readonly argument_names: Array<string>;
}

export interface CommandArgument {
	readonly kind: "argument";

	readonly name: string;
	readonly description: string;

	readonly type?: Type;
	readonly varargs: boolean;
}

export interface CommandType {
	readonly kind: "command";

	readonly name: string;
	readonly description?: string;

	readonly arguments: Array<CommandArgument>;
}

export type Type =
	| LiteralType
	| TableType
	| StrangeType
	| FunctionType
	| CommandType
	| IntersectionType
	| UnionType;

export interface Result {
	replace: vector;
	suggestions: Array<Suggestion>;
	issues: Array<Issue>;
	additional_info?: {
		name: string;
		description?: string;
		type: string;
	};
}

export type InputState = {
	vars: Map<string, unknown>;
	globals: Map<string, unknown>;

	cursor: number;
	input: string;
	vm: LanguageVm;

	result?: {
		replace: vector;
		suggestions: Array<Suggestion>;
		additional_info?: {
			name: string;
			description?: string;
			type: string;
		};
	};
	issues: Array<Issue>;
};

export function analyze(
	language_vm: LanguageVm,
	input: string,
	cursor: number,
): Result;
export function match_eval_value(
	value: unknown,
	type: Type,
	exact?: boolean,
): Type | undefined;
