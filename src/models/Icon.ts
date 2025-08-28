
export enum IconState {
    Unknown,
    Complete,
    Scraped,
    Inactive,
    Ready,
    Waiting
}

export interface Icon {
    state: IconState,
    path: string,
    colour: string,
    text: string
}

export function getIcon(state: IconState): Icon {

    switch (state) {
        case IconState.Ready:
            return {
                state,
                path: 'icons/icon-ready.png',
                colour: '#00ff00',
                text: '●'
            } as Icon;
        case IconState.Scraped:
            return {
                state,
                path: 'icons/icon-scraped.png',
                colour: '#ff0000',
                text: '●'
            } as Icon;
        case IconState.Waiting:
            return {
                state,
                path: 'icons/icon-waiting.png',
                colour: '#666666',
                text: ''
            } as Icon;
        case IconState.Complete:
            return {
                state,
                path: 'icons/icon-complete.png',
                colour: '#0000ff',
                text: '✓'
            } as Icon;
        case IconState.Inactive:
            return {
                state,
                path: 'icons/icon-inactive.png',
                colour: '#666666',
                text: '●'
            } as Icon;
    }

    console.warn("No icon state could be resolved");
    return {
        state: IconState.Unknown,
        path: '',
        colour: '',
        text: ''
    } as Icon;
}
