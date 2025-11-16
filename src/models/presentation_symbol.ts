import { DataRow, RawSymbolData, requiredFields, SymbolField } from './raw_symbol_data';
import { processorIterator, processors } from './symbol_processors';
import SymbolPreview from './symbol_preview';

type ProcessedSymbolMap = Map<SymbolField, DataRow>;

export class PresentationSymbol {
    private _rawSymbolData: RawSymbolData | null;
    private readonly _processedSymbolMap: ProcessedSymbolMap;

    constructor(rawSymbolData: RawSymbolData) {
        this._processedSymbolMap = new Map();
        this._rawSymbolData = rawSymbolData;
    }

    public updateSymbolData(rawSymbolData: RawSymbolData | null | undefined): void {
        if (!rawSymbolData) {
            console.error(`Missing raw symbol data when attempting to update presentation symbol`);
            return;
        }

        this._rawSymbolData = rawSymbolData;
        this.calculateRows();
    }

    public reset(): void {
        this._rawSymbolData = null;
        this._processedSymbolMap.clear();
    }

    public generatePreview(): SymbolPreview {
        const preview = new SymbolPreview();

        for (const requiredField of requiredFields) {
            const isFound = this._rawSymbolData?.findSymbol(requiredField);

            preview.previews = {
                done: isFound != null,
                tooltip: 'ba',
                abbreviation: 'aa'
            };
        }

        return preview;
    }

    private calculateRows(): void {
        if (!this._rawSymbolData) {
            console.warn(`Missing raw data`);
            return;
        }

        for (const [key, func] of processorIterator(processors)) {
            if (!func) {
                console.warn(`Missing func for processor of type: ${key}`);
                continue;
            }

            const k = key as unknown as SymbolField;

            const dataRow: DataRow | null = func(this._rawSymbolData);
            if (!dataRow?.displayValue) continue; // Don't overwrite with null results

            this._processedSymbolMap.set(k, dataRow);
        }
    }
}
