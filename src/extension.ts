import * as vscode from 'vscode';
import { PythonParser } from './parser/pythonParser';
import { DependencyGraph } from './analyzer/dependencyGraph';
import { WebviewProvider } from './webview/provider';

export function activate(context: vscode.ExtensionContext) {
    console.log('AI Refactor Tool activated!');

    const parser = new PythonParser();
    const dependencyGraph = new DependencyGraph();
    const webviewProvider = new WebviewProvider(context);

    // Command: Analyze current file
    const analyzeCommand = vscode.commands.registerCommand('ai-refactor.analyze', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor');
            return;
        }

        const document = editor.document;
        const code = document.getText();

        try {
            // Parse AST
            const ast = parser.parse(code);
            
            // Build dependency graph
            const deps = dependencyGraph.analyze(code, document.fileName);
            
            // Show in webview
            webviewProvider.show(ast, deps);
            
            vscode.window.showInformationMessage('Analysis complete!');
        } catch (error) {
            vscode.window.showErrorMessage(`Analysis failed: ${error}`);
        }
    });

    // Command: Show dependencies
    const showDepsCommand = vscode.commands.registerCommand('ai-refactor.showDependencies', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const document = editor.document;
        const code = document.getText();
        const deps = dependencyGraph.analyze(code, document.fileName);
        
        webviewProvider.showDependencies(deps);
    });

    // Command: Refactor selection
    const refactorCommand = vscode.commands.registerCommand('ai-refactor.refactor', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const selection = editor.selection;
        const code = editor.document.getText(selection);

        if (!code.trim()) {
            vscode.window.showWarningMessage('No code selected');
            return;
        }

        // TODO: Call AI to refactor
        vscode.window.showInformationMessage('AI refactor coming soon!');
    });

    context.subscriptions.push(analyzeCommand, showDepsCommand, refactorCommand);
}

export function deactivate() {}
