import { BackgroundRequest, ContentAction, ScrapeRequest, ScrapeResponse } from '../models/actions';
import SymbolPreview from '../models/symbol_preview';

class PopupManager {
    constructor() {
        console.log('Popup initialized');
        // this.pageTypes = ['summary', 'statistics', 'financials'];
        // this.pageDisplayNames = {
        //     'summary': 'Summary Page',
        //     'statistics': 'Key Statistics',
        //     'financials': 'Financials'
        // };
        this.preview = new SymbolPreview();
    }

    initializeUI(preview: SymbolPreview | undefined): void {

        // Set the main scrape button
        const scrapeButton = document.getElementById('scrape-page-option');
        if (!scrapeButton) {
            console.error("Missing scrape button");
            return;
        }

        scrapeButton.addEventListener('click', async () => {
            await this.scrapePage();
        })

        // Set up the reset button
        const resetButton = document.getElementById('resetButton');
        if (!resetButton) {
            console.error("Missing reset button");
            return;
        }

        this.updatePreview(preview);

        resetButton.addEventListener('click', async (): Promise<void> => {
            await this.resetProgress();
        });
    }

    async scrapePage(): Promise<void> {
        console.log('Scraping page (popup.js)...');

        let response: ScrapeResponse = await browser.runtime.sendMessage({
            action: ContentAction.ScrapeContentPage,
        } as BackgroundRequest);

        const newResponse = {} as ScrapeResponse;
        Object.assign(newResponse, response);

        if (newResponse?.success) {
            console.log("good response");

            const newPreview = new SymbolPreview();
            Object.assign(newPreview, newResponse?.preview);

            this.updatePreview(newPreview);
        }
    } catch (error: Error) {
        console.error('Error scraping page:', error);
    }

    private updatePreview(preview: SymbolPreview | undefined): void {
        console.log('update preview');
        if (!preview) return;

        const previewPanelElement = document.getElementById('preview-panel');
        if (!previewPanelElement) {
            console.error(`Failed to find preview panel`);
            return;
        }
        previewPanelElement.innerHTML = '';

        const previewTemplate: HTMLTemplateElement = document.getElementById('preview-template') as HTMLTemplateElement;
        if (!previewTemplate) {
            console.error(`Failed to find preview template`);
            return;
        }

        for (const previewRow of preview.getPreviews()) {
            const clone = previewTemplate.content.firstElementChild?.cloneNode(true);
            if (!clone) {
                continue;
            }

            const mainElem = clone.parentElement?.querySelector('div.preview');
            const p = clone.parentElement?.querySelector('p');

            mainElem?.classList.add(previewRow?.done ? 'is-complete' : 'is-not-complete')

            if (p) {
                p.innerText = previewRow.abbreviation || '';
            }

            previewPanelElement.appendChild(clone);
        }
    }

    // async loadStatus() {
    //     console.log('Loading status...');
    //
    //     try {
    //         const response = await browser.runtime.sendMessage({
    //             action: 'getScrapingStatus'
    //         });
    //
    //         this.updateStatusDisplay(response);
    //     } catch (error) {
    //         console.error('Error loading status:', error);
    //     }
    // }

    // updateStatusDisplay(status) {
    //     const pageList = document.getElementById('pageList');
    //     const exportStatus = document.getElementById('exportStatus');
    //
    //     // Clear the current list
    //     pageList.innerHTML = '';
    //
    //     // Create page items
    //     this.pageTypes.forEach((pageType, index) => {
    //         const listItem = document.createElement('li');
    //         listItem.className = 'page-item';
    //
    //         const statusDot = document.createElement('div');
    //         statusDot.className = 'page-status';
    //
    //         const pageLabel = document.createElement('span');
    //         pageLabel.textContent = this.pageDisplayNames[pageType];
    //
    //         // Determine status
    //         let pageStatus = 'waiting';
    //
    //         if (status.isComplete) {
    //             pageStatus = 'complete';
    //         } else if (status.scrapedData.includes(pageType)) {
    //             pageStatus = 'scraped';
    //         } else if (index === status.currentPageIndex) {
    //             pageStatus = 'ready';
    //         }
    //
    //         listItem.classList.add(pageStatus);
    //         statusDot.classList.add(pageStatus);
    //
    //         listItem.appendChild(statusDot);
    //         listItem.appendChild(pageLabel);
    //         pageList.appendChild(listItem);
    //     });
    //
    //     // Show export status if complete
    //     if (status.isComplete) {
    //         exportStatus.style.display = 'block';
    //         exportStatus.className = 'export-status success';
    //     } else {
    //         exportStatus.style.display = 'none';
    //     }
    //
    //     // Update instructions based on the current state
    //     this.updateInstructions(status);
    // }

    // updateInstructions(status) {
    //     const instructions = document.querySelector('.instructions');
    //
    //     if (status.isComplete) {
    //         instructions.textContent = 'All pages scraped! Data has been copied to clipboard and can be pasted into LibreOffice Calc.';
    //     } else if (status.currentPageIndex < this.pageTypes.length) {
    //         const currentPageType = this.pageTypes[status.currentPageIndex];
    //         const currentPageName = this.pageDisplayNames[currentPageType];
    //         instructions.textContent = `Navigate to the ${currentPageName} and click the extension icon to scrape data.`;
    //     } else {
    //         instructions.textContent = 'Click the extension icon when on Yahoo Finance pages to scrape data.';
    //     }
    // }

    async resetProgress(): Promise<void> {
        try {
            await browser.runtime.sendMessage({
                action: ContentAction.ResetScrape
            } as BackgroundRequest);

            // Reload status immediately
            // await this.loadStatus();

            // Hide export status
            const exportStatus = document.getElementById('exportStatus');
            if (!exportStatus) {
                console.error("Missing export status element");
                return;
            }

            exportStatus.style.display = 'none';
        } catch (error) {
            console.error('Error resetting progress:', error);
        }
    }

    // Helper method to get current tab
    async getCurrentTab() {
        const [tab] = await browser.tabs.query({
            active: true,
            currentWindow: true
        });
        return tab;
    }
}

// Initialise the popup when DOM is loaded
(async (): Promise<void> => {
    const previewResponse: ScrapeResponse = await browser.runtime.sendMessage({
        action: ContentAction.SendPreview
    } as ScrapeRequest);
    const newPreview = new SymbolPreview();
    Object.assign(newPreview, previewResponse.preview);

    const popupManager = new PopupManager();
    popupManager.initializeUI(newPreview);

    // await popupManager.loadStatus();
})();
