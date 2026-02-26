# perms.ts Documentation

> **Repository:** [github.com/guarde/perms.ts](https://github.com/guarde/perms.ts)
> **Package:** `@guarde/perms.ts`
> **Version:** 1.0.9
> **License:** ISC

## Overview

`perms.ts` is a lightweight, type-safe bitfield permissions library for TypeScript. It uses `BigInt` under the hood, giving you an unlimited number of permission flags with no 32-bit ceiling. You define your flags (and optional roles) once, and the library gives you back a fully typed toolkit for setting, clearing, toggling, and querying permission bits.

---

## Installation

```bash
npm install @guarde/perms.ts
```

---

## Quick Start

```typescript
import { createPermissions } from "@guarde/perms.ts";

const perms = createPermissions({
  flags: [
    "CanRead",
    "CanWrite",
    "CanDelete",
    "CanAdmin",
  ] as const,
  roles: {
    Viewer: ["CanRead"],
    Editor: ["CanRead", "CanWrite"],
    Admin:  ["CanRead", "CanWrite", "CanDelete", "CanAdmin"],
  },
});

// Grant a user some permissions
let userPerms = 0n;
userPerms = perms.set(userPerms, perms.bits.CanRead);
userPerms = perms.set(userPerms, perms.bits.CanWrite);

// Check permissions
perms.hasAll(userPerms, perms.bits.CanRead);  // true
perms.hasAny(userPerms, perms.bits.CanAdmin); // false

// Use a predefined role
const editorPerms = perms.roles.Editor;
perms.hasAll(editorPerms, perms.bits.CanRead | perms.bits.CanWrite); // true
```

---

## API Reference

### Types

#### `Permission`

```typescript
type Permission = bigint;
```

The core permission type. Every permission value is a `bigint`, where each bit position represents a distinct flag.

---

#### `PermissionSpecification`

```typescript
interface PermissionSpecification {
  flags: readonly string[];
  roles?: Record<string, readonly string[]>;
}
```

The shape of the configuration object passed to `createPermissions`.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `flags`  | `readonly string[]` | Yes | An ordered list of permission flag names. Each flag is assigned a bit position based on its index (0-indexed). |
| `roles`  | `Record<string, readonly string[]>` | No | Named groups of flags. Each role maps to a pre-computed bitmask combining all of its listed flags. |

---

#### `PermissionKit<F, R>`

```typescript
interface PermissionKit<F, R> {
  bits:  Record<F[number], Permission>;
  roles: Record<keyof R & string, Permission>;

  set(p: Permission, mask: Permission): Permission;
  clear(p: Permission, mask: Permission): Permission;
  toggle(p: Permission, mask: Permission): Permission;

  hasAll(p: Permission, mask: Permission): boolean;
  hasAny(p: Permission, mask: Permission): boolean;

  toNames(p: Permission): F[number][];
  fromNames(names: readonly F[number][]): Permission;
}
```

The object returned by `createPermissions`. Contains the bit constants, role constants, and all manipulation/query functions. Fully generic -- flag names and role names are inferred from your input and enforced at the type level.

---

### Factory Function

#### `createPermissions(spec)`

```typescript
function createPermissions<F, R>(spec: {
  flags: F;
  roles?: R;
}): PermissionKit<F, R>;
```

Creates and returns a `PermissionKit` based on the provided specification.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `spec.flags` | `readonly string[] (as const)` | Ordered array of flag names. Use `as const` for full type inference. |
| `spec.roles` | `Record<string, readonly string[]>` | (Optional) Named bundles of flags that are OR'd together into a single bitmask. |

**Returns:** A `PermissionKit` object containing `bits`, `roles`, and all utility functions.

**How bits are assigned:**

Each flag name is assigned a single bit based on its array index:

```
flags[0] -> 1n << 0n  (1n)
flags[1] -> 1n << 1n  (2n)
flags[2] -> 1n << 2n  (4n)
flags[3] -> 1n << 3n  (8n)
...
```

**Example:**

```typescript
const perms = createPermissions({
  flags: [
    "Deprecated",
    "CanUpdateUsername",
    "CanUpdateProfilePicture",
    "CanBlacklistUser",
  ] as const,
  roles: {
    User:  ["CanUpdateUsername", "CanUpdateProfilePicture"],
    Admin: ["CanUpdateUsername", "CanUpdateProfilePicture", "CanBlacklistUser"],
  },
});

perms.bits.Deprecated;            // 1n  (bit 0)
perms.bits.CanUpdateUsername;      // 2n  (bit 1)
perms.bits.CanUpdateProfilePicture; // 4n  (bit 2)
perms.bits.CanBlacklistUser;       // 8n  (bit 3)

perms.roles.User;  // 6n  (CanUpdateUsername | CanUpdateProfilePicture)
perms.roles.Admin; // 14n (CanUpdateUsername | CanUpdateProfilePicture | CanBlacklistUser)
```

---

### Properties

#### `bits`

```typescript
bits: Record<FlagName, Permission>
```

A map of every flag name to its corresponding single-bit `bigint` value. Use these as masks when calling the utility functions.

```typescript
perms.bits.CanRead   // 1n
perms.bits.CanWrite  // 2n
perms.bits.CanDelete // 4n
```

---

#### `roles`

```typescript
roles: Record<RoleName, Permission>
```

A map of every role name to its pre-computed bitmask (all the role's flags OR'd together). Only populated if `roles` was provided in the spec.

```typescript
perms.roles.User   // bitmask with User flags set
perms.roles.Admin  // bitmask with Admin flags set
```

---

### Manipulation Functions

#### `set(p, mask)`

```typescript
set(p: Permission, mask: Permission): Permission
```

Sets (turns on) the bits specified by `mask` in permission value `p`. Uses bitwise OR (`p | mask`).

| Parameter | Type | Description |
|-----------|------|-------------|
| `p` | `Permission` | The current permission value. |
| `mask` | `Permission` | The bit(s) to turn on. Can be a single flag or multiple flags OR'd together. |

**Returns:** A new `Permission` with the specified bits enabled.

```typescript
let p = 0n;
p = perms.set(p, perms.bits.CanRead);                       // enable CanRead
p = perms.set(p, perms.bits.CanWrite | perms.bits.CanDelete); // enable multiple at once
```

---

#### `clear(p, mask)`

```typescript
clear(p: Permission, mask: Permission): Permission
```

Clears (turns off) the bits specified by `mask` in permission value `p`. Uses bitwise AND-NOT (`p & ~mask`).

| Parameter | Type | Description |
|-----------|------|-------------|
| `p` | `Permission` | The current permission value. |
| `mask` | `Permission` | The bit(s) to turn off. |

**Returns:** A new `Permission` with the specified bits disabled.

```typescript
let p = 7n; // CanRead | CanWrite | CanDelete
p = perms.clear(p, perms.bits.CanWrite); // 5n -- CanRead | CanDelete
```

---

#### `toggle(p, mask)`

```typescript
toggle(p: Permission, mask: Permission): Permission
```

Toggles (flips) the bits specified by `mask` in permission value `p`. Uses bitwise XOR (`p ^ mask`). Bits that are on will be turned off, and bits that are off will be turned on.

| Parameter | Type | Description |
|-----------|------|-------------|
| `p` | `Permission` | The current permission value. |
| `mask` | `Permission` | The bit(s) to toggle. |

**Returns:** A new `Permission` with the specified bits flipped.

```typescript
let p = 0n;
p = perms.toggle(p, perms.bits.CanRead); // 1n -- turned on
p = perms.toggle(p, perms.bits.CanRead); // 0n -- turned back off
```

---

### Query Functions

#### `hasAll(p, mask)`

```typescript
hasAll(p: Permission, mask: Permission): boolean
```

Checks whether **all** bits in `mask` are set in permission value `p`. Uses `(p & mask) === mask`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `p` | `Permission` | The permission value to check. |
| `mask` | `Permission` | The bit(s) that must all be present. |

**Returns:** `true` if every bit in `mask` is set in `p`, `false` otherwise.

```typescript
let p = 7n; // bits 0, 1, 2 are set
perms.hasAll(p, perms.bits.CanRead | perms.bits.CanWrite); // true -- both present
perms.hasAll(p, perms.bits.CanAdmin);                       // false -- bit 3 not set
```

---

#### `hasAny(p, mask)`

```typescript
hasAny(p: Permission, mask: Permission): boolean
```

Checks whether **at least one** bit in `mask` is set in permission value `p`. Uses `(p & mask) !== 0n`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `p` | `Permission` | The permission value to check. |
| `mask` | `Permission` | The bit(s) to test for (at least one must be present). |

**Returns:** `true` if any bit in `mask` is set in `p`, `false` otherwise.

```typescript
let p = 4n; // only CanDelete is set
perms.hasAny(p, perms.bits.CanRead | perms.bits.CanDelete); // true -- CanDelete matches
perms.hasAny(p, perms.bits.CanRead | perms.bits.CanWrite);  // false -- neither matches
```

---

### Conversion Functions

#### `toNames(p)`

```typescript
toNames(p: Permission): FlagName[]
```

Converts a permission bitmask into an array of flag name strings. Returns the names of all flags that are set, in the original declaration order.

| Parameter | Type | Description |
|-----------|------|-------------|
| `p` | `Permission` | The permission value to decode. |

**Returns:** An array of flag name strings for every enabled bit.

```typescript
perms.toNames(7n);
// ["Deprecated", "CanUpdateUsername", "CanUpdateProfilePicture"]
```

---

#### `fromNames(names)`

```typescript
fromNames(names: readonly FlagName[]): Permission
```

Converts an array of flag name strings into a permission bitmask. Unknown/invalid names are silently ignored.

| Parameter | Type | Description |
|-----------|------|-------------|
| `names` | `readonly FlagName[]` | An array of flag names to combine. |

**Returns:** A `Permission` bitmask with the corresponding bits set.

```typescript
perms.fromNames(["Deprecated", "CanUpdateUsername", "CanBlacklistUser"]);
// 11n (1 + 2 + 8)

// Unknown names are safely ignored
perms.fromNames(["Deprecated", "CanShutdownWebsite"]);
// 1n (only Deprecated is recognized)
```

---

## Usage Patterns

### Storing permissions in a database

Since `Permission` is a `bigint`, it can be stored as a numeric column or serialized to a string:

```typescript
// Serialize for storage
const dbValue = userPerms.toString(); // "14"

// Deserialize from storage
const restored = BigInt(dbValue);     // 14n
```

### Combining multiple flags into a mask

Use bitwise OR (`|`) to combine multiple flags into a single mask for batch operations:

```typescript
const readWriteMask = perms.bits.CanRead | perms.bits.CanWrite;

let p = 0n;
p = perms.set(p, readWriteMask);         // set both at once
perms.hasAll(p, readWriteMask);           // true
p = perms.clear(p, readWriteMask);        // clear both at once
```

### Role-based access control

Use predefined roles to assign a standard set of permissions:

```typescript
// Assign a role
let userPerms = perms.roles.User;

// Check if user has a specific ability from their role
perms.hasAll(userPerms, perms.bits.CanUpdateUsername);       // true
perms.hasAll(userPerms, perms.bits.CanBlacklistUser);         // false

// Elevate to admin
userPerms = perms.roles.Admin;
perms.hasAll(userPerms, perms.bits.CanBlacklistUser);         // true
```

### Granting additional permissions beyond a role

```typescript
let p = perms.roles.User;
p = perms.set(p, perms.bits.CanBlacklistUser); // User + extra privilege
```

### Inspecting permissions (debugging / logging)

```typescript
const names = perms.toNames(userPerms);
console.log("Active permissions:", names);
// ["CanUpdateUsername", "CanUpdateProfilePicture", "CanBlacklistUser"]
```

---

## Project Structure

```
perms.ts/
  src/
    Perms.ts          # Core library -- types and createPermissions()
  __tests__/
    perms.test.ts     # Jest test suite
  dist/               # Compiled output (generated by tsc)
  package.json
  tsconfig.json
  jest.config.js
```

---

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build
```
