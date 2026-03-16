import * as vscode from 'vscode';
import { ASTNode } from '../parser/pythonParser';
import { DependencyGraphData } from '../analyzer/dependencyGraph';

export class WebviewProvider {
    private panel: vscode.WebviewPanel | undefined;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    /**
     * Show analysis results in webview
     */
    show(ast: ASTNode, deps: DependencyGraphData): void {
        this.createOrShowPanel();
        
        if (!this.panel) return;

        const html = this.generateHtml(ast, deps);
        this.panel.webview.html = html;
    }

    /**
     * Show dependency graph only
     */
    showDependencies(deps: DependencyGraphData): void {
        this.createOrShowPanel();
        
        if (!this.panel) return;

        const mermaid = this.generateMermaid(deps);
        const html = this.generateDepsHtml(mermaid);
        this.panel.webview.html = html;
    }

    private createOrShowPanel(): void {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.Two);
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'aiRefactor',
            'AI Refactor Tool',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });
    }

    private generateHtml(ast: ASTNode, deps: DependencyGraphData): string {
        const astJson = JSON.stringify(ast, null, 2);
        const mermaid = this.generateMermaid(deps);

        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>AI Refactor Tool</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0; 
            padding: 20px;
            background: #1e1e1e;
            color: #d4d4d4;
        }
        h1 { color: #569cd6; font-size: 18px; }
        h2 { color: #4ec9b0; font-size: 14px; margin-top: 20px; }
        .tab { 
            display: flex; 
            border-bottom: 1px solid #3c3c3c;
            margin-bottom: 20px;
        }
        .tab button {
            background: transparent;
            border: none;
            color: #858585;
            padding: 10px 20px;
            cursor: pointer;
            font-size: 14px;
        }
        .tab button.active {
            color: #d4d4d4;
            border-bottom: 2px solid #569cd6;
        }
        .tabcontent { display: none; }
        .tabcontent.active { display: block; }
        pre { 
            background: #252526; 
            padding: 15px; 
            border-radius: 5px;
            overflow-x: auto;
            font-size: 12px;
            line-height: 1.4;
        }
        .mermaid { 
            background: #252526; 
            padding: 20px; 
            border-radius: 5px;
            text-align: center;
        }
        .stats {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
        }
        .stat-card {
            background: #2d2d30;
            padding: 15px 25px;
            border-radius: 5px;
            text-align: center;
        }
        .stat-value { font-size: 24px; color: #569cd6; }
        .stat-label { font-size: 12px; color: #858585; }
    </style>
</head>
<body>
    <h1>🔧 AI Refactor Tool</h1>
    
    <div class="stats">
        <div class="stat-card">
            <div class="stat-value">${deps.nodes.length}</div>
            <div class="stat-label">Nodes</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${deps.edges.length}</div>
            <div class="stat-label">Edges</div>
        </div>
    </div>

    <div class="tab">
        <button class="active" onclick="showTab('ast')">AST</button>
        <button onclick="showTab('deps')">Dependencies</button>
        <button onclick="showTab('json')">Raw JSON</button>
    </div>

    <div id="ast" class="tabcontent active">
        <h2>Abstract Syntax Tree</h2>
        <pre>${this.escapeHtml(this.simplifyAst(ast))}</pre>
    </div>

    <div id="deps" class="tabcontent">
        <h2>Dependency Graph</h2>
        <div class="mermaid">
${mermaid}
        </div>
    </div>

    <div id="json" class="tabcontent">
        <h2>Raw AST JSON</h2>
        <pre>${this.escapeHtml(astJson)}</pre>
    </div>

    <script>
        mermaid.initialize({ 
            startOnLoad: true,
            theme: 'dark',
            securityLevel: 'loose'
        });
        
        function showTab(tabId) {
            document.querySelectorAll('.tabcontent').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab button').forEach(b => b.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            event.target.classList.add('active');
        }
    </script>
</body>
</html>`;
    }

    private generateDepsHtml(mermaid: string): string {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Dependencies</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0; 
            padding: 20px;
            background: #1e1e1e;
            color: #d4d4d4;
        }
        .mermaid { 
            background: #252526; 
            padding: 20px; 
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="mermaid">
${mermaid}
    </div>
    <script>
        mermaid.initialize({ 
            startOnLoad: true,
            theme: 'dark',
            securityLevel: 'loose'
        });
    </script>
</body>
</html>`;
    }

    private generateMermaid(deps: DependencyGraphData): string {
        let lines: string[] = ['graph TD'];
        
        // Define node styles
        const moduleNodes = deps.nodes.filter(n => n.type === 'module');
        const classNodes = deps.nodes.filter(n => n.type === 'class');
        const funcNodes = deps.nodes.filter(n => n.type === 'function');

        for (const node of moduleNodes) {
            lines.push(`    ${this.escapeId(node.id)}["📦 ${node.name}"]`);
            lines.push(`    style ${this.escapeId(node.id)} fill:#6a9955,stroke:#333,color:#fff`);
        }
        
        for (const node of classNodes) {
            lines.push(`    ${this.escapeId(node.id)}["🏛️ ${node.name}"]`);
            lines.push(`    style ${this.escapeId(node.id)} fill:#dcdcaa,stroke:#333`);
        }
        
        for (const node of funcNodes) {
            lines.push(`    ${this.escapeId(node.id)}["⚡ ${node.name}"]`);
            lines.push(`    style ${this.escapeId(node.id)} fill:#4fc1ff,stroke:#333`);
        }

        // Add edges
        for (const edge of deps.edges) {
            const from = this.escapeId(edge.from);
            const to = this.escapeId(edge.to);
            const label = edge.type === 'import' ? 'imports' : 
                          edge.type === 'call' ? 'calls' : 
                          edge.type === 'inherit' ? 'extends' : 'uses';
            lines.push(`    ${from} --${label}--> ${to}`);
        }

        return lines.join('\n');
    }

    private simplifyAst(ast: ASTNode, depth = 0): string {
        if (depth > 3) return '...';
        
        let result = ast.type;
        if (ast.name) result += `: ${ast.name}`;
        if (ast.line) result += ` (line ${ast.line})`;
        
        if (ast.children && ast.children.length > 0) {
            const childStr = ast.children
                .map(c => this.simplifyAst(c, depth + 1))
                .join('\n' + '  '.repeat(depth + 1));
            result += '\n' + '  '.repeat(depth + 1) + childStr;
        }
        
        return result;
    }

    private escapeHtml(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    private escapeId(id: string): string {
        // Mermaid doesn't like certain characters in node IDs
        return id.replace(/[^a-zA-Z0-9_]/g, '_');
    }
}
