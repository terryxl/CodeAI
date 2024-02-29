"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
// A generic server that you can extend to mock completion based APIs. This is
// mainly used as a stop-gap while we're waiting for proper access to some
// services.
//
// To run: `pnpm -C vscode ts-node ./scripts/mock-server.ts`
const endpoints = {
    '/batch': {
        completions: [
            {
                completion: 'foo()',
                log_prob: -0.7,
            },
            {
                completion: 'bar()',
                log_prob: -0.9,
            },
            {
                completion: 'baz()',
                log_prob: -0.91,
            },
        ],
    },
};
http_1.default.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => {
        body += chunk;
    });
    req.on('end', () => {
        const payload = JSON.parse(body);
        console.log();
        console.log('>', req.url);
        console.log(payload);
        const mockedResponse = endpoints[req.url];
        if (mockedResponse) {
            console.log('<', mockedResponse);
            res.setHeader('content-type', 'application/json');
            res.write(JSON.stringify(mockedResponse));
            res.end();
            return;
        }
        console.log('< 404 Not Found');
        res.statusCode = 404;
        res.write('Not Found');
        res.end();
    });
}).listen(3001);
console.log('Listening on port 3001...');
//# sourceMappingURL=mock-server.js.map