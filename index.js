const fastify = require("fastify")({ logger: false })
const fs = require("fs")
const path = require("path")

fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/public/',
})

fastify.post('/create', (req, res) => {
    let { url, name } = req.body;
    const shortURL = createURL(url, name)
    if(shortURL.code == 0) return { msg: shortURL.msg, code: 0}
    return { url: shortURL, code: 1 }
})

fastify.get('/:short', (req, res) => {
    let { short } = req.params;
    if(!short) return res.sendFile('index.html')
    const goto = getURL(short, true)
    if (!goto?.url) return { msg: "redirect url not found!", code: 0 }
    res.redirect(goto?.url);
})

fastify.get('/data/:short', (req, res) => {
    let { short } = req.params;
    const shortData = getURL(short, false)
    if (!shortData?.url) return { msg: "redirect url not found!", code: 0 }
    return shortData;
})

fastify.listen({ host: "0.0.0.0", port: 2222 }).then(() => {
    console.log("server has been start!")
})

const createURL = (url,name) => {
    let db;
    try {
        db = JSON.parse(fs.readFileSync("./url.json"))
    } catch (error) {
        fs.writeFileSync("./url.json", JSON.stringify([]))
        db = []
    }

    if(!name || name == "" || !url || url == "") return { code: 0, msg: "please enter name or url"}
    if(db.find(e => e.name == name.toLowerCase())) return { code: 0, msg: "already have name in database."}

    let short = (new Date().getTime()).toString(32) + Math.floor(Math.random())
    db.push({
        url: url,
        name: name.toLowerCase(),
        count: 0,
        short: short.toLowerCase()
    })
    fs.writeFileSync("./url.json", JSON.stringify(db, null, 4))
    return {
        short: short.toLowerCase(),
        name: name.toLowerCase()
    };
}
const getURL = (url, visit) => {
    let db;
    let isName = false;
    try {
        db = JSON.parse(fs.readFileSync("./url.json"))
    } catch (error) {
        fs.writeFileSync("./url.json", JSON.stringify([]))
        db = []
    }
    redirect = db.find(e => e.short == url.toLowerCase())
    if(!redirect) {
        redirect = db.find(e => e.name == url.toLowerCase())
        isName = true;
    }
    if (redirect) {
        if(isName) {
            db.find(e => e.name == url.toLowerCase()).count++
        }
        else {
            db.find(e => e.short == url.toLowerCase()).count++
        }
        if(visit) {
            fs.writeFileSync("./url.json", JSON.stringify(db, null, 4))
        }
    }
    return redirect;
}