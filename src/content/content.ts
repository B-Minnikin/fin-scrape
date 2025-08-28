// Content script for scraping Yahoo Finance data

import { getPageType } from '../helpers/url_helpers.ts';
import { PageType } from "../models/PageTypes.ts";
import { initStockData, StockData } from "../models/StockData.ts";

// Actual page
// take scrape request
// resolve to the specific page type
// do the calculations
// return the results

console.log("Content ??");

class YahooFinanceScraper {
    constructor() {
        this.initializeMessageListener();
    }

    initializeMessageListener() {
        console.log("Content init");

        browser.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
            console.log(`Content action: ${request.action}`);
            console.log(request);

            // TODO - get the current tab
            // send the url to the url helper
            // use that to get the pageType instead of passing the value

            if (request.action === 'scrapeContentPage') {
                console.log("Scrape in content script");

                const url = sender.tab?.url;
                if (url === undefined) {
                    console.error("Undefined url");
                    sendResponse({ success: false, error: 'URL is not valid' });
                    return;
                }

                const pageType = getPageType(url);

                try {
                    if (!this.isPageValid()) {
                        console.warn('Page is not valid');
                        sendResponse({ success: false, error: 'Page is not valid' });
                        return;
                    }

                    const data = await this.scrapePageData(request.pageType)
                    sendResponse({
                        success: true,
                        data: data
                    });
                } catch (error) {
                        console.error('Scraping error:', error);

                        if (error instanceof Error) {
                            sendResponse({ success: false, error: error.message });
                        }
                }

                return true; // Keep the message channel open
            }
        });
    }

    isPageValid() {
        const currentUrl = window.location.href;
        const quotePattern = /^https:\/\/uk\.finance\.yahoo\.com\/quote\/[A-Z0-9.-]+\/?$/i;
        const comparePattern = /^https:\/\/uk\.finance\.yahoo\.com\/compare\/[A-Z0-9.-]+\/?$/i;

        const result = quotePattern.test(currentUrl) || comparePattern.test(currentUrl);
        if (!result) {
            console.warn('Page is not valid');
        }

        return result;
    }

    async scrapePageData(pageType: PageType): Promise<StockData> {
        const stockData: StockData = initStockData();

        switch (pageType) {
            case PageType.Summary:
                this.scrapeSummaryPage(stockData);
                break;
            case PageType.Comparison:
                this.scrapeComparisonPage(stockData);
                break;
            case PageType.Statistics:
                // this.scrapeStatisticsPage(stockData);
                break;
            case PageType.Financials:
                // this.scrapeFinancialsPage(stockData);
                break;
            default:
                throw new Error(`Unknown page type: ${pageType}`);
        }

        return stockData;
    }

    scrapeSummaryPage(stockData: StockData) {
        console.log('Scraping summary page...');

        // symbol
        // company name
        // beta
        // P/E - trailing
        // P/E - forward
        // market cap
        // EV
        // profit margin
        // debt to equity
        // PEG ratio
        // EV/EBITDA

        // Extract symbol
        const symbolElement = document.querySelector('h1[data-symbol]');
        if (symbolElement) {
            stockData.symbol = symbolElement.getAttribute('data-symbol') ?? "[No Symbol]";
        } else {
            // Fallback: extract from URL
            const urlMatch = window.location.href.match(/\/quote\/([^\/\?]+)/);
            stockData.symbol = urlMatch ? urlMatch[1] : '';
        }

        // Extract company name
        const companyNameElement = document.querySelector('h1');
        if (companyNameElement) {
            const fullText = companyNameElement.textContent?.trim();
            // Remove symbol in parentheses
            stockData.companyName = fullText?.replace(/\s*\([^)]*\)\s*$/, '').trim();
        }

        // Extract current price
        const priceElement = document.querySelector('[data-symbol] + div span') ||
            document.querySelector('fin-streamer[data-field="regularMarketPrice"]') ||
            document.querySelector('[data-testid="qsp-price"]');
        if (priceElement) {
            stockData.currentPrice = parseInt(priceElement.textContent?.trim() ?? "");
        }

        // Extract change and change percent
        const changeElements = document.querySelectorAll('fin-streamer[data-field*="change"]');
        changeElements.forEach(el => {
            const field = el.getAttribute('data-field');
            if (field === 'regularMarketChange') {
                stockData.change = parseInt(el.textContent?.trim() ?? "");
            } else if (field === 'regularMarketChangePercent') {
                stockData.changePercent = parseInt(el.textContent?.trim() ?? "");
            }
        });

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
                        stockData.marketCap = parseInt(valueCell.textContent?.trim() ?? "");
                    }
                }
            });
        }

        console.log('Summary data scraped:', stockData);
    }

    scrapeComparisonPage(stockData: StockData) {
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

    scrapeYahooSummaryPage() {
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
    safeTextContent(element: HTMLElement) {
        return element ? element.textContent?.trim() : '';
    }

    // Utility method to find the element by text content
    findElementByText(selector: string, text: string) {
        const elements = document.querySelectorAll(selector);
        for (let element of elements) {
            if (element.textContent?.toLowerCase().includes(text.toLowerCase())) {
                return element;
            }
        }
        return null;
    }
}

const scraper = new YahooFinanceScraper();
scraper.initializeMessageListener();

console.log('Content script loaded');
