import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', async () => {
    const actual = await vi.importActual<typeof import('next/navigation')>('next/navigation');
    return {
        ...actual,
        useRouter: vi.fn(() => ({
            push: vi.fn(),
            replace: vi.fn(),
            prefetch: vi.fn(),
        })),
        useSearchParams: vi.fn(() => ({
            get: vi.fn(),
        })),
        usePathname: vi.fn(() => ''),
    };
});

// Mock Next.js server components
vi.mock('next/server', async () => {
    const actual = await vi.importActual<typeof import('next/server')>('next/server');
    return {
        ...actual,
        NextResponse: {
            ...actual.NextResponse,
            json: vi.fn((data, init) => {
                // Return an object that partially mimics a Response
                return {
                    json: async () => data,
                    status: init?.status || 200,
                    headers: new Map(),
                    ok: (init?.status || 200) < 400,
                };
            }),
        },
    };
});

vi.mock('next/headers', async () => {
    const actual = await vi.importActual<typeof import('next/headers')>('next/headers');
    return {
        ...actual,
        cookies: vi.fn(async () => ({
            get: vi.fn(),
            getAll: vi.fn(),
            set: vi.fn(),
        })),
    };
});

// Mock Environment Variables
process.env.JWT_SECRET = 'test-secret';
process.env.ENCRYPTION_KEY = '01234567890123456789012345678901'; // 32 bytes

// Mock Logger to prevent spam during tests
vi.mock('@/lib/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    },
}));
