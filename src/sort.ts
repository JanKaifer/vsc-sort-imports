import { DEFAULT_CONFIGS, getConfig } from 'import-sort-config';
import { TextDocument, window } from 'vscode';
import { dirname, extname } from 'path';
import { getConfiguration, getMaxRange } from './utils';
import importSort, { ISortResult } from 'import-sort';

// const findImports = /^import [^\n]+\n+/gm;
const defaultLanguages = [
    'javascript',
    'typescript',
];

let cachedParser: string;
let cachedStyle: string;


export function sort(document: TextDocument): ISortResult {
    const languages = getConfiguration<string[]>('languages') || defaultLanguages;
    const isValidLanguage = languages.some(language => document.languageId.includes(language));

    if (!isValidLanguage) {
        return;
    }

    const currentText = document.getText();
    const fileName = document.fileName;
    const extension = extname(fileName);
    const directory = dirname(fileName);

    let result;
    const config = clone(DEFAULT_CONFIGS);
    const defaultSortStyle = getConfiguration<string>('default-sort-style');

    for (const languages of Object.keys(config)) {
        config[languages].style = defaultSortStyle;
    }

    const useCache = getConfiguration<boolean>('cache-package-json-config-checks');

    try {
        if (!useCache || !cachedParser) {
            const { parser, style } = getConfig(extension, directory, config);
            cachedParser = parser;
            cachedStyle = style;
        }

        return importSort(currentText, cachedParser, cachedStyle, fileName);
    } catch (exception) {
        if (!getConfiguration<boolean>('suppress-warnings')) {
            window.showWarningMessage(`Error sorting imports: ${exception}`);
        }

        return null;
    }
}


export function sortCurrentDocument() {
    const {
        activeTextEditor: editor,
        activeTextEditor: { document }
    } = window;

    const { code } = sort(document) || { code: '' };

    if (!code) {
        return;
    }

    return editor.edit(edit => edit.replace(getMaxRange(), code));
}


function clone(object) {
    return JSON.parse(JSON.stringify(object));
}
