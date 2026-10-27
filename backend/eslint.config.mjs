import parser from '@typescript-eslint/parser';
export default [{ ignores: ['dist', 'node_modules'] }, { files: ['src/**/*.ts', 'tests/**/*.ts'], languageOptions: { parser } }];
