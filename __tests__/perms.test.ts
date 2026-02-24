// @ts-nocheck

import { createPermissions, type Permission } from '../src/Perms';

describe('🧪 Permissions', () => {
    const perms = createPermissions({
        flags: [
            "Deprecated",
            "CanUpdateUsername",
            "CanUpdateProfilePicture",
            "CanBlacklistUser"
        ] as const,
        roles: {
            User: [
                "CanUpdateUsername",
                "CanUpdateProfilePicture"
            ],
            Admin: [
                "CanUpdateUsername",
                "CanUpdateProfilePicture",
                "CanBlacklistUser"
            ] as const,
        }
    });

    const { bits } = perms;

    test("Should assign bits by declaration order", () => {
        expect(bits.Deprecated).toBe(1n << 0n);
        expect(bits.CanUpdateUsername).toBe(1n << 1n);
    });

    describe('set()', () => {
        test('Should assign single flags', () => {
            let p: Permission = 0n;
            p = perms.set(p, bits.Deprecated);
            expect(p).toBe(1n);
        });

        test('Should assign multiple flags', () => {
            let p: Permission = 0n;
            p = perms.set(p, bits.Deprecated);
            p = perms.set(p, bits.CanUpdateUsername);
            expect(p).toBe(3n);
        });
    });

    describe('clear()', () => {
        test('Should clear a flag, resetting to 0', () => {
            let p: Permission = 2n;
            p = perms.clear(p, bits.CanUpdateUsername);
            expect(p).toBe(0n);
        });

        test('Should clear a singular flag, without resetting to 0', () => {
            let p: Permission = 6n;
            p = perms.clear(p, bits.CanUpdateUsername);
            expect(p).toBe(4n);
        });
    });

    describe('toggle()', () => {
        test('Should turn off a permission', () => {
            let p: Permission = 1n;
            p = perms.toggle(p, bits.Deprecated);
            expect(p).toBe(0n);
        });

        test('Should turn on a permission', () => {
            let p: Permission = 0n;
            p = perms.toggle(p, bits.Deprecated);
            expect(p).toBe(1n);
        });

        test('Should toggle a permission', () => {
            let p: Permission = 0n;

            p = perms.toggle(p, bits.Deprecated);
            expect(p).toBe(1n);
            p = perms.toggle(p, bits.Deprecated);
            expect(p).toBe(0n);
        })
    });

    describe('hasAll()', () => {
        test('Should return true when a permission has all bits (>1)', () => {
            let p: Permission = 7n;
            expect(perms.hasAll(p, bits.Deprecated | bits.CanUpdateUsername | bits.CanUpdateProfilePicture)).toBe(true);
        });

        test('Should return true when a permission has all bits (=1)', () => {
            let p: Permission = 1n;
            expect(perms.hasAll(p, bits.Deprecated)).toBe(true);
        });

        test('Should return true when a permission has one bit, of many', () => {
            let p: Permission = 3n;
            expect(perms.hasAll(p, bits.Deprecated)).toBe(true);
        });

        test('Should return false when no bits present', () => {
            let p: Permission = 0n;
            expect(perms.hasAll(p, bits.Deprecated)).toBe(false);
        });

        test('Should return false when specified bit not present', () => {
            let p: Permission = 2n;
            expect(perms.hasAll(p, bits.Deprecated)).toBe(false);
        });
    });

    describe('hasAny()', () => {
        test('Should return true if any one bit is present (=1)', () => {
            let p: Permission = 7n;
            expect(perms.hasAny(p, bits.Deprecated)).toBe(true);
        });

        test('Should return true if any one bit is present (<1)', () => {
            let p: Permission = 7n;
            expect(perms.hasAny(p, bits.Deprecated | bits.CanUpdateUsername)).toBe(true);
        });

        test('Should return true if any one bit is present, including falsy', () => {
            let p: Permission = 7n;
            expect(perms.hasAny(p, bits.Deprecated | bits.CanBlacklistUser)).toBe(true);
        });

        test('Should return false if no bit is present', () => {
            let p: Permission = 0n;
            expect(perms.hasAny(p, bits.Deprecated)).toBe(false);
        });
    });

    describe('toNames()', () => {
        test('Should return enabled flags, in decleration order, by name', () => {
            let p: Permission = 7n;
            expect(perms.toNames(p)).toEqual(["Deprecated", "CanUpdateUsername", "CanUpdateProfilePicture"])
        });
    });

    describe('fromNames()', () => {
        test('Should be able to build the correct mask', () => {
            const p = perms.fromNames([
                "Deprecated",
                "CanUpdateUsername",
                "CanBlacklistUser"
            ]);

            expect(p).toBe(11n);
        });

        test('Should be able to build the correct mask, with unknown names', () => {
            const p = perms.fromNames([
                "Deprecated",
                "CanUpdateUsername", 
                "CanBlacklistUser",
                "CanShutdownWebsite"
            ]);

            expect(p).toBe(11n);
        });
    });

    describe('Roles', () => {
        const user = perms.roles.User;
        const admin = perms.roles.Admin;

        test('Should have correct permissions', () => {
            expect((user & bits.CanUpdateUsername) !== 0n).toBe(true);
        });

        test('Should have no permission', () => {
            expect((user & bits.CanBlacklistUser) === 0n).toBe(true);
        });

        test('Should be able to have multiple roles with no collision', () => {
            expect((user & bits.CanBlacklistUser) === 0n).toBe(true);
            expect((admin & bits.CanBlacklistUser) === 0n).toBe(false);
        });
    });
});