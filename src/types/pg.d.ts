declare module 'pg' {
    export class Pool {
        constructor(config?: {
            connectionString?: string;
            max?: number;
            idleTimeoutMillis?: number;
            connectionTimeoutMillis?: number;
        });
        connect(): Promise<any>;
        query(text: string, params?: any[]): Promise<any>;
        end(): Promise<void>;
    }
}
