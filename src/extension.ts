'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import axios from 'axios';

type Crate = {
    description: string;
    max_version: string;
    name: string;
};

const mapCrateToCompletionItem = (crate: Crate) => {
    const { description, max_version, name } = crate;
    const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Text);
    item.insertText = `${name} = "${max_version}"`;
    item.detail = `${max_version}`;
    item.documentation = `${description}`;
    return item;
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "search-crates-io" is now active!');

    vscode.languages.registerCompletionItemProvider({ language: 'toml', pattern: '**/Cargo.toml' }, {
        async provideCompletionItems (document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            const { text } = editor.document.lineAt(editor.selection.active.line);

            try {
                const { data } = await axios.get(`https://crates.io/api/v1/crates?page=1&per_page=20&q=${text}&sort=`);
                const crates: Crate[] = data.crates;
                return crates.map(mapCrateToCompletionItem);
            } catch (err) {
                console.error(err);
            }
        },
        resolveCompletionItem (item: vscode.CompletionItem, token: vscode.CancellationToken) {
            return item;
        }
    });
}
