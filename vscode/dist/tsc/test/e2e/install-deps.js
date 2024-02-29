"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.installVsCode = void 0;
const child_process_1 = require("child_process");
const test_electron_1 = require("@vscode/test-electron");
// The VS Code version to use for e2e tests (there is also a version in ../integration/main.ts used for integration tests).
//
// We set this to stable so that tests are always running on the version of VS Code users are likely to be using. This may
// result in tests breaking after a VS Code release but it's better for them to be investigated than potential bugs being
// missed because we're running on an older version than users.
const vscodeVersion = 'stable';
// A custom version of the VS Code download reporter that silences matching installation
// notifications as these otherwise are emitted on every test run
class CustomConsoleReporter extends test_electron_1.ConsoleReporter {
    report(report) {
        if (report.stage !== test_electron_1.ProgressReportStage.FoundMatchingInstall) {
            super.report(report);
        }
    }
}
function installVsCode() {
    return (0, test_electron_1.downloadAndUnzipVSCode)(vscodeVersion, undefined, new CustomConsoleReporter(process.stdout.isTTY));
}
exports.installVsCode = installVsCode;
function installChromium() {
    const proc = (0, child_process_1.spawn)('pnpm', ['exec', 'playwright', 'install', 'chromium'], {
        shell: true,
    });
    return new Promise((resolve, reject) => {
        proc.on('error', e => console.error(e));
        proc.stderr.on('data', e => {
            const message = e.toString();
            if (message) {
                console.error(message);
            }
        });
        proc.stdout.on('data', e => {
            const message = e.toString();
            if (message) {
                console.log(message);
            }
        });
        proc.on('close', code => {
            if (code) {
                reject(new Error(`Process failed: ${code}}`));
            }
            else {
                resolve();
            }
        });
    });
}
function installAllDeps() {
    return Promise.all([installVsCode(), installChromium()]);
}
if (require.main === module) {
    const timeout = setTimeout(() => {
        console.error('timed out waiting to install dependencies');
        process.exit(1);
    }, 5 * 60 * 1000 // 5 minutes
    );
    void (async () => {
        await installAllDeps();
        clearTimeout(timeout);
    })();
}
