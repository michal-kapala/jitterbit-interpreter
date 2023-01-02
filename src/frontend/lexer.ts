// -----------------------------------------------------------
// ---------------          LEXER          -------------------
// ---  Responsible for producing tokens from the source   ---
// -----------------------------------------------------------

// Represents tokens that our language understands in parsing.
export enum TokenType {
  // Script scope tag
  OpenTransTag,
  CloseTransTag,
  // Literal Types
  Number,
  Identifier,
  // Keywords
  Let,
  Const,

  // Grouping * Operators
  BinaryOperator,
  Assignment,
  Comma,
  Dot,
  Colon,
  Semicolon,
  OpenParen, // (
  CloseParen, // )
  OpenBrace, // {
  CloseBrace, // }
  OpenBracket, // [
  CloseBracket, //]
  EOF, // Signified the end of file
  UnknownToken // Token parsing error
}

/**
 * Constant lookup for keywords and known identifiers + symbols.
 */
// to be yoinked
const KEYWORDS: Record<string, TokenType> = {
  let: TokenType.Let,
  const: TokenType.Const,
};

/**
 * Represents a single token from the source-code.
 */
export interface Token {
  value: string; // contains the raw value as seen inside the source code.
  type: TokenType; // tagged structure.
}

/**
 * Returns a token of a given type and value
 * @param value token literal
 * @param type token type
 * @returns 
 */
function token(value = "", type: TokenType): Token {
  return { value, type };
}

/**
 * Returns whether the character passed in alphabetic -> [a-zA-Z]
 */
// to be changed
function isalpha(src: string) {
  return src.toUpperCase() != src.toLowerCase();
}

/**
 * Returns true if the character is whitespace like -> [\s, \t, \n]
 */
// to be changed to support positioning (newline)
function isskippable(str: string) {
  return str == " " || str == "\n" || str == "\t" || str == "\r";
}

/**
 Return whether the character is a valid integer -> [0-9]
 */
// to be reworked
function isint(str: string) {
  const c = str.charCodeAt(0);
  const bounds = ["0".charCodeAt(0), "9".charCodeAt(0)];
  return c >= bounds[0] && c <= bounds[1];
}

/**
 * Given a string representing source code: Produce tokens and handles
 * possible unidentified characters.
 *
 * - Returns an array of tokens.
 * - Does not modify the incoming string.
 */
export function tokenize(sourceCode: string): Token[] {
  const tokens = new Array<Token>();
  const src = sourceCode.split("");

  let skippedChar;
  let currChar;
  let nextChar;
  let transTagOpened = false;
  let transTagClosed = false;

  // produce tokens until the EOF is reached.
  while (src.length > 0) {
    // BEGIN PARSING MULTICHARACTER TOKENS - OPERATORS, TAGS, COMMENTS

    // SKIP DOUBLEDASH COMMENTS
    if(src[0] == "/" && src[1] == "/") {
      src.shift();
      skippedChar = src.shift();
      while(skippedChar != "\n") {
        skippedChar = src.shift();
      }
    }
    // SKIP MULTILINE COMMENTS
    else if(src[0] == "/" && src[1] == "*") {
      src.shift();
      skippedChar = src.shift();
      currChar = src[0];
      nextChar = src[1];
      if(currChar == "/") {
        // JB throws 'Unknown token */' if the first commented character
        // in a valid comment is a slash
        // 'self closing comment' problem
        // this should add an error/warning
        console.warn("Warning: JB throws 'Unknown token */' with comment content that begins with a slash");
      }
      
      // skip content
      while(src.length > 0) {
        // it is safe to skip to the end of the file
        // script scope tag validation should return
        // 'Missing closing tag </trans>' error
        skippedChar = src.shift();
        if(skippedChar === "*" && src[0] === "/"){
          // consume the ending slash
          src.shift();
          break;
        }
      }
    } else if(
      !transTagOpened &&
      src.length >= 7 &&
      src[0] == "<" &&
      src[1] == "t" &&
      src[2] == "r" &&
      src[3] == "a" &&
      src[4] == "n" &&
      src[5] == "s" &&
      src[6] == ">"
    ) {
      for(let i = 0; i < 7; i++) src.shift();
      tokens.push(token("<trans>", TokenType.OpenTransTag));
      // only try to parse 1 trans tag opening
      // the subsequent ones will result in an operator expr error
      transTagOpened = true;
    }
    else if(
      !transTagClosed && transTagOpened &&
      src.length >= 8 &&
      src[0] == "<" &&
      src[1] == "/" &&
      src[2] == "t" &&
      src[3] == "r" &&
      src[4] == "a" &&
      src[5] == "n" &&
      src[6] == "s" &&
      src[7] == ">"
    ) {
      for(let i = 0; i< 8; i++) src.shift();
      tokens.push(token("</trans>", TokenType.CloseTransTag));
      // only try to parse the first trans tag closing
      // the subsequent ones will be ignored
      transTagClosed = true;
    }
    // BEGIN PARSING ONE CHARACTER TOKENS
    else if (src[0] == "(") {
      tokens.push(token(src.shift(), TokenType.OpenParen));
    } else if (src[0] == ")") {
      tokens.push(token(src.shift(), TokenType.CloseParen));
    } else if (src[0] == "{") {
      tokens.push(token(src.shift(), TokenType.OpenBrace));
    } else if (src[0] == "}") {
      tokens.push(token(src.shift(), TokenType.CloseBrace));
    } else if (src[0] == "[") {
      tokens.push(token(src.shift(), TokenType.OpenBracket));
    } else if (src[0] == "]") {
      tokens.push(token(src.shift(), TokenType.CloseBracket));
    } // HANDLE BINARY OPERATORS
    else if (
      src[0] == "+" || src[0] == "-" || src[0] == "*" || src[0] == "/" ||
      src[0] == "%"
    ) {
      tokens.push(token(src.shift(), TokenType.BinaryOperator));
    } // Handle Conditional & Assignment Tokens
    else if (src[0] == "=") {
      tokens.push(token(src.shift(), TokenType.Assignment));
    } else if (src[0] == ";") {
      tokens.push(token(src.shift(), TokenType.Semicolon));
    } else if (src[0] == ":") {
      // Unsupported token
      tokens.push(token(src.shift(), TokenType.Colon));
    } else if (src[0] == ",") {
      tokens.push(token(src.shift(), TokenType.Comma));
    } else if (src[0] == ".") {
      tokens.push(token(src.shift(), TokenType.Dot));
    } // HANDLE MULTICHARACTER KEYWORDS, TOKENS, IDENTIFIERS ETC...
    else {
      // Handle numeric literals -> Integers
      if (isint(src[0])) {
        let num = "";
        while (src.length > 0 && isint(src[0])) {
          num += src.shift();
        }

        // append new numeric token.
        tokens.push(token(num, TokenType.Number));
      } // Handle Identifier & Keyword Tokens.
      else if (isalpha(src[0])) {
        let ident = "";
        while (src.length > 0 && isalpha(src[0])) {
          ident += src.shift();
        }

        // to be yoinked
        // CHECK FOR RESERVED KEYWORDS
        const reserved = KEYWORDS[ident];
        // If value is not undefined then the identifier is
        // recognized keyword
        if (typeof reserved == "number") {
          tokens.push(token(ident, reserved));
        } else {
          // Unrecognized name must mean user defined symbol.
          tokens.push(token(ident, TokenType.Identifier));
        }
      } else if (isskippable(src[0])) {
        // Skip unneeded chars.
        src.shift();
      } // Handle unrecognized characters.
      // TODO: Implement better errors and error recovery.
      else {
        // only parse the unknown characters inside of the script scope
        if(transTagOpened) {
          console.error(
            "Unrecognized character found in source: ",
            src[0].charCodeAt(0),
            src,
          );
          console.error("script scope opened: ", transTagOpened, "script scope closed: ", transTagClosed);
          tokens.push({ type: TokenType.EOF, value: "UnexpectedEndOfFile" });
        }
        // pre-scope unhandled characters
        else {
          src.shift();
        }
      }
    }
  }

  tokens.push({ type: TokenType.EOF, value: "EndOfFile" });
  return tokens;
}
