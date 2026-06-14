declare module 'sql.js' {
  export interface Database {
    run(sql: string, params?: any[]): void
    prepare(sql: string): any
    exec(sql: string): any[]
    export(): Uint8Array
    close(): void
    getRowsModified(): number
  }

  export interface SqlJsStatic {
    Database: new (data?: Uint8Array) => Database
  }

  export default function initSqlJs(config?: { locateFile?: (file: string) => string; wasmBinary?: Uint8Array }): Promise<SqlJsStatic>
}
