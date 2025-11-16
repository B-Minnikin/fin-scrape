
export interface PreviewRow {
    done: boolean;
    abbreviation: string | null;
    tooltip: string | null;
}

export default class SymbolPreview {
    private _previews: PreviewRow[] = [];

    public get previews(): PreviewRow[] {
        return this._previews;
    }

    public set previews(row: PreviewRow | null) {
        if (!row) {
            console.warn(`Null preview row`);
            return;
        }

        const existing: PreviewRow | undefined = this._previews.find((p: PreviewRow) => p.abbreviation === row.abbreviation);
        if (existing) {
            console.warn(`Already have preview with abbreviation: ${row.abbreviation}. Overwriting!`);

            existing.done = row.done;
            existing.tooltip = row.tooltip;
            return;
        }

        this._previews.push(row);
    }
}
