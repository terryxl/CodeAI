/// <reference types="node" />
import * as child_process from 'child_process';
import { type Frame, type FrameLocator, type Page } from '@playwright/test';
import { MockServer } from '../fixtures/mock-server';
export interface WorkspaceDirectory {
    workspaceDirectory: string;
}
interface WorkspaceSettings {
    [key: string]: string | boolean | number;
}
export interface ExtraWorkspaceSettings {
    extraWorkspaceSettings: WorkspaceSettings;
}
export interface DotcomUrlOverride {
    dotcomUrl: string | undefined;
}
export interface ExpectedEvents {
    expectedEvents: string[];
}
export declare const test: import("@playwright/test").TestType<import("@playwright/test").PlaywrightTestArgs & import("@playwright/test").PlaywrightTestOptions & WorkspaceDirectory & ExtraWorkspaceSettings & DotcomUrlOverride & ExpectedEvents & {
    server: MockServer;
} & {
    [key: string]: any;
} & {
    sidebar: Frame;
}, import("@playwright/test").PlaywrightWorkerArgs & import("@playwright/test").PlaywrightWorkerOptions>;
export declare function signOut(page: Page): Promise<void>;
export declare function executeCommandInPalette(page: Page, commandName: string): Promise<void>;
/**
 * Verifies that loggedEvents contain all of expectedEvents (in any order).
 */
export declare function assertEvents(loggedEvents: string[], expectedEvents: string[]): Promise<void>;
export declare function withTempDir<T>(f: (dir: string) => Promise<T>): Promise<T>;
export declare function spawn(...args: Parameters<typeof child_process.spawn>): Promise<void>;
export declare function openFile(page: Page, filename: string): Promise<void>;
export declare function newChat(page: Page): Promise<FrameLocator>;
export declare function withPlatformSlashes(input: string): string;
export declare function getMetaKeyByOS(): string;
export {};
//# sourceMappingURL=helpers.d.ts.map