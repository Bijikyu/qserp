// Ensures qtests-runner.mjs exists at project root by copying a valid shipped template.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cwd = process.cwd();
function isValid(content){try{return /runCLI/.test(content) && /API Mode/.test(content);}catch{return false;}}
try{const target=path.join(cwd,'qtests-runner.mjs');if(!fs.existsSync(target)){const candidates=[path.join(cwd,'lib','templates','qtests-runner.mjs.template'),path.join(cwd,'templates','qtests-runner.mjs.template'),path.join(cwd,'node_modules','qtests','lib','templates','qtests-runner.mjs.template'),path.join(cwd,'node_modules','qtests','templates','qtests-runner.mjs.template')];let content=null;for(const p of candidates){try{if(fs.existsSync(p)){const c=fs.readFileSync(p,'utf8');if(isValid(c)){content=c;break;}}}catch{}}if(!content){/* silent no-op */}else{fs.writeFileSync(target,content,'utf8');}}}catch{/* silent */}
