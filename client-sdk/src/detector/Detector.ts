
// Mock function for now, replace with actual API call
const sendTelemetry = async (data: any): Promise<string> => {
  try {
    const response = await fetch('http://localhost:8000/api/v1/telemetry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    return result.verdict; // 'bot' or 'human'
  } catch (e) {
    console.error("Telemetry failed", e);
    return 'human'; // Fail open
  }
};

import { BehaviorTracker } from '../collector/BehaviorTracker';

export default class Detector {
  private static instance: Detector;
  private behaviorTracker: BehaviorTracker;

  private constructor() {
    this.behaviorTracker = new BehaviorTracker();
  }

  static getInstance() {
    if (Detector.instance === undefined) {
      Detector.instance = new Detector();
    }

    return Detector.instance;
  }

  // ... (Existing detectorMap)
  detectorMap: Array<string | string[]> = [
    'errorTrapPhantomJS',
    'errorTrapPuppeteer',
    // ... (Use existing list from view_file if possible, or shorten for brevity in this turn but I should keep it all)
    'errorTrapPlaywrightChrome',
    'errorTrapPlaywrightFirefox',
    'errorTrapPlaywrightWebKit',
    'errorTrapSeleniumChrome',
    'chromeDriver',
    'wrongChromeOrder',
    'inconsistentCloneError',
    'fakeCreateElement',
    ['firefoxDevTools', 'hiddenScroll', 'noHovermq'],
    'inconsistentChromeObject',
    'iframeChromeRuntime',
    'oldSelenium',
    'inconsistentPermissions',
    'phantomWindow',
    'playwrightOrientation',
    'playwrightWebKit',
    'toStringSpoofed',
    'webdriver',
    ['firefoxDevTools', 'webGLDisabled']
  ];

  async detect(collectorResults: string[], token?: string): Promise<string> {
    // 1. Local checks (Legacy)
    let localVerdict = 'human';
    for (const detector of this.detectorMap) {
      if (typeof detector === 'string' && collectorResults.includes(detector)) {
        localVerdict = 'bot';
        break;
      } else if (Array.isArray(detector)) {
        const all = detector.every((e) => collectorResults.includes(e));
        if (all) {
          localVerdict = 'bot';
          break;
        }
      }
    }

    // 2. Prepare Telemetry Payload
    // Get behavioral data
    const behavioralData = this.behaviorTracker.getData();

    const payload = {
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      hardware_concurrency: navigator.hardwareConcurrency || 4,
      webdriver: navigator.webdriver || localVerdict === 'bot',
      headers: {},

      // Behavioral Data
      mouse_movements: behavioralData.mouse_movements,
      keystrokes: behavioralData.keystrokes,
      time_on_page: behavioralData.time_on_page,
      honeypot_triggered: behavioralData.honeypot_triggered
    };

    // 3. Send to Backend
    return await sendTelemetry(payload);
  }
}
