import UrlHelper from '../helpers/url_helper';
import { PageType } from '../models/page_types';
import { ContentAction, ScrapeRequest, ScrapeResponse } from '../models/actions';
import { RawSymbolData, SymbolField } from '../models/raw_symbol_data';
import MessageSender = browser.runtime.MessageSender;
import YahooScraperHelper from '../helpers/yahoo_scraper_helper';


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

                    await YahooScraperHelper.scrapePageData(pageType, this._rawSymbolData);
                    console.log(this._rawSymbolData);

                    return {
                        success: true,
                        rawSymbolData: this._rawSymbolData,
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
}

(async (): Promise<void> => {
    const scraper = new YahooFinanceScraper();
    scraper.initializeMessageListener();

    console.log('Content script loaded');
})();
