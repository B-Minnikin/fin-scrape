// Background service worker for Yahoo Finance scraper

// handle scrapingComplete
// integrate it into existing data

// handle reset data mechanism

import { PageType } from "../models/PageTypes";
import { initStockData, StockData } from "../models/StockData";
import { getIcon, Icon, IconState } from "../models/Icon";
import MessageSender = browser.runtime.MessageSender;

class ScrapingManager {
    stockData: StockData = initStockData();
    currentPageType: PageType = PageType.Unknown;
    isComplete: boolean = false;

    constructor() {
        console.log('Scraping manager initialized');
    }

    private async injectContentScriptIfMissing(tabId: number): Promise<void> {
        // Try to inject the content script if it isn't already present.
        // We attempt both common build locations to support loading from root or from dist.
        const tryFiles = ['content.js', 'dist/content.js'];
        for (const file of tryFiles) {
            try {
                await browser.tabs.executeScript(tabId, { file });
                // If injection succeeds once, stop trying.
                return;
            } catch (e) {
                // Continue to next path
                console.warn(`Failed to inject ${file}:`, e);
            }
        }
        throw new Error('Unable to inject content script: tried content.js and dist/content.js');
    }

    async initialiseListeners(): Promise<void> {
        // Handle tab updates to check page compatibility
        browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && tab.url) {
                this.checkPageAndUpdateIcon(tabId, tab.url);
            }
        });

        // Handle tab activation
        browser.tabs.onActivated.addListener(async (activeInfo): Promise<void> => {
            const tab = await browser.tabs.get(activeInfo.tabId);
            if (tab.url) {
                await this.checkPageAndUpdateIcon(activeInfo.tabId, tab.url);
            }
        });

        // Handle extension icon clicks
        browser.browserAction.onClicked.addListener(async (tab) => {
            await this.handleIconClick(tab);
        });

        // Handle messages from content scripts
        browser.runtime.onMessage.addListener(async (request, sender, sendResponse): Promise<boolean> => {
            await this.handleMessage(request, sender, sendResponse);
            return true; // Keep the message channel open for async response
        });
    }

    async checkPageAndUpdateIcon(tabId: number, url: string): Promise<void> {
        const pageType: PageType = this.identifyPageType(url);

        if (!pageType) {
            try {
                await this.updateIcon(tabId, IconState.Inactive);
            } catch (error) {
                console.error(`Failed to set icon to inactive for tabId: ${tabId}`);
            }
            return;
        }

        const isCurrentPage = pageType === this.currentPageType;
        const isScraped = this.currentPageType !== PageType.Unknown;

        if (this.isComplete) {
            try {
                await this.updateIcon(tabId, IconState.Complete);
            } catch (error) {
                console.error(`Failed to set icon to complete for tabId: ${tabId}`);
            }
        } else if (isScraped) {
            try {
                await this.updateIcon(tabId, IconState.Scraped);
            } catch (error) {
                console.error(`Failed to set icon to scraped for tabId: ${tabId}`);
            }
        } else if (isCurrentPage) {
            try {
                await this.updateIcon(tabId, IconState.Ready);
            } catch (error) {
                console.error(`Failed to set icon to ready for tabId: ${tabId}`);
            }
        } else {
            try {
                await this.updateIcon(tabId, IconState.Waiting);
            } catch (error) {
                console.error(`Failed to set icon to waiting for tabId: ${tabId}`);
            }
        }
    }

    identifyPageType(url: string | undefined): PageType {
        if (url === undefined) return PageType.Unknown;
        if (!url.includes('finance.yahoo.com/quote/')) return PageType.Unknown;

        if (url.includes('/key-statistics')) return PageType.Statistics;
        if (url.includes('/financials')) return PageType.Financials;
        if (url.match(/\/quote\/[^\/]+\/?$/)) return PageType.Summary;

        return PageType.Unknown;
    }

    async updateIcon(tabId: number, state: IconState) {
        const icon: Icon = getIcon(state);

        await browser.browserAction.setIcon({
            tabId: tabId,
            path: icon.path
        });

        await browser.browserAction.setBadgeText({
            tabId: tabId,
            text: icon.text
        });

        await browser.browserAction.setBadgeBackgroundColor({
            tabId: tabId,
            color: icon.colour || '#666666'
        });
    }

    async handleIconClick(tab: browser.tabs.Tab) {
        if (!tab) {
            console.error("Tab is undefined when handling icon click");
            return;
        }

        const pageType: PageType = this.identifyPageType(tab.url);

        // @ts-ignore
        if (!pageType || pageType === PageType.Unknown) {
            console.warn('Not a scrapable Yahoo Finance page');
            return;
        }

        const isScraped = this.currentPageType !== PageType.Unknown;

        if (this.isComplete) {
            console.log('All pages already scraped');
            return;
        }

        if (isScraped) {
            console.log('This page already scraped');
            return;
        }

        if (tab.id === undefined) {
            console.error("Invalid tab ID");
            return;
        }

        // Send scraping request to content script
        try {
            const response = await browser.tabs.sendMessage(tab.id, {
                action: 'scrape',
                pageType
            });

            if (response && response.success) {
                console.log(`Successfully scraped ${pageType} data`);
                return;
            }
        } catch (error) {
            console.warn('Content script may not be injected yet. Attempting to inject and retry...', error);
            try {
                await this.injectContentScriptIfMissing(tab.id);
                const retryResponse = await browser.tabs.sendMessage(tab.id, {
                    action: 'scrape',
                    pageType
                });
                if (retryResponse && retryResponse.success) {
                    console.log(`Successfully scraped ${pageType} data after injection`);
                    return;
                }
            } catch (injectErr) {
                console.error('Failed to inject content script and send message:', injectErr);
            }
        }
    }

    async handleMessage(request: any, sender: MessageSender, sendResponse: any): Promise<void> {
        // TODO
        // create a proper request type
        console.log(`Background message action: ${request.action}`);

        switch (request.action) {
            case 'scrapingComplete':
                if (sender.tab === undefined) {
                    console.error("Sender tab is undefined");
                    sendResponse({ success: false });
                    return;
                }

                await this.handleScrapingComplete(request.pageType, request.data, sender.tab);
                sendResponse({ success: true });
                break;

            case 'scrapePage':
                console.log('Scraping page (background.js)...');

                const [tab] = await browser.tabs.query({active: true, lastFocusedWindow: true});

                if (tab.id === undefined) {
                    console.error("Invalid tab ID when scraping page");
                    return;
                }

                try {
                    console.log(`Sending scrape request to content script for tabId: ${tab.id}`);

                    let contentResponse = await browser.tabs.sendMessage(tab.id, {
                        action: 'scrapeContentPage',
                        pageType: PageType.Summary
                    });

                    if (!contentResponse?.success) {
                        console.warn('Content script may not be injected. Injecting and retrying...');
                        await this.injectContentScriptIfMissing(tab.id);
                        contentResponse = await browser.tabs.sendMessage(tab.id, {
                            action: 'scrapeContentPage',
                            pageType: PageType.Summary
                        });
                    }

                    if (contentResponse?.success) {
                        sendResponse({ success: true });
                    } else {
                        console.error("Failed to scrape content");
                        sendResponse({ success: false });
                    }
                } catch (err) {
                    console.error(err);
                    sendResponse({ success: false });
                }
                break;

            case 'getScrapingStatus':
                sendResponse({
                    currentPageType: this.currentPageType,
                    scrapedData: Object.keys(this.stockData),
                    isComplete: this.isComplete
                });
                break;

            case 'resetScraping':
                this.resetScraping();
                sendResponse({ success: true });
                break;
        }
    }

    async handleScrapingComplete(pageType: PageType, data: any, tab: browser.tabs.Tab) {
        // TODO
        // assess whether this is still needed
    }

    async exportToClipboard() {
        // const summary = this.scrapedData.summary || {};
        // const statistics = this.scrapedData.statistics || {};
        // const financials = this.scrapedData.financials || {};

        // Create the CSV row with common stock data fields
        // const row = [
        //     summary.symbol || '',
        //     summary.companyName || '',
        //     summary.currentPrice || '',
        //     summary.change || '',
        //     summary.changePercent || '',
        //     summary.marketCap || '',
        //     statistics.peRatio || '',
        //     statistics.eps || '',
        //     statistics.dividend || '',
        //     financials.revenue || '',
        //     financials.netIncome || '',
        //     new Date().toISOString().split('T')[0] // Date scraped
        // ];
        const row = this.stockData;

        // const csvRow = row.map(field => `"${field}"`).join('\t');
        const csvRow = ""; // TODO - finish

        try {
            await navigator.clipboard.writeText(csvRow);
            console.log('Data exported to clipboard');
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    }

    resetScraping() {
        this.stockData = initStockData();
        this.currentPageType = PageType.Unknown;
        this.isComplete = false;
    }
}

(async () => {
    // Initialize the scraping manager
    const scrapingManager = new ScrapingManager();
    await scrapingManager.initialiseListeners();
})();
