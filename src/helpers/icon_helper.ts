import { PageType } from '../models/page_types';
import { getIcon, Icon, IconState } from '../models/icon';
import UrlHelper from './url_helper';

export default class IconHelper {

    public static async checkPageAndUpdateIcon(isComplete: boolean, tabId: number, url: string, currentPageType: PageType): Promise<void> {
        const pageType: PageType = UrlHelper.identifyPageType(url);

        if (!pageType) {
            try {
                await this.updateIcon(tabId, IconState.Inactive);
            } catch (error) {
                console.error(`Failed to set icon to inactive for tabId: ${tabId}`);
            }
            return;
        }

        const isCurrentPage: boolean = pageType === currentPageType;
        const isScraped: boolean = currentPageType !== PageType.Unknown;

        if (isComplete) {
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

    private static async updateIcon(tabId: number, state: IconState): Promise<void> {
        const icon: Icon = getIcon(state);

        await browser.action.setIcon({
            tabId: tabId,
            path: icon.path
        });

        await browser.action.setBadgeText({
            tabId: tabId,
            text: icon.text
        });

        await browser.action.setBadgeBackgroundColor({
            tabId: tabId,
            color: icon.colour || '#666666'
        });
    }
}
