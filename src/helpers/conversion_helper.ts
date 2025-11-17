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

    public static toFloatFromShorthand(shortFloat: string | null): number | null {
        if (!shortFloat || shortFloat.length === 0) return null;

        const postfix = shortFloat.at(shortFloat.length - 1);
        if (!postfix) return null;
        // @ts-ignore
        if (!(postfix.toUpperCase() === 'B' ^ postfix.toUpperCase() === 'M')) return null;

        // M = 1,000,000
        // B = 1,000,000,000
        const postfixQuantity = postfix.toUpperCase() === 'M'
            ? 1000000
            : 1000000000;

        const numberSegment = shortFloat.slice(0, -1);
        const number = parseFloat(numberSegment);

        if (isNaN(number)) return null;

        return number * postfixQuantity;
    }
}
