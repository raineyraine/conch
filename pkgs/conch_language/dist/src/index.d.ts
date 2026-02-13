import type {
	LanguageVm,
	Metadata,
	Result,
	Type,
	TypeAnalysisInfo,
} from "./analysis";

export type * from "./analysis";
export * from "./analysis";

export type * from "./ast";

export type RunResult =
	| { ok: true; values?: Array<unknown> }
	| { ok: false; why: Array<string> };

export type LanguageInterface = {
	version: string;

	create_vm: () => LanguageVm;
	set_command: (vm: LanguageVm, key: string, value: unknown) => void;
	set_variable: (vm: LanguageVm, key: string, value: unknown) => void;

	/** Attaches info about a certain value. */
	attach_info: (vm: LanguageVm, metaddata: Metadata) => TypeAnalysisInfo;

	run: (vm: LanguageVm, input: string) => RunResult;

	analyze: (
		vm: LanguageVm,
		input: string,
		cursor: number,
	) => Result | undefined;
};

export const version: string;

export function create_vm(): LanguageVm;

export function set_command(vm: LanguageVm, key: string, value: unknown): void;
export function set_variable(vm: LanguageVm, key: string, value: unknown): void;

export function attach_info(
	vm: LanguageVm,
	is_var: boolean,
	key: string,
	value: Type,
): TypeAnalysisInfo;

export function run(vm: LanguageVm, input: string): RunResult;
