/**
 * AST Node representation
 */
export interface ASTNode {
    type: string;
    name?: string;
    line: number;
    column: number;
    endLine?: number;
    endColumn?: number;
    children?: ASTNode[];
    value?: string;
}
/**
 * Python AST Parser using Python's ast module
 */
export declare class PythonParser {
    private tempFile;
    constructor();
    /**
     * Parse Python code to AST
     */
    parse(code: string): ASTNode;
    /**
     * Extract imports from AST
     */
    extractImports(ast: ASTNode): string[];
    /**
     * Extract functions from AST
     */
    extractFunctions(ast: ASTNode): Array<{
        name: string;
        line: number;
        params: number;
    }>;
    /**
     * Extract classes from AST
     */
    extractClasses(ast: ASTNode): Array<{
        name: string;
        line: number;
    }>;
}
//# sourceMappingURL=pythonParser.d.ts.map