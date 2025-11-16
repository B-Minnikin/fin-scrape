import { PageType } from '../models/page_types';

export default class UrlHelper {

    public static identifyPageType(url: string | undefined): PageType {
        if (!url) return PageType.Unknown;
        if (!url.includes('finance.yahoo.com/quote/')
            && !url.includes('finance.yahoo.com/compare/'))
                return PageType.Unknown;

        if (url.includes('/key-statistics')) return PageType.Statistics;
        if (url.includes('/financials')) return PageType.Financials;
        if (url.match(/\/quote\/[^\/]+\/?$/)) return PageType.Summary;
        if (url.match(/\/compare\//)) return PageType.Comparison;

        return PageType.Unknown;
    }

    public static isPageValid(url: string): boolean {
        const quotePattern = /^https:\/\/uk\.finance\.yahoo\.com\/quote\/[A-Z0-9.-]+\/?$/i;
        const comparePattern = /^https:\/\/uk\.finance\.yahoo\.com\/compare\/[A-Z0-9.-]+\/?$/i;

        const result: boolean = quotePattern.test(url) || comparePattern.test(url);
        if (!result) {
            console.warn('Page is not valid');
        }

        return result;
    }
}
