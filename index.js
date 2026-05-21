const express = require('express');
const app = express();
const request = require('request');
const wikip = require('wiki-infobox-parser');

//ejs
app.set("view engine", 'ejs');

//routes
app.get('/', (req,res) =>{
    res.render('index');
});

app.get('/index', (req,response) =>{
    let url = "https://en.wikipedia.org/w/api.php"
    let params = {
        action: "opensearch",
        search: req.query.person,
        limit: "1",
        namespace: "0",
        format: "json"
    }

    url = url + "?"
    Object.keys(params).forEach( (key) => {
        url += '&' + key + '=' + params[key]; 
    });

    //get wikip search string
    request(url,(err,res, body) =>{
        if(err) {
            response.redirect('404');
        }
            result = JSON.parse(body);
            x = result[3][0];
            x = x.substring(30, x.length); 
            //get wikip json
            wikip(x , (err, final) => {
                if (err){
                    response.redirect('404');
                }
                else{
                    const answers = final;
                    response.send(answers);
                }
            });
    });

    
});

// /504-error — previously threw new Error('Timeout error') unconditionally (mock).
// Now simulates a realistic upstream call with a configurable timeout threshold.
// If the upstream does not respond within UPSTREAM_TIMEOUT_MS the handler returns
// a structured 504 JSON body instead of letting an uncaught exception propagate.
const UPSTREAM_TIMEOUT_MS = parseInt(process.env.UPSTREAM_TIMEOUT_MS || '5000', 10);

app.get('/504-error', async (req, res, next) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    try {
        // Replace this URL with the real upstream endpoint when available.
        const upstream = process.env.UPSTREAM_URL || 'https://httpbin.org/delay/2';
        const response = await fetch(upstream, { signal: controller.signal });
        clearTimeout(timer);
        const data = await response.json();
        res.status(200).json({ status: 'ok', data });
    } catch (err) {
        clearTimeout(timer);
        if (err.name === 'AbortError') {
            return res.status(504).json({
                error: 'Gateway Timeout',
                message: `Upstream did not respond within ${UPSTREAM_TIMEOUT_MS}ms`,
            });
        }
        next(err); // delegate unexpected errors to the global error handler
    }
});

// Global Express error handler — catches any unhandled errors thrown in route
// handlers and returns a structured JSON response instead of a bare 500/504.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('[error]', err.message, err.stack);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({
        error: err.name || 'InternalServerError',
        message: err.message || 'An unexpected error occurred',
    });
});

//port
app.listen(3000, console.log("Listening at port 3000..."))