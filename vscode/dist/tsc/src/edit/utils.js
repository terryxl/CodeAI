"use strict";
// This cleans up the code returned by Cody based on current behavior
// ex. Remove  `tags:` that Cody sometimes include in the returned content
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentSanitizer = void 0;
const constants_1 = require("./prompt/constants");
// It also removes all spaces before a new line to keep the indentations
function contentSanitizer(text) {
    const FIXUP_TAG_TOPICS = `(${constants_1.PROMPT_TOPICS.OUTPUT}|${constants_1.PROMPT_TOPICS.SELECTED}|${constants_1.PROMPT_TOPICS.PRECEDING})`;
    const FIXUP_TAG_REGEX = new RegExp(`^\\s*<${FIXUP_TAG_TOPICS}>|<\\/${FIXUP_TAG_TOPICS}>\\s*$`, 'g');
    let output = text.replaceAll(FIXUP_TAG_REGEX, '');
    const tagsIndex = text.indexOf('tags:');
    if (tagsIndex !== -1) {
        // NOTE: 6 is the length of `tags:` + 1 space
        output = output.slice(tagsIndex + 6);
    }
    return output.replace(/^\s*\n/, '');
}
exports.contentSanitizer = contentSanitizer;
