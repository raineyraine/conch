import type Vide from "@rbxts/vide";

export = ConchUi;
export as namespace ConchUi;

declare namespace ConchUi {
	/**
	 * Binds the activation of Conch to a given user input or keycode. This automatically mounts the UI if it has not yet been mounted.
	 */
	function bind_to(input: Enum.KeyCode | Enum.UserInputType): void;

	/**
	 * Mounts the UI to the PlayerGui.
	 */
	function mount(): void;

	/**
	 * A vide source that stores if the UI is enabled or not. When called with a boolean, sets it to that boolean. Otherwise, returns the currently stored boolean.
	 */
	const opened: Vide.Source<boolean>;

	/**
	 * Refers to the UI component for the Conch UI.
	 */
	function app(): ScreenGui;

	/**
	 * Reference to Conch package
	 */
	const conch: void;
}
