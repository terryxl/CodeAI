import express from 'express';
export declare const SERVER_URL = "http://localhost:49300";
export declare const VALID_TOKEN = "sgp_1234567890123456789012345678901234567890";
export declare class GraphQlMock {
    private readonly container;
    private readonly operation;
    private response;
    private nextMock;
    constructor(container: MockServer, operation: string);
    replyJson(json: any): GraphQlMock;
    replyStatus(code: number, message?: string): GraphQlMock;
    next(): GraphQlMock;
    handleRequest(res: express.Response): void;
}
export declare class MockServer {
    readonly express: express.Express;
    graphQlMocks: Map<string, GraphQlMock>;
    constructor(express: express.Express);
    onGraphQl(operation: string): GraphQlMock;
    static run<T>(around: (server: MockServer) => Promise<T>): Promise<T>;
}
export declare function sendTestInfo(testName: string, testID: string, testRunID: string): void;
export declare let loggedEvents: string[];
export declare function resetLoggedEvents(): void;
//# sourceMappingURL=mock-server.d.ts.map