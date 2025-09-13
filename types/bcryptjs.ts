// Ambient declaration for bcryptjs to satisfy TypeScript in this project.
// You can optionally replace this by installing: pnpm add -D @types/bcryptjs

declare module 'bcryptjs' {
  export function genSalt(rounds?: number): Promise<string>;
  export function hash(s: string, salt: string): Promise<string>;
  export function compare(s: string, hash: string): Promise<boolean>;

  const _default: {
    genSalt: typeof genSalt;
    hash: typeof hash;
    compare: typeof compare;
  };
  export default _default;
}

