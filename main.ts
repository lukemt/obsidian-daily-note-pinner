import {
	Plugin,
	FileView,
	TFile,
	WorkspaceLeaf,
	normalizePath,
} from "obsidian";

const DN_CONFIG_PATH = normalizePath(".obsidian/daily-notes.json");
const DEFAULT_FORMAT = "YYYY-MM-DD";

interface DailyNote {
	name: string;
	folder?: string;
	leaf?: WorkspaceLeaf;
}

interface SavedData {
	lastPinName: string;
}

export default class DailyNotePinnerPlugin extends Plugin {
	savedData: SavedData;
	dailyNote: DailyNote;

	async readDnConfig() {
		const dnConfigExists =
			await this.app.vault.adapter.exists(DN_CONFIG_PATH);

		if (dnConfigExists) {
			const dnConfig = JSON.parse(
				await this.app.vault.adapter.read(DN_CONFIG_PATH),
			);

			if (dnConfig.format) {
				this.dailyNote.name = moment().format(dnConfig.format);
			}

			if (dnConfig.folder) {
				this.dailyNote.folder = dnConfig.folder;
			}
		}
	}

	getNotePath(): string {
		let notePath = `${this.dailyNote.name}.md`;
		if (this.dailyNote.folder) {
			notePath = `${this.dailyNote.folder}/${notePath}`;
		}
		return notePath;
	}

	async pinCmd() {
		const notePath = this.getNotePath();
		let noteFile;

		if (await this.app.vault.adapter.exists(notePath, true)) {
			noteFile = this.app.vault.getAbstractFileByPath(notePath);
		} else {
			noteFile = await this.app.vault.create(notePath, "");
		}

		if (noteFile instanceof TFile) {
			const leaf = this.app.workspace.getLeaf("tab");
			await leaf.openFile(noteFile);
			leaf.setPinned(true);
		}
	}

	async setPinStatusOf(baseName: string, toPin: boolean) {
		this.app.workspace.iterateRootLeaves((leaf) => {
			if (
				leaf.view instanceof FileView &&
				leaf.view.file?.basename === baseName
			) {
				sleep(0).then(async () => {
					leaf.setPinned(toPin);
					this.savedData.lastPinName = baseName;
					await this.saveData(this.savedData);
				});
			}
		});
	}

	async closeLeavesOf(baseName: string) {
		this.app.workspace.iterateRootLeaves((leaf) => {
			if (
				leaf.view instanceof FileView &&
				leaf.view.file?.basename === baseName
			) {
				sleep(0).then(() => leaf.detach());
			}
		});
	}

	async onload() {
		this.dailyNote = {
			name: moment().format(DEFAULT_FORMAT),
		};

		this.savedData = {
			lastPinName: moment().subtract("1", "days").format(DEFAULT_FORMAT),
		};

		this.savedData = Object.assign(this.savedData, await this.loadData());
		await this.readDnConfig();

		this.app.workspace.onLayoutReady(async () => {
			await this.closeLeavesOf(this.savedData.lastPinName);
			// required for propagation
			sleep(0).then(
				async () =>
					await this.setPinStatusOf(this.dailyNote.name, true),
			);
		});

		this.addCommand({
			id: "pin-daily-note",
			name: "Pin Daily Note",
			callback: async () => {
				await this.pinCmd();
			},
		});
	}
}
