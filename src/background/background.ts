import { PageType } from '../models/page_types';
import { RawSymbolData } from '../models/raw_symbol_data';
import { BackgroundRequest, ContentAction, ScrapeRequest, ScrapeResponse, ScrapeStatus } from '../models/actions';
import UrlHelper from '../helpers/url_helper';
import IconHelper from '../helpers/icon_helper';
import MessageSender = browser.runtime.MessageSender;
import Tab = browser.tabs.Tab;
import { PresentationSymbol } from '../models/presentation_symbol';

class ScrapingManager {
    rawSymbolData: RawSymbolData;
    presentationSymbol: PresentationSymbol; // TODO - needed or transient?
    currentPageType: PageType = PageType.Unknown;
    isComplete: boolean = false;

    constructor() {
        console.log('Scraping manager initialized');
        this.rawSymbolData = new RawSymbolData();
        this.presentationSymbol = new PresentationSymbol(this.rawSymbolData);
    }

    public async initializeListeners(): Promise<void> {

        // TODO - delete?
        // Handle tab updates to check page compatibility
        browser.tabs.onUpdated.addListener(async (tabId: number, changeInfo, tab: Tab): Promise<void> => {
            if (changeInfo.status === 'complete' && tab.url) {
                await IconHelper.checkPageAndUpdateIcon(this.rawSymbolData.isComplete(), tabId, tab.url, this.currentPageType);
            }
        });

        // TODO - delete?
        // Handle tab activation
        browser.tabs.onActivated.addListener(async (activeInfo): Promise<void> => {
            const tab = await browser.tabs.get(activeInfo.tabId);
            if (tab.url) {
                await IconHelper.checkPageAndUpdateIcon(this.rawSymbolData.isComplete(), activeInfo.tabId, tab.url, this.currentPageType);
            }
        });

        // TODO - delete?
        // Handle extension icon clicks
        // browser.action.onClicked.addListener(async (tab: Tab): Promise<void> => {
        //     await this.handleIconClick(tab);
        // });

        // Handle messages from content scripts
        browser.runtime.onMessage.addListener(async (request, sender: MessageSender, sendResponse): Promise<boolean> => {
            console.log('background onMessage');
            console.log(request);
            await this.handleMessage(request, sender, sendResponse);
            return true; // Keep the message channel open for async response
        });
    }

    // TODO - delete
    async handleIconClick(tab: browser.tabs.Tab): Promise<void> {
        if (!tab) {
            console.error("Tab is undefined when handling icon click");
            return;
        }

        const pageType: PageType = UrlHelper.identifyPageType(tab.url);

        // @ts-ignore
        if (!pageType || pageType === PageType.Unknown) {
            console.warn('Not a scrapable Yahoo Finance page');
            return;
        }

        const isScraped: boolean = this.currentPageType !== PageType.Unknown;

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
            const response: ScrapeResponse = await browser.tabs.sendMessage(tab.id, {
                action: ContentAction.ScrapeContentPage,
                pageType
            });

            if (response && response.success) {
                console.log(`Successfully scraped ${pageType} data`);
            }
        } catch (error) {
            console.error('Error sending scrape message:', error);
        }
    }

    async handleMessage(request: BackgroundRequest, sender: MessageSender, sendResponse: any): Promise<boolean> {
        console.log(`Background message action: ${request.action}`);

        switch (request.action) {
            case ContentAction.ScrapingComplete:
                if (!sender.tab) {
                    console.error("Sender tab is undefined");
                    sendResponse({ success: false });
                    return false;
                }

                await this.handleScrapingComplete(request.pageType, request.data, sender.tab);
                sendResponse({
                    success: true
                } as ScrapeResponse);
                break;

            case ContentAction.ScrapeContentPage:
                console.log('Scraping page (background.js)...');

                const [tab] = await browser.tabs.query({active: true, lastFocusedWindow: true});

                if (!tab?.id) {
                    console.error("Invalid tab ID when scraping page");
                    return false;
                }

                try {
                    const url = tab.url;

                    const contentResponse: ScrapeResponse = await browser.tabs.sendMessage(tab.id, {
                        action: request.action,
                        url,
                    } as ScrapeRequest);

                    console.log('Background received content script response');
                    console.log(contentResponse);

                    if (contentResponse?.success) {
                        this.presentationSymbol.updateSymbolData(RawSymbolData.fromPlainObject(contentResponse.rawSymbolData));

                        sendResponse({
                            success: true,
                            preview: this.presentationSymbol.generatePreview()
                        } as ScrapeResponse);
                    } else {
                        console.error("Failed to scrape content");
                        sendResponse({ success: false } as ScrapeResponse);
                    }
                } catch (err) {
                    console.error(err);
                    sendResponse({ success: false } as ScrapeResponse);
                }
                break;

            case ContentAction.GetScrapeStatus:
                sendResponse({
                    currentPageType: this.currentPageType,
                    scrapedData: this.rawSymbolData,
                    isComplete: this.isComplete
                } as ScrapeStatus);
                break;

            case ContentAction.ResetScrape:
                this.resetScraping();
                sendResponse({
                    success: true
                } as ScrapeResponse);
                break;
        }

        return true;
    }

    async handleScrapingComplete(pageType: PageType | undefined, data: any, tab: browser.tabs.Tab): Promise<void> {
        // TODO
        // assess whether this is still needed
    }

    resetScraping(): void {
        this.rawSymbolData = new RawSymbolData();
        this.currentPageType = PageType.Unknown;
        this.isComplete = false;
    }
}

(async (): Promise<void> => {
    // Initialise the scraping manager
    const scrapingManager = new ScrapingManager();
    await scrapingManager.initializeListeners();
})();
