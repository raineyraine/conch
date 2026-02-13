export interface Issue {
	readonly why: string;
	readonly span: vector;
}

export interface Output {
	issues: Array<Issue>;
	result?: Ast;
}
