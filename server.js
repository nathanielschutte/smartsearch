
const path = require('path');
const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);

const SearchTree = require('./search');
const search = new SearchTree('words.txt');

app.use(express.static(path.join(__dirname, 'html')));

function searchQuery(query) {
    results = [];
    // if (search.matchWordInTree(query)) {
    //     results.push(query);
    // }
    suggest = search.suggestWordInTree(query);
    if (suggest.length > 0) {
        results = suggest;
    }
    return results;
}

app.get('/search', (req, res) => {
    //console.log('/search', req.query.query);
    if (req.query && req.query.query) {
        results = searchQuery(req.query.query);
        if (results != null) {
            res.send({status: 'OK', results: results, query: req.query.query});
        }
        else {
            res.send({status: 'error', message: 'search error'})
        }
    }
    else {
        res.send({status: 'error', message: 'no query string'});
        console.log('/search query string error')
    }
})

const port = 3002;
server.listen(port, () => {
    console.log(`listening on ${port}`);
})