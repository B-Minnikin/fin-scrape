import { PageType } from './page_types';
import { RawSymbolData } from './raw_symbol_data';
import SymbolPreview from './symbol_preview';

export enum ContentAction {
    ScrapeContentPage,
    ScrapingComplete,
    GetScrapeStatus,
    ResetScrape,
    CopyToClipboard,
}

export interface ScrapeRequest {
    action: ContentAction;
    pageType: PageType;
    url: string;
}

export interface ScrapeResponse {
    success: boolean;
    rawSymbolData?: RawSymbolData;
    preview?: SymbolPreview;
}

export interface ScrapeStatus {
    isComplete: boolean;
    currentPageType: PageType;
    scrapedData: RawSymbolData;
}

export interface BackgroundRequest {
    action: ContentAction;
    pageType?: PageType;
    data?: RawSymbolData;
}
