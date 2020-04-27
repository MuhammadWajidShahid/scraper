const puppeteer = require('puppeteer');
const express=require("express")
var bodyParser = require('body-parser')
const app = express();
app.use(express.static("./static"));
app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())
app.post("/getCsv",async(req,res)=>{
    if(!req.body.url)
    res.status(400).send("please enter a url");
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const getData=async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 200, height: 900 });
    // await page.goto('https://c19.se/en/Sweden/V%C3%A4stra%20G%C3%B6taland');
    // 'https://c19.se/en/Sweden/Stockholm'
    await page.goto(req.body.url);
    //   await page.waitForSelector('svg');
    const elem = await page.$("svg.highcharts-root");
    await hoveronel(elem);
    async function hoveronel(elem, x = null, y = null) {
        const rect = await page.evaluate(el => {
            const { top, left, width, height, x, y } = el.getBoundingClientRect();
            return { top, left, width, height, x, y };
        }, elem);
        await page.mouse.move(rect.x + 10, rect.y + 50, { steps: 5 });
        var nowtime=new Date().getTime();
        var allData=[];
        for (let i = rect.x; i <= rect.x + rect.width; i = i + 2) {
            await page.mouse.move(rect.x + i, rect.y + 50, { steps: 2 });
            var text = await page.evaluate(el => {
                const g =  el.lastChild
                const t =  g.lastChild
                const childs=t.childNodes;
                // console.log(childs)
                let data={
                }
                childs.forEach((ch,index) => {
                        if((index+1)%3==0)
                        {
                            const key=ch.innerHTML.replace(/\:\s/g, "")
                            data[key]=childs[index+1].innerHTML.replace(/\s/g, "")
                        }
                    });
                    data.date=t.firstChild.innerHTML;
                    return data
                }, elem);
                const time=new Date(text.date).getTime()
                // console.log(time)
                if(time!=nowtime)
                {
                    nowtime=time;
                    allData.push(text);
                }
        }
        // making csv
        var header=[];
        const keys=Object.keys(allData[allData.length-1]);
        keys.map(key=>header.push({id:key,title:key}))
        const csvWriter = createCsvWriter({
            path: 'record.csv',
            header  
        });
        await csvWriter.writeRecords(allData)
        console.log(allData,Object.keys(allData[allData.length-1]))
    }
    await browser.close();
};
await getData();
res.download(`${__dirname}/record.csv`)
//  res.sendFile(`${__dirname}/record.csv`);
})

app.listen(process.env.PORT||8080,console.log("running"));