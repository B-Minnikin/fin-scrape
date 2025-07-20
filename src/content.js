// Content script for scraping Yahoo Finance data

class YahooFinanceScraper {
    constructor() {
        this.initializeMessageListener();
    }

    initializeMessageListener() {
        browser.runtime.onMessage.addEventListener(async (request, sender, sendResponse) => {
            if (request.action === 'scrape') {
                try {
                    const data = await this.scrapePageData(request.pageType)
                    browser.runtime.sendMessage({
                        action: 'scrapingComplete',
                        pageType: request.pageType,
                        data: data
                    });
                    sendResponse({ success: true });
                } catch (error) {
                        console.error('Scraping error:', error);
                        sendResponse({ success: false, error: error.message });
                }

                return true; // Keep the message channel open
            }
        });
    }

    async scrapePageData(pageType) {
        switch (pageType) {
            case 'summary':
                return this.scrapeSummaryPage();
            case 'statistics':
                return this.scrapeStatisticsPage();
            case 'financials':
                return this.scrapeFinancialsPage();
            default:
                throw new Error(`Unknown page type: ${pageType}`);
        }
    }

    scrapeSummaryPage() {
        console.log('Scraping summary page...');

        const data = {};

        // Extract symbol
        const symbolElement = document.querySelector('h1[data-symbol]');
        if (symbolElement) {
            data.symbol = symbolElement.getAttribute('data-symbol');
        } else {
            // Fallback: extract from URL
            const urlMatch = window.location.href.match(/\/quote\/([^\/\?]+)/);
            data.symbol = urlMatch ? urlMatch[1] : '';
        }

        // Extract company name
        const companyNameElement = document.querySelector('h1');
        if (companyNameElement) {
            const fullText = companyNameElement.textContent.trim();
            // Remove symbol in parentheses
            data.companyName = fullText.replace(/\s*\([^)]*\)\s*$/, '').trim();
        }

        // Extract current price
        const priceElement = document.querySelector('[data-symbol] + div span') ||
            document.querySelector('fin-streamer[data-field="regularMarketPrice"]') ||
            document.querySelector('[data-testid="qsp-price"]');
        if (priceElement) {
            data.currentPrice = priceElement.textContent.trim();
        }

        // Extract change and change percent
        const changeElements = document.querySelectorAll('fin-streamer[data-field*="change"]');
        changeElements.forEach(el => {
            const field = el.getAttribute('data-field');
            if (field === 'regularMarketChange') {
                data.change = el.textContent.trim();
            } else if (field === 'regularMarketChangePercent') {
                data.changePercent = el.textContent.trim();
            }
        });

        // Extract market cap from summary table
        const summaryTable = document.querySelector('[data-testid="quote-statistics"]') ||
            document.querySelector('div[data-testid="quote-summary"]');

        if (summaryTable) {
            const rows = summaryTable.querySelectorAll('tr');
            rows.forEach(row => {
                const labelCell = row.querySelector('td:first-child');
                const valueCell = row.querySelector('td:last-child');

                if (labelCell && valueCell) {
                    const label = labelCell.textContent.trim().toLowerCase();
                    if (label.includes('market cap')) {
                        data.marketCap = valueCell.textContent.trim();
                    }
                }
            });
        }

        console.log('Summary data scraped:', data);
        return data;
    }

    scrapeStatisticsPage() {
        console.log('Scraping statistics page...');

        const data = {};

        // Find statistics tables
        const tables = document.querySelectorAll('table');

        tables.forEach(table => {
            const rows = table.querySelectorAll('tr');

            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 2) {
                    const label = cells[0].textContent.trim().toLowerCase();
                    const value = cells[1].textContent.trim();

                    // Map common statistics
                    if (label.includes('trailing p/e') || label.includes('pe ratio')) {
                        data.peRatio = value;
                    } else if (label.includes('diluted eps')) {
                        data.eps = value;
                    } else if (label.includes('forward annual dividend yield')) {
                        data.dividend = value;
                    } else if (label.includes('peg ratio')) {
                        data.pegRatio = value;
                    } else if (label.includes('price/book')) {
                        data.priceToBook = value;
                    } else if (label.includes('enterprise value/revenue')) {
                        data.evRevenue = value;
                    } else if (label.includes('beta')) {
                        data.beta = value;
                    }
                }
            });
        });

        console.log('Statistics data scraped:', data);
        return data;
    }

    scrapeFinancialsPage() {
        console.log('Scraping financials page...');

        const data = {};

        // Look for financial data tables
        const tables = document.querySelectorAll('table');

        tables.forEach(table => {
            const rows = table.querySelectorAll('tr');

            rows.forEach(row => {
                const cells = row.querySelectorAll('td, th');
                if (cells.length >= 2) {
                    const label = cells[0].textContent.trim().toLowerCase();

                    // Get the most recent period (usually second column)
                    const value = cells[1] ? cells[1].textContent.trim() : '';

                    // Map common financial metrics
                    if (label.includes('total revenue') || label.includes('revenue')) {
                        data.revenue = value;
                    } else if (label.includes('net income') && !label.includes('common')) {
                        data.netIncome = value;
                    } else if (label.includes('gross profit')) {
                        data.grossProfit = value;
                    } else if (label.includes('operating income')) {
                        data.operatingIncome = value;
                    } else if (label.includes('total cash')) {
                        data.totalCash = value;
                    } else if (label.includes('total debt')) {
                        data.totalDebt = value;
                    }
                }
            });
        });

        // Also check for any fin-streamer elements with financial data
        const finStreamers = document.querySelectorAll('fin-streamer');
        finStreamers.forEach(streamer => {
            const field = streamer.getAttribute('data-field');
            if (field && field.includes('revenue')) {
                data.revenue = data.revenue || streamer.textContent.trim();
            }
        });

        console.log('Financials data scraped:', data);
        return data;
    }

    // Utility method to safely extract text content
    safeTextContent(element) {
        return element ? element.textContent.trim() : '';
    }

    // Utility method to find element by text content
    findElementByText(selector, text) {
        const elements = document.querySelectorAll(selector);
        for (let element of elements) {
            if (element.textContent.toLowerCase().includes(text.toLowerCase())) {
                return element;
            }
        }
        return null;
    }
}

// Initialize the scraper
const scraper = new YahooFinanceScraper();
scraper.initializeMessageListener();

// Signal that the content script is loaded
console.log('Yahoo Finance scraper content script loaded');
