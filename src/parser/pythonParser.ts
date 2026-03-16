import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

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
export class PythonParser {
    private tempFile: string;

    constructor() {
        this.tempFile = path.join(__dirname, '__temp_ast__.py');
    }

    /**
     * Parse Python code to AST
     */
    parse(code: string): ASTNode {
        // Write code to temp file for ast module to parse
        fs.writeFileSync(this.tempFile, code, 'utf-8');

        try {
            // Use Python's ast module to parse
            const pythonScript = `
import ast
import json

with open('${this.tempFile.replace(/\\/g, '\\\\')}', 'r') as f:
    code = f.read()

tree = ast.parse(code)

def node_to_dict(node):
    result = {
        'type': type(node).__name__,
        'line': getattr(node, 'lineno', 0) or 0,
        'column': getattr(node, 'col_offset', 0) or 0,
    }
    if hasattr(node, 'end_lineno') and node.end_lineno:
        result['endLine'] = node.end_lineno
    if hasattr(node, 'end_col_offset') and node.end_col_offset:
        result['endColumn'] = node.end_col_offset
    
    # Get name for functions, classes, imports
    if hasattr(node, 'name') and node.name:
        result['name'] = node.name
    if hasattr(node, 'id') and node.id:
        result['name'] = node.id
    if hasattr(node, 'asname') and node.asname:
        result['asname'] = node.asname
    if hasattr(node, 'alias') and node.alias:
        result['alias'] = node.alias
    
    # Get value for constants
    if hasattr(node, 'value') and node.value:
        if isinstance(node.value, (str, int, float, bool)):
            result['value'] = str(node.value)
    
    # Process children
    children = []
    for child in ast.iter_child_nodes(node):
        children.append(node_to_dict(child))
    if children:
        result['children'] = children
    
    return result

result = node_to_dict(tree)
print(json.dumps(result))
`;

            const output = execSync(`python3 -c "${pythonScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, {
                encoding: 'utf-8',
                maxBuffer: 10 * 1024 * 1024
            });

            return JSON.parse(output.trim());
        } catch (error) {
            throw new Error(`Failed to parse Python code: ${error}`);
        }
    }

    /**
     * Extract imports from AST
     */
    extractImports(ast: ASTNode): string[] {
        const imports: string[] = [];

        const traverse = (node: ASTNode) => {
            if (node.type === 'Import' && node.children) {
                for (const child of node.children) {
                    if (child.type === 'alias' && child.name) {
                        imports.push(child.name);
                    }
                }
            }
            if (node.type === 'ImportFrom' && node.children) {
                let module = '';
                for (const child of node.children) {
                    if (child.type === 'module' && child.name) {
                        module = child.name;
                    }
                    if (child.type === 'alias' && child.name) {
                        imports.push(module ? `${module}.${child.name}` : child.name);
                    }
                }
            }
            if (node.children) {
                for (const child of node.children) {
                    traverse(child);
                }
            }
        };

        traverse(ast);
        return imports;
    }

    /**
     * Extract functions from AST
     */
    extractFunctions(ast: ASTNode): Array<{name: string, line: number, params: number}> {
        const functions: Array<{name: string, line: number, params: number}> = [];

        const traverse = (node: ASTNode) => {
            if (node.type === 'FunctionDef' || node.type === 'AsyncFunctionDef') {
                const params = node.children?.filter(c => c.type === 'arguments').length || 0;
                functions.push({
                    name: node.name || 'anonymous',
                    line: node.line,
                    params
                });
            }
            if (node.children) {
                for (const child of node.children) {
                    traverse(child);
                }
            }
        };

        traverse(ast);
        return functions;
    }

    /**
     * Extract classes from AST
     */
    extractClasses(ast: ASTNode): Array<{name: string, line: number}> {
        const classes: Array<{name: string, line: number}> = [];

        const traverse = (node: ASTNode) => {
            if (node.type === 'ClassDef') {
                classes.push({
                    name: node.name || 'Unknown',
                    line: node.line
                });
            }
            if (node.children) {
                for (const child of node.children) {
                    traverse(child);
                }
            }
        };

        traverse(ast);
        return classes;
    }
}
