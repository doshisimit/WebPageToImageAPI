const express = require('express');
const puppeteer = require('puppeteer');
const sharp = require('sharp');
const path = require('path');
const cors = require('cors');
const validUrl = require('valid-url');

const app = express();
const port = 3000;

// Enable CORS for requests from example.com
// const corsOptions = {
//     origin: 'http://example.com', // Change to your domain
//     optionsSuccessStatus: 200 // For legacy browser support
// };
app.use(cors());

app.use(express.static('public'));

app.get('/screenshot', async (req, res) => {
    const { url, device } = req.query;

    if (!url) {
        return res.status(400).send('URL is required');
    }

    if (!validUrl.isUri(url)) {
        return res.status(400).send('Invalid URL');
    }

    let width, height, mockupPath, x, y;
    switch (device) {
        case 'desktop':
            width = 1508;
            height = 850;
            mockupPath = path.join(__dirname, 'mockups', 'desktop_mockup.jpg');
            x = 492; // Replace with the x coordinate for desktop mockup
            y = 390; // Replace with the y coordinate for desktop mockup
            break;
        case 'tablet':
            width = 895;
            height = 1195;
            mockupPath = path.join(__dirname, 'mockups', 'tablet_mockup.jpg');
            x = 154; // Replace with the x coordinate for tablet mockup
            y = 198; // Replace with the y coordinate for tablet mockup
            break;
        case 'mobile':
            width = 731;
            height = 1570;
            mockupPath = path.join(__dirname, 'mockups', 'mobile_mockup.jpg');
            x = 158; // Replace with the x coordinate for mobile mockup
            y = 232; // Replace with the y coordinate for mobile mockup
            break;
        default:
            width = 1508;
            height = 850;
            mockupPath = path.join(__dirname, 'mockups', 'desktop_mockup.jpg');
            x = 492; // Default x coordinate
            y = 390; // Default y coordinate
    }

    let browser;
    try {
        browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setViewport({ width, height });
        await page.goto(url, { waitUntil: 'networkidle2' });
        let screenshot = await page.screenshot();

        // Apply rounded corners only for mobile
        if (device === 'mobile') {
            const roundedCorners = Buffer.from(
                `<svg width="${width}" height="${height}">
                    <rect x="0" y="0" width="${width}" height="${height}" rx="50" ry="50"/>
                </svg>`
            );

            screenshot = await sharp(screenshot)
                .composite([{ input: roundedCorners, blend: 'dest-in' }])
                .png()
                .toBuffer();
        }

        const image = await sharp(mockupPath)
            .composite([{ input: screenshot, left: x, top: y }])
            .toBuffer();

        res.type('image/png');
        res.send(image);
    } catch (error) {
        console.error('Error generating screenshot:', error);
        res.status(500).send('Error generating screenshot');
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
