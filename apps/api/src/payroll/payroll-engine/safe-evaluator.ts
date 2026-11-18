/**
 * Safe Mathematical Expression Evaluator
 * Fully sandboxed parser without eval() or new Function().
 * Supports basic arithmetic (+, -, *, /, ^, unary -), parentheses, and variables.
 */

export class SafeFormulaEvaluator {
  /**
   * Evaluates a mathematical expression safely using an AST / RPN evaluator with context variables.
   * @param expression e.g. "BASIC * 0.4", "0.5 * BASIC + 1000", "min(BASIC * 0.1, 1500)"
   * @param context Key-value dictionary of available component values, e.g. { BASIC: 50000, GROSS: 80000 }
   */
  static evaluate(expression: string, context: Record<string, number> = {}): number {
    if (!expression || !expression.trim()) return 0;

    // Normalize expression
    const expr = expression.trim();
    const tokens = this.tokenize(expr);
    const rpn = this.toRpn(tokens);
    return this.evaluateRpn(rpn, context);
  }

  /**
   * Tokenizes an arithmetic expression into numbers, operators, identifiers, and brackets.
   */
  private static tokenize(expr: string): string[] {
    const tokens: string[] = [];
    let i = 0;

    while (i < expr.length) {
      const char = expr[i];

      if (/\s/.test(char)) {
        i++;
        continue;
      }

      if (/[0-9.]/.test(char)) {
        let numStr = '';
        while (i < expr.length && /[0-9.]/.test(expr[i])) {
          numStr += expr[i];
          i++;
        }
        tokens.push(numStr);
        continue;
      }

      if (/[a-zA-Z_]/.test(char)) {
        let idStr = '';
        while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) {
          idStr += expr[i];
          i++;
        }
        tokens.push(idStr);
        continue;
      }

      if (['+', '-', '*', '/', '^', '(', ')', ','].includes(char)) {
        // Handle unary minus
        if (
          char === '-' &&
          (tokens.length === 0 || ['+', '-', '*', '/', '^', '(', ','].includes(tokens[tokens.length - 1]))
        ) {
          tokens.push('u-');
        } else {
          tokens.push(char);
        }
        i++;
        continue;
      }

      throw new Error(`Invalid character in formula: '${char}'`);
    }

    return tokens;
  }

  /**
   * Converts infix tokens to Reverse Polish Notation (RPN) using Dijkstra's Shunting-yard algorithm.
   */
  private static toRpn(tokens: string[]): string[] {
    const output: string[] = [];
    const opStack: string[] = [];

    const precedence: Record<string, number> = {
      '+': 1,
      '-': 1,
      '*': 2,
      '/': 2,
      '^': 3,
      'u-': 4,
    };

    const isRightAssociative = (op: string) => op === '^' || op === 'u-';

    for (const token of tokens) {
      if (/^[0-9.]+$/.test(token) || /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token)) {
        output.push(token);
      } else if (token in precedence) {
        while (
          opStack.length > 0 &&
          opStack[opStack.length - 1] !== '(' &&
          (precedence[opStack[opStack.length - 1]] > precedence[token] ||
            (precedence[opStack[opStack.length - 1]] === precedence[token] && !isRightAssociative(token)))
        ) {
          output.push(opStack.pop()!);
        }
        opStack.push(token);
      } else if (token === '(') {
        opStack.push(token);
      } else if (token === ')') {
        while (opStack.length > 0 && opStack[opStack.length - 1] !== '(') {
          output.push(opStack.pop()!);
        }
        if (opStack.length === 0) {
          throw new Error('Mismatched parentheses in formula');
        }
        opStack.pop(); // Remove '('
      }
    }

    while (opStack.length > 0) {
      const op = opStack.pop()!;
      if (op === '(' || op === ')') {
        throw new Error('Mismatched parentheses in formula');
      }
      output.push(op);
    }

    return output;
  }

  /**
   * Evaluates an RPN queue with context values.
   */
  private static evaluateRpn(rpn: string[], context: Record<string, number>): number {
    const stack: number[] = [];

    for (const token of rpn) {
      if (/^[0-9.]+$/.test(token)) {
        stack.push(parseFloat(token));
      } else if (token === 'u-') {
        if (stack.length < 1) throw new Error('Invalid formula unary operator');
        stack.push(-stack.pop()!);
      } else if (['+', '-', '*', '/', '^'].includes(token)) {
        if (stack.length < 2) throw new Error(`Invalid formula operator syntax for '${token}'`);
        const b = stack.pop()!;
        const a = stack.pop()!;
        switch (token) {
          case '+':
            stack.push(a + b);
            break;
          case '-':
            stack.push(a - b);
            break;
          case '*':
            stack.push(a * b);
            break;
          case '/':
            stack.push(b === 0 ? 0 : a / b);
            break;
          case '^':
            stack.push(Math.pow(a, b));
            break;
        }
      } else {
        // Variable identifier
        const upperToken = token.toUpperCase();
        let val = 0;
        if (token in context) {
          val = context[token];
        } else if (upperToken in context) {
          val = context[upperToken];
        }
        stack.push(Number.isFinite(val) ? val : 0);
      }
    }

    if (stack.length !== 1) {
      throw new Error('Formula evaluation resulted in multiple stack states');
    }

    const result = stack.pop()!;
    return Number.isFinite(result) ? Math.round(result * 100) / 100 : 0;
  }

  /**
   * Detects circular dependencies in a set of formulas using DFS cycle detection.
   * @param formulas Record of componentCode -> formula
   * @returns array of componentCodes involved in cycle or null if acyclic
   */
  static detectCircularDependencies(
    formulas: Record<string, string | null | undefined>,
  ): string[] | null {
    const adjList: Record<string, string[]> = {};

    for (const [code, formula] of Object.entries(formulas)) {
      adjList[code.toUpperCase()] = [];
      if (formula) {
        const matches = formula.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
        for (const dep of matches) {
          const upperDep = dep.toUpperCase();
          if (upperDep !== code.toUpperCase()) {
            adjList[code.toUpperCase()].push(upperDep);
          } else {
            // Self-referencing cycle
            return [code];
          }
        }
      }
    }

    const visited: Record<string, boolean> = {};
    const recStack: Record<string, boolean> = {};
    const cyclePath: string[] = [];

    const dfs = (node: string): boolean => {
      visited[node] = true;
      recStack[node] = true;
      cyclePath.push(node);

      for (const neighbor of adjList[node] || []) {
        if (!visited[neighbor]) {
          if (dfs(neighbor)) return true;
        } else if (recStack[neighbor]) {
          cyclePath.push(neighbor);
          return true;
        }
      }

      recStack[node] = false;
      cyclePath.pop();
      return false;
    };

    for (const node of Object.keys(adjList)) {
      if (!visited[node]) {
        if (dfs(node)) return cyclePath;
      }
    }

    return null;
  }

  /**
   * Helper to convert numeric amount to words (e.g. 54200 -> "Fifty-Four Thousand Two Hundred Rupees Only")
   */
  static numberToWords(amount: number, currency: string = 'INR'): string {
    if (!Number.isFinite(amount) || amount === 0) return 'Zero Rupees Only';

    const absAmount = Math.abs(amount);
    const rupees = Math.floor(absAmount);
    const paise = Math.round((absAmount - rupees) * 100);

    const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const twoDigits = [
      'Ten',
      'Eleven',
      'Twelve',
      'Thirteen',
      'Fourteen',
      'Fifteen',
      'Sixteen',
      'Seventeen',
      'Eighteen',
      'Nineteen',
    ];
    const tensMultiple = [
      '',
      '',
      'Twenty',
      'Thirty',
      'Forty',
      'Fifty',
      'Sixty',
      'Seventy',
      'Eighty',
      'Ninety',
    ];

    const convertChunk = (num: number): string => {
      let str = '';
      if (num > 99) {
        str += `${singleDigits[Math.floor(num / 100)]} Hundred `;
        num %= 100;
      }
      if (num >= 10 && num <= 19) {
        str += `${twoDigits[num - 10]} `;
      } else if (num >= 20) {
        str += `${tensMultiple[Math.floor(num / 10)]} `;
        if (num % 10 > 0) {
          str += `${singleDigits[num % 10]} `;
        }
      } else if (num > 0) {
        str += `${singleDigits[num]} `;
      }
      return str.trim();
    };

    // Indian Numbering System: Crores (10,000,000), Lakhs (100,000), Thousands (1,000), Hundreds (100)
    let n = rupees;
    const parts: string[] = [];

    const crore = Math.floor(n / 10000000);
    if (crore > 0) {
      parts.push(`${convertChunk(crore)} Crore`);
      n %= 10000000;
    }

    const lakh = Math.floor(n / 100000);
    if (lakh > 0) {
      parts.push(`${convertChunk(lakh)} Lakh`);
      n %= 100000;
    }

    const thousand = Math.floor(n / 1000);
    if (thousand > 0) {
      parts.push(`${convertChunk(thousand)} Thousand`);
      n %= 1000;
    }

    if (n > 0) {
      parts.push(convertChunk(n));
    }

    let result = parts.join(' ').trim();
    if (amount < 0) result = `Negative ${result}`;

    const currencyWord = currency === 'USD' ? 'Dollars' : currency === 'EUR' ? 'Euros' : 'Rupees';
    const subWord = currency === 'USD' || currency === 'EUR' ? 'Cents' : 'Paise';

    if (paise > 0) {
      return `${result} ${currencyWord} and ${convertChunk(paise)} ${subWord} Only`;
    }
    return `${result} ${currencyWord} Only`;
  }
}

