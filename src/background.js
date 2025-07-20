// Background service worker for Yahoo Finance scraper

class ScrapingManager {
    constructor() {
        console.log('Scraping manager initialized');
        this.pageTypes = ['summary', 'statistics', 'financials'];
        this.scrapedData = {};
        this.currentPageIndex = 0;
        this.isComplete = false;
    }

    async initializeListeners() {
        // Handle tab updates to check page compatibility
        browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && tab.url) {
                this.checkPageAndUpdateIcon(tabId, tab.url);
            }
        });

        // Handle tab activation
        browser.tabs.onActivated.addListener(async (activeInfo) => {
            const tab = await browser.tabs.get(activeInfo.tabId);
            if (tab.url) {
                this.checkPageAndUpdateIcon(activeInfo.tabId, tab.url);
            }
        });

        // Handle extension icon clicks
        browser.action.onClicked.addListener(async (tab) => {
            await this.handleIconClick(tab);
        });

        // Handle messages from content scripts
        browser.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
            await this.handleMessage(request, sender, sendResponse);
            return true; // Keep the message channel open for async response
        });
    }

    checkPageAndUpdateIcon(tabId, url) {
        const pageType = this.identifyPageType(url);

        if (!pageType) {
            this.updateIcon(tabId, 'inactive');
            return;
        }

        const pageIndex = this.pageTypes.indexOf(pageType);
        const isCurrentPage = pageIndex === this.currentPageIndex;
        const isScraped = this.scrapedData[pageType] !== undefined;

        if (this.isComplete) {
            this.updateIcon(tabId, 'complete');
        } else if (isScraped) {
            this.updateIcon(tabId, 'scraped');
        } else if (isCurrentPage) {
            this.updateIcon(tabId, 'ready');
        } else {
            this.updateIcon(tabId, 'waiting');
        }
    }

    identifyPageType(url) {
        if (!url.includes('finance.yahoo.com/quote/')) return null;

        if (url.includes('/key-statistics')) return 'statistics';
        if (url.includes('/financials')) return 'financials';
        if (url.match(/\/quote\/[^\/]+\/?$/)) return 'summary';

        return null;
    }

    updateIcon(tabId, state) {
        const iconPaths = {
            'ready': 'icons/icon-ready.png',
            'scraped': 'icons/icon-scraped.png',
            'waiting': 'icons/icon-waiting.png',
            'complete': 'icons/icon-complete.png',
            'inactive': 'icons/icon-inactive.png'
        };

        const badgeTexts = {
            'ready': '●',
            'scraped': '●',
            'waiting': '',
            'complete': '✓',
            'inactive': ''
        };

        const badgeColors = {
            'ready': '#00ff00',
            'scraped': '#ff0000',
            'waiting': '#666666',
            'complete': '#0000ff',
            'inactive': '#666666'
        };

        browser.action.setIcon({
            tabId: tabId,
            path: iconPaths[state] || iconPaths['inactive']
        });

        browser.action.setBadgeText({
            tabId: tabId,
            text: badgeTexts[state] || ''
        });

        browser.action.setBadgeBackgroundColor({
            tabId: tabId,
            color: badgeColors[state] || '#666666'
        });
    }

    async handleIconClick(tab) {
        const pageType = this.identifyPageType(tab.url);

        if (!pageType) {
            console.log('Not a scrapable Yahoo Finance page');
            return;
        }

        const pageIndex = this.pageTypes.indexOf(pageType);
        const isCurrentPage = pageIndex === this.currentPageIndex;
        const isScraped = this.scrapedData[pageType] !== undefined;

        if (this.isComplete) {
            console.log('All pages already scraped');
            return;
        }

        if (isScraped) {
            console.log('This page already scraped');
            return;
        }

        if (!isCurrentPage) {
            console.log(`Please scrape ${this.pageTypes[this.currentPageIndex]} page first`);
            return;
        }

        // Send scraping request to content script
        try {
            const response = await browser.tabs.sendMessage(tab.id, {
                action: 'scrape',
                pageType: pageType
            });

            if (response && response.success) {
                console.log(`Successfully scraped ${pageType} data`);
            }
        } catch (error) {
            console.error('Error sending scrape message:', error);
        }
    }

    async handleMessage(request, sender, sendResponse) {
        switch (request.action) {
            case 'scrapingComplete':
                await this.handleScrapingComplete(request.pageType, request.data, sender.tab);
                sendResponse({ success: true });
                break;

            case 'getScrapingStatus':
                sendResponse({
                    currentPageIndex: this.currentPageIndex,
                    pageTypes: this.pageTypes,
                    scrapedData: Object.keys(this.scrapedData),
                    isComplete: this.isComplete
                });
                break;

            case 'resetScraping':
                this.resetScraping();
                sendResponse({ success: true });
                break;
        }
    }

    async handleScrapingComplete(pageType, data, tab) {
        this.scrapedData[pageType] = data;

        // Move to next page
        this.currentPageIndex++;

        // Check if all pages are scraped
        if (this.currentPageIndex >= this.pageTypes.length) {
            this.isComplete = true;
            await this.exportToClipboard();
            this.updateIcon(tab.id, 'complete');
        } else {
            this.updateIcon(tab.id, 'scraped');
        }

        console.log(`Scraped ${pageType}:`, data);
        console.log('Current status:', {
            currentPageIndex: this.currentPageIndex,
            isComplete: this.isComplete,
            scrapedPages: Object.keys(this.scrapedData)
        });
    }

    async exportToClipboard() {
        const summary = this.scrapedData.summary || {};
        const statistics = this.scrapedData.statistics || {};
        const financials = this.scrapedData.financials || {};

        // Create the CSV row with common stock data fields
        const row = [
            summary.symbol || '',
            summary.companyName || '',
            summary.currentPrice || '',
            summary.change || '',
            summary.changePercent || '',
            summary.marketCap || '',
            statistics.peRatio || '',
            statistics.eps || '',
            statistics.dividend || '',
            financials.revenue || '',
            financials.netIncome || '',
            new Date().toISOString().split('T')[0] // Date scraped
        ];

        const csvRow = row.map(field => `"${field}"`).join('\t');

        try {
            await navigator.clipboard.writeText(csvRow);
            console.log('Data exported to clipboard');
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    }

    resetScraping() {
        this.scrapedData = {};
        this.currentPageIndex = 0;
        this.isComplete = false;
        console.log('Scraping reset');
    }
}

// Initialize the scraping manager
const scrapingManager = new ScrapingManager();
await scrapingManager.initializeListeners();
