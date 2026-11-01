import js from '@eslint/js';
import tseslint from 'typescript-eslint';
export default tseslint.config(js.configs.recommended,...tseslint.configs.recommended,{files:['apps/web/src/workbench/*.jsx'],languageOptions:{parser:tseslint.parser,parserOptions:{ecmaFeatures:{jsx:true}},globals:{crypto:'readonly',document:'readonly',setTimeout:'readonly',clearTimeout:'readonly'}}},{ignores:['**/dist/**','**/node_modules/**']});
