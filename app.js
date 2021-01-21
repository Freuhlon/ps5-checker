const express = require('express');
const puppeteer = require('puppeteer-extra')

const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

const app = express();
const port = 80;

let stock = [];

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




const checkStock = async () => {
    stock = [];

    let cptStock = 0;
    do {

        if( cptStock === data.sites.length) {
            stock = [];
            cptStock = 0;
        }
        const site = data.sites[cptStock];

        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage()
        await page.setExtraHTTPHeaders({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-US,q=0.9',
            'Cache-Control': 'none',
        })
        await page.goto(site.url, {
            waitUntil: 'networkidle0',
        });

        await sleep(30000);
        await page.screenshot({ path: 'testresult.png', fullPage: true });

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
        await browser.close();
        cptStock++;
    } while(true);

};

app.get('/check', (req, res) => {
    res.send(stock);
});

app.listen(port, () => {

    console.log(`Application de check de stock écoute sur http://localhost:${port}`);

    (async () => {

        await checkStock();

    })();
});


function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
