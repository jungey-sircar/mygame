// Types
export type Language = 'python' | 'c' | 'javascript' | 'java' | 'dotnet' | 'php';

export interface StackFrame {
  functionName: string;
  args: Record<string, any>;
}

export interface ExecutionStep {
  line: number;
  type: 'assignment' | 'print' | 'condition_true' | 'condition_false' | 'loop_start' | 'loop_check' | 'function_call' | 'function_return' | 'expression' | 'define';
  explanation: string;
  variables: Record<string, any>;
  callStack: StackFrame[];
  output: string[];
}

class ReturnValue {
  constructor(public value: any) {}
}

// ─── Python Interpreter ───
class PythonInterpreter {
  private lines: { text: string; indent: number; lineNum: number; isEmpty: boolean }[] = [];
  private steps: ExecutionStep[] = [];
  private globalVars: Record<string, any> = {};
  private callStack: StackFrame[] = [];
  private output: string[] = [];
  private functions: Record<string, { params: string[]; start: number; end: number }> = {};
  private classes: Record<string, { methods: Record<string, { params: string[]; start: number; end: number }>; start: number; end: number }> = {};
  private stepCount = 0;
  private maxSteps = 500;
  private indentUnit = 4;

  run(code: string): ExecutionStep[] {
    this.lines = code.split('\n').map((raw, i) => ({
      text: raw.trim(),
      indent: raw.search(/\S/) < 0 ? 0 : raw.search(/\S/),
      lineNum: i,
      isEmpty: raw.trim() === '' || raw.trim().startsWith('#'),
    }));
    this.steps = [];
    this.globalVars = {};
    this.callStack = [];
    this.output = [];
    this.functions = {};
    this.classes = {};
    this.stepCount = 0;
    this.detectIndent();
    this.findClasses();
    this.findFunctions();
    try {
      this.executeBlock(0, this.lines.length, 0, this.globalVars);
    } catch (e) {
      if (!(e instanceof ReturnValue)) {
        this.record(0, 'expression', `Error: ${e}`);
      }
    }
    return this.steps;
  }

  private detectIndent() {
    for (const l of this.lines) {
      if (l.indent > 0 && !l.isEmpty) { this.indentUnit = l.indent; return; }
    }
    this.indentUnit = 4;
  }

  private findFunctions() {
    for (let i = 0; i < this.lines.length; i++) {
      if (this.lines[i].indent !== 0) continue;
      const m = this.lines[i].text.match(/^def\s+(\w+)\s*\(([^)]*)\)\s*:/);
      if (m) {
        const params = m[2] ? m[2].split(',').map(p => p.trim()).filter(Boolean) : [];
        const bodyIndent = this.lines[i].indent + this.indentUnit;
        let end = i + 1;
        while (end < this.lines.length && (this.lines[end].isEmpty || this.lines[end].indent >= bodyIndent)) end++;
        this.functions[m[1]] = { params, start: i + 1, end };
      }
    }
  }

  private findClasses() {
    for (let i = 0; i < this.lines.length; i++) {
      const m = this.lines[i].text.match(/^class\s+(\w+)\s*:?/);
      if (!m) continue;
      const bodyIndent = this.lines[i].indent + this.indentUnit;
      const classEnd = this.blockEnd(i + 1, bodyIndent);
      const methods: Record<string, { params: string[]; start: number; end: number }> = {};

      let j = i + 1;
      while (j < classEnd) {
        const l = this.lines[j];
        if (!l.isEmpty && l.indent === bodyIndent) {
          const mm = l.text.match(/^def\s+(\w+)\s*\(([^)]*)\)\s*:/);
          if (mm) {
            const params = mm[2] ? mm[2].split(',').map(p => p.trim()).filter(Boolean) : [];
            const methodIndent = bodyIndent + this.indentUnit;
            const end = this.blockEnd(j + 1, methodIndent);
            methods[mm[1]] = { params, start: j + 1, end };
            j = end;
            continue;
          }
        }
        j++;
      }

      this.classes[m[1]] = { methods, start: i + 1, end: classEnd };
    }
  }

  private blockEnd(start: number, bodyIndent: number): number {
    let i = start;
    while (i < this.lines.length && (this.lines[i].isEmpty || this.lines[i].indent >= bodyIndent)) i++;
    return i;
  }

  private record(line: number, type: ExecutionStep['type'], explanation: string, scope?: Record<string, any>) {
    if (this.stepCount++ > this.maxSteps) throw new Error('Max steps exceeded');
    this.steps.push({
      line,
      type,
      explanation,
      variables: JSON.parse(JSON.stringify(scope ?? this.globalVars)),
      callStack: JSON.parse(JSON.stringify(this.callStack)),
      output: [...this.output],
    });
  }

  private executeBlock(start: number, end: number, indent: number, scope: Record<string, any>) {
    let i = start;
    while (i < end && this.stepCount < this.maxSteps) {
      const l = this.lines[i];
      if (l.isEmpty) { i++; continue; }
      if (l.indent < indent) break;
      if (l.indent > indent) { i++; continue; }

      if (l.text.startsWith('def ')) {
        const name = l.text.match(/def\s+(\w+)/)?.[1] ?? '?';
        this.record(l.lineNum, 'define', `Define function ${name}`, scope);
        const f = this.functions[name];
        i = f ? f.end : i + 1;
        continue;
      }

      if (l.text.startsWith('class ')) {
        const name = l.text.match(/class\s+(\w+)/)?.[1] ?? '?';
        this.record(l.lineNum, 'define', `Define class ${name}`, scope);
        const cls = this.classes[name];
        i = cls ? cls.end : i + 1;
        continue;
      }

      i = this.executeLine(i, indent, scope);
    }
  }

  private executeLine(idx: number, indent: number, scope: Record<string, any>): number {
    const l = this.lines[idx];
    const t = l.text;

    // Keywords first
    if (t.startsWith('if ') || t.startsWith('elif ')) return this.handleCond(idx, indent, scope);
    if (t.startsWith('while ')) return this.handleWhile(idx, indent, scope);
    if (t.startsWith('for ')) return this.handleFor(idx, indent, scope);

    if (t.startsWith('return')) {
      const expr = t.slice(6).trim();
      const val = expr ? this.evaluate(expr, scope) : undefined;
      this.record(l.lineNum, 'function_return', `Return ${JSON.stringify(val)}`, scope);
      throw new ReturnValue(val);
    }

    if (t.startsWith('print(') && t.endsWith(')')) {
      const argsStr = t.slice(6, -1);
      const args = argsStr.trim() ? this.parseComma(argsStr).map(a => this.evaluate(a, scope)) : [];
      const out = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
      this.output.push(out);
      this.record(l.lineNum, 'print', `Output: ${out}`, scope);
      return idx + 1;
    }

    // Augmented assignment
    const aug = t.match(/^(\w+)\s*(\+=|-=|\*=|\/=)\s*(.+)$/);
    if (aug) {
      const v = this.evaluate(aug[3], scope);
      const op = aug[2];
      if (op === '+=') scope[aug[1]] = (scope[aug[1]] ?? 0) + v;
      else if (op === '-=') scope[aug[1]] = (scope[aug[1]] ?? 0) - v;
      else if (op === '*=') scope[aug[1]] = (scope[aug[1]] ?? 0) * v;
      else scope[aug[1]] = (scope[aug[1]] ?? 0) / v;
      this.record(l.lineNum, 'assignment', `${aug[1]} ${op} ${v} → ${scope[aug[1]]}`, scope);
      return idx + 1;
    }

    // Object attribute assignment
    const attrAssign = t.match(/^(\w+)\.(\w+)\s*=(?!=)\s*(.+)$/);
    if (attrAssign) {
      const obj = scope[attrAssign[1]];
      const val = this.evaluate(attrAssign[3], scope);
      if (obj && typeof obj === 'object') {
        obj[attrAssign[2]] = val;
        this.record(l.lineNum, 'assignment', `${attrAssign[1]}.${attrAssign[2]} = ${JSON.stringify(val)}`, scope);
        return idx + 1;
      }
    }

    // Indexed assignment: arr[i] = value
    const idxAssign = t.match(/^(\w+)\[(.+)\]\s*=(?!=)\s*(.+)$/);
    if (idxAssign) {
      const target = scope[idxAssign[1]];
      const key = this.evaluate(idxAssign[2], scope);
      const val = this.evaluate(idxAssign[3], scope);
      if (target && typeof target === 'object') {
        target[key] = val;
        this.record(l.lineNum, 'assignment', `${idxAssign[1]}[${JSON.stringify(key)}] = ${JSON.stringify(val)}`, scope);
        return idx + 1;
      }
    }

    // Assignment
    const assign = t.match(/^(\w+)\s*=(?!=)\s*(.+)$/);
    if (assign) {
      const val = this.evaluate(assign[2], scope);
      scope[assign[1]] = val;
      this.record(l.lineNum, 'assignment', `${assign[1]} = ${JSON.stringify(val)}`, scope);
      return idx + 1;
    }

    // Method calls like list.append(x)
    const method = t.match(/^(\w+)\.(\w+)\s*\(([^)]*)\)$/);
    if (method) {
      const obj = scope[method[1]];
      const args = method[3].trim() ? this.parseComma(method[3]).map(a => this.evaluate(a, scope)) : [];
      if (method[2] === 'append' && Array.isArray(obj)) obj.push(args[0]);
      else this.callMethod(obj, method[2], args, scope);
      this.record(l.lineNum, 'expression', `${method[1]}.${method[2]}(${args.map(a => JSON.stringify(a)).join(', ')})`, scope);
      return idx + 1;
    }

    // Expression
    this.evaluate(t, scope);
    this.record(l.lineNum, 'expression', `Evaluated: ${t}`, scope);
    return idx + 1;
  }

  private handleCond(idx: number, indent: number, scope: Record<string, any>): number {
    const l = this.lines[idx];
    const condStr = l.text.match(/^(?:if|elif)\s+(.+):$/)?.[1] ?? '';
    const val = this.evaluate(condStr, scope);
    const bodyIndent = indent + this.indentUnit;
    const bodyEnd = this.blockEnd(idx + 1, bodyIndent);

    if (val) {
      this.record(l.lineNum, 'condition_true', `${condStr} → True`, scope);
      this.executeBlock(idx + 1, bodyEnd, bodyIndent, scope);
      return this.skipBranches(bodyEnd, indent);
    } else {
      this.record(l.lineNum, 'condition_false', `${condStr} → False`, scope);
      if (bodyEnd < this.lines.length && !this.lines[bodyEnd].isEmpty && this.lines[bodyEnd].indent === indent) {
        const next = this.lines[bodyEnd].text;
        if (next.startsWith('elif ')) return this.handleCond(bodyEnd, indent, scope);
        if (next.startsWith('else:')) {
          const elseEnd = this.blockEnd(bodyEnd + 1, bodyIndent);
          this.record(this.lines[bodyEnd].lineNum, 'condition_true', 'Entering else block', scope);
          this.executeBlock(bodyEnd + 1, elseEnd, bodyIndent, scope);
          return elseEnd;
        }
      }
      return bodyEnd;
    }
  }

  private skipBranches(idx: number, indent: number): number {
    let i = idx;
    while (i < this.lines.length) {
      const l = this.lines[i];
      if (l.isEmpty) { i++; continue; }
      if (l.indent !== indent) break;
      if (l.text.startsWith('elif ') || l.text.startsWith('else:')) {
        i = this.blockEnd(i + 1, indent + this.indentUnit);
      } else break;
    }
    return i;
  }

  private handleWhile(idx: number, indent: number, scope: Record<string, any>): number {
    const l = this.lines[idx];
    const condStr = l.text.match(/^while\s+(.+):$/)?.[1] ?? '';
    const bodyIndent = indent + this.indentUnit;
    const bodyEnd = this.blockEnd(idx + 1, bodyIndent);

    this.record(l.lineNum, 'loop_start', `While loop: ${condStr}`, scope);
    let iter = 0;
    while (this.evaluate(condStr, scope) && iter++ < 200 && this.stepCount < this.maxSteps) {
      this.record(l.lineNum, 'loop_check', `${condStr} → True (iteration ${iter})`, scope);
      this.executeBlock(idx + 1, bodyEnd, bodyIndent, scope);
    }
    if (iter > 0) this.record(l.lineNum, 'condition_false', `${condStr} → False, loop ended`, scope);
    return bodyEnd;
  }

  private handleFor(idx: number, indent: number, scope: Record<string, any>): number {
    const l = this.lines[idx];
    const m = l.text.match(/^for\s+(\w+)\s+in\s+(.+):$/);
    if (!m) return idx + 1;
    const varName = m[1];
    const iterable = this.evaluate(m[2], scope);
    const bodyIndent = indent + this.indentUnit;
    const bodyEnd = this.blockEnd(idx + 1, bodyIndent);

    this.record(l.lineNum, 'loop_start', `For loop: ${varName} in ${m[2]}`, scope);
    if (Array.isArray(iterable)) {
      for (let i = 0; i < iterable.length && this.stepCount < this.maxSteps; i++) {
        scope[varName] = iterable[i];
        this.record(l.lineNum, 'loop_check', `${varName} = ${JSON.stringify(iterable[i])} (iteration ${i + 1})`, scope);
        this.executeBlock(idx + 1, bodyEnd, bodyIndent, scope);
      }
    }
    return bodyEnd;
  }

  // ─── Expression Evaluator ───
  evaluate(expr: string, scope: Record<string, any>): any {
    expr = expr.trim();
    if (!expr) return undefined;

    // String literal
    if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'")))
      return expr.slice(1, -1);

    // Number
    if (/^-?\d+(\.\d+)?$/.test(expr)) return Number(expr);

    // Booleans
    if (expr === 'True') return true;
    if (expr === 'False') return false;
    if (expr === 'None') return null;

    // Simple variable
    if (/^\w+$/.test(expr) && expr in scope) return scope[expr];

    // Object property access
    const propM = expr.match(/^(\w+)\.(\w+)$/);
    if (propM) {
      const obj = scope[propM[1]];
      if (obj && typeof obj === 'object') return obj[propM[2]];
    }

    // List literal
    if (expr.startsWith('[') && expr.endsWith(']')) {
      const inner = expr.slice(1, -1).trim();
      if (!inner) return [];
      return this.parseComma(inner).map(e => this.evaluate(e, scope));
    }

    // List indexing
    const idxM = expr.match(/^(\w+)\[([^\]]+)\]$/);
    if (idxM) {
      const arr = scope[idxM[1]];
      const i = this.evaluate(idxM[2], scope);
      return arr?.[i];
    }

    // Preprocess function calls
    let processed = this.preprocessFuncs(expr, scope);

    // Convert Python → JS
    let js = processed
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false')
      .replace(/\bNone\b/g, 'null')
      .replace(/\band\b/g, '&&')
      .replace(/\bor\b/g, '||')
      .replace(/\bnot\s+/g, '!');

    // Integer division
    js = js.replace(/(\w+)\s*\/\/\s*(\w+)/g, 'Math.floor($1/$2)');

    const keys = Object.keys(scope);
    const vals = Object.values(scope);
    try {
      const fn = new Function(...keys, `"use strict"; return (${js})`);
      return fn(...vals);
    } catch { return undefined; }
  }

  private preprocessFuncs(expr: string, scope: Record<string, any>): string {
    let result = expr;
    let safety = 20;
    while (safety-- > 0) {
      const m = result.match(/\b(\w+)\s*\(([^()]*)\)/);
      if (!m) break;
      const name = m[1];
      if (['if', 'while', 'for', 'def', 'return', 'Math'].includes(name)) break;
      const args = m[2].trim() ? this.parseComma(m[2]).map(a => this.evaluate(a, scope)) : [];
      const ret = this.callFunc(name, args, scope);
      result = result.replace(m[0], ret === undefined ? 'null' : JSON.stringify(ret));
    }
    return result;
  }

  private callFunc(name: string, args: any[], scope: Record<string, any>): any {
    // Built-ins
    if (name === 'len') return args[0]?.length ?? 0;
    if (name === 'range') {
      if (args.length === 1) {
        const n = Number(args[0]) || 0;
        return n > 0 ? Array.from({ length: n }, (_, i) => i) : [];
      }
      if (args.length === 2) {
        const start = Number(args[0]) || 0;
        const stop = Number(args[1]) || 0;
        const step = start <= stop ? 1 : -1;
        const r: number[] = [];
        for (let i = start; step > 0 ? i < stop : i > stop; i += step) r.push(i);
        return r;
      }
      if (args.length === 3) {
        const start = Number(args[0]) || 0;
        const stop = Number(args[1]) || 0;
        const step = Number(args[2]) || 0;
        if (step === 0) return [];
        const r: number[] = [];
        for (let i = start; step > 0 ? i < stop : i > stop; i += step) r.push(i);
        return r;
      }
      return [];
    }
    if (name === 'abs') return Math.abs(args[0]);
    if (name === 'max') return Math.max(...args);
    if (name === 'min') return Math.min(...args);
    if (name === 'str') return String(args[0]);
    if (name === 'int') return parseInt(String(args[0]));
    if (name === 'float') return parseFloat(String(args[0]));
    if (name === 'print') { this.output.push(args.map(String).join(' ')); return undefined; }
    if (name === 'type') return typeof args[0];
    if (name === 'sorted') return [...(args[0] ?? [])].sort((a, b) => a - b);
    if (name === 'reversed') return [...(args[0] ?? [])].reverse();
    if (name === 'sum') return (args[0] ?? []).reduce((a: number, b: number) => a + b, 0);
    if (name === 'list') return Array.isArray(args[0]) ? [...args[0]] : [];

    // Class constructor call
    if (name in this.classes) {
      const instance: Record<string, any> = { __class: name };
      const cls = this.classes[name];
      const init = cls.methods.__init__;
      if (init) {
        const local: Record<string, any> = { self: instance };
        const ps = init.params.filter(p => p !== 'self');
        ps.forEach((p, i) => { local[p] = args[i]; });
        this.callStack.push({ functionName: `${name}.__init__`, args: { ...local } });
        this.record(init.start - 1, 'function_call', `Call ${name}.__init__(${args.map(a => JSON.stringify(a)).join(', ')})`, local);
        try {
          this.executeBlock(init.start, init.end, this.lines[init.start]?.indent ?? this.indentUnit, local);
          this.callStack.pop();
        } catch (e) {
          if (e instanceof ReturnValue) this.callStack.pop();
          else { this.callStack.pop(); throw e; }
        }
      }
      return instance;
    }

    // User-defined
    const func = this.functions[name];
    if (!func) return undefined;

    const local: Record<string, any> = {};
    func.params.forEach((p, i) => { local[p] = args[i]; });

    this.callStack.push({ functionName: name, args: { ...local } });
    this.record(func.start - 1, 'function_call', `Call ${name}(${args.map(a => JSON.stringify(a)).join(', ')})`, local);

    try {
      this.executeBlock(func.start, func.end, this.lines[func.start]?.indent ?? this.indentUnit, local);
      this.callStack.pop();
      return undefined;
    } catch (e) {
      if (e instanceof ReturnValue) { this.callStack.pop(); return e.value; }
      this.callStack.pop();
      throw e;
    }
  }

  private parseComma(str: string): string[] {
    const result: string[] = [];
    let cur = '', depth = 0, inStr = false, sc = '';
    for (const ch of str) {
      if (inStr) { cur += ch; if (ch === sc) inStr = false; continue; }
      if (ch === '"' || ch === "'") { inStr = true; sc = ch; cur += ch; continue; }
      if (ch === '(' || ch === '[') { depth++; cur += ch; continue; }
      if (ch === ')' || ch === ']') { depth--; cur += ch; continue; }
      if (ch === ',' && depth === 0) { result.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    if (cur.trim()) result.push(cur.trim());
    return result;
  }

  private callMethod(obj: any, methodName: string, args: any[], scope: Record<string, any>): any {
    if (!obj || typeof obj !== 'object') return undefined;
    const className = obj.__class;
    if (!className || !(className in this.classes)) return undefined;
    const method = this.classes[className].methods[methodName];
    if (!method) return undefined;

    const local: Record<string, any> = { self: obj };
    const ps = method.params.filter(p => p !== 'self');
    ps.forEach((p, i) => { local[p] = args[i]; });

    this.callStack.push({ functionName: `${className}.${methodName}`, args: { ...local } });
    this.record(method.start - 1, 'function_call', `Call ${className}.${methodName}(${args.map(a => JSON.stringify(a)).join(', ')})`, local);

    try {
      this.executeBlock(method.start, method.end, this.lines[method.start]?.indent ?? this.indentUnit, local);
      this.callStack.pop();
      return undefined;
    } catch (e) {
      if (e instanceof ReturnValue) { this.callStack.pop(); return e.value; }
      this.callStack.pop();
      throw e;
    }
  }
}

// ─── C Interpreter (simplified) ───
class CInterpreter {
  private steps: ExecutionStep[] = [];
  private vars: Record<string, any> = {};
  private varTypes: Record<string, string> = {};
  private callStack: StackFrame[] = [];
  private output: string[] = [];
  private functions: Record<string, { params: { type: string; name: string }[]; body: string[] ; startLine: number }> = {};
  private stepCount = 0;
  private maxSteps = 500;
  private originalLines: string[] = [];

  run(code: string): ExecutionStep[] {
    this.steps = [];
    this.vars = {};
    this.varTypes = {};
    this.callStack = [];
    this.output = [];
    this.functions = {};
    this.stepCount = 0;
    this.originalLines = code.split('\n');

    // Simple line-by-line C interpreter
    const lines = this.originalLines.map(l => l.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('#'));
    this.findCFunctions(lines);
    try {
      this.executeCLines(lines, this.vars);
    } catch (e) {
      if (!(e instanceof ReturnValue)) {
        this.record(0, 'expression', `Error: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    return this.steps;
  }

  private record(line: number, type: ExecutionStep['type'], explanation: string, scope?: Record<string, any>) {
    if (this.stepCount++ > this.maxSteps) throw new Error('Max steps');
    this.steps.push({
      line: Math.min(line, this.originalLines.length - 1),
      type, explanation,
      variables: JSON.parse(JSON.stringify(scope ?? this.vars)),
      callStack: JSON.parse(JSON.stringify(this.callStack)),
      output: [...this.output],
    });
  }

  private findCFunctions(lines: string[]) {
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^(?:int|void|float|double|char)\s+(\w+)\s*\(([^)]*)\)\s*\{?$/);
      if (m && m[1] !== 'main') {
        const params = m[2] ? m[2].split(',').map(p => {
          const parts = p.trim().split(/\s+/);
          return { type: parts[0], name: parts[1] || parts[0] };
        }) : [];
        // Find matching brace
        let depth = lines[i].includes('{') ? 1 : 0;
        let j = i + 1;
        if (depth === 0 && j < lines.length && lines[j] === '{') { depth = 1; j++; }
        const bodyStart = j;
        while (j < lines.length && depth > 0) {
          if (lines[j].includes('{')) depth++;
          if (lines[j].includes('}')) depth--;
          if (depth > 0) j++;
          else break;
        }
        this.functions[m[1]] = { params, body: lines.slice(bodyStart, j), startLine: i };
      }
    }
  }

  private executeCLines(lines: string[], scope: Record<string, any>) {
    let i = 0;
    let inMain = false;
    let depth = 0;
    while (i < lines.length && this.stepCount < this.maxSteps) {
      let line = lines[i].replace(/;$/, '').trim();
      if (!line || line === '{' || line === '}') {
        if (lines[i].includes('{')) depth++;
        if (lines[i].includes('}')) depth--;
        i++; continue;
      }

      // Skip function definitions (non-main)
      if (line.match(/^(?:int|void|float|double|char)\s+\w+\s*\([^)]*\)\s*\{?$/) && !line.includes('main')) {
        let d = line.includes('{') ? 1 : 0;
        i++;
        while (i < lines.length) {
          if (lines[i].includes('{')) d++;
          if (lines[i].includes('}')) d--;
          i++;
          if (d <= 0) break;
        }
        continue;
      }

      // Main function start
      if (line.includes('main')) { i++; continue; }

      i = this.executeCLine(line, i, lines, scope);
    }
  }

  private executeCLine(line: string, idx: number, lines: string[], scope: Record<string, any>): number {
    line = line.replace(/;$/, '').trim();

    // Variable declaration/assignment
    const decl = line.match(/^(int|float|double|char|long)\s+(\w+)(?:\[(.+)\])?\s*(?:=\s*(.+))?$/);
    if (decl) {
      const type = decl[1];
      const name = decl[2];
      const arrSize = decl[3];
      const initExpr = decl[4];
      this.varTypes[name] = arrSize ? `${type}[]` : type;

      if (arrSize !== undefined) {
        const size = Math.max(0, Number(this.evalC(arrSize, scope)) || 0);
        scope[name] = Array.from({ length: size }, () => 0);
        this.record(idx, 'assignment', `${name} = ${JSON.stringify(scope[name])}`, scope);
      } else {
        const raw = initExpr ? this.evalC(initExpr, scope) : 0;
        const val = this.castCValue(name, raw);
        scope[name] = val;
        this.record(idx, 'assignment', `${name} = ${val}`, scope);
      }
      return idx + 1;
    }

    // Indexed assignment: arr[i] = value
    const idxAssign = line.match(/^(\w+)\[(.+)\]\s*=\s*(.+)$/);
    if (idxAssign && !line.includes('==')) {
      const arr = scope[idxAssign[1]];
      const key = this.evalC(idxAssign[2], scope);
      const raw = this.evalC(idxAssign[3], scope);
      const val = this.castCArrayValue(idxAssign[1], raw);
      if (Array.isArray(arr)) {
        arr[key] = val;
        this.record(idx, 'assignment', `${idxAssign[1]}[${key}] = ${val}`, scope);
        return idx + 1;
      }
    }

    // Assignment
    const assign = line.match(/^(\w+)\s*=\s*(.+)$/);
    if (assign && !line.includes('==')) {
      const raw = this.evalC(assign[2], scope);
      const val = this.castCValue(assign[1], raw);
      scope[assign[1]] = val;
      this.record(idx, 'assignment', `${assign[1]} = ${val}`, scope);
      return idx + 1;
    }

    // Increment/decrement
    const inc = line.match(/^(\w+)(\+\+|--)$/);
    if (inc) {
      scope[inc[1]] = (scope[inc[1]] ?? 0) + (inc[2] === '++' ? 1 : -1);
      this.record(idx, 'assignment', `${inc[1]}${inc[2]} → ${scope[inc[1]]}`, scope);
      return idx + 1;
    }

    // Augmented assignment
    const augC = line.match(/^(\w+)\s*(\+=|-=|\*=|\/=)\s*(.+)$/);
    if (augC) {
      const v = this.evalC(augC[3], scope);
      const op = augC[2];
      if (op === '+=') scope[augC[1]] += v;
      else if (op === '-=') scope[augC[1]] -= v;
      else if (op === '*=') scope[augC[1]] *= v;
      else scope[augC[1]] /= v;
      scope[augC[1]] = this.castCValue(augC[1], scope[augC[1]]);
      this.record(idx, 'assignment', `${augC[1]} ${op} ${v} → ${scope[augC[1]]}`, scope);
      return idx + 1;
    }

    // printf
    if (line.startsWith('printf(')) {
      const argsStr = line.slice(7, line.lastIndexOf(')'));
      const parts = this.parseCComma(argsStr);
      let fmt = parts[0]?.replace(/^"|"$/g, '') ?? '';
      const args = parts.slice(1).map(a => this.evalC(a, scope));
      let ai = 0;
      fmt = fmt.replace(/%[difs]/g, () => String(args[ai++] ?? ''));
      fmt = fmt.replace(/\\n/g, '');
      this.output.push(fmt);
      this.record(idx, 'print', `Output: ${fmt}`, scope);
      return idx + 1;
    }

    // If
    if (line.startsWith('if') && line.includes('(')) {
      const cond = line.match(/if\s*\((.+)\)/)?.[1] ?? '';
      const val = this.evalC(cond, scope);
      // Find block
      const { blockLines, endIdx: j } = this.extractCBlock(idx, lines, line);
      const branchHeader = this.getCBranchHeader(j, lines);

      if (val) {
        this.record(idx, 'condition_true', `${cond} → True`, scope);
        this.executeCBlockLines(blockLines, scope);
      } else {
        this.record(idx, 'condition_false', `${cond} → False`, scope);
      }

      // Check for else if / else
      if (branchHeader) {
        if (branchHeader.kind === 'else if') {
          const cleanLine = branchHeader.headerLine.replace(/^else\s+/, '');
          if (!val) return this.executeCLine(cleanLine, branchHeader.headerIdx, lines, scope);
          return this.skipCBranches(branchHeader.headerIdx, lines);
        }

        const { blockLines: elseLines, endIdx: afterElse } = this.extractCBlock(branchHeader.headerIdx, lines, branchHeader.headerLine);
        if (!val) {
          this.record(branchHeader.headerIdx, 'condition_true', 'Entering else block', scope);
          this.executeCBlockLines(elseLines, scope);
        }
        return afterElse;
      }

      return j + 1;
    }

    // While loop
    if (line.startsWith('while') && line.includes('(')) {
      const cond = line.match(/while\s*\((.+)\)/)?.[1] ?? '';
      const { blockLines, endIdx: j } = this.extractCBlock(idx, lines, line);
      this.record(idx, 'loop_start', 'While loop started', scope);

      let iter = 0;
      while (this.evalC(cond, scope) && iter++ < 200 && this.stepCount < this.maxSteps) {
        this.record(idx, 'loop_check', `Condition true (iteration ${iter})`, scope);
        this.executeCBlockLines(blockLines, scope);
      }

      this.record(idx, 'condition_false', 'Loop ended', scope);
      return j;
    }

    // For loop
    const forM = line.match(/^for\s*\((.+)\)/);
    if (forM) {
      const parts = forM[1].split(';').map(s => s.trim());
      if (parts.length === 3) {
        // Init
        this.executeCLine(parts[0], idx, lines, scope);
        this.record(idx, 'loop_start', `For loop started`, scope);
        let iter = 0;
        // Find body
        let blockLines: string[] = [];
        let j = idx + 1;
        if (line.includes('{') || (j < lines.length && lines[j].trim() === '{')) {
          if (!line.includes('{')) j++;
          let d = 1;
          const start = j;
          while (j < lines.length && d > 0) {
            if (lines[j].includes('{')) d++;
            if (lines[j].includes('}')) d--;
            if (d > 0) { blockLines.push(lines[j]); j++; }
            else j++;
          }
        }
        while (this.evalC(parts[1], scope) && iter++ < 200 && this.stepCount < this.maxSteps) {
          this.record(idx, 'loop_check', `Condition true (iteration ${iter})`, scope);
          this.executeCBlockLines(blockLines, scope);
          this.executeCLine(parts[2], idx, lines, scope);
        }
        this.record(idx, 'condition_false', 'Loop ended', scope);
        return j;
      }
    }

    // Return
    if (line.startsWith('return')) {
      const val = this.evalC(line.slice(6).trim(), scope);
      this.record(idx, 'function_return', `Return ${val}`, scope);
      throw new ReturnValue(val);
    }

    this.record(idx, 'expression', line, scope);
    return idx + 1;
  }

  private executeCBlockLines(blockLines: string[], scope: Record<string, any>) {
    let bi = 0;
    while (bi < blockLines.length && this.stepCount < this.maxSteps) {
      const bodyLine = blockLines[bi].replace(/;$/, '').trim();
      if (!bodyLine || bodyLine === '{' || bodyLine === '}') {
        bi++;
        continue;
      }
      bi = this.executeCLine(bodyLine, bi, blockLines, scope);
    }
  }

  private extractCBlock(idx: number, lines: string[], headerLine: string): { blockLines: string[]; endIdx: number } {
    const blockLines: string[] = [];
    let j = idx + 1;
    if (headerLine.includes('{') || (j < lines.length && lines[j].trim() === '{')) {
      if (!headerLine.includes('{')) j++;
      let d = 1;
      while (j < lines.length && d > 0) {
        const current = lines[j];
        if (current.includes('}')) {
          d--;
          if (d <= 0) {
            break;
          }
        }
        if (current.includes('{')) d++;
        blockLines.push(current);
        j++;
      }
    } else {
      blockLines.push(lines[j] ?? '');
      j = idx + 2;
    }
    return { blockLines, endIdx: j };
  }

  private getCBranchHeader(idx: number, lines: string[]): { headerIdx: number; headerLine: string; kind: 'else if' | 'else' } | null {
    const current = lines[idx]?.trim() ?? '';
    if (current.startsWith('} else if') || current.startsWith('else if')) {
      return {
        headerIdx: idx,
        headerLine: current.replace(/^\}\s*/, ''),
        kind: 'else if',
      };
    }

    if (current.startsWith('} else') || current.startsWith('else')) {
      return {
        headerIdx: idx,
        headerLine: current.replace(/^\}\s*/, ''),
        kind: 'else',
      };
    }

    const next = lines[idx + 1]?.trim() ?? '';
    if (next.startsWith('else if')) {
      return {
        headerIdx: idx + 1,
        headerLine: next,
        kind: 'else if',
      };
    }

    if (next.startsWith('else')) {
      return {
        headerIdx: idx + 1,
        headerLine: next,
        kind: 'else',
      };
    }

    return null;
  }

  private skipCBranches(idx: number, lines: string[]): number {
    let j = idx;
    // skip current else-if block
    let d = lines[j]?.includes('{') ? 1 : 0;
    j++;
    while (j < lines.length && d > 0) {
      if (lines[j].includes('}')) d--;
      if (d <= 0) { j++; break; }
      if (lines[j].includes('{')) d++;
      j++;
    }
    // skip any trailing else/else-if
    while (j < lines.length) {
      const nl = lines[j]?.trim() ?? '';
      if (nl.startsWith('} else') || nl.startsWith('else')) {
        d = nl.includes('{') ? 1 : 0;
        j++;
        if (d === 0) { j++; break; }
        while (j < lines.length && d > 0) {
          if (lines[j].includes('}')) d--;
          if (d <= 0) { j++; break; }
          if (lines[j].includes('{')) d++;
          j++;
        }
      } else break;
    }
    return j;
  }

  private evalC(expr: string, scope: Record<string, any>): any {
    expr = expr.trim().replace(/;$/, '');
    if (!expr) return 0;
    if (/^-?\d+(\.\d+)?$/.test(expr)) return Number(expr);
    if (expr.startsWith('"') && expr.endsWith('"')) return expr.slice(1, -1);
    if (expr.startsWith("'") && expr.endsWith("'")) return expr.charCodeAt(1);
    if (/^\w+$/.test(expr) && expr in scope) return scope[expr];

    // Array indexing
    const idxM = expr.match(/^(\w+)\[([^\]]+)\]$/);
    if (idxM) {
      const arr = scope[idxM[1]];
      const key = this.evalC(idxM[2], scope);
      if (Array.isArray(arr)) return arr[key] ?? 0;
    }

    // Direct function call: factorial(5)
    const fm = expr.match(/^(\w+)\s*\(([^()]*)\)$/);
    if (fm && fm[1] in this.functions) {
      const args = fm[2].trim() ? this.parseCComma(fm[2]).map(a => this.evalC(a, scope)) : [];
      return this.callCFunction(fm[1], args);
    }

    // Function calls inside expressions: n * factorial(n - 1)
    const processed = this.preprocessCFuncs(expr, scope);
    if (processed !== expr) return this.evalC(processed, scope);

    // JS eval fallback for arithmetic/comparisons
    const keys = Object.keys(scope);
    const vals = Object.values(scope);
    try {
      const value = new Function(...keys, `"use strict"; return (${expr})`)(...vals);
      if (typeof value === 'number' && expr.includes('/') && !expr.includes('.')) return Math.trunc(value);
      return value;
    } catch { return 0; }
  }

  private castCValue(name: string, value: any): any {
    const t = this.varTypes[name] ?? '';
    if (t === 'int' || t === 'long' || t === 'char') return Math.trunc(Number(value) || 0);
    return value;
  }

  private castCArrayValue(name: string, value: any): any {
    const t = this.varTypes[name] ?? '';
    if (t.startsWith('int') || t.startsWith('long') || t.startsWith('char')) return Math.trunc(Number(value) || 0);
    return value;
  }

  private preprocessCFuncs(expr: string, scope: Record<string, any>): string {
    let result = expr;
    let safety = 30;
    while (safety-- > 0) {
      const m = result.match(/\b(\w+)\s*\(([^()]*)\)/);
      if (!m) break;
      const name = m[1];
      if (!(name in this.functions)) break;

      const args = m[2].trim() ? this.parseCComma(m[2]).map(a => this.evalC(a, scope)) : [];
      const ret = this.callCFunction(name, args);
      const replacement = typeof ret === 'string' ? JSON.stringify(ret) : String(ret ?? 0);
      result = result.replace(m[0], replacement);
    }
    return result;
  }

  private callCFunction(name: string, args: any[]): any {
    const func = this.functions[name];
    if (!func) return 0;

    const local: Record<string, any> = {};
    func.params.forEach((p, i) => { local[p.name] = args[i]; });
    this.callStack.push({ functionName: name, args: { ...local } });
    this.record(func.startLine, 'function_call', `Call ${name}(${args.map(a => JSON.stringify(a)).join(', ')})`, local);

    try {
      let bi = 0;
      while (bi < func.body.length && this.stepCount < this.maxSteps) {
        const bodyLine = func.body[bi].replace(/;$/, '').trim();
        if (!bodyLine || bodyLine === '{' || bodyLine === '}') { bi++; continue; }
        bi = this.executeCLine(bodyLine, bi, func.body, local);
      }
      this.callStack.pop();
      return 0;
    } catch (e) {
      if (e instanceof ReturnValue) { this.callStack.pop(); return e.value; }
      this.callStack.pop();
      throw e;
    }
  }

  private parseCComma(str: string): string[] {
    const r: string[] = [];
    let cur = '', depth = 0, inStr = false, sc = '';
    for (const ch of str) {
      if (inStr) { cur += ch; if (ch === sc) inStr = false; continue; }
      if (ch === '"') { inStr = true; sc = ch; cur += ch; continue; }
      if (ch === '(') { depth++; cur += ch; continue; }
      if (ch === ')') { depth--; cur += ch; continue; }
      if (ch === ',' && depth === 0) { r.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    if (cur.trim()) r.push(cur.trim());
    return r;
  }
}

// ─── JavaScript Interpreter ───
class JavaScriptInterpreter {
  private steps: ExecutionStep[] = [];
  private globalVars: Record<string, any> = {};
  private callStack: StackFrame[] = [];
  private output: string[] = [];
  private functions: Record<string, { params: string[]; body: string[]; startLine: number }> = {};
  private classes: Record<string, { methods: Record<string, { params: string[]; body: string[]; startLine: number }> }> = {};
  private stepCount = 0;
  private maxSteps = 500;
  private originalLines: string[] = [];

  run(code: string): ExecutionStep[] {
    this.steps = [];
    this.globalVars = {};
    this.callStack = [];
    this.output = [];
    this.functions = {};
    this.classes = {};
    this.stepCount = 0;
    this.originalLines = code.split('\n');

    const lines = this.originalLines.map(l => l.trim()).filter(l => l && !l.startsWith('//'));
    this.findClasses(lines);
    this.findFunctions(lines);
    try {
      this.executeLines(lines, this.globalVars);
    } catch (e) {
      if (!(e instanceof ReturnValue)) {
        this.record(0, 'expression', `Error: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    return this.steps;
  }

  private record(line: number, type: ExecutionStep['type'], explanation: string, scope?: Record<string, any>) {
    if (this.stepCount++ > this.maxSteps) throw new Error('Max steps exceeded');
    this.steps.push({
      line: Math.min(line, this.originalLines.length - 1),
      type, explanation,
      variables: JSON.parse(JSON.stringify(scope ?? this.globalVars)),
      callStack: JSON.parse(JSON.stringify(this.callStack)),
      output: [...this.output],
    });
  }

  private findFunctions(lines: string[]) {
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^function\s+(\w+)\s*\(([^)]*)\)\s*\{?$/);
      if (m) {
        const params = m[2] ? m[2].split(',').map(p => p.trim()).filter(Boolean) : [];
        let depth = lines[i].includes('{') ? 1 : 0;
        let j = i + 1;
        if (depth === 0 && j < lines.length && lines[j] === '{') { depth = 1; j++; }
        const bodyStart = j;
        while (j < lines.length && depth > 0) {
          if (lines[j].includes('{')) depth++;
          if (lines[j].includes('}')) depth--;
          if (depth > 0) j++;
          else break;
        }
        this.functions[m[1]] = { params, body: lines.slice(bodyStart, j), startLine: i };
      }
    }
  }

  private executeLines(lines: string[], scope: Record<string, any>) {
    let i = 0;
    while (i < lines.length && this.stepCount < this.maxSteps) {
      let line = lines[i].replace(/;$/, '').trim();
      if (!line || line === '{' || line === '}') { i++; continue; }

      // Skip class definitions
      if (line.match(/^class\s+\w+/)) {
        let d = line.includes('{') ? 1 : 0;
        i++;
        while (i < lines.length) {
          if (lines[i].includes('{')) d++;
          if (lines[i].includes('}')) d--;
          i++;
          if (d <= 0) break;
        }
        continue;
      }

      // Skip function definitions
      if (line.match(/^function\s+\w+\s*\(/)) {
        let d = line.includes('{') ? 1 : 0;
        i++;
        while (i < lines.length) {
          if (lines[i].includes('{')) d++;
          if (lines[i].includes('}')) d--;
          i++;
          if (d <= 0) break;
        }
        continue;
      }

      i = this.executeLine(line, i, lines, scope);
    }
  }

  private executeLine(line: string, idx: number, lines: string[], scope: Record<string, any>): number {
    line = line.replace(/;$/, '').trim();

    // Variable declaration with let/const/var
    const decl = line.match(/^(?:let|const|var)\s+(\w+)\s*=\s*(.+)$/);
    if (decl) {
      const val = this.evalJS(decl[2], scope);
      scope[decl[1]] = val;
      this.record(idx, 'assignment', `${decl[1]} = ${JSON.stringify(val)}`, scope);
      return idx + 1;
    }

    // Variable declaration without assignment
    const declOnly = line.match(/^(?:let|const|var)\s+(\w+)$/);
    if (declOnly) {
      scope[declOnly[1]] = undefined;
      this.record(idx, 'assignment', `${declOnly[1]} = undefined`, scope);
      return idx + 1;
    }

    // Assignment
    const assign = line.match(/^(\w+)\s*=\s*(.+)$/);
    if (assign && !line.includes('==') && !line.includes('===')) {
      const val = this.evalJS(assign[2], scope);
      scope[assign[1]] = val;
      this.record(idx, 'assignment', `${assign[1]} = ${JSON.stringify(val)}`, scope);
      return idx + 1;
    }

    // Indexed assignment: arr[i] = value
    const idxAssign = line.match(/^(\w+)\[(.+)\]\s*=\s*(.+)$/);
    if (idxAssign && !line.includes('==') && !line.includes('===')) {
      const arr = scope[idxAssign[1]];
      const key = this.evalJS(idxAssign[2], scope);
      const val = this.evalJS(idxAssign[3], scope);
      if (arr && typeof arr === 'object') {
        arr[key] = val;
        this.record(idx, 'assignment', `${idxAssign[1]}[${JSON.stringify(key)}] = ${JSON.stringify(val)}`, scope);
        return idx + 1;
      }
    }

    // Object property assignment
    const propAssign = line.match(/^(\w+)\.(\w+)\s*=\s*(.+)$/);
    if (propAssign && !line.includes('==') && !line.includes('===')) {
      const obj = scope[propAssign[1]];
      const val = this.evalJS(propAssign[3], scope);
      if (obj && typeof obj === 'object') {
        obj[propAssign[2]] = val;
        this.record(idx, 'assignment', `${propAssign[1]}.${propAssign[2]} = ${JSON.stringify(val)}`, scope);
        return idx + 1;
      }
    }

    // Augmented assignment
    const aug = line.match(/^(\w+)\s*(\+=|-=|\*=|\/=|%=)\s*(.+)$/);
    if (aug) {
      const v = this.evalJS(aug[3], scope);
      const op = aug[2];
      if (op === '+=') scope[aug[1]] = (scope[aug[1]] ?? 0) + v;
      else if (op === '-=') scope[aug[1]] = (scope[aug[1]] ?? 0) - v;
      else if (op === '*=') scope[aug[1]] = (scope[aug[1]] ?? 0) * v;
      else if (op === '/=') scope[aug[1]] = (scope[aug[1]] ?? 0) / v;
      else if (op === '%=') scope[aug[1]] = (scope[aug[1]] ?? 0) % v;
      this.record(idx, 'assignment', `${aug[1]} ${op} ${v} → ${scope[aug[1]]}`, scope);
      return idx + 1;
    }

    // Increment/decrement
    const inc = line.match(/^(\w+)(\+\+|--)$/);
    if (inc) {
      scope[inc[1]] = (scope[inc[1]] ?? 0) + (inc[2] === '++' ? 1 : -1);
      this.record(idx, 'assignment', `${inc[1]}${inc[2]} → ${scope[inc[1]]}`, scope);
      return idx + 1;
    }

    // console.log
    if (line.startsWith('console.log(') && line.endsWith(')')) {
      const argsStr = line.slice(12, -1);
      const args = argsStr.trim() ? this.parseComma(argsStr).map(a => this.evalJS(a, scope)) : [];
      const out = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
      this.output.push(out);
      this.record(idx, 'print', `Output: ${out}`, scope);
      return idx + 1;
    }

    // Array method calls: arr.push(x), arr.pop(), etc.
    const method = line.match(/^(\w+)\.(push|pop|shift|unshift|splice|reverse|sort)\s*\(([^)]*)\)$/);
    if (method) {
      const obj = scope[method[1]];
      const args = method[3].trim() ? this.parseComma(method[3]).map(a => this.evalJS(a, scope)) : [];
      if (Array.isArray(obj)) {
        if (method[2] === 'push') obj.push(...args);
        else if (method[2] === 'pop') obj.pop();
        else if (method[2] === 'shift') obj.shift();
        else if (method[2] === 'unshift') obj.unshift(...args);
        else if (method[2] === 'reverse') obj.reverse();
        else if (method[2] === 'sort') obj.sort((a: number, b: number) => a - b);
      }
      this.record(idx, 'expression', `${method[1]}.${method[2]}(${args.map(a => JSON.stringify(a)).join(', ')})`, scope);
      return idx + 1;
    }

    // Object method calls
    const objMethod = line.match(/^(\w+)\.(\w+)\s*\(([^)]*)\)$/);
    if (objMethod) {
      const obj = scope[objMethod[1]];
      const args = objMethod[3].trim() ? this.parseComma(objMethod[3]).map(a => this.evalJS(a, scope)) : [];
      this.callClassMethod(obj, objMethod[2], args, scope);
      this.record(idx, 'expression', `${objMethod[1]}.${objMethod[2]}(${args.map(a => JSON.stringify(a)).join(', ')})`, scope);
      return idx + 1;
    }

    // If statement
    if (line.startsWith('if') && line.includes('(')) {
      const cond = line.match(/if\s*\((.+)\)/)?.[1] ?? '';
      const val = this.evalJS(cond, scope);
      let blockLines: string[] = [];
      let j = idx + 1;
      if (line.includes('{') || (j < lines.length && lines[j].trim() === '{')) {
        if (!line.includes('{')) j++;
        let d = 1;
        while (j < lines.length && d > 0) {
          const blockLine = lines[j].trim();
          // Preserve `} else {` for the dedicated else-handling branch below.
          if (d === 1 && /^\}\s*else\b/.test(blockLine)) {
            break;
          }
          if (lines[j].includes('}')) d--;
          if (d <= 0) { j++; break; }
          if (lines[j].includes('{')) d++;
          blockLines.push(lines[j]);
          j++;
        }
      } else {
        blockLines = [lines[j] ?? ''];
        j = idx + 2;
      }

      if (val) {
        this.record(idx, 'condition_true', `${cond} → true`, scope);
        this.executeJSBlockLines(blockLines, scope);
      } else {
        this.record(idx, 'condition_false', `${cond} → false`, scope);
      }

      // Check for else if / else
      if (j < lines.length) {
        const nextLine = lines[j]?.trim() ?? '';
        if (nextLine.startsWith('} else if') || nextLine.startsWith('else if')) {
          const cleanLine = nextLine.replace(/^\}\s*/, '');
          if (!val) return this.executeLine(cleanLine, j, lines, scope);
          // skip else if + trailing else blocks
          let d = nextLine.includes('{') ? 1 : 0;
          j++;
          while (j < lines.length && d > 0) {
            if (lines[j].includes('}')) d--;
            if (d <= 0) { j++; break; }
            if (lines[j].includes('{')) d++;
            j++;
          }
          // skip trailing else
          while (j < lines.length) {
            const nl = lines[j]?.trim() ?? '';
            if (nl.startsWith('} else') || nl.startsWith('else')) {
              d = nl.includes('{') ? 1 : 0;
              j++;
              if (d === 0) { j++; break; }
              while (j < lines.length && d > 0) {
                if (lines[j].includes('}')) d--;
                if (d <= 0) { j++; break; }
                if (lines[j].includes('{')) d++;
                j++;
              }
            } else break;
          }
          return j;
        }
        if (nextLine.startsWith('} else') || nextLine.startsWith('else')) {
          let elseLines: string[] = [];
          let k = j + 1;
          if (nextLine.includes('{') || (k < lines.length && lines[k].trim() === '{')) {
            if (!nextLine.includes('{')) k++;
            let d = 1;
            while (k < lines.length && d > 0) {
              if (lines[k].includes('}')) d--;
              if (d <= 0) { k++; break; }
              if (lines[k].includes('{')) d++;
              elseLines.push(lines[k]);
              k++;
            }
          } else {
            elseLines = [lines[k] ?? ''];
            k++;
          }
          if (!val) {
            this.record(j, 'condition_true', 'Entering else block', scope);
            this.executeJSBlockLines(elseLines, scope);
          }
          return k;
        }
      }
      return j;
    }

    // For loop
    const forM = line.match(/^for\s*\((.+)\)/);
    if (forM) {
      const parts = forM[1].split(';').map(s => s.trim());
      if (parts.length === 3) {
        this.executeLine(parts[0], idx, lines, scope);
        this.record(idx, 'loop_start', `For loop started`, scope);
        let iter = 0;
        let blockLines: string[] = [];
        let j = idx + 1;
        if (line.includes('{') || (j < lines.length && lines[j].trim() === '{')) {
          if (!line.includes('{')) j++;
          let d = 1;
          while (j < lines.length && d > 0) {
            if (lines[j].includes('{')) d++;
            if (lines[j].includes('}')) d--;
            if (d > 0) { blockLines.push(lines[j]); j++; }
            else j++;
          }
        }
        while (this.evalJS(parts[1], scope) && iter++ < 200 && this.stepCount < this.maxSteps) {
          this.record(idx, 'loop_check', `Condition true (iteration ${iter})`, scope);
          this.executeJSBlockLines(blockLines, scope);
          this.executeLine(parts[2], idx, lines, scope);
        }
        return j;
      }
    }

    // While loop
    if (line.startsWith('while') && line.includes('(')) {
      const cond = line.match(/while\s*\((.+)\)/)?.[1] ?? '';
      let blockLines: string[] = [];
      let j = idx + 1;
      if (line.includes('{') || (j < lines.length && lines[j].trim() === '{')) {
        if (!line.includes('{')) j++;
        let d = 1;
        while (j < lines.length && d > 0) {
          if (lines[j].includes('{')) d++;
          if (lines[j].includes('}')) d--;
          if (d > 0) { blockLines.push(lines[j]); j++; }
          else j++;
        }
      }
      this.record(idx, 'loop_start', `While loop: ${cond}`, scope);
      let iter = 0;
      while (this.evalJS(cond, scope) && iter++ < 200 && this.stepCount < this.maxSteps) {
        this.record(idx, 'loop_check', `${cond} → true (iteration ${iter})`, scope);
        this.executeJSBlockLines(blockLines, scope);
      }
      if (iter > 0) this.record(idx, 'condition_false', `${cond} → false, loop ended`, scope);
      return j;
    }

    // Return
    if (line.startsWith('return')) {
      const val = this.evalJS(line.slice(6).trim(), scope);
      this.record(idx, 'function_return', `Return ${JSON.stringify(val)}`, scope);
      throw new ReturnValue(val);
    }

    // General expression
    this.evalJS(line, scope);
    this.record(idx, 'expression', `Evaluated: ${line}`, scope);
    return idx + 1;
  }

  private executeJSBlockLines(blockLines: string[], scope: Record<string, any>) {
    let bi = 0;
    while (bi < blockLines.length && this.stepCount < this.maxSteps) {
      const bodyLine = blockLines[bi].replace(/;$/, '').trim();
      if (!bodyLine || bodyLine === '{' || bodyLine === '}') {
        bi++;
        continue;
      }
      bi = this.executeLine(bodyLine, bi, blockLines, scope);
    }
  }

  private evalJS(expr: string, scope: Record<string, any>): any {
    expr = expr.trim().replace(/;$/, '');
    if (!expr) return undefined;

    // Remove let/const/var prefix for inline declarations (e.g. in for init)
    const declM = expr.match(/^(?:let|const|var)\s+(\w+)\s*=\s*(.+)$/);
    if (declM) {
      const val = this.evalJS(declM[2], scope);
      scope[declM[1]] = val;
      return val;
    }

    if (/^-?\d+(\.\d+)?$/.test(expr)) return Number(expr);
    if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'")) || (expr.startsWith('`') && expr.endsWith('`')))
      return expr.slice(1, -1);
    if (expr === 'true') return true;
    if (expr === 'false') return false;
    if (expr === 'null') return null;
    if (expr === 'undefined') return undefined;
    if (/^\w+$/.test(expr) && expr in scope) return scope[expr];

    // Constructor call: new ClassName(...)
    const newM = expr.match(/^new\s+(\w+)\s*\((.*)\)$/);
    if (newM) {
      const args = newM[2].trim() ? this.parseComma(newM[2]).map(a => this.evalJS(a, scope)) : [];
      return this.instantiateClass(newM[1], args);
    }

    // Array literal
    if (expr.startsWith('[') && expr.endsWith(']')) {
      const inner = expr.slice(1, -1).trim();
      if (!inner) return [];
      return this.parseComma(inner).map(e => this.evalJS(e, scope));
    }

    // Object literal
    if (expr.startsWith('{') && expr.endsWith('}')) {
      const inner = expr.slice(1, -1).trim();
      if (!inner) return {};
      const obj: Record<string, any> = {};
      const pairs = this.parseComma(inner);
      for (const pair of pairs) {
        const [k, ...rest] = pair.split(':');
        if (k && rest.length) obj[k.trim().replace(/['"]/g, '')] = this.evalJS(rest.join(':'), scope);
      }
      return obj;
    }

    // Array/object indexing
    const idxM = expr.match(/^(\w+)\[([^\]]+)\]$/);
    if (idxM) {
      const obj = scope[idxM[1]];
      const key = this.evalJS(idxM[2], scope);
      return obj?.[key];
    }

    // Property access: obj.prop or arr.length
    const propM = expr.match(/^(\w+)\.(\w+)$/);
    if (propM) {
      const obj = scope[propM[1]];
      if (obj !== undefined && obj !== null) return obj[propM[2]];
    }

    // Method call expression: obj.method(...)
    const methodExpr = expr.match(/^(\w+)\.(\w+)\s*\((.*)\)$/);
    if (methodExpr) {
      const obj = scope[methodExpr[1]];
      const args = methodExpr[3].trim() ? this.parseComma(methodExpr[3]).map(a => this.evalJS(a, scope)) : [];
      return this.callClassMethod(obj, methodExpr[2], args, scope);
    }

    // Preprocess function calls
    let processed = this.preprocessFuncs(expr, scope);

    const keys: string[] = [];
    const vals: any[] = [];
    let safeExpr = processed;
    for (const [k, v] of Object.entries(scope)) {
      if (k === 'this') {
        keys.push('__this');
        vals.push(v);
        safeExpr = safeExpr.replace(/\bthis\b/g, '__this');
      } else {
        keys.push(k);
        vals.push(v);
      }
    }

    try {
      return new Function(...keys, `"use strict"; return (${safeExpr})`)(...vals);
    } catch { return undefined; }
  }

  private preprocessFuncs(expr: string, scope: Record<string, any>): string {
    let result = expr;
    let safety = 20;
    while (safety-- > 0) {
      const m = result.match(/\b(\w+)\s*\(([^()]*)\)/);
      if (!m) break;
      const name = m[1];
      if (['if', 'while', 'for', 'function', 'return', 'Math', 'console', 'let', 'const', 'var'].includes(name)) break;
      const args = m[2].trim() ? this.parseComma(m[2]).map(a => this.evalJS(a, scope)) : [];
      const ret = this.callFunc(name, args, scope);
      result = result.replace(m[0], ret === undefined ? 'undefined' : JSON.stringify(ret));
    }
    return result;
  }

  private callFunc(name: string, args: any[], scope: Record<string, any>): any {
    // Built-ins
    if (name === 'Math') return undefined;
    if (name === 'parseInt') return parseInt(String(args[0]));
    if (name === 'parseFloat') return parseFloat(String(args[0]));
    if (name === 'String') return String(args[0]);
    if (name === 'Number') return Number(args[0]);
    if (name === 'isNaN') return isNaN(args[0]);
    if (name === 'Array') return new Array(args[0]).fill(0);

    if (name in this.classes) return this.instantiateClass(name, args);

    // User-defined
    const func = this.functions[name];
    if (!func) return undefined;

    const local: Record<string, any> = {};
    func.params.forEach((p, i) => { local[p] = args[i]; });
    this.callStack.push({ functionName: name, args: { ...local } });
    this.record(func.startLine, 'function_call', `Call ${name}(${args.map(a => JSON.stringify(a)).join(', ')})`, local);

    try {
      let bi = 0;
      while (bi < func.body.length && this.stepCount < this.maxSteps) {
        const bodyLine = func.body[bi].replace(/;$/, '').trim();
        if (!bodyLine || bodyLine === '{' || bodyLine === '}') { bi++; continue; }
        bi = this.executeLine(bodyLine, bi, func.body, local);
      }
      this.callStack.pop();
      return undefined;
    } catch (e) {
      if (e instanceof ReturnValue) { this.callStack.pop(); return e.value; }
      this.callStack.pop(); throw e;
    }
  }

  private parseComma(str: string): string[] {
    const result: string[] = [];
    let cur = '', depth = 0, inStr = false, sc = '';
    for (const ch of str) {
      if (inStr) { cur += ch; if (ch === sc) inStr = false; continue; }
      if (ch === '"' || ch === "'" || ch === '`') { inStr = true; sc = ch; cur += ch; continue; }
      if (ch === '(' || ch === '[' || ch === '{') { depth++; cur += ch; continue; }
      if (ch === ')' || ch === ']' || ch === '}') { depth--; cur += ch; continue; }
      if (ch === ',' && depth === 0) { result.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    if (cur.trim()) result.push(cur.trim());
    return result;
  }

  private findClasses(lines: string[]) {
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^class\s+(\w+)\s*\{?$/);
      if (!m) continue;

      let depth = lines[i].includes('{') ? 1 : 0;
      let j = i + 1;
      if (depth === 0 && j < lines.length && lines[j] === '{') { depth = 1; j++; }
      const bodyStart = j;
      while (j < lines.length && depth > 0) {
        if (lines[j].includes('{')) depth++;
        if (lines[j].includes('}')) depth--;
        if (depth > 0) j++;
        else break;
      }

      const body = lines.slice(bodyStart, j);
      const methods: Record<string, { params: string[]; body: string[]; startLine: number }> = Object.create(null);

      let bi = 0;
      while (bi < body.length) {
        const header = body[bi].trim();
        const mm = header.match(/^(\w+)\s*\(([^)]*)\)\s*\{?$/);
        if (!mm || ['if', 'for', 'while', 'switch', 'catch'].includes(mm[1])) { bi++; continue; }

        let md = header.includes('{') ? 1 : 0;
        let k = bi + 1;
        if (md === 0 && k < body.length && body[k] === '{') { md = 1; k++; }
        const methodStart = k;
        while (k < body.length && md > 0) {
          if (body[k].includes('{')) md++;
          if (body[k].includes('}')) md--;
          if (md > 0) k++;
          else break;
        }

        methods[mm[1]] = {
          params: mm[2] ? mm[2].split(',').map(p => p.trim()).filter(Boolean) : [],
          body: body.slice(methodStart, k),
          startLine: i,
        };
        bi = k + 1;
      }

      this.classes[m[1]] = { methods };
    }
  }

  private instantiateClass(name: string, args: any[]): any {
    const cls = this.classes[name];
    if (!cls) return undefined;
    const instance: Record<string, any> = { __class: name };
    const ctor = Object.prototype.hasOwnProperty.call(cls.methods, 'constructor')
      ? cls.methods['constructor']
      : undefined;
    if (!ctor) return instance;

    const local: Record<string, any> = { this: instance };
    ctor.params.forEach((p, i) => { local[p] = args[i]; });
    this.callStack.push({ functionName: `${name}.constructor`, args: { ...local } });
    this.record(ctor.startLine, 'function_call', `Call ${name}.constructor(${args.map(a => JSON.stringify(a)).join(', ')})`, local);

    try {
      let bi = 0;
      while (bi < ctor.body.length && this.stepCount < this.maxSteps) {
        const bodyLine = ctor.body[bi].replace(/;$/, '').trim();
        if (!bodyLine || bodyLine === '{' || bodyLine === '}') { bi++; continue; }
        bi = this.executeLine(bodyLine, bi, ctor.body, local);
      }
      this.callStack.pop();
      return instance;
    } catch (e) {
      if (e instanceof ReturnValue) { this.callStack.pop(); return instance; }
      this.callStack.pop();
      throw e;
    }
  }

  private callClassMethod(obj: any, methodName: string, args: any[], scope: Record<string, any>): any {
    if (!obj || typeof obj !== 'object') return undefined;
    const className = obj.__class;
    if (!className || !(className in this.classes)) return undefined;
    const method = this.classes[className].methods[methodName];
    if (!method) return undefined;

    const local: Record<string, any> = { this: obj };
    method.params.forEach((p, i) => { local[p] = args[i]; });
    this.callStack.push({ functionName: `${className}.${methodName}`, args: { ...local } });
    this.record(method.startLine, 'function_call', `Call ${className}.${methodName}(${args.map(a => JSON.stringify(a)).join(', ')})`, local);

    try {
      let bi = 0;
      while (bi < method.body.length && this.stepCount < this.maxSteps) {
        const bodyLine = method.body[bi].replace(/;$/, '').trim();
        if (!bodyLine || bodyLine === '{' || bodyLine === '}') { bi++; continue; }
        bi = this.executeLine(bodyLine, bi, method.body, local);
      }
      this.callStack.pop();
      return undefined;
    } catch (e) {
      if (e instanceof ReturnValue) { this.callStack.pop(); return e.value; }
      this.callStack.pop();
      throw e;
    }
  }
}

function normalizePhpCode(code: string): string {
  const lines = code.split('\n');
  const out: string[] = [];
  let inClass = false;
  let classDepth = 0;

  for (const raw of lines) {
    let line = raw.trim();
    if (line === '' || line === '<?php' || line === '?>') {
      out.push('');
      continue;
    }

    if (line.startsWith('//') || line.startsWith('#')) {
      out.push(line);
      continue;
    }

    const startsClass = /^class\s+\w+/.test(line);

    line = line
      .replace(/\belseif\b/g, 'else if')
      .replace(/\$([a-zA-Z_][\w]*)/g, '$1')
      .replace(/\$this->/g, 'this.')
      .replace(/->/g, '.')
      .replace(/\b__construct\s*\(/g, 'constructor(')
      .replace(/\becho\s*\((.*)\)\s*;/, 'console.log($1);')
      .replace(/\becho\s+([^;]+);/, 'console.log($1);');

    if (inClass) {
      line = line.replace(/^function\s+([a-zA-Z_][\w]*)\s*\(/, '$1(');
    }

    const opens = (line.match(/\{/g) ?? []).length;
    const closes = (line.match(/\}/g) ?? []).length;
    if (startsClass) {
      inClass = true;
      classDepth += opens - closes;
    } else if (inClass) {
      classDepth += opens - closes;
      if (classDepth <= 0) {
        inClass = false;
        classDepth = 0;
      }
    }

    out.push(line);
  }

  return out.join('\n');
}

function normalizeJavaLikeCode(code: string, lang: 'java' | 'dotnet'): string {
  const lines = code.split('\n');
  const classStack: string[] = [];
  let inClass = false;
  const out: string[] = [];
  let sawMainMethod = false;
  const entryClasses: Array<{ className: string; methodName: string }> = [];

  const removeModifiers = (s: string) =>
    s
      .replace(/\bpublic\b/g, '')
      .replace(/\bprivate\b/g, '')
      .replace(/\bprotected\b/g, '')
      .replace(/\binternal\b/g, '')
      .replace(/\bstatic\b/g, '')
      .replace(/\bfinal\b/g, '')
      .replace(/\bvirtual\b/g, '')
      .replace(/\boverride\b/g, '')
      .replace(/\breadonly\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  for (const raw of lines) {
    let line = raw.trim();
    if (!line) {
      out.push('');
      continue;
    }

    if (/^(import|package|using\s+[\w\.\*]+;?)/.test(line)) {
      out.push('');
      continue;
    }

    line = line
      .replace(/System\.out\.println\s*\(/g, 'console.log(')
      .replace(/Console\.WriteLine\s*\(/g, 'console.log(')
      .replace(/Console\.Write\s*\(/g, 'console.log(')
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false')
      .replace(/\bnull\b/g, 'null');

    const classMatch = line.match(/^\s*(?:public\s+)?class\s+(\w+)\s*\{?\s*$/);
    if (classMatch) {
      const className = classMatch[1];
      classStack.push(className);
      inClass = true;
      out.push(`class ${className} {`);
      continue;
    }

    if (line === '}') {
      if (inClass && classStack.length > 0) classStack.pop();
      inClass = classStack.length > 0;
      out.push('}');
      continue;
    }

    // Convert constructor signatures: ClassName(args) { -> constructor(args) {
    if (inClass && classStack.length > 0) {
      const currentClass = classStack[classStack.length - 1];
      const ctorRegex = new RegExp(`^${currentClass}\\s*\\(([^)]*)\\)\\s*\\{?\\s*$`);
      const ctorMatch = removeModifiers(line).match(ctorRegex);
      if (ctorMatch) {
        const params = ctorMatch[1]
          .split(',')
          .map(p => p.trim())
          .filter(Boolean)
          .map(p => p.split(/\s+/).pop() ?? p)
          .join(', ');
        out.push(`constructor(${params}) {`);
        continue;
      }
    }

    // Convert method signatures in class: int add(int a, int b) { -> add(a, b) {
    if (inClass) {
      const m = removeModifiers(line).match(/^(?:void|int|double|float|long|bool|boolean|String|string|char|decimal)(?:\[\])?\s+(\w+)\s*\(([^)]*)\)\s*\{?\s*$/);
      if (m) {
        const methodName = m[1];
        if (methodName.toLowerCase() === 'main') {
          sawMainMethod = true;
          const currentClass = classStack[classStack.length - 1];
          if (currentClass) entryClasses.push({ className: currentClass, methodName });
        }
        const params = m[2]
          .split(',')
          .map(p => p.trim())
          .filter(Boolean)
          .map(p => p.split(/\s+/).pop() ?? p)
          .join(', ');
        out.push(`${methodName}(${params}) {`);
        continue;
      }
    }

    // Convert top-level typed function signatures to JS function declarations
    const fn = removeModifiers(line).match(/^(?:void|int|double|float|long|bool|boolean|String|string|char|decimal)(?:\[\])?\s+(\w+)\s*\(([^)]*)\)\s*\{?\s*$/);
    if (fn && !inClass) {
      const fnName = fn[1];
      if (fnName.toLowerCase() === 'main') sawMainMethod = true;
      const params = fn[2]
        .split(',')
        .map(p => p.trim())
        .filter(Boolean)
        .map(p => p.split(/\s+/).pop() ?? p)
        .join(', ');
      out.push(`function ${fnName}(${params}) {`);
      continue;
    }

    // Convert typed declarations: int x = 1; -> let x = 1;
    line = line
      .replace(/\b(?:int|double|float|long|bool|boolean|String|string|char|decimal)(?:\[\])\s+(\w+)\s*=/g, 'let $1 =')
      .replace(/\b(?:int|double|float|long|bool|boolean|String|string|char|decimal|var)\s+(\w+)\s*=/g, 'let $1 =')
      .replace(/\b(?:int|double|float|long|bool|boolean|String|string|char|decimal)(?:\[\])\s+(\w+)\b/g, 'let $1')
      .replace(/\b(?:int|double|float|long|bool|boolean|String|string|char|decimal|var)\s+(\w+)\b/g, 'let $1')
      .replace(/new\s+\w+\s*\[(\d+)\]/g, 'new Array($1).fill(0)')
      .replace(/new\s+\w+\[\]\s*\{([^}]*)\}/g, '[$1]');

    out.push(line);
  }

  if (sawMainMethod) {
    for (const entry of entryClasses) {
      const safe = entry.className.replace(/[^a-zA-Z0-9_]/g, '_');
      out.push(`let __entry_${safe} = new ${entry.className}();`);
      out.push(`__entry_${safe}.${entry.methodName}([]);`);
    }

    out.push('if (typeof main === "function") {');
    out.push('    main([]);');
    out.push('}');
    out.push('if (typeof Main === "function") {');
    out.push('    Main([]);');
    out.push('}');
  }

  // Keep language param to allow future language-specific tweaks.
  void lang;
  return out.join('\n');
}

class JavaInterpreter {
  run(code: string): ExecutionStep[] {
    const normalized = normalizeJavaLikeCode(code, 'java');
    return new JavaScriptInterpreter().run(normalized);
  }
}

class DotNetInterpreter {
  run(code: string): ExecutionStep[] {
    const normalized = normalizeJavaLikeCode(code, 'dotnet');
    return new JavaScriptInterpreter().run(normalized);
  }
}

class PhpInterpreter {
  run(code: string): ExecutionStep[] {
    const normalized = normalizePhpCode(code);
    return new JavaScriptInterpreter().run(normalized);
  }
}

// ─── Public API ───
export function traceCode(code: string, language: Language): ExecutionStep[] {
  if (language === 'python') return new PythonInterpreter().run(code);
  if (language === 'javascript') return new JavaScriptInterpreter().run(code);
  if (language === 'java') return new JavaInterpreter().run(code);
  if (language === 'dotnet') return new DotNetInterpreter().run(code);
  if (language === 'php') return new PhpInterpreter().run(code);
  return new CInterpreter().run(code);
}
