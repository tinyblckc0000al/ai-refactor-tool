import * as vscode from 'vscode';
import { ASTNode } from '../parser/pythonParser';
import { DependencyGraphData } from '../analyzer/dependencyGraph';
export declare class WebviewProvider {
    private panel;
    private context;
    constructor(context: vscode.ExtensionContext);
    /**
     * Show analysis results in webview
     */
    show(ast: ASTNode, deps: DependencyGraphData): void;
    /**
     * Show dependency graph only
     */
    showDependencies(deps: DependencyGraphData): void;
    private createOrShowPanel;
    private generateHtml;
    private generateDepsHtml;
    private generateMermaid;
    private simplifyAst;
    private escapeHtml;
    private escapeId;
}
//# sourceMappingURL=provider.d.ts.map