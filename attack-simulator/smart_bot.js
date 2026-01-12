
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    console.log('🤖 Starting SMART BOT attack (Stealth Mode)...');

    // Launch with stealth settings
    const browser = await puppeteer.launch({
        headless: false, // Run in headful mode to mimic human better
        args: ['--no-sandbox']
    });

    const page = await browser.newPage();

    // Capture browser console logs
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // Fake window dimensions
    await page.setViewport({ width: 1920, height: 1080 });

    try {
        const targetUrl = 'http://localhost:5500/test_page.html'; // Assuming port 5500
        await page.goto(targetUrl, { waitUntil: 'networkidle0' });

        console.log("📍 Page loaded.");

        // 1. Avoid Honeypot (Smart)
        // We do NOT type into #hp_input

        // 2. Simulate Mouse Movement (Human-like)
        console.log("🖱️ Simulating human mouse movement...");
        await page.mouse.move(100, 100);
        await page.mouse.move(200, 200, { steps: 10 });
        await page.mouse.move(500, 300, { steps: 20 });
        await new Promise(r => setTimeout(r, 1000)); // Wait a bit

        // 3. Click the button (Run Check)
        console.log("🖱️ Clicking Run Check...");
        await page.click('button');

        // Wait for result OR Error
        await page.waitForFunction(
            () => {
                const text = document.getElementById('status').textContent;
                return text.includes('Verdict') || text.includes('Error');
            },
            { timeout: 10000 } // Increased timeout
        );

        const status = await page.$eval('#status', el => el.textContent);
        console.log(`📊 Result: ${status}`);

    } catch (e) {
        console.error("❌ Attack failed:", e.message);

        // Take a screenshot if possible to debug
        // await page.screenshot({ path: 'debug.png' });

        console.log("💡 Tip: Check if Backend (Port 8000) and Frontend (Port 5500) are running.");
        console.log("💡 Tip: Check backend logs for ML/Import errors.");
    }

    // Keep open specifically to see result
    // await browser.close();
})();
