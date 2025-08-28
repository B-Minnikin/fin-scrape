
export interface StockData {
    symbol: string,
    exchange: string | undefined,
    companyName: string | undefined,
    currentPrice: number | undefined,
    change: number | undefined,
    changePercent: number | undefined,
    marketCap: number | undefined,
    peRatio: number | undefined,
    eps: number | undefined,
    dividend: number | undefined,
    revenue: number | undefined,
    netIncome: number | undefined,
    date: string | undefined
}

export function initStockData(): StockData {
    return {
        symbol: "Unknown Symbol",
        change: undefined,
        changePercent: undefined,
        companyName: undefined,
        currentPrice: undefined,
        date: undefined,
        dividend: undefined,
        eps: undefined,
        exchange: undefined,
        marketCap: undefined,
        netIncome: undefined,
        peRatio: undefined,
        revenue: undefined,
    } as StockData;
}
