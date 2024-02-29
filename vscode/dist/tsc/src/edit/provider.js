"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditProvider = void 0;
const vscode_uri_1 = require("vscode-uri");
const cody_shared_1 = require("@sourcegraph/cody-shared");
const new_test_file_1 = require("../commands/utils/new-test-file");
const log_1 = require("../log");
const AuthProvider_1 = require("../services/AuthProvider");
const prompt_1 = require("./prompt");
const constants_1 = require("./prompt/constants");
const utils_1 = require("./utils");
const workspace_files_1 = require("../commands/utils/workspace-files");
const vscode_1 = require("vscode");
const utils_2 = require("../non-stop/utils");
const utilts_1 = require("../models/utilts");
const telemetry_1 = require("../services/telemetry");
const code_count_1 = require("../services/utils/code-count");
const telemetry_v2_1 = require("../services/telemetry-v2");
class EditProvider {
    config;
    cancelCompletionCallback = null;
    insertionResponse = null;
    insertionInProgress = false;
    insertionPromise = null;
    constructor(config) {
        this.config = config;
    }
    async startEdit() {
        return (0, cody_shared_1.wrapInActiveSpan)('command.edit.start', async (span) => {
            const model = this.config.task.model;
            const contextWindow = (0, utilts_1.getContextWindowForModel)(this.config.authProvider.getAuthStatus(), model);
            const { messages, stopSequences, responseTopic, responsePrefix } = await (0, prompt_1.buildInteraction)({
                model,
                contextWindow,
                task: this.config.task,
                editor: this.config.editor,
            });
            const multiplexer = new cody_shared_1.BotResponseMultiplexer();
            const typewriter = new cody_shared_1.Typewriter({
                update: content => {
                    void this.handleResponse(content, true);
                },
                close: () => { },
            });
            let text = '';
            multiplexer.sub(responseTopic, {
                onResponse: async (content) => {
                    text += content;
                    typewriter.update(responsePrefix + text);
                    return Promise.resolve();
                },
                onTurnComplete: async () => {
                    typewriter.close();
                    typewriter.stop();
                    void this.handleResponse(text, false);
                    return Promise.resolve();
                },
            });
            // Listen to test file name suggestion from responses
            // Allows Cody to let us know which test file we should add the new content to
            if (this.config.task.intent === 'test') {
                let filepath = '';
                multiplexer.sub(constants_1.PROMPT_TOPICS.FILENAME, {
                    onResponse: async (content) => {
                        filepath += content;
                        void this.handleFileCreationResponse(filepath, true);
                        return Promise.resolve();
                    },
                    onTurnComplete: async () => {
                        return Promise.resolve();
                    },
                });
            }
            const abortController = new AbortController();
            this.cancelCompletionCallback = () => abortController.abort();
            const stream = this.config.chat.chat(messages, { model, stopSequences }, abortController.signal);
            let textConsumed = 0;
            for await (const message of stream) {
                switch (message.type) {
                    case 'change': {
                        if (textConsumed === 0 && responsePrefix) {
                            void multiplexer.publish(responsePrefix);
                        }
                        const text = message.text.slice(textConsumed);
                        textConsumed += text.length;
                        void multiplexer.publish(text);
                        break;
                    }
                    case 'complete': {
                        void multiplexer.notifyTurnComplete();
                        break;
                    }
                    case 'error': {
                        let err = message.error;
                        (0, log_1.logError)('EditProvider:onError', err.message);
                        if ((0, cody_shared_1.isAbortError)(err)) {
                            void this.handleResponse(text, false);
                            return;
                        }
                        if ((0, AuthProvider_1.isNetworkError)(err)) {
                            err = new Error('Cody could not respond due to network error.');
                        }
                        // Display error message as assistant response
                        this.handleError(err);
                        console.error(`Completion request failed: ${err.message}`);
                        break;
                    }
                }
            }
        });
    }
    abortEdit() {
        this.cancelCompletionCallback?.();
    }
    async handleResponse(response, isMessageInProgress) {
        // Error state: The response finished but we didn't receive any text
        if (!response && !isMessageInProgress) {
            this.handleError(new Error('Cody did not respond with any text'));
        }
        if (!response) {
            return;
        }
        // If the response finished and we didn't receive a test file name suggestion,
        // we will create one manually before inserting the response to the new test file
        if (this.config.task.intent === 'test' && !this.config.task.destinationFile) {
            if (isMessageInProgress) {
                return;
            }
            await this.handleFileCreationResponse('', isMessageInProgress);
        }
        if (!isMessageInProgress) {
            telemetry_1.telemetryService.log('CodyVSCodeExtension:fixupResponse:hasCode', {
                ...(0, code_count_1.countCode)(response),
                source: this.config.task.source,
                hasV2Event: true,
            });
            const endpoint = this.config.authProvider?.getAuthStatus()?.endpoint;
            const responseText = endpoint && (0, cody_shared_1.isDotCom)(endpoint) ? response : undefined;
            telemetry_v2_1.telemetryRecorder.recordEvent('cody.fixup.response', 'hasCode', {
                metadata: (0, code_count_1.countCode)(response),
                privateMetadata: {
                    source: this.config.task.source,
                    responseText,
                },
            });
        }
        const intentsForInsert = ['add', 'test'];
        return intentsForInsert.includes(this.config.task.intent)
            ? this.handleFixupInsert(response, isMessageInProgress)
            : this.handleFixupEdit(response, isMessageInProgress);
    }
    /**
     * Display an erred codelens to the user on failed fixup apply.
     * Will allow the user to view the error in more detail if needed.
     */
    handleError(error) {
        this.config.controller.error(this.config.task.id, error);
    }
    async handleFixupEdit(response, isMessageInProgress) {
        return this.config.controller.didReceiveFixupText(this.config.task.id, (0, utils_1.contentSanitizer)(response), isMessageInProgress ? 'streaming' : 'complete');
    }
    async handleFixupInsert(response, isMessageInProgress) {
        this.insertionResponse = response;
        this.insertionInProgress = isMessageInProgress;
        if (this.insertionPromise) {
            // Already processing an insertion, wait for it to finish
            return;
        }
        return this.processInsertionQueue();
    }
    async processInsertionQueue() {
        while (this.insertionResponse !== null) {
            const responseToSend = this.insertionResponse;
            this.insertionResponse = null;
            this.insertionPromise = this.config.controller.didReceiveFixupInsertion(this.config.task.id, (0, utils_1.contentSanitizer)(responseToSend), this.insertionInProgress ? 'streaming' : 'complete');
            try {
                await this.insertionPromise;
            }
            finally {
                this.insertionPromise = null;
            }
        }
    }
    async handleFileCreationResponse(text, isMessageInProgress) {
        const task = this.config.task;
        if (task.state !== utils_2.CodyTaskState.pending) {
            return;
        }
        // Has already been created when set
        if (task.destinationFile) {
            return;
        }
        // Manually create the file if no name was suggested
        if (!text.length && !isMessageInProgress) {
            // an existing test file from codebase
            const cbTestFileUri = task.contextMessages?.find(m => m?.file?.uri?.fsPath?.includes('test'))
                ?.file?.uri;
            if (cbTestFileUri) {
                const testFileUri = (0, new_test_file_1.convertFileUriToTestFileUri)(task.fixupFile.uri, cbTestFileUri);
                const fileExists = await (0, workspace_files_1.doesFileExist)(testFileUri);
                // create a file uri with untitled scheme that would work on windows
                const newFileUri = fileExists ? testFileUri : testFileUri.with({ scheme: 'untitled' });
                await this.config.controller.didReceiveNewFileRequest(this.config.task.id, newFileUri);
                return;
            }
            // Create a new untitled file if the suggested file does not exist
            const currentFile = task.fixupFile.uri;
            const currentDoc = await vscode_1.workspace.openTextDocument(currentFile);
            const newDoc = await vscode_1.workspace.openTextDocument({ language: currentDoc?.languageId });
            await this.config.controller.didReceiveNewFileRequest(this.config.task.id, newDoc.uri);
            return;
        }
        const opentag = `<${constants_1.PROMPT_TOPICS.FILENAME}>`;
        const closetag = `</${constants_1.PROMPT_TOPICS.FILENAME}>`;
        const currentFileUri = task.fixupFile.uri;
        const currentFileName = (0, cody_shared_1.uriBasename)(currentFileUri);
        // remove open and close tags from text
        const newFileName = text.trim().replaceAll(new RegExp(`${opentag}(.*)${closetag}`, 'g'), '$1');
        const haveSameExtensions = cody_shared_1.posixFilePaths.extname(currentFileName) === cody_shared_1.posixFilePaths.extname(newFileName);
        // Create a new file uri by replacing the file name of the currentFileUri with fileName
        let newFileUri = vscode_uri_1.Utils.joinPath(currentFileUri, '..', newFileName);
        if (haveSameExtensions && !task.destinationFile) {
            const fileIsFound = await (0, workspace_files_1.doesFileExist)(newFileUri);
            if (!fileIsFound) {
                newFileUri = newFileUri.with({ scheme: 'untitled' });
            }
            this.insertionPromise = this.config.controller.didReceiveNewFileRequest(task.id, newFileUri);
            try {
                await this.insertionPromise;
            }
            catch (error) {
                this.handleError(new Error('Cody failed to generate unit tests', { cause: error }));
            }
            finally {
                this.insertionPromise = null;
            }
        }
    }
}
exports.EditProvider = EditProvider;
