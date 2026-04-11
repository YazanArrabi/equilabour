/**
 * Strips undefined values from an object before passing to Prisma update operations.
 *
 * This is required because Zod infers optional fields as `T | undefined` (the key is
 * present but may be undefined), while Prisma under `exactOptionalPropertyTypes: true`
 * expects fields to either be ABSENT or have a concrete value — never explicitly
 * undefined. The return type is `unknown` because TypeScript cannot narrow the resulting
 * type statically after runtime filtering; callers must assert with `as any`.
 */
export function stripUndefined(obj: Record<string, unknown>): unknown {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  );
}
