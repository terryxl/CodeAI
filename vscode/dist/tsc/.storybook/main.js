"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vite_1 = require("vite");
const config = {
    stories: ['../webviews/**/*.story.@(js|jsx|ts|tsx)'],
    addons: ['@storybook/addon-links', '@storybook/addon-essentials', '@storybook/addon-interactions'],
    framework: {
        name: '@storybook/react-vite',
        options: {},
    },
    viteFinal: async (config) => {
        return (0, vite_1.mergeConfig)(config, { define: { 'process.env': {} } });
    },
};
exports.default = config;
