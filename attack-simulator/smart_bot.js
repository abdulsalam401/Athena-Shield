const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

(async () => {
    console.log('🤖 Starting SMART BOT attack (Stealth Mode)...');

    const isHeadless = process.env.HEADLESS === 'true';
    const targetUrl = process.env.TARGET_URL || 'http://127.0.0.1:5500/test_page.html';

    // Locate system browser (Chrome / Edge) if present
    const candidatePaths = [
        process.env.CHROME_PATH,
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
    ].filter(Boolean);

    let systemBrowser = candidatePaths.find(p => {
        try { return fs.existsSync(p); } catch { return false; }
    });

    const launchOptions = {
        headless: isHeadless ? 'new' : false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    };

    if (systemBrowser) {
        launchOptions.executablePath = systemBrowser;
    }

    let browser;
    try {
        browser = await puppeteer.launch(launchOptions);
    } catch (launchErr) {
        console.log(`⚠️ Launch failed (${launchErr.message}), falling back to headless mode...`);
        launchOptions.headless = 'new';
        browser = await puppeteer.launch(launchOptions);
    }

    const page = await browser.newPage();

    // Capture browser console logs
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // Fake window dimensions
    await page.setViewport({ width: 1920, height: 1080 });

    try {
        console.log(`📍 Navigating to ${targetUrl}...`);
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

        console.log("📍 Page loaded.");

        // 1. Avoid Honeypot (Smart)
        // We do NOT type into #hp_input

        // 2. Simulate Mouse Movement (Robotic steps)
        console.log("🖱️ Simulating robotic mouse movement steps...");
        await page.mouse.move(100, 100);
        await page.mouse.move(200, 200, { steps: 10 });
        await page.mouse.move(500, 300, { steps: 20 });
        await new Promise(r => setTimeout(r, 1000)); // Wait a bit

        // 3. Click the button (Run Check)
        console.log("🖱️ Clicking verification check...");
        await page.click('.btn-primary');

        // Wait for result OR Error
        await page.waitForFunction(
            () => {
                const el = document.getElementById('status');
                const text = el ? el.textContent : '';
                return text.includes('Verdict') || text.includes('Error');
            },
            { timeout: 10000 }
        );

        const status = await page.$eval('#status', el => el.textContent);
        console.log(`📊 Result: ${status}`);

        if (status.includes('BOT')) {
            console.log("\n🛡️ SUCCESS: Athena Shield successfully caught the Smart Bot!");
        } else {
            console.log("\n⚠️ Bot bypassed or verification inconclusive:", status);
        }

    } catch (e) {
        console.error("❌ Attack failed:", e.message);
        console.log("💡 Tip: Verify Backend (Port 8000) and Biometrics Lab (Port 5500) are running.");
    } finally {
        if (process.env.KEEP_OPEN !== 'true' && browser) {
            await browser.close();
        }
    }
})();
