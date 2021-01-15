const puppeteer = require('puppeteer');
const schedule = require('node-schedule');
const express = require('express');

const app = express();
const port = 80;

let stock = [];

const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-infobars',
    '--window-position=0,0',
    '--ignore-certifcate-errors',
    '--ignore-certifcate-errors-spki-list',
    '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"'
];

const options = {
    args,
    headless: true,
    ignoreHTTPSErrors: true,
    userDataDir: './tmp'
};

const data = {
    set: "PS5",
    sites: [
        {
            name: "Boulanger",
            url: "https://www.boulanger.com/ref/1147567",
            query: ".pb-bottom",
            content: "indisponible"
        },
        {
            name: "Fnac",
            url: "https://www.fnac.com/Console-Sony-PS5-Edition-Standard/a14119956/w-4",
            query: ".js-fnacBuyBox",
            content: "Indisponible"
        },
        {
            name: "Micromania",
            url: "https://www.micromania.fr/playstation-5-105642.html",
            query: ".back-in-stock-container",
            content: "LE PRODUIT EST ÉPUISÉ"
        },
        {
            name: "Amazon",
            url: "https://www.amazon.fr/PlayStation-%C3%89dition-Standard-DualSense-Couleur/dp/B08H93ZRK9/ref=sr_1_1?dchild=1&keywords=Ps5+Console&qid=1610527304&sr=8-1",
            query: "#outOfStock",
            content: "Actuellement indisponible."
        },
        {
            name: "Darty",
            url: "https://www.darty.com/nav/achat/informatique/ps4/consoles_ps4/sony_sony_ps5_standard.html?awc=7735_1610528211_f04170bd02385bbe7e3496e7c6011903&ectrans=1&dartycid=aff_429787_generique_awin",
            query: ".product-information-bloc",
            content: "PRODUIT INDISPONIBLE"
        },
    ]
};




const checkStock = async (page) => {
    stock = [];
    for (const site of data.sites) {
        await page.goto(site.url, {
            waitUntil: 'networkidle0',
        });

        try {
            const innerHtml = await page.$eval(site.query, div => div.innerText);

            const notAvailable = site.content;
            const available = !innerHtml.includes(notAvailable);

            if (available) {
                console.log(`La console ${data.set} est dispo sur ${site.name}`);
                stock.push({
                    name: site.name,
                    available: true
                })
            } else {
                console.log(`La console ${data.set} n'est pas disponible sur ${site.name}`);
                stock.push({
                    name: site.name,
                    available: false
                })
            }
        } catch(error) {
            console.log(`Impossible de recupérer les données pour le site ${site.name}`);
            stock.push({
                name: site.name,
                available: 'Error'
            })
        }

    }
};

app.get('/check', (req, res) => {
    res.send(stock);
});

app.listen(port, () => {

    console.log(`Application de check de stock écoute sur http://localhost:${port}`);

    (async () => {
        const browser = await puppeteer.launch(options);
        const page = await browser.newPage();

        schedule.scheduleJob('*/1 * * * *', async () => {
            await checkStock(page);
        });

    })();
});
