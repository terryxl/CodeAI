"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const semver_1 = __importDefault(require("semver"));
/**
 * This script is used by the CI to publish the extension to the VS Code Marketplace.
 *
 * See [CONTRIBUTING.md](../CONTRIBUTING.md) for instructions on how to generate a stable release or
 * insiders release.
 *
 * All release types are triggered by the CI and should not be run locally.
 */
const packageJSONPath = path_1.default.join(__dirname, '../package.json');
const packageJSONBody = fs_1.default.readFileSync(packageJSONPath, 'utf-8');
const packageJSON = JSON.parse(packageJSONBody);
const packageJSONVersionString = packageJSON.version;
let packageJSONWasModified = false;
// Check version validity.
const packageJSONVersion = semver_1.default.valid(packageJSONVersionString);
if (!packageJSONVersion) {
    console.error(`Invalid version in package.json: ${JSON.stringify(packageJSONVersionString)}. Versions must be valid semantic version strings.`);
    process.exit(1);
}
var ReleaseType;
(function (ReleaseType) {
    ReleaseType["Stable"] = "stable";
    ReleaseType["Insiders"] = "insiders";
})(ReleaseType || (ReleaseType = {}));
const releaseType = process.env.CODY_RELEASE_TYPE;
function validateReleaseType(releaseType) {
    if (!releaseType || !Object.values(ReleaseType).includes(releaseType)) {
        console.error(`Invalid release type ${JSON.stringify(releaseType)}. Valid values are: ${JSON.stringify(Object.values(ReleaseType))}. Specify a a release type in the CODY_RELEASE_TYPE env var.`);
        process.exit(1);
    }
}
validateReleaseType(releaseType);
const dryRun = Boolean(process.env.CODY_RELEASE_DRY_RUN);
const customDefaultSettingsFile = process.env.CODY_RELEASE_CUSTOM_DEFAULT_SETTINGS_FILE;
if (customDefaultSettingsFile) {
    // Override settings defaults in this build from a provided settings file.
    // The settings file is expected to contain JSON of an object with settings
    // key-value properties.
    const settingsDefaults = loadJsonFileSync(customDefaultSettingsFile);
    console.log(`Applying custom default settings from ${customDefaultSettingsFile}`);
    const configurationProperties = packageJSON.contributes.configuration.properties;
    const missingSettings = [];
    for (const [name, value] of Object.entries(settingsDefaults)) {
        const foundProperty = configurationProperties[name];
        if (foundProperty) {
            console.log(`\t- Setting custom default setting for "${name}" with value "${value}"`);
            foundProperty.default = value;
            packageJSONWasModified = true;
        }
        else {
            missingSettings.push(name);
        }
    }
    if (missingSettings.length > 0) {
        console.error('Failed to apply all custom settings. These settings were not found in the configuration in package.json:');
        for (const name of missingSettings) {
            console.error(`\t- ${name}`);
        }
        process.exit(1);
    }
    writeJsonFileSync('package.json', packageJSON);
}
if (releaseType === ReleaseType.Stable) {
    console.log('Removing experimental settings before the stable release...');
    try {
        const properties = packageJSON?.contributes?.configuration?.properties;
        if (properties) {
            for (const key in properties) {
                if (key.includes('.experimental.')) {
                    delete properties[key];
                }
            }
            fs_1.default.writeFileSync(packageJSONPath, JSON.stringify(packageJSON, null, 2), 'utf8');
        }
    }
    catch (error) {
        console.error('Error removing experimental settings', error);
        process.exit(1); // Exit with a non-zero status code in case of an error
    }
}
// Tokens are stored in the GitHub repository's secrets.
const tokens = {
    vscode: dryRun ? 'dry-run' : process.env.VSCODE_MARKETPLACE_TOKEN,
    openvsx: dryRun ? 'dry-run' : process.env.VSCODE_OPENVSX_TOKEN,
};
if (!tokens.vscode || !tokens.openvsx) {
    console.error('Missing required tokens.');
    process.exit(1);
}
// The insiders build is the stable version suffixed with "-" and the Unix time.
//
// For example: 0.4.4 in package.json -> 0.5.1689391131
const insidersVersion = semver_1.default
    .inc(packageJSONVersion, 'minor')
    ?.replace(/\.\d+$/, `.${Math.ceil(Date.now() / 1000)}`);
if (!insidersVersion) {
    console.error('Could not increment version for insiders release.');
    process.exit(1);
}
const version = releaseType === ReleaseType.Insiders ? insidersVersion : packageJSONVersion;
// Package (build and bundle) the extension.
console.error(`Packaging ${releaseType} release at version ${version}...`);
(0, child_process_1.execFileSync)('vsce', [
    'package',
    ...(releaseType === ReleaseType.Insiders
        ? [insidersVersion, '--pre-release', '--no-update-package-json', '--no-git-tag-version']
        : []),
    '--no-dependencies',
    '--out',
    'dist/cody.vsix',
], {
    stdio: 'inherit',
});
// Publish the extension.
console.error(`Publishing ${releaseType} release at version ${version}...`);
if (dryRun) {
    console.error('Dry run complete. Skipping publish step.');
}
else {
    // Publish to the VS Code Marketplace.
    (0, child_process_1.execFileSync)('vsce', [
        'publish',
        ...(releaseType === ReleaseType.Insiders ? ['--pre-release', '--no-git-tag-version'] : []),
        '--packagePath',
        'dist/cody.vsix',
    ], {
        env: { ...process.env, VSCE_PAT: tokens.vscode },
        stdio: 'inherit',
    });
    // Publish to the OpenVSX Registry.
    (0, child_process_1.execFileSync)('ovsx', [
        'publish',
        ...(releaseType === ReleaseType.Insiders ? ['--pre-release'] : []),
        '--packagePath',
        'dist/cody.vsix',
        '--pat',
        tokens.openvsx,
    ], {
        stdio: 'inherit',
    });
}
if (packageJSONWasModified) {
    // Restore original package.json, only if it was modified during build.
    fs_1.default.writeFileSync(packageJSONPath, packageJSONBody);
}
console.error('Done!');
function loadJsonFileSync(filename) {
    const filepath = path_1.default.join(process.cwd(), filename);
    const body = fs_1.default.readFileSync(filepath, 'utf-8');
    return JSON.parse(body);
}
function writeJsonFileSync(filename, data) {
    const filepath = path_1.default.join(process.cwd(), filename);
    const body = JSON.stringify(data, null, 2);
    fs_1.default.writeFileSync(filepath, body, 'utf8');
}
//# sourceMappingURL=release.js.map