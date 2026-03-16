/**
 * Dependency relationship
 */
export interface Dependency {
    from: string;
    to: string;
    type: 'import' | 'call' | 'inherit' | 'attribute';
    line?: number;
}
/**
 * Dependency graph data
 */
export interface DependencyGraphData {
    nodes: Array<{
        id: string;
        type: 'module' | 'function' | 'class' | 'method';
        name: string;
        line?: number;
    }>;
    edges: Dependency[];
}
/**
 * Simple dependency graph analyzer for Python
 */
export declare class DependencyGraph {
    private parser;
    constructor();
    /**
     * Analyze Python code and extract dependencies
     */
    analyze(code: string, filePath: string): DependencyGraphData;
    /**
     * Analyze function calls within AST
     */
    private analyzeCalls;
    /**
     * Extract function name from Call node
     */
    private getCallName;
    /**
     * Generate Mermaid diagram from dependency graph
     */
    toMermaid(graph: DependencyGraphData): string;
}
//# sourceMappingURL=dependencyGraph.d.ts.map