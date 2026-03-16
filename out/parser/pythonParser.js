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
exports.PythonParser = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
/**
 * Python AST Parser using Python's ast module
 */
class PythonParser {
    constructor() {
        this.tempFile = path.join(__dirname, '__temp_ast__.py');
    }
    /**
     * Parse Python code to AST
     */
    parse(code) {
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
            const output = (0, child_process_1.execSync)(`python3 -c "${pythonScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, {
                encoding: 'utf-8',
                maxBuffer: 10 * 1024 * 1024
            });
            return JSON.parse(output.trim());
        }
        catch (error) {
            throw new Error(`Failed to parse Python code: ${error}`);
        }
    }
    /**
     * Extract imports from AST
     */
    extractImports(ast) {
        const imports = [];
        const traverse = (node) => {
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
    extractFunctions(ast) {
        const functions = [];
        const traverse = (node) => {
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
    extractClasses(ast) {
        const classes = [];
        const traverse = (node) => {
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
exports.PythonParser = PythonParser;
//# sourceMappingURL=pythonParser.js.map