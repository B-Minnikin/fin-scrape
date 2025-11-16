import { BackgroundRequest, ContentAction, ScrapeResponse } from '../models/actions';
import SymbolPreview, { PreviewRow } from '../models/symbol_preview';

class PopupManager {
    preview: SymbolPreview;
    // pageTypes: Array<string>;
    // pageDisplayNames: Array<string>;

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

    // TODO - send request to background
    // TODO - set icon based on current page (in background I think)

    initializeUI(): void {
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

        resetButton.addEventListener('click', async (): Promise<void> => {
            await this.resetProgress();
        });
    }

    async scrapePage(): Promise<void> {
        console.log('Scraping page (popup.js)...');

        const response: ScrapeResponse = await browser.runtime.sendMessage({
            action: ContentAction.ScrapeContentPage,
        } as BackgroundRequest);

        console.log(response);

        if (response?.success) {
            console.log("good response");

            const preview = response?.preview;
            if (preview) {
                this.preview = preview;
                this.updatePreview();
            }

            window.close(); // TODO - keep open for preview?
        }

        // await this.updateStatusDisplay(response);
    } catch (error: Error) {
        console.error('Error scraping page:', error);
    }

    private updatePreview(): void {
        const previewPanelElement = document.getElementById('preview-panel');
        if (!previewPanelElement) {
            console.error(`Failed to find preview panel`);
            return;
        }

        const previewTemplate = document.getElementById('preview-template');
        if (!previewTemplate) {
            console.error(`Failed to find preview template`);
            return;
        }

        for (const preview of this.preview.previews) {
            const clone = previewTemplate.cloneNode(true);
            const mainElem = clone.parentElement?.querySelector('div.preview');
            const p = clone.parentElement?.querySelector('p');

            mainElem?.classList.add(preview?.done ? 'is-complete' : 'is-not-complete')

            if (p) {
                p.innerText = preview.abbreviation || '';
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
(async () => {
    const popupManager = new PopupManager();
    popupManager.initializeUI();

    // await popupManager.loadStatus();
})();
