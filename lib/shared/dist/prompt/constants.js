const DEFAULT_MAX_TOKENS = 7000;
export const ANSWER_TOKENS = 1000;
const CODY_INTRO_TOKENS = 1000;
export const MAX_HUMAN_INPUT_TOKENS = 1000;
export const MAX_CURRENT_FILE_TOKENS = 1000;
export const MAX_AVAILABLE_PROMPT_LENGTH = DEFAULT_MAX_TOKENS - ANSWER_TOKENS - CODY_INTRO_TOKENS;
export const CHARS_PER_TOKEN = 4;
export const SURROUNDING_LINES = 50;
export const NUM_CODE_RESULTS = 12;
export const NUM_TEXT_RESULTS = 3;
export const MAX_BYTES_PER_FILE = 4096;
export function tokensToChars(tokens) {
    return tokens * CHARS_PER_TOKEN;
}
//# sourceMappingURL=constants.js.map