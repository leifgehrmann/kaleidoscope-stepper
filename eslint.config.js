import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import ts from 'typescript-eslint';
export default [
    { ignores: [ 'dist' ] },
    js.configs.recommended,
    ...ts.configs.recommended,
    ...pluginVue.configs['flat/recommended'],
    {
        files: ['*.vue', '**/*.vue'],
        languageOptions: {
            parserOptions: {
                parser: '@typescript-eslint/parser'
            }
        }
    },
    {
        rules: {
            // Airbnb-like rules
            semi: ['error', 'always'],
            quotes: ['error', 'single', {
                avoidEscape: true,
                allowTemplateLiterals: true
            }],
            'eol-last': ['error', 'always'],
            'no-var': ['error'],
            'prefer-const': ['error'],

            // Disabled this rule, because Kaleidoscope is a false positive
            'vue/multi-word-component-names': ['off']
        }
    }
];
