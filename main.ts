import { Plugin, FileView } from 'obsidian';

const dateRegex = /\d{4}-\d{2}-\d{2}/;

export default class DailyNotePinnerPlugin extends Plugin {
	async onload() {
		this.registerEvent(
			this.app.workspace.on("file-open", this.pinDailyNote)
		);
		this.pinDailyNote();
	}

	pinDailyNote = () => {
		const date = new Date();
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const today = `${year}-${month}-${day}`;

		this.app.workspace.iterateRootLeaves(leaf => {
			if (leaf.view instanceof FileView && dateRegex.test(leaf.view.file?.basename ?? "")) {
				const shouldBePinned = leaf.view.file?.basename === today;
				// @ts-ignore
				if (leaf.pinned !== shouldBePinned) {
					leaf.setPinned(shouldBePinned);
				}
			}
		})
	}
}
