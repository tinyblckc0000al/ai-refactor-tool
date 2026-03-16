import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { PythonParser, ASTNode } from '../parser/pythonParser';

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
export class DependencyGraph {
    private parser: PythonParser;

    constructor() {
        this.parser = new PythonParser();
    }

    /**
     * Analyze Python code and extract dependencies
     */
    analyze(code: string, filePath: string): DependencyGraphData {
        const ast = this.parser.parse(code);
        
        const nodes: Array<{id: string, type: 'module' | 'function' | 'class' | 'method', name: string, line?: number}> = [];
        const edges: Dependency[] = [];

        // Add current module as root node
        const moduleName = path.basename(filePath, '.py');
        nodes.push({
            id: moduleName,
            type: 'module',
            name: moduleName
        });

        // Extract imports
        const imports = this.parser.extractImports(ast);
        for (const imp of imports) {
            const impModule = imp.split('.')[0];
            if (!nodes.find(n => n.id === impModule)) {
                nodes.push({
                    id: impModule,
                    type: 'module',
                    name: impModule
                });
            }
            edges.push({
                from: moduleName,
                to: impModule,
                type: 'import'
            });
        }

        // Extract functions
        const functions = this.parser.extractFunctions(ast);
        for (const fn of functions) {
            const fnId = `${moduleName}:${fn.name}`;
            nodes.push({
                id: fnId,
                type: 'function',
                name: fn.name,
                line: fn.line
            });
            edges.push({
                from: moduleName,
                to: fnId,
                type: 'call'
            });
        }

        // Extract classes
        const classes = this.parser.extractClasses(ast);
        for (const cls of classes) {
            const clsId = `${moduleName}:${cls.name}`;
            nodes.push({
                id: clsId,
                type: 'class',
                name: cls.name,
                line: cls.line
            });
            edges.push({
                from: moduleName,
                to: clsId,
                type: 'inherit'
            });
        }

        // Analyze function calls
        this.analyzeCalls(ast, moduleName, edges);

        return { nodes, edges };
    }

    /**
     * Analyze function calls within AST
     */
    private analyzeCalls(node: ASTNode, moduleName: string, edges: Dependency[]): void {
        const traverse = (n: ASTNode, currentFunction?: string) => {
            // Track function definitions
            if (n.type === 'FunctionDef' || n.type === 'AsyncFunctionDef') {
                currentFunction = n.name;
            }

            // Track function calls
            if (n.type === 'Call') {
                const funcName = this.getCallName(n);
                if (funcName && funcName !== currentFunction) {
                    const sourceId = currentFunction 
                        ? `${moduleName}:${currentFunction}` 
                        : moduleName;
                    edges.push({
                        from: sourceId,
                        to: funcName,
                        type: 'call',
                        line: n.line
                    });
                }
            }

            if (n.children) {
                for (const child of n.children) {
                    traverse(child, currentFunction);
                }
            }
        };

        traverse(node);
    }

    /**
     * Extract function name from Call node
     */
    private getCallName(node: ASTNode): string | null {
        if (node.children) {
            for (const child of node.children) {
                if (child.type === 'Attribute') {
                    const value = child.children?.find(c => c.type === 'Name');
                    const attr = child.children?.find(c => c.type === 'attr');
                    if (value && attr) {
                        return `${value.name || 'unknown'}.${attr.name || 'unknown'}`;
                    }
                }
                if (child.type === 'Name') {
                    return child.name || null;
                }
            }
        }
        return null;
    }

    /**
     * Generate Mermaid diagram from dependency graph
     */
    toMermaid(graph: DependencyGraphData): string {
        let mermaid = 'graph TD\n';
        
        // Add nodes with styling
        for (const node of graph.nodes) {
            const shape = node.type === 'module' ? '([📦 ' : node.type === 'class' ? '[�aclass ' : '[[function ';
            const close = node.type === 'module' ? '])' : node.type === 'class' ? '])' : ']]';
            mermaid += `    ${node.id}${shape}${node.name}${close}\n`;
            
            // Add styling
            if (node.type === 'module') {
                mermaid += `    style ${node.id} fill:#f9f,stroke:#333\n`;
            } else if (node.type === 'class') {
                mermaid += `    style ${node.id} fill:#ff9,stroke:#333\n`;
            } else {
                mermaid += `    style ${node.id} fill:#9f9,stroke:#333\n`;
            }
        }

        // Add edges
        for (const edge of graph.edges) {
            const label = edge.type === 'import' ? '--import-->' : 
                          edge.type === 'call' ? '--calls-->' : 
                          edge.type === 'inherit' ? '--extends-->' : 
                          '--uses-->';
            mermaid += `    ${edge.from} ${label} ${edge.to}\n`;
        }

        return mermaid;
    }
}
