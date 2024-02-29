"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const nodeClient_1 = require("@sourcegraph/cody-shared/src/sourcegraph-api/completions/nodeClient");
const polly_1 = require("../testutils/polly");
const symfExpandQuery_1 = require("./symfExpandQuery");
(0, vitest_1.describe)('symf', () => {
    const client = new nodeClient_1.SourcegraphNodeCompletionsClient({
        accessToken: process.env.SRC_ACCESS_TOKEN ?? 'invalid',
        serverEndpoint: process.env.SRC_ENDPOINT ?? 'https://sourcegraph.com',
        customHeaders: {},
        debugEnable: true,
    });
    (0, vitest_1.describe)('expand-query', () => {
        let polly;
        (0, vitest_1.beforeAll)(() => {
            polly = (0, polly_1.startPollyRecording)({ recordingName: 'symf' });
        });
        function check(query, expectedHandler) {
            (0, vitest_1.it)(query, async () => {
                expectedHandler(await (0, symfExpandQuery_1.symfExpandQuery)(client, query));
            });
        }
        check('ocean', expanded => (0, vitest_1.expect)(expanded).toMatchInlineSnapshot('"circulation current ebb flow heat motion ocean ppt psu salinity salt sea stream temp temperature tidal tide water wave waves"'));
        check('How do I write a file to disk in Go', expanded => (0, vitest_1.expect)(expanded).toMatchInlineSnapshot('"disk file files go golang harddrive storage write writefile writetofile"'));
        check('Where is authentication router defined?', expanded => (0, vitest_1.expect)(expanded).toMatchInlineSnapshot('"auth authenticate authentication define defined definition route router routing"'));
        check('parse file with tree-sitter', expanded => (0, vitest_1.expect)(expanded).toMatchInlineSnapshot('"file files parser parsing sitter tree tree-sitter ts"'));
        check('scan tokens in C++', expanded => (0, vitest_1.expect)(expanded).toMatchInlineSnapshot('"c cin f getline in scan scan_f scanf str stream streams string tok token tokens"'));
        (0, vitest_1.afterAll)(async () => {
            await polly.stop();
        });
    });
});
