import SymbolPreview from './symbol_preview';

export enum SymbolField {
    PeRatio,
    Symbol,
    Exchange,
    CompanyName,
    CurrentPrice,
    Change,
    ChangePercent,
    MarketCap,
    Eps,
    Dividend,
    Revenue,
    NetIncome,
    Date,
    Peg,
    Pegr,
    PriceToFreeCashFlowPerShare,
    EvToEbitda,
    DebtToEquity,
    Roic,
    NetMargin,
    Beta,
    RevenueGrowth,
}

export const requiredFields: SymbolField[] = [
    SymbolField.Symbol,
    SymbolField.CompanyName,
    SymbolField.Exchange,
    SymbolField.PeRatio,
    SymbolField.MarketCap,
]

export type UnderlyingValue = string | number | null;

export interface DataRow {
    name: SymbolField;
    scrapedValue: string | null;
    displayValue?: string | null;
    underlyingValue?: UnderlyingValue;
    colour?: string | null;
}

export class RawSymbolData {
    scrapedData: DataRow[];

    constructor() {
        this.scrapedData = [];
    }

    public add(name: SymbolField, value: string | undefined): void {
        if (!value) {
            console.warn(`No value when attempting to add data for: ${name}`);
            return;
        }

        this.scrapedData.push({
            name,
            scrapedValue: value
        });
    }

    public find(field: SymbolField): DataRow | null {
        const dataRow = this.scrapedData.find((dr: DataRow) => dr.name === field);
        if (!dataRow) return null;

        return dataRow;
    }

    // TODO - move this to the processed symbol
    public isComplete(): boolean {
        return Object.entries(this).every( i=> {
            return i != undefined;
        });
    }

    // TODO - move this to the processed symbol
    public getCompletionMap(): boolean[] {
        return Object.entries(this).map(i => {
            return i != undefined;
        });
    }
}
