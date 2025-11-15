import { RawSymbolData, SymbolField } from '../models/raw_symbol_data';

export default class ConversionHelper {
    public static getFloat(rawSymbolData: RawSymbolData, fieldName: SymbolField): number | null {
        const item = rawSymbolData.scrapedData.find(d => d.name === fieldName);
        if (!item?.scrapedValue) return null;

        return parseFloat(item.scrapedValue) || null;
    }

    public static toFloat(value: string | null): number | null {
        if (!value) return null;

        const result: number = parseFloat(value);
        if (isNaN(result)) return null;

        return result;
    }

    public static getInt(rawSymbolData: RawSymbolData, fieldName: SymbolField): number | null {
        const item = rawSymbolData.scrapedData.find(d => d.name === fieldName);
        if (!item?.scrapedValue) return null;

        return parseInt(item.scrapedValue) || null;
    }

    public static getString(rawSymbolData: RawSymbolData, fieldName: SymbolField): string | null {
        const item = rawSymbolData.scrapedData.find(d => d.name === fieldName);
        if (!item) return null;

        return item.scrapedValue;
    }
}
