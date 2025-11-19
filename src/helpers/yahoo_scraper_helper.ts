import { PageType } from '../models/page_types';
import { RawSymbolData, SymbolField } from '../models/raw_symbol_data';

export default class YahooScraperHelper {
    public static async scrapePageData(pageType: PageType, rawSymbolData: RawSymbolData): Promise<void> {
        switch (pageType) {
            case PageType.Summary:
                this.scrapeSummaryPage(rawSymbolData);
                break;
            case PageType.Comparison:
                this.scrapeComparisonPage(rawSymbolData);
                break;
            case PageType.Statistics:
                this.scrapeStatisticsPage(rawSymbolData);
                break;
            case PageType.Financials:
                this.scrapeFinancialsPage(rawSymbolData);
                break;
            default:
                throw new Error(`Unknown page type: ${pageType}`);
        }
    }

    private static scrapeSummaryPage(symbolData: RawSymbolData): void {
        console.log('Scraping summary page...');

        // P/E - forward
        // profit margin
        // debt to equity
        // PEG ratio
        // EV/EBITDA
        // dividends

        const li = [...document.querySelectorAll('li')];

        // ----- Symbol
        const symbolElement: Element | null = document.querySelector('h1[data-symbol]');
        if (symbolElement) {
            symbolData.addSymbol(SymbolField.Symbol, symbolElement.getAttribute('data-symbol') ?? "[No Symbol]");
        } else {
            // Fallback: extract from URL
            const urlMatch = window.location.href.match(/\/quote\/([^\/\?]+)/);
            symbolData.addSymbol(SymbolField.Symbol, urlMatch ? urlMatch[1] : '');
        }

        // ----- Company Name
        const companyNameElement = document.querySelector('div.top section.container > h1');
        if (companyNameElement) {
            const fullText = companyNameElement.textContent?.trim();
            const extracted = fullText?.replace(/\s*\([^)]*\)\s*$/, '').trim();
            // Remove symbol in parentheses

            symbolData.addSymbol(SymbolField.CompanyName, extracted);
        }

        // ----- P/E Ratio
        const peRatioElement = document.querySelector('fin-streamer[data-field="trailingPE"]');
        console.log(peRatioElement);
        if (peRatioElement) {
            const fullText = peRatioElement.textContent?.trim();
            const extracted = fullText?.replace(/\s*\([^)]*\)\s*$/, '').trim();
            // Remove symbol in parentheses

            console.log(fullText);
            console.log(extracted);

            symbolData.addSymbol(SymbolField.PeRatio, extracted);
        }

        // ----- Forward P/E Ratio
        const forwardPeElement = li.find(p => p.firstElementChild?.textContent?.trim() === 'Forward P/E')
        if (forwardPeElement) {
            const fullText = forwardPeElement?.children[1]?.textContent?.trim();
            symbolData.addSymbol(SymbolField.ForwardPeRatio, fullText);
        }

        // ----- Beta
        const betaElement = document.querySelector('span[title="Beta (5Y monthly)"] + span');
        console.log(betaElement);
        if (betaElement) {
            const fullText = betaElement.textContent?.trim();
            const extracted = fullText?.replace(/\s*\([^)]*\)\s*$/, '').trim();
            // Remove symbol in parentheses

            console.log(fullText);
            console.log(extracted);

            symbolData.addSymbol(SymbolField.Beta, extracted);
        }

        // ----- Profit Margin
        const profitMarginElement = li.find(p => p.firstElementChild?.textContent?.trim() === 'Profit margin');
        if (profitMarginElement) {
            const fullText = profitMarginElement?.children[1]?.textContent?.trim();
            symbolData.addSymbol(SymbolField.ProfitMargin, fullText);
        }

        // ----- Debt to Equity
        const debtToEquityElement = li.find(p => p.firstElementChild?.textContent?.trim().startsWith('Total debt/equity'));
        if (debtToEquityElement) {
            const fullText = debtToEquityElement?.children[1]?.textContent?.trim();
            symbolData.addSymbol(SymbolField.DebtToEquity, fullText);
        }

        // ----- EV/EBITDA
        const evToEbitdaElement = li.find(p => p.firstElementChild?.textContent?.trim() === 'Enterprise value/EBITDA');
        if (debtToEquityElement) {
            const fullText = debtToEquityElement?.children[1]?.textContent?.trim();
            symbolData.addSymbol(SymbolField.EvToEbitda, fullText);
        }

        // ----- Dividend
        const dividendElement = document.querySelector('span[title="Forward dividend & yield"] + span');
        if (dividendElement) {
            const extracted = dividendElement
                .textContent?.trim()?.match(/\(([\d.]+)%\)/);
            console.log(extracted);

            if (extracted && extracted.length > 1) {
                symbolData.addSymbol(SymbolField.Dividend, extracted[1]);
            }
        }

        // ----- PEG Ratio
        const pegRatioElement = li.find(p => p.firstElementChild?.textContent?.trim() === 'PEG ratio (5-yr expected)')
        if (pegRatioElement) {
            const fullText = pegRatioElement?.children[1]?.textContent?.trim();
            symbolData.addSymbol(SymbolField.Peg, fullText);
        }

        // ----- Market Cap
        const marketCapElement = li.find(p => p.firstElementChild?.textContent?.trim() === 'Market cap')
        if (marketCapElement) {
            const fullText = marketCapElement?.children[1]?.textContent?.trim();
            symbolData.addSymbol(SymbolField.MarketCap, fullText);
        }

        // ----- Enterprise Value
        const enterpriseValueElement = li.find(p => p.firstElementChild?.textContent?.trim() === 'Enterprise value')
        if (enterpriseValueElement) {
            const fullText = enterpriseValueElement?.children[1]?.textContent?.trim();
            symbolData.addSymbol(SymbolField.EnterpriseValue, fullText);
        }

        // ----- Current Price
        const priceElement = document.querySelector('[data-symbol] + div span') ||
            document.querySelector('fin-streamer[data-field="regularMarketPrice"]') ||
            document.querySelector('[data-testid="qsp-price"]');
        if (priceElement) {
            const value = priceElement.textContent?.trim();
            symbolData.addSymbol(SymbolField.CurrentPrice, value);
        }

        // Extract market cap from the summary table
        const summaryTable = document.querySelector('[data-testid="quote-statistics"]') ||
            document.querySelector('div[data-testid="quote-summary"]');

        if (summaryTable) {
            const rows = summaryTable.querySelectorAll('tr');
            rows.forEach(row => {
                const labelCell = row.querySelector('td:first-child');
                const valueCell = row.querySelector('td:last-child');

                if (labelCell && valueCell) {
                    const label = labelCell.textContent?.trim().toLowerCase();
                    if (label?.includes('market cap')) {
                        const value = valueCell.textContent?.trim();
                        symbolData.addSymbol(SymbolField.MarketCap, value);
                    }
                }
            });
        }

        console.log('Summary data scraped:', symbolData);
    }

    private static scrapeComparisonPage(symbolData: RawSymbolData): void {
        console.log('Scraping comparison page...');

        const tr = [...document.querySelectorAll('tr')];

        // ----- Price to Free Cash Flow per Share
        const pFcfPSElement = tr.find(p => p.firstElementChild?.textContent?.trim() === 'Price to free cash flow per share');
        if (pFcfPSElement) {
            const innerElem = pFcfPSElement?.children[1] as HTMLTableCellElement;
            const fullText = innerElem.innerText?.trim();
            symbolData.addSymbol(SymbolField.PriceToFreeCashFlowPerShare, fullText);
        }

        // ----- ROIC
        const roicElement = tr.find(p => p.firstElementChild?.textContent?.trim() === 'Return on capital');
        if (roicElement) {
            const innerElem = roicElement?.children[1] as HTMLTableCellElement;
            const fullText = innerElem.innerText?.trim();
            symbolData.addSymbol(SymbolField.Roic, fullText);
        }

        // ----- Revenue Growth YoY
        const revenueGrowthElement = tr.find(p => p.firstElementChild?.textContent?.trim() === 'Revenue growth YoY');
        if (revenueGrowthElement) {
            const innerElem = revenueGrowthElement?.children[1]?.children[1]?.firstElementChild as HTMLTableCellElement;
            const fullText = innerElem.innerText?.trim();
            symbolData.addSymbol(SymbolField.RevenueGrowth, fullText);
        }

        // free cash flow
        // EPS 1Yr growth
        // return on assets
        // institutional ownership
    }

    private static scrapeStatisticsPage(rawSymbolData: RawSymbolData): void {
        console.log('Scraping statistics page...');

        // Find statistics tables
        const tables = document.querySelectorAll('table');

        tables.forEach(table => {
            const rows = table.querySelectorAll('tr');

            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 2) {
                    const label = cells[0].textContent?.trim().toLowerCase();
                    const value = cells[1].textContent?.trim();

                    if (!label || !value) {
                        console.warn(`Missing label (${label}) or value (${value})`);
                        return;
                    }

                    if (label.includes('trailing p/e') || label.includes('pe ratio')) {
                        rawSymbolData.addSymbol(SymbolField.PeRatio, value);
                    } else if (label.includes('diluted eps')) {
                        rawSymbolData.addSymbol(SymbolField.Eps, value);
                    } else if (label.includes('forward annual dividend yield')) {
                        rawSymbolData.addSymbol(SymbolField.Dividend, value);
                    } else if (label.includes('peg ratio')) {
                        rawSymbolData.addSymbol(SymbolField.Peg, value);
                    } else if (label.includes('price/book')) {
                        rawSymbolData.addSymbol(SymbolField.PriceToBook, value);
                    } else if (label.includes('enterprise value/revenue')) {
                        rawSymbolData.addSymbol(SymbolField.EnterpriseValueToRevenue, value);
                    } else if (label.includes('beta')) {
                        rawSymbolData.addSymbol(SymbolField.Beta, value);
                    }
                }
            });
        });
    }

    private static scrapeFinancialsPage(rawSymbolData: RawSymbolData): void {
        // Look for financial data tables
        const tables = document.querySelectorAll('table');

        tables.forEach(table => {
            const rows = table.querySelectorAll('tr');

            rows.forEach(row => {
                const cells = row.querySelectorAll('td, th');
                if (cells.length >= 2) {
                    const label = cells[0].textContent?.trim().toLowerCase();

                    // Get the most recent period (usually second column)
                    const value = cells[1] ? cells[1].textContent?.trim() : '';

                    if (!label || !value) {
                        console.warn(`Missing label (${label}) or value (${value})`);
                        return;
                    }

                    // Map common financial metrics
                    if (label.includes('total revenue') || label.includes('revenue')) {
                        rawSymbolData.addSymbol(SymbolField.Revenue, value);
                    } else if (label.includes('net income') && !label.includes('common')) {
                        rawSymbolData.addSymbol(SymbolField.NetIncome, value);
                    } else if (label.includes('gross profit')) {
                        rawSymbolData.addSymbol(SymbolField.GrossProfit, value);
                    } else if (label.includes('operating income')) {
                        rawSymbolData.addSymbol(SymbolField.OperatingIncome, value);
                    } else if (label.includes('total cash')) {
                        rawSymbolData.addSymbol(SymbolField.TotalCash, value);
                    } else if (label.includes('total debt')) {
                        rawSymbolData.addSymbol(SymbolField.TotalDebt, value);
                    }
                }
            });
        });
    }
}
