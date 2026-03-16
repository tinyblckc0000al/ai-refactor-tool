"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyGraph = void 0;
const path = __importStar(require("path"));
const pythonParser_1 = require("../parser/pythonParser");
/**
 * Simple dependency graph analyzer for Python
 */
class DependencyGraph {
    constructor() {
        this.parser = new pythonParser_1.PythonParser();
    }
    /**
     * Analyze Python code and extract dependencies
     */
    analyze(code, filePath) {
        const ast = this.parser.parse(code);
        const nodes = [];
        const edges = [];
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
    analyzeCalls(node, moduleName, edges) {
        const traverse = (n, currentFunction) => {
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
    getCallName(node) {
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
    toMermaid(graph) {
        let mermaid = 'graph TD\n';
        // Add nodes with styling
        for (const node of graph.nodes) {
            const shape = node.type === 'module' ? '([📦 ' : node.type === 'class' ? '[�aclass ' : '[[function ';
            const close = node.type === 'module' ? '])' : node.type === 'class' ? '])' : ']]';
            mermaid += `    ${node.id}${shape}${node.name}${close}\n`;
            // Add styling
            if (node.type === 'module') {
                mermaid += `    style ${node.id} fill:#f9f,stroke:#333\n`;
            }
            else if (node.type === 'class') {
                mermaid += `    style ${node.id} fill:#ff9,stroke:#333\n`;
            }
            else {
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
exports.DependencyGraph = DependencyGraph;
//# sourceMappingURL=dependencyGraph.js.map