import { SymbolField } from '../models/raw_symbol_data';

enum Colour {
    Green,
    Yellow,
    Red,
}

const colours: Record<Colour, string> = {
    [Colour.Green]: '#31a438',
    [Colour.Yellow]: '#e7c133',
    [Colour.Red]: '#ef1c1c',
};

export default class ColourHelper {
    public static getColour(symbolType: SymbolField, value: number | null, comparisonValue?: number | null): string | null {
        if (!value) {
            console.warn(`Invalid value for symbol: ${symbolType}`);
            return null;
        }

        switch (symbolType) {
            case SymbolField.PeRatio:
                if (value > 5 && value <= 15) {
                    return colours[Colour.Green];
                }

                if (value > 15 && value <= 18) return colours[Colour.Yellow];
                if (value > 18) return colours[Colour.Red];
                break;
            case SymbolField.EnterpriseValue:
                if (!comparisonValue) return null;

                // Enterprise value is lower than the market cap
                if (value < comparisonValue) return colours[Colour.Green];
                if (value >= comparisonValue) return colours[Colour.Yellow];
                break;
            case SymbolField.MarketCap:
                if (value < 100000000) return colours[Colour.Yellow];
                break;
        }

        return null;
    }
}
