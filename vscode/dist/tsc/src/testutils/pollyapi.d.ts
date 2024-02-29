interface Response {
    status: number;
    body: any;
}
export declare class PollyYamlWriter {
    private readonly recordingsDir;
    constructor(recordingsDir: string);
    getRecording(recording: string): Response;
    saveRecording(recording: string, data: any): Response;
    deleteRecording(recording: string): Response;
    filenameFor(recording: string): string;
    respond(status: number, body?: any): Response;
}
export {};
//# sourceMappingURL=pollyapi.d.ts.map