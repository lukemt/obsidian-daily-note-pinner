import { Plugin } from 'obsidian';

const dateRegex = /\d{4}-\d{2}-\d{2}/;

export default class DailyNotePinnerPlugin extends Plugin {
	async onload() {
		this.registerEvent(
			this.app.workspace.on("file-open", this.pinDailyNote)
		);
		this.pinDailyNote();
	}

	pinDailyNote = () => {
		const today = new Date().toISOString().substring(0, 10);
		this.app.workspace.iterateRootLeaves(leaf => {
			if (dateRegex.test(leaf.view.file?.basename)) {
				const shouldBePinned = leaf.view.file?.basename === today;
				if (leaf?.pinned !== shouldBePinned) {
					leaf.setPinned(shouldBePinned);
				}
			}
		})
	}
}
