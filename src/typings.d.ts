// # 3rd Party Library
// If the library doesn't have typings available at `@types/`,
// you can still use it by manually adding typings for it

// Fix for @worktile/gantt compatibility with date-fns 4.x
declare module 'date-fns/locale' {
  export interface Locale {
    code: string;
    localize: any;
    formatLong: any;
    formatRelative: any;
    match: any;
    options?: {
      weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
      firstWeekContainsDate?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
    };
  }
}

declare module 'date-fns' {
  export type FirstWeekContainsDate = 1 | 2 | 3 | 4 | 5 | 6 | 7;
}
