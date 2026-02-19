/**
 * 代码解析服务
 * 支持 Java、JavaScript、TypeScript 文件解析
 * 使用 Tree-sitter 进行 AST 解析
 */

import { logger } from '@zhixing/shared';

/**
 * 代码块类型
 */
export type CodeBlockType = 'class' | 'interface' | 'function' | 'method' | 'variable' | 'comment' | 'other';

/**
 * 代码块定义
 */
export interface CodeBlock {
  type: CodeBlockType;
  name: string;
  content: string;
  startLine: number;
  endLine: number;
  filePath: string;
  language: string;
  parent?: string;
  signature?: string;
  docstring?: string;
}

/**
 * 文件解析结果
 */
export interface ParseResult {
  filePath: string;
  language: string;
  blocks: CodeBlock[];
  imports: string[];
  exports: string[];
}

/**
 * 支持的编程语言
 */
const SUPPORTED_LANGUAGES = ['java', 'javascript', 'typescript'];

/**
 * 文件扩展名到语言映射
 */
const EXT_TO_LANGUAGE: Record<string, string> = {
  '.java': 'java',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
};

/**
 * 获取文件语言类型
 */
export function getLanguageFromPath(filePath: string): string | null {
  const ext = filePath.toLowerCase().substring(filePath.lastIndexOf('.'));
  return EXT_TO_LANGUAGE[ext] || null;
}

/**
 * 检查文件是否支持解析
 */
export function isSupportedFile(filePath: string): boolean {
  return getLanguageFromPath(filePath) !== null;
}

/**
 * 基于正则的轻量级代码解析器
 * 用于提取类、函数、方法等代码块
 */
export class CodeParser {
  /**
   * 解析代码文件
   */
  parse(filePath: string, content: string): ParseResult {
    const language = getLanguageFromPath(filePath);
    if (!language) {
      throw new Error(`Unsupported file type: ${filePath}`);
    }

    const blocks: CodeBlock[] = [];
    const imports: string[] = [];
    const exports: string[] = [];

    const lines = content.split('\n');

    // 根据语言选择解析策略
    switch (language) {
      case 'java':
        this.parseJava(content, lines, filePath, blocks, imports, exports);
        break;
      case 'javascript':
      case 'typescript':
        this.parseJavaScript(content, lines, filePath, blocks, imports, exports, language);
        break;
    }

    return {
      filePath,
      language,
      blocks,
      imports,
      exports,
    };
  }

  /**
   * 解析 Java 代码
   */
  private parseJava(
    content: string,
    lines: string[],
    filePath: string,
    blocks: CodeBlock[],
    imports: string[],
    exports: string[]
  ): void {
    // 提取 import 语句
    const importRegex = /^import\s+([\w.]+(?:\.\*)?);/gm;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    // 提取 package 声明
    const packageRegex = /^package\s+([\w.]+);/m;
    const packageMatch = packageRegex.exec(content);
    const packageName = packageMatch ? packageMatch[1] : '';

    // 提取类定义
    const classRegex = /(?:(?:public|private|protected|abstract|final)\s+)*(?:class|interface|enum|record)\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?\s*\{/g;
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      const startPos = match.index;
      const endPos = this.findMatchingBrace(content, startPos + match[0].length - 1);
      const startLine = content.substring(0, startPos).split('\n').length;
      const endLine = content.substring(0, endPos).split('\n').length;

      const classContent = content.substring(startPos, endPos + 1);
      const docstring = this.extractDocstring(lines, startLine - 1);

      blocks.push({
        type: match[0].includes('interface') ? 'interface' : 'class',
        name: className,
        content: classContent,
        startLine,
        endLine,
        filePath,
        language: 'java',
        signature: this.extractClassSignature(classContent),
        docstring,
      });

      // 提取类中的方法
      this.parseJavaMethods(classContent, lines, filePath, startLine, blocks, className);
    }
  }

  /**
   * 解析 JavaScript/TypeScript 代码
   */
  private parseJavaScript(
    content: string,
    lines: string[],
    filePath: string,
    blocks: CodeBlock[],
    imports: string[],
    exports: string[],
    language: string
  ): void {
    // 提取 import/export 语句
    const importRegex = /^import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"];?/gm;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    const exportRegex = /^export\s+(?:default\s+)?(?:class|function|interface|type|const|let|var)?\s*(\w+)?/gm;
    while ((match = exportRegex.exec(content)) !== null) {
      if (match[1]) exports.push(match[1]);
    }

    // 提取类定义
    const classRegex = /(?:(?:export|abstract)\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?\s*\{/g;
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      const startPos = match.index;
      const endPos = this.findMatchingBrace(content, startPos + match[0].length - 1);
      const startLine = content.substring(0, startPos).split('\n').length;
      const endLine = content.substring(0, endPos).split('\n').length;

      const classContent = content.substring(startPos, endPos + 1);
      const docstring = this.extractJSDoc(lines, startLine - 1);

      blocks.push({
        type: 'class',
        name: className,
        content: classContent,
        startLine,
        endLine,
        filePath,
        language,
        signature: this.extractClassSignature(classContent),
        docstring,
      });

      // 提取类中的方法
      this.parseJSMethods(classContent, lines, filePath, startLine, blocks, className, language);
    }

    // 提取独立函数（不在类中的）
    const funcRegex = /(?:(?:export|async)\s+)?(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\(|(\w+)\s*:\s*(?:async\s+)?\(|(?:export\s+)?default\s+(?:async\s+)?\(?\s*function)/g;
    while ((match = funcRegex.exec(content)) !== null) {
      const funcName = match[1] || match[2] || match[3];
      if (!funcName) continue;

      // 检查是否已经在类中
      if (this.isInsideClassBlock(content, match.index, blocks)) continue;

      const startPos = match.index;
      const startLine = content.substring(0, startPos).split('\n').length;
      const endPos = this.findFunctionEnd(content, startPos);
      const endLine = content.substring(0, endPos).split('\n').length;

      const funcContent = content.substring(startPos, endPos);
      const docstring = this.extractJSDoc(lines, startLine - 1);

      blocks.push({
        type: 'function',
        name: funcName,
        content: funcContent,
        startLine,
        endLine,
        filePath,
        language,
        signature: this.extractFunctionSignature(funcContent),
        docstring,
      });
    }
  }

  /**
   * 解析 Java 类中的方法
   */
  private parseJavaMethods(
    classContent: string,
    lines: string[],
    filePath: string,
    classStartLine: number,
    blocks: CodeBlock[],
    className: string
  ): void {
    // 方法签名正则：支持注解、修饰符、泛型、返回类型
    const methodRegex = /(?:(?:@[\w]+(?:\([^)]*\))?\s*)*(?:(?:public|private|protected|static|final|abstract|synchronized)\s+)*(?:<[^>]+>\s*)?)(?:[\w<>,\s]+)\s+(\w+)\s*\([^)]*\)\s*(?:throws\s+[\w,\s]+)?\s*\{/g;

    let match;
    while ((match = methodRegex.exec(classContent)) !== null) {
      const methodName = match[1];
      const startPos = match.index;
      const endPos = this.findMatchingBrace(classContent, startPos + match[0].length - 1);
      const startLine = classStartLine + classContent.substring(0, startPos).split('\n').length - 1;
      const endLine = classStartLine + classContent.substring(0, endPos).split('\n').length - 1;

      const methodContent = classContent.substring(startPos, endPos + 1);
      const docstring = this.extractDocstring(lines, startLine - 1);

      blocks.push({
        type: 'method',
        name: methodName,
        content: methodContent,
        startLine,
        endLine,
        filePath,
        language: 'java',
        parent: className,
        signature: this.extractMethodSignature(methodContent),
        docstring,
      });
    }
  }

  /**
   * 解析 JavaScript/TypeScript 类中的方法
   */
  private parseJSMethods(
    classContent: string,
    lines: string[],
    filePath: string,
    classStartLine: number,
    blocks: CodeBlock[],
    className: string,
    language: string
  ): void {
    // 方法定义正则
    const methodRegex = /(?:(?:async|static|private|protected|public|readonly)\s+)*(?:\w+\s*[=:]\s*)?(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*[\w<>,\s]+)?\s*\{/g;

    let match;
    while ((match = methodRegex.exec(classContent)) !== null) {
      const methodName = match[1];
      // 跳过构造函数和 getter/setter
      if (methodName === 'constructor' || methodName.startsWith('get ') || methodName.startsWith('set ')) continue;

      const startPos = match.index;
      const endPos = this.findMatchingBrace(classContent, startPos + match[0].length - 1);
      const startLine = classStartLine + classContent.substring(0, startPos).split('\n').length - 1;
      const endLine = classStartLine + classContent.substring(0, endPos).split('\n').length - 1;

      const methodContent = classContent.substring(startPos, endPos + 1);
      const docstring = this.extractJSDoc(lines, startLine - 1);

      blocks.push({
        type: 'method',
        name: methodName,
        content: methodContent,
        startLine,
        endLine,
        filePath,
        language,
        parent: className,
        signature: this.extractFunctionSignature(methodContent),
        docstring,
      });
    }
  }

  /**
   * 查找匹配的右大括号
   */
  private findMatchingBrace(content: string, openBracePos: number): number {
    let braceCount = 1;
    let pos = openBracePos + 1;

    while (braceCount > 0 && pos < content.length) {
      if (content[pos] === '{') braceCount++;
      else if (content[pos] === '}') braceCount--;
      pos++;
    }

    return pos - 1;
  }

  /**
   * 查找函数结束位置
   */
  private findFunctionEnd(content: string, startPos: number): number {
    // 尝试找到匹配的 }
    const openBracePos = content.indexOf('{', startPos);
    if (openBracePos === -1) {
      // 箭头函数可能没有 {}
      const semicolonPos = content.indexOf(';', startPos);
      return semicolonPos !== -1 ? semicolonPos + 1 : content.length;
    }
    return this.findMatchingBrace(content, openBracePos) + 1;
  }

  /**
   * 检查是否在类块中
   */
  private isInsideClassBlock(content: string, pos: number, blocks: CodeBlock[]): boolean {
    for (const block of blocks) {
      if (block.type === 'class') {
        const blockStart = content.indexOf(block.content);
        if (blockStart !== -1 && pos > blockStart && pos < blockStart + block.content.length) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 提取 JavaDoc 注释
   */
  private extractDocstring(lines: string[], lineIndex: number): string | undefined {
    const docLines: string[] = [];
    let i = lineIndex - 1;

    // 向上查找 /** 开始的注释
    while (i >= 0) {
      const line = lines[i].trim();
      if (line.startsWith('/**')) {
        docLines.unshift(line);
        break;
      } else if (line.startsWith('*')) {
        docLines.unshift(line);
      } else if (line === '' || line.startsWith('@')) {
        // 继续向上
      } else {
        break;
      }
      i--;
    }

    return docLines.length > 0 ? docLines.join('\n') : undefined;
  }

  /**
   * 提取 JSDoc 注释
   */
  private extractJSDoc(lines: string[], lineIndex: number): string | undefined {
    const docLines: string[] = [];
    let i = lineIndex - 1;

    while (i >= 0) {
      const line = lines[i].trim();
      if (line.startsWith('/**')) {
        docLines.unshift(line);
        break;
      } else if (line.startsWith('*')) {
        docLines.unshift(line);
      } else {
        break;
      }
      i--;
    }

    return docLines.length > 0 ? docLines.join('\n') : undefined;
  }

  /**
   * 提取类签名
   */
  private extractClassSignature(content: string): string {
    const firstLine = content.split('\n')[0].trim();
    return firstLine.replace(/\s*\{$/, '');
  }

  /**
   * 提取方法签名
   */
  private extractMethodSignature(content: string): string {
    const firstLine = content.split('\n')[0].trim();
    return firstLine.replace(/\s*\{$/, '');
  }

  /**
   * 提取函数签名
   */
  private extractFunctionSignature(content: string): string {
    const lines = content.split('\n');
    let signature = '';
    for (const line of lines) {
      signature += line.trim();
      if (line.includes('{') || line.includes('=>')) {
        break;
      }
    }
    return signature.replace(/\s*\{$/, '');
  }
}

/**
 * 创建代码解析器实例
 */
export function createCodeParser(): CodeParser {
  return new CodeParser();
}
