"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VSCodeStoryDecorator = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const VSCodeStoryDecorator_module_css_1 = __importDefault(require("./VSCodeStoryDecorator.module.css"));
/**
 * A decorator for storybooks that makes them look like they're running in VS Code.
 */
const VSCodeStoryDecorator = story => ((0, jsx_runtime_1.jsx)("div", { className: VSCodeStoryDecorator_module_css_1.default.container, children: story() }));
exports.VSCodeStoryDecorator = VSCodeStoryDecorator;
