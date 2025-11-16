import UrlHelper from '../helpers/url_helper';
import { PageType } from '../models/page_types';
import { ContentAction, ScrapeRequest, ScrapeResponse } from '../models/actions';
import { RawSymbolData, SymbolField } from '../models/raw_symbol_data';
import MessageSender = browser.runtime.MessageSender;

// Actual page
// take scrape request
// resolve to the specific page type
// do the calculations
// return the results

console.log("Content ??");

class YahooFinanceScraper {
    private _rawSymbolData: RawSymbolData;

    constructor() {
        this._rawSymbolData = new RawSymbolData();

        this.initializeMessageListener();
    }

    initializeMessageListener(): void {
        console.log("Content init");

        browser.runtime.onMessage.addListener(async (request: ScrapeRequest, sender: MessageSender) => {
            const url = request.url;
            console.log(url); // TODO - delete

            // TODO - is this in the right place?
            if (request.action === ContentAction.ResetScrape) {
                this._rawSymbolData = new RawSymbolData();
            }

            if (request.action === ContentAction.CopyToClipboard) {
                // TODO - implement
            }

            if (request.action === ContentAction.ScrapingComplete) {
                // TODO - implement
            }

            if (request.action === ContentAction.ScrapeContentPage) {
                if (!url) {
                    console.error("Undefined url");
                    return { success: false, error: 'URL is not valid' };
                }

                const pageType: PageType = UrlHelper.identifyPageType(url);

                try {
                    if (pageType === PageType.Unknown) {
                        console.warn(`Page is not valid: ${url}`);
                        return {
                            success: false,
                            error: 'Page is not valid'
                        } as ScrapeResponse;
                    }

                    const data: RawSymbolData = await this.scrapePageData(pageType);
                    console.log(data);

                    return {
                        success: true,
                        rawSymbolData: data
                    } as ScrapeResponse;
                } catch (error) {
                        console.error('Scraping error:', error);

                        if (error instanceof Error) {
                            return { success: false, error: error.message };
                        }
                }
            }
        });
    }

    private async scrapePageData(pageType: PageType): Promise<RawSymbolData> {
        switch (pageType) {
            case PageType.Summary:
                this.scrapeSummaryPage(this._rawSymbolData);
                break;
            case PageType.Comparison:
                this.scrapeComparisonPage(this._rawSymbolData);
                break;
            case PageType.Statistics:
                // this.scrapeStatisticsPage(this._rawSymbolData);
                break;
            case PageType.Financials:
                // this.scrapeFinancialsPage(this._rawSymbolData);
                break;
            default:
                throw new Error(`Unknown page type: ${pageType}`);
        }

        return this._rawSymbolData;
    }

    private scrapeSummaryPage(symbolData: RawSymbolData): void {
        console.log('Scraping summary page...');

        // beta
        // P/E - trailing
        // P/E - forward
        // EV
        // profit margin
        // debt to equity
        // PEG ratio
        // EV/EBITDA
        // dividends

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
        const companyNameElement = document.querySelector('h1');
        if (companyNameElement) {
            const fullText = companyNameElement.textContent?.trim();
            const extracted = fullText?.replace(/\s*\([^)]*\)\s*$/, '').trim();
            // Remove symbol in parentheses

            symbolData.addSymbol(SymbolField.CompanyName, extracted);
        }

        // ----- Current Price
        const priceElement = document.querySelector('[data-symbol] + div span') ||
            document.querySelector('fin-streamer[data-field="regularMarketPrice"]') ||
            document.querySelector('[data-testid="qsp-price"]');
        if (priceElement) {
            const value = priceElement.textContent?.trim();
            symbolData.addSymbol(SymbolField.CurrentPrice, value);
        }

        // Extract change and change percent
        // const changeElements = document.querySelectorAll('fin-streamer[data-field*="change"]');
        // changeElements.forEach(el => {
        //     const field = el.getAttribute('data-field');
        //     if (field === 'regularMarketChange') {
        //         symbolData.change = parseInt(el.textContent?.trim() ?? "");
        //     } else if (field === 'regularMarketChangePercent') {
        //         symbolData.changePercent = parseInt(el.textContent?.trim() ?? "");
        //     }
        // });

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

    private scrapeComparisonPage(symbolData: RawSymbolData): void {
        console.log('Scraping comparison page...');

        // TODO - complete
        // test when multiple comparisons present

        // revenue growth YoY
        // free cash flow
        // price to free cash flow per share
        // EPS 1Yr growth
        // return on assets
        // return on capital
        // institutional ownership
    }

    // scrapeStatisticsPage() {
    //     console.log('Scraping statistics page...');
    //
    //     const data = {};
    //
    //     // Find statistics tables
    //     const tables = document.querySelectorAll('table');
    //
    //     tables.forEach(table => {
    //         const rows = table.querySelectorAll('tr');
    //
    //         rows.forEach(row => {
    //             const cells = row.querySelectorAll('td');
    //             if (cells.length >= 2) {
    //                 const label = cells[0].textContent.trim().toLowerCase();
    //                 const value = cells[1].textContent.trim();
    //
    //                 // Map common statistics
    //                 if (label.includes('trailing p/e') || label.includes('pe ratio')) {
    //                     data.peRatio = value;
    //                 } else if (label.includes('diluted eps')) {
    //                     data.eps = value;
    //                 } else if (label.includes('forward annual dividend yield')) {
    //                     data.dividend = value;
    //                 } else if (label.includes('peg ratio')) {
    //                     data.pegRatio = value;
    //                 } else if (label.includes('price/book')) {
    //                     data.priceToBook = value;
    //                 } else if (label.includes('enterprise value/revenue')) {
    //                     data.evRevenue = value;
    //                 } else if (label.includes('beta')) {
    //                     data.beta = value;
    //                 }
    //             }
    //         });
    //     });
    //
    //     console.log('Statistics data scraped:', data);
    //     return data;
    // }

    private scrapeYahooSummaryPage(): void {
        console.log('Scraping Yahoo summary page...');

        // extract the stock name from the URL

        const urlMatch = window.location.href.match(/\/quote\/([^\/\?]+)/);
        const symbol = urlMatch ? urlMatch[1] : '';

        // get name
        // .top > div.hdr > div.left > section.container > h1
    }

    // scrapeFinancialsPage() {
    //     console.log('Scraping financials page...');
    //
    //     const data = {};
    //
    //     // Look for financial data tables
    //     const tables = document.querySelectorAll('table');
    //
    //     tables.forEach(table => {
    //         const rows = table.querySelectorAll('tr');
    //
    //         rows.forEach(row => {
    //             const cells = row.querySelectorAll('td, th');
    //             if (cells.length >= 2) {
    //                 const label = cells[0].textContent.trim().toLowerCase();
    //
    //                 // Get the most recent period (usually second column)
    //                 const value = cells[1] ? cells[1].textContent.trim() : '';
    //
    //                 // Map common financial metrics
    //                 if (label.includes('total revenue') || label.includes('revenue')) {
    //                     data.revenue = value;
    //                 } else if (label.includes('net income') && !label.includes('common')) {
    //                     data.netIncome = value;
    //                 } else if (label.includes('gross profit')) {
    //                     data.grossProfit = value;
    //                 } else if (label.includes('operating income')) {
    //                     data.operatingIncome = value;
    //                 } else if (label.includes('total cash')) {
    //                     data.totalCash = value;
    //                 } else if (label.includes('total debt')) {
    //                     data.totalDebt = value;
    //                 }
    //             }
    //         });
    //     });
    //
    //     // Also check for any fin-streamer elements with financial data
    //     const finStreamers = document.querySelectorAll('fin-streamer');
    //     finStreamers.forEach(streamer => {
    //         const field = streamer.getAttribute('data-field');
    //         if (field && field.includes('revenue')) {
    //             data.revenue = data.revenue || streamer.textContent.trim();
    //         }
    //     });
    //
    //     console.log('Financials data scraped:', data);
    //     return data;
    // }

    // Utility method to safely extract text content
    private safeTextContent(element: HTMLElement): string | undefined {
        return element ? element.textContent?.trim() : '';
    }

    // Utility method to find the element by text content
    private findElementByText(selector: string, text: string): Element | null {
        const elements = document.querySelectorAll(selector);
        for (let element of elements) {
            if (element.textContent?.toLowerCase().includes(text.toLowerCase())) {
                return element;
            }
        }
        return null;
    }
}

(async (): Promise<void> => {
    const scraper = new YahooFinanceScraper();
    scraper.initializeMessageListener();

    console.log('Content script loaded');
})();
