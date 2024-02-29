"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const base64_1 = require("./base64");
(0, vitest_1.describe)('base64', () => {
    (0, vitest_1.it)('decode', () => {
        const original = JSON.parse('["H4sIAAAAAAAAA6pWSkksSVSyqlYqSc1JzU0tKaoEcYpSk/OLUlzLUvNKikH8xJzyxMpiv8wcJau80pyc2traWgAAAAD//wMAhHZ9ajoAAAA="]')[0];
        (0, vitest_1.expect)((0, base64_1.decodeCompressedBase64)(original)).toMatchInlineSnapshot(`
          {
            "data": {
              "telemetry": {
                "recordEvents": {
                  "alwaysNil": null,
                },
              },
            },
          }
        `);
    });
});
