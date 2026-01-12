export interface BehavioralData {
    mouse_movements: Array<[number, number, number]>; // x, y, timestamp
    keystrokes: Array<[string, number]>; // key_code (redacted), timestamp
    scroll_events: Array<[number, number]>; // scroll_y, timestamp
    time_on_page: number;
    honeypot_triggered: boolean;
}

export class BehaviorTracker {
    private data: BehavioralData = {
        mouse_movements: [],
        keystrokes: [],
        scroll_events: [],
        time_on_page: 0,
        honeypot_triggered: false
    };
    private startTime: number;

    constructor() {
        this.startTime = Date.now();
        this.initListeners();
        this.initHoneypot();
    }

    private initHoneypot() {
        const hp = document.getElementById('hp_input') as HTMLInputElement;
        if (hp) {
            hp.addEventListener('input', () => {
                this.data.honeypot_triggered = true;
                console.log("Honeypot triggered!");
            });
            hp.addEventListener('focus', () => {
                this.data.honeypot_triggered = true;
            });
        }
    }

    private initListeners() {
        // Track mouse movements (throttled)
        let lastMouseTime = 0;
        document.addEventListener('mousemove', (e) => {
            const now = Date.now();
            if (now - lastMouseTime > 100) { // Record every 100ms max
                this.data.mouse_movements.push([e.clientX, e.clientY, now]);
                lastMouseTime = now;
            }
        });

        // Track key presses (anonymized)
        document.addEventListener('keydown', (e) => {
            // We store generic info, not actual chars for privacy
            const now = Date.now();
            this.data.keystrokes.push([e.code, now]);
        });

        // Track scrolling
        let lastScrollTime = 0;
        document.addEventListener('scroll', () => {
            const now = Date.now();
            if (now - lastScrollTime > 200) {
                this.data.scroll_events.push([window.scrollY, now]);
                lastScrollTime = now;
            }
        });
    }

    public getData(): BehavioralData {
        this.data.time_on_page = Date.now() - this.startTime;
        return this.data;
    }
}
