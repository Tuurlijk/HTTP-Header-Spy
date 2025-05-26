declare module 'mark.js' {
  export default class Mark {
    constructor(context: HTMLElement | Document | NodeList | Node[] | string);
    mark(keyword: string | string[], options?: object): void;
    markRegExp(regexp: RegExp, options?: object): void;
    unmark(options?: object): void;
  }
}
