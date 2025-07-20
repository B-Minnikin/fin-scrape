// Popup script for Yahoo Finance scraper

class PopupManager {
    constructor() {
        console.log('Popup initialized');
        this.pageTypes = ['summary', 'statistics', 'financials'];
        this.pageDisplayNames = {
            'summary': 'Summary Page',
            'statistics': 'Key Statistics',
            'financials': 'Financials'
        };
    }

    // TODO - send request to background
    // TODO - set icon based on current page (in background I think)

    initializeUI() {
        // Set the main scrape button
        const scrapeButton = document.getElementById('scrape-page-option');
        scrapeButton.addEventListener('click', async () => {
            await this.scrapePage();
        })

        // Set up the reset button
        const resetButton = document.getElementById('resetButton');
        resetButton.addEventListener('click', async () => {
            await this.resetProgress();
        });

        // Set up periodic status updates
        // setInterval(async () => {
        //     await this.loadStatus();
        // }, 1000);
    }

    async scrapePage() {
        console.log('Scraping page (popup.js)...');

        const response = await browser.runtime.sendMessage({
            action: 'scrapePage'
        });

        // TODO - if success then dismiss popup

        // await this.updateStatusDisplay(response);
    } catch (error) {
        console.error('Error scraping page:', error);
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

    async resetProgress() {
        try {
            await browser.runtime.sendMessage({
                action: 'resetScraping'
            });

            // Reload status immediately
            // await this.loadStatus();

            // Hide export status
            const exportStatus = document.getElementById('exportStatus');
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

// Initialize the popup when DOM is loaded
(async () => {
    const popupManager = new PopupManager();
    popupManager.initializeUI();

    // await popupManager.loadStatus();
})();
