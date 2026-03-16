#!/usr/bin/env node
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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
function parseArgs(args) {
    const options = {
        command: args[0] || 'help',
        targetPath: args[1] || '.',
        graph: false,
        format: 'text'
    };
    // Parse flags
    for (let i = 2; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--graph' || arg === '-g') {
            options.graph = true;
            options.format = 'mermaid';
        }
        else if (arg === '--json') {
            options.format = 'json';
        }
        else if (arg === '--output' || arg === '-o') {
            options.output = args[++i];
        }
    }
    return options;
}
/**
 * Python AST Parser using Python's ast module
 */
class PythonParser {
    constructor() {
        this.tempFile = '/tmp/__temp_ast__.py';
    }
    parse(code) {
        fs.writeFileSync(this.tempFile, code, 'utf-8');
        try {
            // Write Python script to temp file and execute
            const scriptFile = '/tmp/__ast_parser__.py';
            const pythonScript = `
import ast
import json

with open('${this.tempFile}', 'r') as f:
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
    
    if hasattr(node, 'name') and node.name:
        result['name'] = node.name
    if hasattr(node, 'id') and node.id:
        result['name'] = node.id
    if hasattr(node, 'asname') and node.asname:
        result['asname'] = node.asname
    if hasattr(node, 'alias') and node.alias:
        result['alias'] = node.alias
    if hasattr(node, 'value') and node.value:
        if isinstance(node.value, (str, int, float, bool)):
            result['value'] = str(node.value)
    if hasattr(node, 'module') and node.module:
        result['module'] = node.module
    
    children = []
    for child in ast.iter_child_nodes(node):
        children.append(node_to_dict(child))
    if children:
        result['children'] = children
    
    return result

result = node_to_dict(tree)
print(json.dumps(result))
`;
            fs.writeFileSync(scriptFile, pythonScript, 'utf-8');
            const output = (0, child_process_1.execSync)(`python3 "${scriptFile}"`, {
                encoding: 'utf-8',
                maxBuffer: 10 * 1024 * 1024
            });
            return JSON.parse(output.trim());
        }
        catch (error) {
            throw new Error(`Failed to parse Python code: ${error}`);
        }
    }
    extractImports(ast) {
        const imports = [];
        const seen = new Set();
        const traverse = (node) => {
            if (node.type === 'Import' && node.children) {
                for (const child of node.children) {
                    if (child.type === 'alias' && child.name) {
                        imports.push(child.name);
                    }
                }
            }
            if (node.type === 'ImportFrom' && node.module) {
                if (node.children) {
                    for (const child of node.children) {
                        if (child.type === 'alias' && child.name) {
                            const key = node.module + '.' + child.name;
                            if (!seen.has(key)) {
                                seen.add(key);
                                imports.push(key);
                            }
                        }
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
    extractFunctions(ast) {
        const functions = [];
        const traverse = (node) => {
            if (node.type === 'FunctionDef' || node.type === 'AsyncFunctionDef') {
                functions.push({
                    name: node.name || 'anonymous',
                    line: node.line,
                    params: 0
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
    extractClasses(ast) {
        const classes = [];
        const traverse = (node) => {
            if (node.type === 'ClassDef') {
                const baseClasses = [];
                if (node.children) {
                    for (const child of node.children) {
                        if (child.type === 'Name' && child.name) {
                            baseClasses.push(child.name);
                        }
                    }
                }
                classes.push({
                    name: node.name || 'Unknown',
                    line: node.line,
                    baseClasses
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
    /**
     * Extract function calls (caller -> callee)
     */
    extractFunctionCalls(ast, currentFunction) {
        const calls = [];
        const traverse = (node, funcName) => {
            // Track current function
            if (node.type === 'FunctionDef' || node.type === 'AsyncFunctionDef') {
                funcName = node.name || 'anonymous';
            }
            // Found a function call
            if (node.type === 'Call' && node.children && node.children.length > 0) {
                const firstChild = node.children[0];
                if (firstChild.type === 'Name' && firstChild.name && funcName) {
                    // Skip self-calls and builtins
                    if (firstChild.name !== funcName && !['print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'set', 'tuple', 'bool', 'type', 'isinstance', 'hasattr', 'getattr', 'setattr'].includes(firstChild.name)) {
                        calls.push({
                            caller: funcName,
                            callee: firstChild.name,
                            line: node.line
                        });
                    }
                }
            }
            if (node.children) {
                for (const child of node.children) {
                    traverse(child, funcName);
                }
            }
        };
        traverse(ast, currentFunction);
        return calls;
    }
    /**
     * Extract all data: imports, functions, classes, calls
     */
    extractAll(ast) {
        return {
            imports: this.extractImports(ast),
            functions: this.extractFunctions(ast),
            classes: this.extractClasses(ast),
            calls: this.extractFunctionCalls(ast, null)
        };
    }
}
class MultiFileDependencyGraph {
    constructor() {
        this.fileModules = new Map();
        this.parser = new PythonParser();
    }
    /**
     * Analyze all Python files in a directory
     */
    analyzeDirectory(dirPath) {
        const nodes = [];
        const edges = [];
        // Find all Python files
        const pyFiles = this.findPythonFiles(dirPath);
        console.log(`Found ${pyFiles.length} Python files`);
        // First pass: register all module names
        for (const filePath of pyFiles) {
            const relativePath = path.relative(dirPath, filePath);
            const moduleName = path.basename(filePath, '.py');
            const fullModuleName = relativePath.replace(/\//g, '.').replace(/\.py$/, '');
            this.fileModules.set(moduleName, fullModuleName);
        }
        // Second pass: analyze dependencies
        for (const filePath of pyFiles) {
            const relativePath = path.relative(dirPath, filePath);
            const code = fs.readFileSync(filePath, 'utf-8');
            const ast = this.parser.parse(code);
            const moduleName = path.basename(filePath, '.py');
            const fullModuleName = relativePath.replace(/\//g, '.').replace(/\.py$/, '');
            // Add module node
            nodes.push({
                id: fullModuleName,
                type: 'module',
                name: moduleName,
                file: relativePath
            });
            // Extract imports
            const imports = this.parser.extractImports(ast);
            const addedEdges = new Set();
            for (const imp of imports) {
                const resolvedModule = this.resolveImport(imp, dirPath, filePath);
                const edgeKey = `${fullModuleName}->${resolvedModule}`;
                if (resolvedModule && resolvedModule !== fullModuleName && !addedEdges.has(edgeKey)) {
                    addedEdges.add(edgeKey);
                    edges.push({
                        from: fullModuleName,
                        to: resolvedModule,
                        type: 'import'
                    });
                }
            }
            // Extract functions
            const functions = this.parser.extractFunctions(ast);
            for (const fn of functions) {
                const fnId = `${fullModuleName}:${fn.name}`;
                nodes.push({
                    id: fnId,
                    type: 'function',
                    name: fn.name,
                    file: relativePath,
                    line: fn.line
                });
            }
            // Extract classes
            const classes = this.parser.extractClasses(ast);
            for (const cls of classes) {
                const clsId = `${fullModuleName}:${cls.name}`;
                nodes.push({
                    id: clsId,
                    type: 'class',
                    name: cls.name,
                    file: relativePath,
                    line: cls.line
                });
                // Add inheritance edges
                for (const base of cls.baseClasses) {
                    const resolvedBase = this.resolveImport(base, dirPath, filePath);
                    if (resolvedBase && resolvedBase !== fullModuleName) {
                        edges.push({
                            from: clsId,
                            to: resolvedBase,
                            type: 'inherit'
                        });
                    }
                }
            }
            // Extract function calls
            const calls = this.parser.extractFunctionCalls(ast, null);
            for (const call of calls) {
                // Try to resolve the callee to a known function
                const calleeId = `${fullModuleName}:${call.callee}`;
                const resolvedCallee = this.resolveCall(call.callee, fullModuleName);
                if (resolvedCallee && resolvedCallee !== calleeId) {
                    edges.push({
                        from: calleeId,
                        to: resolvedCallee,
                        type: 'call',
                        line: call.line
                    });
                }
            }
        }
        return { nodes, edges };
    }
    /**
     * Resolve a function call to a known function
     */
    resolveCall(calleeName, currentModule) {
        // Check if it's a known function in our nodes
        const key = `${currentModule}:${calleeName}`;
        // Try to find in other modules
        for (const [modName, fullModName] of this.fileModules) {
            if (modName === calleeName) {
                return fullModName;
            }
        }
        return null;
    }
    /**
     * Resolve import to local module
     */
    resolveImport(imp, dirPath, currentFile) {
        // Get the root module (before any .)
        const impModule = imp.split('.')[0];
        // Try to find the module in analyzed files first
        for (const [modName, fullModName] of this.fileModules) {
            if (modName === impModule || fullModName.endsWith(impModule)) {
                return fullModName;
            }
        }
        // Check if file exists locally
        const possiblePaths = [
            path.join(dirPath, impModule + '.py'),
            path.join(dirPath, impModule, '__init__.py')
        ];
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                const relativePath = path.relative(dirPath, p);
                return relativePath.replace(/\//g, '.').replace(/\.py$/, '').replace(/^\\./, '');
            }
        }
        return null;
    }
    /**
     * Find circular dependencies
     */
    findCircularDeps(graph) {
        const cycles = [];
        const visited = new Set();
        const recursionStack = new Set();
        const pathStack = [];
        // Build adjacency list for modules only
        const moduleEdges = new Map();
        for (const edge of graph.edges) {
            if (edge.type === 'import') {
                if (!moduleEdges.has(edge.from)) {
                    moduleEdges.set(edge.from, new Set());
                }
                moduleEdges.get(edge.from).add(edge.to);
            }
        }
        const dfs = (node) => {
            visited.add(node);
            recursionStack.add(node);
            pathStack.push(node);
            const neighbors = moduleEdges.get(node);
            if (neighbors) {
                for (const neighbor of neighbors) {
                    if (!visited.has(neighbor)) {
                        dfs(neighbor);
                    }
                    else if (recursionStack.has(neighbor)) {
                        // Found cycle
                        const cycleStart = pathStack.indexOf(neighbor);
                        cycles.push([...pathStack.slice(cycleStart), neighbor]);
                    }
                }
            }
            pathStack.pop();
            recursionStack.delete(node);
        };
        // Start DFS from each unvisited node
        for (const node of moduleEdges.keys()) {
            if (!visited.has(node)) {
                dfs(node);
            }
        }
        return cycles;
    }
    /**
     * Generate Mermaid diagram
     */
    toMermaid(graph) {
        let mermaid = '```mermaid\ngraph TD\n';
        // Add styling
        mermaid += '    classDef module fill:#e3f2fd,stroke:#1565c0,stroke-width:2px\n';
        mermaid += '    classDef class fill:#fff3e0,stroke:#e65100,stroke-width:2px\n';
        mermaid += '    classDef function fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px\n\n';
        // Add nodes
        const modules = graph.nodes.filter(n => n.type === 'module');
        const classes = graph.nodes.filter(n => n.type === 'class');
        const functions = graph.nodes.filter(n => n.type === 'function');
        for (const node of modules) {
            const label = node.file ? `${node.name}\\n(${node.file})` : node.name;
            mermaid += `    ${node.id}["📦 ${label}"]:::module\n`;
        }
        for (const node of classes) {
            mermaid += `    ${node.id}["🏠 ${node.name}"]:::class\n`;
        }
        for (const node of functions) {
            mermaid += `    ${node.id}["⚡ ${node.name}"]:::function\n`;
        }
        // Add edges
        for (const edge of graph.edges) {
            if (edge.type === 'import') {
                mermaid += `    ${edge.from} --imports--> ${edge.to}\n`;
            }
            else if (edge.type === 'inherit') {
                mermaid += `    ${edge.from} --extends--> ${edge.to}\n`;
            }
            else if (edge.type === 'call') {
                mermaid += `    ${edge.from} --calls--> ${edge.to}\n`;
            }
        }
        mermaid += '```\n';
        return mermaid;
    }
    /**
     * Find Python files recursively
     */
    findPythonFiles(dir) {
        const files = [];
        const traverse = (dir) => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== '__pycache__') {
                    traverse(fullPath);
                }
                else if (entry.isFile() && entry.name.endsWith('.py')) {
                    files.push(fullPath);
                }
            }
        };
        traverse(dir);
        return files;
    }
}
/**
 * Rename a function/variable/class in a Python file
 */
function renameInFile(filePath, oldName, newName, outputPath) {
    const code = fs.readFileSync(filePath, 'utf-8');
    const ast = parser.parse(code);
    // Find all occurrences of the name
    const locations = findNameLocations(ast, oldName);
    if (locations.definitions.length === 0 && locations.references.length === 0) {
        console.error(`❌ Name '${oldName}' not found in the code`);
        process.exit(1);
    }
    console.log(`Found ${locations.definitions.length} definition(s) and ${locations.references.length} reference(s)`);
    // Perform rename via Python script
    const scriptFile = '/tmp/__rename__.py';
    const pythonScript = `
import ast

file_path = "${filePath.replace('\\', '\\\\')}"
old_name = "${oldName}"
new_name = "${newName}"

with open(file_path, 'r') as f:
    source = f.read()

tree = ast.parse(source)

class RenameVisitor(ast.NodeTransformer):
    def __init__(self, old_name, new_name):
        self.old_name = old_name
        self.new_name = new_name
    
    def visit_Name(self, node):
        if node.id == self.old_name:
            node.id = self.new_name
        return node
    
    def visit_FunctionDef(self, node):
        if node.name == self.old_name:
            node.name = self.new_name
        self.generic_visit(node)
        return node
    
    def visit_AsyncFunctionDef(self, node):
        if node.name == self.old_name:
            node.name = self.new_name
        self.generic_visit(node)
        return node
    
    def visit_ClassDef(self, node):
        if node.name == self.old_name:
            node.name = self.new_name
        self.generic_visit(node)
        return node
    
    def visit_Attribute(self, node):
        if isinstance(node.value, ast.Name):
            if node.value.id == self.old_name:
                node.value.id = self.new_name
        self.generic_visit(node)
        return node

transformer = RenameVisitor(old_name, new_name)
new_tree = transformer.visit(tree)
ast.fix_missing_locations(new_tree)
new_source = ast.unparse(new_tree)

print(new_source, end='')
`;
    fs.writeFileSync(scriptFile, pythonScript, 'utf-8');
    const newSource = (0, child_process_1.execSync)(`python3 "${scriptFile}"`, { encoding: 'utf-8' });
    const output = outputPath || filePath;
    // Backup original if overwriting
    if (!outputPath) {
        const backupPath = filePath + '.bak';
        fs.writeFileSync(backupPath, code, 'utf-8');
        console.log(`📦 Backed up original to: ${backupPath}`);
    }
    fs.writeFileSync(output, newSource, 'utf-8');
    console.log(`✅ Renamed '${oldName}' -> '${newName}'`);
    console.log(`📁 Saved to: ${output}`);
}
/**
 * Find all locations of a name in AST
 */
function findNameLocations(ast, name) {
    const locations = { definitions: [], references: [] };
    const traverse = (node) => {
        if ((node.type === 'FunctionDef' || node.type === 'AsyncFunctionDef') && node.name === name) {
            locations.definitions.push({ type: 'function', line: node.line, name });
        }
        if (node.type === 'ClassDef' && node.name === name) {
            locations.definitions.push({ type: 'class', line: node.line, name });
        }
        if (node.type === 'Name' && node.name === name) {
            locations.references.push({ type: 'name', line: node.line });
        }
        if (node.children) {
            for (const child of node.children) {
                traverse(child);
            }
        }
    };
    traverse(ast);
    return locations;
}
/**
 * Extract a variable from a specific line
 */
function extractVariable(filePath, varName, targetLine, outputPath) {
    const code = fs.readFileSync(filePath, 'utf-8');
    // Use Python to perform the extraction
    const scriptFile = '/tmp/__extract__.py';
    const pythonScript = `
import ast
import sys

file_path = "${filePath.replace('\\', '\\\\')}"
var_name = "${varName}"
target_line = ${targetLine}

with open(file_path, 'r') as f:
    source = f.read()

lines = source.split('\n')

tree = ast.parse(source)

class AssignFinder(ast.NodeVisitor):
    def __init__(self, line_no):
        self.line_no = line_no
        self.assignment = None
    
    def visit_Assign(self, node):
        if node.lineno == self.line_no:
            if node.targets and isinstance(node.targets[0], ast.Name):
                self.assignment = {
                    'type': 'Assign',
                    'var': node.targets[0].id,
                    'value': ast.unparse(node.value),
                }
        self.generic_visit(node)
    
    def visit_AnnAssign(self, node):
        if node.lineno == self.line_no:
            if isinstance(node.target, ast.Name):
                self.assignment = {
                    'type': 'AnnAssign',
                    'var': node.target.id,
                    'value': ast.unparse(node.value) if node.value else None,
                    'annotated': True,
                    'annotation': ast.unparse(node.annotation) if node.annotation else None
                }
        self.generic_visit(node)

finder = AssignFinder(target_line)
finder.visit(tree)

if not finder.assignment:
    print(f"Error: Line {target_line} is not a valid assignment statement", file=sys.stderr)
    sys.exit(1)

assignment = finder.assignment
original_var = assignment['var']
value_expr = assignment['value']

target_content = lines[target_line - 1]
target_indent = len(target_content) - len(target_content.lstrip())
indent_str = ' ' * target_indent

class DefFinder(ast.NodeVisitor):
    def __init__(self, target_line):
        self.target_line = target_line
        self.containing_def = None
    
    def visit_FunctionDef(self, node):
        if node.lineno <= self.target_line:
            self.containing_def = ('function', node.lineno)
        self.generic_visit(node)
    
    def visit_AsyncFunctionDef(self, node):
        if node.lineno <= self.target_line:
            self.containing_def = ('function', node.lineno)
        self.generic_visit(node)
    
    def visit_ClassDef(self, node):
        if node.lineno <= self.target_line:
            self.containing_def = ('class', node.lineno)
        self.generic_visit(node)

def_finder = DefFinder(target_line)
def_finder.visit(tree)

insert_pos = def_finder.containing_def[1] if def_finder.containing_def else 0

for i in range(insert_pos, len(lines)):
    if lines[i].strip():
        insert_pos = i + 1
        break

if assignment.get('annotated'):
    new_var_line = f"{indent_str}{var_name}: {assignment['annotation']} = {value_expr}"
else:
    new_var_line = f"{indent_str}{var_name} = {value_expr}"

new_target_line = f"{indent_str}{original_var} = {var_name}"

new_lines = lines[:insert_pos]
if insert_pos > 0 and new_lines and new_lines[-1].strip():
    new_lines.append('')
new_lines.append(new_var_line)
new_lines.append('')
new_lines.extend(lines[insert_pos:target_line - 1])
new_lines.append(new_target_line)
new_lines.extend(lines[target_line:])

print('\n'.join(new_lines), end='')
`;
    fs.writeFileSync(scriptFile, pythonScript, 'utf-8');
    try {
        const newSource = (0, child_process_1.execSync)(`python3 "${scriptFile}"`, { encoding: 'utf-8' });
        const output = outputPath || filePath;
        if (!outputPath) {
            const backupPath = filePath + '.bak';
            fs.writeFileSync(backupPath, code, 'utf-8');
            console.log(`📦 Backed up original to: ${backupPath}`);
        }
        fs.writeFileSync(output, newSource, 'utf-8');
        console.log(`✅ Extracted variable '${varName}' (line ${targetLine})`);
        console.log(`📁 Saved to: ${output}`);
    }
    catch (error) {
        console.error(`❌ Extraction failed: ${error}`);
        process.exit(1);
    }
}
// CLI
const args = process.argv.slice(2);
if (args.length === 0) {
    console.log(`
🔧 AI Refactor Tool - CLI

Usage: node cli.js <command> [options]

Commands:
  analyze <dir>   Analyze Python project dependencies
  circular <dir>  Find circular dependencies
  graph <file>    Generate dependency graph (text/mermaid)
  rename <file> <old> <new>  Rename function/variable/class
  extract <file> <var> <line>  Extract expression to variable
  
Options:
  --graph[=format]   Output dependency graph (format: text|mermaid, default: mermaid)
  --filter=<module>  Filter by specific module
  -o, --output       Output file path
  
Example:
  node cli.js analyze ./test_sample.py
  node cli.js analyze ./my_project --graph=mermaid
  node cli.js graph ./test_sample.py
  node cli.js rename sample.py calculate compute
  node cli.js extract sample.py new_var 10
    `.trim());
    process.exit(1);
}
const command = args[0];
const targetPath = args[1] || '.';
// Parse additional options
const options = {};
for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
        const [key, value] = arg.substring(2).split('=');
        options[key] = value || 'true';
    }
}
// Determine output format
const graphFormat = options.graph === 'true' || options.graph === undefined ? 'mermaid' : options.graph;
// Helper to output graph in specified format
function outputGraph(analyzer, graph, filterModule) {
    let filteredNodes = graph.nodes;
    let filteredEdges = graph.edges;
    if (filterModule) {
        filteredNodes = graph.nodes.filter(n => n.id === filterModule || n.id.startsWith(filterModule + ':'));
        filteredEdges = graph.edges.filter(e => e.from.startsWith(filterModule || '') || e.to.startsWith(filterModule || ''));
    }
    const filteredGraph = { nodes: filteredNodes, edges: filteredEdges };
    if (graphFormat === 'text') {
        // Text output
        console.log('\n📊 Dependency Graph (Text)\n');
        console.log('=== NODES ===');
        for (const node of filteredNodes) {
            console.log(`  [${node.type}] ${node.id}`);
        }
        console.log('\n=== EDGES ===');
        for (const edge of filteredEdges) {
            const lineInfo = edge.line ? `:${edge.line}` : '';
            console.log(`  ${edge.from} --${edge.type}${lineInfo}--> ${edge.to}`);
        }
    }
    else {
        // Mermaid output (default)
        console.log('\n📊 Dependency Graph (Mermaid)\n');
        console.log(analyzer.toMermaid(filteredGraph));
    }
}
if (command === 'analyze' || command === 'graph') {
    const analyzer = new MultiFileDependencyGraph();
    try {
        let dirPath = targetPath;
        let filterModule = options.filter || null;
        // Check if target is file or directory
        if (fs.statSync(targetPath).isFile()) {
            const fileName = path.basename(targetPath, '.py');
            dirPath = path.dirname(targetPath);
            if (!filterModule)
                filterModule = fileName;
        }
        const graph = analyzer.analyzeDirectory(dirPath);
        // If --graph option is set, output graph only
        if (options.graph || command === 'graph') {
            outputGraph(analyzer, graph, filterModule || undefined);
        }
        else {
            // Original analysis output
            let filteredNodes = graph.nodes;
            let filteredEdges = graph.edges;
            if (filterModule) {
                filteredNodes = graph.nodes.filter(n => n.id === filterModule || n.id.startsWith(filterModule + ':'));
                filteredEdges = graph.edges.filter(e => e.from === filterModule || e.to === filterModule);
            }
            console.log('\n📊 Dependency Analysis\n');
            console.log(`Found ${filteredNodes.length} nodes and ${filteredEdges.length} edges\n`);
            console.log('Nodes:');
            for (const node of filteredNodes) {
                console.log(`  - ${node.id} (${node.type})`);
            }
            console.log('\nEdges:');
            for (const edge of filteredEdges) {
                console.log(`  - ${edge.from} --${edge.type}--> ${edge.to}`);
            }
            // Generate mermaid for filtered graph
            const filteredGraph = { nodes: filteredNodes, edges: filteredEdges };
            console.log('\n' + analyzer.toMermaid(filteredGraph));
        }
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}
else if (command === 'circular') {
    const analyzer = new MultiFileDependencyGraph();
    try {
        let dirPath = targetPath;
        if (fs.statSync(targetPath).isFile()) {
            dirPath = path.dirname(targetPath);
        }
        const graph = analyzer.analyzeDirectory(dirPath);
        const cycles = analyzer.findCircularDeps(graph);
        if (cycles.length === 0) {
            console.log('✅ No circular dependencies found!');
        }
        else {
            console.log(`\n⚠️  Found ${cycles.length} circular dependency(ies):\n`);
            for (let i = 0; i < cycles.length; i++) {
                console.log(`  Cycle ${i + 1}: ${cycles[i].join(' → ')}`);
            }
        }
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}
//# sourceMappingURL=cli.js.map