import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve('src');
const ENTRY_FILES = [
  path.resolve('src/main.tsx'),
  path.resolve('src/App.tsx'),
  path.resolve('src/index.css'),
  path.resolve('index.html'),
  path.resolve('server.ts')
].filter(f => fs.existsSync(f));

// Extensions to check when resolving imports without extensions
const EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.css', '.json'];

// Helper to list all files in src/
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

// Helper to resolve an import path from a source file
function resolveImportPath(importPath, sourceFilePath) {
  // Only resolve relative imports starting with . or /
  if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
    return null;
  }

  const sourceDir = path.dirname(sourceFilePath);
  let targetPath = importPath.startsWith('/')
    ? path.resolve(importPath.substring(1))
    : path.resolve(sourceDir, importPath);

  // 1. Direct match (e.g., import './index.css')
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
    return targetPath;
  }

  // 2. Try adding extensions (e.g., import './App' -> './App.tsx')
  for (const ext of EXTENSIONS) {
    const fullExtPath = targetPath.endsWith(ext) ? targetPath : targetPath + ext;
    if (fs.existsSync(fullExtPath) && fs.statSync(fullExtPath).isFile()) {
      return fullExtPath;
    }
  }

  // 3. Try directory index (e.g., import './components' -> './components/index.tsx')
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
    for (const ext of EXTENSIONS) {
      const indexPath = path.join(targetPath, 'index' + ext);
      if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
        return indexPath;
      }
    }
  }

  return null;
}

// Regex to extract import/require specifiers
function extractImportSpecifiers(fileContent) {
  const imports = new Set();

  // Match: import '...' or import "..." (side-effect imports)
  const sideEffectImportRegex = /import\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = sideEffectImportRegex.exec(fileContent)) !== null) {
    imports.add(match[1]);
  }

  // Match: import ... from '...' or export ... from '...'
  const importFromRegex = /(?:import|export)\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g;
  while ((match = importFromRegex.exec(fileContent)) !== null) {
    imports.add(match[1]);
  }

  // Match: require('...')
  const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = requireRegex.exec(fileContent)) !== null) {
    imports.add(match[1]);
  }

  // Match: dynamic import('...')
  const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicImportRegex.exec(fileContent)) !== null) {
    imports.add(match[1]);
  }

  // Match CSS @import '...'
  const cssImportRegex = /@import\s+['"]([^'"]+)['"]/g;
  while ((match = cssImportRegex.exec(fileContent)) !== null) {
    imports.add(match[1]);
  }

  return Array.from(imports);
}

function analyzeUnusedFiles() {
  console.log('\n==================================================');
  console.log('🔍 فحص تحليل استخدام ملفات المشروع (Unused Files Analyzer)');
  console.log('==================================================\n');

  const allSrcFiles = getAllFiles(SRC_DIR);
  const visitedFiles = new Set();
  const queue = [...ENTRY_FILES];

  ENTRY_FILES.forEach(f => visitedFiles.add(f));

  while (queue.length > 0) {
    const currentFile = queue.shift();

    if (!fs.existsSync(currentFile)) continue;

    try {
      const content = fs.readFileSync(currentFile, 'utf-8');
      const specifiers = extractImportSpecifiers(content);

      for (const specifier of specifiers) {
        const resolvedPath = resolveImportPath(specifier, currentFile);
        if (resolvedPath && resolvedPath.startsWith(SRC_DIR)) {
          if (!visitedFiles.has(resolvedPath)) {
            visitedFiles.add(resolvedPath);
            queue.push(resolvedPath);
          }
        }
      }
    } catch (err) {
      console.warn(`⚠️ تعذر قراءة الملف: ${currentFile}`);
    }
  }

  const unusedFiles = allSrcFiles.filter(file => !visitedFiles.has(file));

  console.log(`📊 إحصائيات الملفات:`);
  console.log(` - إجمالي ملفات مجلد src: ${allSrcFiles.length}`);
  console.log(` - الملفات المستخدمة حالياً: ${visitedFiles.size}`);
  console.log(` - الملفات غير المستخدمة (المعزولة): ${unusedFiles.length}\n`);

  if (unusedFiles.length === 0) {
    console.log('✅ ممتاز! جميع الملفات في مجلد src مستخدمة ولا توجد ملفات غير مستخدمة.\n');
  } else {
    console.log('⚠️ قائمة الملفات غير المستخدمة التي لا يتم استيرادها في أي مكان:');
    console.log('--------------------------------------------------');
    unusedFiles.forEach((file, index) => {
      const relativePath = path.relative(process.cwd(), file);
      const stats = fs.statSync(file);
      const lines = fs.readFileSync(file, 'utf-8').split('\n').length;
      console.log(` ${index + 1}. ${relativePath} (${lines} سطر | ${(stats.size / 1024).toFixed(1)} KB)`);
    });
    console.log('--------------------------------------------------');
    console.log('💡 يمكنك مراجعة الملفات أعلاه ثم حذفها أو دمجه في المشروع حسب الحاجة.\n');
  }
}

analyzeUnusedFiles();
