'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import axios from 'axios';
const dropRightWhile = require('lodash.droprightwhile');
const range = require('lodash.range');

const DEPENDENCIES_MARKER = '[dependencies]';

type Crate = {
    description: string;
    max_version: string;
    name: string;
};

const mapCrateToCompletionItem = (currentLineReplaceRange: vscode.Range) => (crate: Crate) => {
    const { description, max_version, name } = crate;
    const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Text);
    item.additionalTextEdits = [vscode.TextEdit.delete(currentLineReplaceRange)];
    item.insertText = `${name} = "${max_version}"`;
    item.detail = `${max_version}`;
    item.documentation = `${description}`;
    return item;
};

const isInDependenciesSection = (document: vscode.TextDocument, activeLineIndex: number): boolean => {
    const lines = dropRightWhile(
        range(0, activeLineIndex).map(i => document.lineAt(i).text),
        (line: string) => !line.startsWith('[')
    );
    
    return (lines[lines.length - 1] || '') === DEPENDENCIES_MARKER;
};

export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "search-crates-io" is now active!');

    vscode.languages.registerCompletionItemProvider({ language: 'toml', pattern: '**/Cargo.toml' }, {
        async provideCompletionItems (document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
            const lineIndex = position.line;
            const { text } = document.lineAt(lineIndex);

            if (!isInDependenciesSection(document, lineIndex)) {
                return;
            }

            const currentLineReplaceRange = new vscode.Range(new vscode.Position(lineIndex, 0), new vscode.Position(lineIndex, text.length));

            try {
                const { data } = await axios.get(`https://crates.io/api/v1/crates?page=1&per_page=20&q=${text}&sort=`);
                const crates: Crate[] = data.crates;
                return crates.map(mapCrateToCompletionItem(currentLineReplaceRange));
            } catch (err) {
                console.error(err);
            }
        },
        resolveCompletionItem (item: vscode.CompletionItem, token: vscode.CancellationToken) {
            return item;
        }
    });
}
