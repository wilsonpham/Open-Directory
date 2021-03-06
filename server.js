const compression = require('compression')
const express = require("express");
const mustacheExpress = require("mustache-express");
const removeMd = require('remove-markdown');

import { OPENDIR_PROTOCOL } from "./public/static/js/process"
const helpers = require("./public/static/js/helpers.js");
const process = require("./public/static/js/process.js");
const fs = require("fs");

const DEFAULT_INITIAL_CHANGELOG = 10;
const DEFAULT_UPDATE_CHANGELOG= 50;

var cached_items = [];
var cached_raw = [];

function get_cached_items() {
    const old_items = cached_items;
    try {
        let data = fs.readFileSync(__dirname + "/public/static/js/cached_items.json");
        let new_items = JSON.parse(data);
        cached_items = new_items;
        return cached_items;
    } catch (e) {
        return old_items;
    }
}

function get_cached_raw() {
    const old_raw = cached_raw;
    try {
        let data = fs.readFileSync(__dirname + "/public/static/js/cached_raw.json");
        let new_raw = JSON.parse(data).filter(i => {
            return (i.data.s1 == OPENDIR_PROTOCOL || i.data.s2 == OPENDIR_PROTOCOL);
        });

        cached_raw = new_raw;
        return cached_raw;
    } catch (e) {
        console.log("ERROR", e);
        throw e;
        return old_raw;
    }
}

const app = express();
app.use(express.static('public'))
app.use(compression());

app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

app.get('/', function (req, res) {
    res.render('index', {
        "twitter_card": "summary_large_image",
        "twitter_image": "https://dir.sv/static/img/twitter_large_card.png"
    });
});

function fillOutItemsWithCategories(items, cache) {
    const categories = new Map();
    for (const item of items) {
        if (item.category) {
            const category = helpers.findObjectByTX(item.category, cache);
            categories.set(category.txid, category);
        }
    }

    return items.concat(Array.from(categories.values()));
}

function getHomepageItems(cache, type="links", sort="hot", limit=200) {
    const items = cache.filter(function(item) {
        if (type == "links") {
            return item.type == "entry";
        } else if (type == "categories") {
            return item.type == "category";
        }
    }).sort(function(a, b) {
        if (sort == "time") {
            if (!a.height) { return -1; }
            if (a.height < b.height) { return 1; }
            if (a.height > b.height) { return -1; }
        } else if (sort == "votes") {
            if (a.votes < b.votes) { return 1; }
            if (a.votes > b.votes) { return -1; }
            if (a.height < b.height) { return 1; }
            if (a.height > b.height) { return -1; }
        } else if (sort == "money") {
            if (a.satoshis < b.satoshis) { return 1; }
            if (a.satoshis > b.satoshis) { return -1; }
            if (a.votes < b.votes) { return 1; }
            if (a.votes > b.votes) { return -1; }
            if (a.height < b.height) { return 1; }
            if (a.height > b.height) { return -1; }
        } else if (sort == "links") {
            if (a.entries < b.entries) { return 1; }
            if (a.entries > b.entries) { return -1; }
            if (a.satoshis < b.satoshis) { return 1; }
            if (a.satoshis > b.satoshis) { return -1; }
            if (a.votes < b.votes) { return 1; }
            if (a.votes > b.votes) { return -1; }
            if (a.height < b.height) { return 1; }
            if (a.height > b.height) { return -1; }
        } else { // hot
            if (a.hottness < b.hottness) { return 1; }
            if (a.hottness > b.hottness) { return -1; }
            if (a.satoshis < b.satoshis) { return 1; }
            if (a.satoshis > b.satoshis) { return -1; }
            if (a.votes < b.votes) { return 1; }
            if (a.votes > b.votes) { return -1; }
            if (a.height < b.height) { return 1; }
            if (a.height > b.height) { return -1; }
        }
        return 0;
    }).slice(0, limit);


    // links need their categories too
    if (type == "links") {
        return fillOutItemsWithCategories(items, cache);
    } else {
        return items;
    }
}

app.get('/api/search', function (req, res) {
    const query = req.query.query.toLowerCase();
    var category_id = req.params.category_id;
    if (category_id == "null") { // hacky
        category_id = null;
    }
    //console.log("QUERY", query);
    //console.log("CATEGORY_ID", category_id);

    try {

        const items = get_cached_items();
        //console.log("ITEMS", items.length);

        const slice = process.buildItemSliceRepresentationFromCache(category_id, items);
        //console.log("SLICE", slice.length);

        const results = slice.filter(item => {
            if (item.deleted) { return false }
            if (item.name && item.name.toLowerCase().indexOf(query) !== -1) { return true }
            if (item.description && item.description.toLowerCase().indexOf(query) !== -1) { return true }
            if (item.txid && item.txid.toLowerCase().indexOf(query) !== -1) { return true }
            if (item.address && item.address.toLowerCase().indexOf(query) !== -1) { return true }
            if (item.link && item.link.toLowerCase().indexOf(query) !== -1) { return true }

            for (const tipchain of item.tipchain) {
                if (tipchain.address.toLowerCase().indexOf(query) !== -1) { return true }
            }

            return false;
        });

        const sorted = results.sort((a, b) => {
                if (a.hottness < b.hottness) { return 1; }
                if (a.hottness > b.hottness) { return -1; }
                if (a.satoshis < b.satoshis) { return 1; }
                if (a.satoshis > b.satoshis) { return -1; }
                if (a.votes < b.votes) { return 1; }
                if (a.votes > b.votes) { return -1; }
                if (a.height < b.height) { return 1; }
                if (a.height > b.height) { return -1; }
                return 0;
        });

        const shortResults = sorted.slice(0, 200);
        const filled = fillOutItemsWithCategories(shortResults, items);

        return res.json({
            "results": filled
        });

    } catch (e) {
        console.log("ERR", e);
    }

    return res.status(400).send({
        message: "error searching"
    });
});


app.get('/api/homepage', function (req, res) {
    var sort = req.query.sort;
    const allowedSorts = ["hot", "money", "votes", "time", "links"];
    if (allowedSorts.indexOf(sort) == -1) { sort = "hot" }

    var itemType = req.query.type;
    const allowedItemTypes = ["links", "categories"];
    if (allowedItemTypes.indexOf(itemType) == -1) { itemType = "links" }

    //console.log("SORT", sort);
    //console.log("ITEM", itemType);

    try {
        const items = get_cached_items();
        const raw = get_cached_raw();
        //console.log("RAW", raw.length);
        //console.log("ITEMS", items.length);

        const slice = getHomepageItems(items, itemType, sort);
        //console.log("SLICE", itemType, sort, slice.length);

        const changelog = process.buildRawSliceRepresentationFromCache(null, raw, items);
        const sortedChangelog = changelog.sort(function(a, b) {
            return (a.height===null)-(b.height===null) || +(a.height>b.height) || -(a.height<b.height);
        }).reverse();

        const shortChangelog = sortedChangelog.slice(0, DEFAULT_INITIAL_CHANGELOG);

        return res.json({
            "slice": slice,
            "changelog": shortChangelog,
        });

    } catch (e) {
        console.log("ERR", e);
    }

    return res.status(400).send({
        message: "error loading homepage"
    });
});

app.get('/api/category/:category_id', function (req, res) {
    const category_id = req.params.category_id;

    //console.log("REQ", category_id);
    try {
        const items = get_cached_items();
        const raw = get_cached_raw();

        //console.log("RAW", raw.length);
        //console.log("ITEMS", items.length);

        const category = helpers.findObjectByTX(category_id, items);
        if (category) {

            const slice = process.buildItemSliceRepresentationFromCache(category.txid, items);
            //console.log("SLICE ITEMS", slice.length);

            const changelog = process.buildRawSliceRepresentationFromCache(category.txid, raw, items);
            const sortedChangelog = changelog.sort(function(a, b) {
                return (a.height===null)-(b.height===null) || +(a.height>b.height) || -(a.height<b.height);
            }).reverse();


            const shortChangelog = sortedChangelog.slice(0, DEFAULT_INITIAL_CHANGELOG);

            return res.json({
                "slice": slice,
                "changelog": shortChangelog,
            });
        }

    } catch (e) {
        console.log("ERR", e);
    }

    return res.status(400).send({
        message: "can't find category_id"
    });

    
});

app.get('/api/changelog/:category_id', function (req, res) {
    var category_id = req.params.category_id;
    if (category_id == "null") { // hacky
        category_id = null;
    }
    //console.log("CATEGORY_ID", category_id);
    const cursor = Number(req.query.cursor || 0);

    try {
        const items = get_cached_items();
        const raw = get_cached_raw();

        //console.log("RAW", raw.length);

        if (category_id) {
            const category = helpers.findObjectByTX(category_id, items);
            if (category) {

                const changelog = process.buildRawSliceRepresentationFromCache(category.txid, raw, items);
                const sortedChangelog = changelog.sort(function(a, b) {
                    return (a.height===null)-(b.height===null) || +(a.height>b.height) || -(a.height<b.height);
                }).reverse();

                const shortChangelog = sortedChangelog.slice(cursor, cursor + DEFAULT_UPDATE_CHANGELOG);
                //console.log("CHANGELOG", changelog.length);
                //console.log("SHORT CHANGELOG", shortChangelog.length);

                return res.json({
                    "idx": cursor,
                    "changelog": shortChangelog,
                });
            }
        } else {
            const changelog = raw;
            const sortedChangelog = changelog.sort(function(a, b) {
                return (a.height===null)-(b.height===null) || +(a.height>b.height) || -(a.height<b.height);
            }).reverse();

            const shortChangelog = sortedChangelog.slice(cursor, cursor + DEFAULT_UPDATE_CHANGELOG);
            //console.log("CHANGELOG", changelog.length);
            //console.log("SHORT CHANGELOG", shortChangelog.length);

            return res.json({
                "idx": cursor,
                "changelog": shortChangelog,
            });
        }

    } catch (e) {
        console.log("ERR", e);
    }

    return res.status(400).send({
        message: "can't find category_id"
    });

    
});



app.get('/category/:category_id', function (req, res) {
    const category_id = req.params.category_id;

    try {
        const items = get_cached_items();

        const category = helpers.findObjectByTX(category_id, items);
        if (category) {

            const title = category.name + " — Open Directory";
            const description = removeMd(category.description).replace(/\n/g, " ");
            res.render('index', {
                "description": description,
                "title": title
            });
            return;
        }


    } catch (e) {
        console.log("Error", e);
    }

    res.render('index');
});

app.get('*', function(req, res) {
    res.render('index');
});

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});
