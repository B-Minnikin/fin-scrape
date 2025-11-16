import { DataRow, RawSymbolData, SymbolField } from './raw_symbol_data';
import ConversionHelper from '../helpers/conversion_helper';
import ColourHelper from '../helpers/colour_helper';

export type ProcessorFunc = (rawSymbolData: RawSymbolData) => DataRow | null;
type Processor = Partial<Record<SymbolField, ProcessorFunc>>;

export function processorIterator<K extends string, V>(obj: Record<K, V>): [K, V][] {
    return Object.entries(obj) as [K, V][];
}

export const processors: Processor = {
    [SymbolField.Symbol]: (rawSymbolData: RawSymbolData): DataRow | null => {
        const thisField: SymbolField = SymbolField.Symbol;
        return basicStringField(thisField, rawSymbolData);
    },
    [SymbolField.CompanyName]: (rawSymbolData: RawSymbolData): DataRow | null => {
        const thisField: SymbolField = SymbolField.CompanyName;
        return basicStringField(thisField, rawSymbolData);
    },
    [SymbolField.Exchange]: (rawSymbolData: RawSymbolData): DataRow | null => {
        const thisField: SymbolField = SymbolField.Exchange;
        return basicStringField(thisField, rawSymbolData);
    },
    [SymbolField.PeRatio]: (rawSymbolData: RawSymbolData): DataRow | null => {
        const thisField: SymbolField = SymbolField.PeRatio;

        const rawValue = rawSymbolData.findSymbol(thisField);
        if (!rawValue) return null;

        const value: number | null = ConversionHelper.toFloat(rawValue.scrapedValue);
        const colour: string | null = null;

        return {
            name: SymbolField.PeRatio,
            scrapedValue: rawValue.scrapedValue,
            displayValue: value?.toString() || '',
            underlyingValue: value,
            colour: ColourHelper.getColour(thisField, value),
        };
    }
}

function basicStringField(thisField: SymbolField, rawSymbolData: RawSymbolData): DataRow | null {
    const value: string | null = ConversionHelper.getString(rawSymbolData, thisField);
    if (!value) return null;

    return {
        name: thisField,
        scrapedValue: value,
        displayValue: value || '',
        underlyingValue: null,
        colour: null,
    };
}
