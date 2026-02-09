declare const pool: import("pg").Pool;
export declare const query: (text: string, params?: any[]) => Promise<import("pg").QueryResult<any>>;
export declare const getClient: () => Promise<import("pg").PoolClient>;
export declare const closePool: () => Promise<void>;
export default pool;
//# sourceMappingURL=connection.d.ts.map