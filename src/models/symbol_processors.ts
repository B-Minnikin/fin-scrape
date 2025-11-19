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
        return basicStringField(SymbolField.Symbol, rawSymbolData);
    },
    [SymbolField.CompanyName]: (rawSymbolData: RawSymbolData): DataRow | null => {
        return basicStringField(SymbolField.CompanyName, rawSymbolData);
    },
    [SymbolField.Exchange]: (rawSymbolData: RawSymbolData): DataRow | null => {
        return basicStringField(SymbolField.Exchange, rawSymbolData);
    },
    [SymbolField.PeRatio]: (rawSymbolData: RawSymbolData): DataRow | null => {
        return basicNumberField(SymbolField.PeRatio, rawSymbolData);
    },
    [SymbolField.ForwardPeRatio]: (rawSymbolData: RawSymbolData): DataRow | null => {
        const thisField: SymbolField = SymbolField.ForwardPeRatio;

        const trailingPeRatioDataRow = rawSymbolData.findSymbol(SymbolField.MarketCap);
        if (!trailingPeRatioDataRow) {
            console.warn('Trailing P/E ratio is missing when attempting to calculate forward P/E ratio');
        }

        const dataRow = rawSymbolData.findSymbol(thisField);
        if (!dataRow) return null;

        const trailingPeRatioNumberValue: number | null = ConversionHelper.toFloat(trailingPeRatioDataRow?.scrapedValue ?? null);
        const numberValue: number | null = ConversionHelper.toFloat(dataRow.scrapedValue);

        return {
            name: thisField,
            scrapedValue: dataRow.scrapedValue,
            displayValue: dataRow.scrapedValue,
            underlyingValue: numberValue,
            colour: ColourHelper.getColour(thisField, numberValue, trailingPeRatioNumberValue),
        };
    },
    [SymbolField.ProfitMargin]: (rawSymbolData: RawSymbolData): DataRow | null => {
        return basicNumberPercentageField(SymbolField.ProfitMargin, rawSymbolData);
    },
    [SymbolField.DebtToEquity]: (rawSymbolData: RawSymbolData): DataRow | null => {
        return basicNumberPercentageField(SymbolField.DebtToEquity, rawSymbolData);
    },
    [SymbolField.Dividend]: (rawSymbolData: RawSymbolData): DataRow | null => {
        return basicNumberField(SymbolField.Dividend, rawSymbolData);
    },
    [SymbolField.Beta]: (rawSymbolData: RawSymbolData): DataRow | null => {
        return basicNumberField(SymbolField.Beta, rawSymbolData);
    },
    [SymbolField.Peg]: (rawSymbolData: RawSymbolData): DataRow | null => {
        return basicNumberField(SymbolField.Peg, rawSymbolData);
    },
    [SymbolField.PriceToFreeCashFlowPerShare]: (rawSymbolData: RawSymbolData): DataRow | null => {
        return basicNumberField(SymbolField.PriceToFreeCashFlowPerShare, rawSymbolData);
    },
    [SymbolField.Roic]: (rawSymbolData: RawSymbolData): DataRow | null => {
        return basicNumberPercentageField(SymbolField.Roic, rawSymbolData);
    },
    [SymbolField.EvToEbitda]: (rawSymbolData: RawSymbolData): DataRow | null => {
        return basicNumberField(SymbolField.EvToEbitda, rawSymbolData);
    },
    [SymbolField.MarketCap]: (rawSymbolData: RawSymbolData): DataRow | null => {
        const thisField: SymbolField = SymbolField.MarketCap;

        const dataRow = rawSymbolData.findSymbol(thisField);
        if (!dataRow) return null;

        const numberValue: number | null = ConversionHelper.toFloatFromShorthand(dataRow.scrapedValue);

        return {
            name: thisField,
            scrapedValue: dataRow.scrapedValue,
            displayValue: dataRow.scrapedValue,
            underlyingValue: numberValue,
            colour: ColourHelper.getColour(thisField, numberValue),
        };
    },
    [SymbolField.EnterpriseValue]: (rawSymbolData: RawSymbolData): DataRow | null => {
        const thisField: SymbolField = SymbolField.EnterpriseValue;

        // TODO - market cap must be completed first
        const marketCapDataRow = rawSymbolData.findSymbol(SymbolField.MarketCap);
        if (!marketCapDataRow) {
            console.warn('Market cap is missing when attempting to calculate enterprise value');
        }

        const dataRow = rawSymbolData.findSymbol(thisField);
        if (!dataRow) return null;

        const marketCapNumberValue: number | null = ConversionHelper.toFloatFromShorthand(marketCapDataRow?.scrapedValue ?? null);
        const numberValue: number | null = ConversionHelper.toFloatFromShorthand(dataRow.scrapedValue);

        return {
            name: thisField,
            scrapedValue: dataRow.scrapedValue,
            displayValue: dataRow.scrapedValue,
            underlyingValue: numberValue,
            colour: ColourHelper.getColour(thisField, numberValue, marketCapNumberValue),
        };
    },
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

function basicNumberField(thisField: SymbolField, rawSymbolData: RawSymbolData): DataRow | null {
    const rawValue = rawSymbolData.findSymbol(thisField);
    if (!rawValue) return null;

    const value: number | null = ConversionHelper.toFloat(rawValue.scrapedValue);

    return {
        name: thisField,
        scrapedValue: rawValue.scrapedValue,
        displayValue: value?.toString() || '',
        underlyingValue: value,
        colour: ColourHelper.getColour(thisField, value),
    };
}

function basicNumberPercentageField(thisField: SymbolField, rawSymbolData: RawSymbolData): DataRow | null {
    const dataRow = rawSymbolData.findSymbol(thisField);
    if (!dataRow) return null;

    const numberValue: number | null = ConversionHelper.toFloatFromPercentage(dataRow.scrapedValue);

    return {
        name: thisField,
        scrapedValue: dataRow.scrapedValue,
        displayValue: dataRow.scrapedValue,
        underlyingValue: numberValue,
        colour: ColourHelper.getColour(thisField, numberValue),
    };
}
