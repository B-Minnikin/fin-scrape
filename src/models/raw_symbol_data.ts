
export enum SymbolField {
    PeRatio,
    ForwardPeRatio,
    Symbol,
    Exchange,
    CompanyName,
    CurrentPrice,
    Change,
    ChangePercent,
    MarketCap,
    EnterpriseValue,
    EnterpriseValueToRevenue,
    Eps,
    Dividend,
    Revenue,
    GrossProfit,
    OperatingIncome,
    NetIncome,
    Date,
    Peg,
    Pegr,
    FreeCashFlow,
    PriceToFreeCashFlowPerShare,
    EvToEbitda,
    TotalCash,
    TotalDebt,
    DebtToEquity,
    Roic,
    ProfitMargin,
    Beta,
    RevenueGrowth,
    PriceToBook,
    InstitutionalOwnership,
}

export const requiredFields: SymbolField[] = [
    SymbolField.Symbol,
    SymbolField.CompanyName,
    SymbolField.Exchange,
    SymbolField.PeRatio,
    SymbolField.ForwardPeRatio,
    SymbolField.Beta,
    SymbolField.MarketCap,
    SymbolField.EnterpriseValue,
    SymbolField.EvToEbitda,
    SymbolField.ProfitMargin,
    SymbolField.RevenueGrowth,
    SymbolField.PriceToFreeCashFlowPerShare,
    SymbolField.Roic,
    SymbolField.DebtToEquity,
    SymbolField.Dividend,
];

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

    public static fromPlainObject(plainObject: object | undefined): RawSymbolData | null {
        if (!plainObject) return null;

        const instance = new RawSymbolData();
        Object.assign(instance, plainObject);
        return instance;
    }

    public addSymbol(name: SymbolField, value: string | undefined): void {
        if (!value) {
            console.warn(`No value when attempting to add data for: ${name}`);
            return;
        }

        let existingRow = this.findSymbol(name);
        if (!existingRow) {
            this.scrapedData.push({
                name,
                scrapedValue: value
            });

            return;
        }

        existingRow.scrapedValue = value;
    }

    public findSymbol(field: SymbolField): DataRow | null {
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
