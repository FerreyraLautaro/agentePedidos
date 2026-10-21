import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { describe, expect, it } from 'vitest';
import { JwtAuthGuard } from './jwt-auth.guard.js';

const SECRET = 'test-secret-with-at-least-32-characters!!';

function contextWith(headers: Record<string, string>) {
  const request: { headers: Record<string, string>; user?: { id: string } } = { headers };
  const context = { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
  return { context, request };
}

describe('JwtAuthGuard', () => {
  const jwt = new JwtService({ secret: SECRET });
  const guard = new JwtAuthGuard(jwt);

  it('lets a valid token through and exposes the user id on the request', async () => {
    const token = await jwt.signAsync({ sub: 'user-1' }, { expiresIn: '1h' });
    const { context, request } = contextWith({ authorization: `Bearer ${token}` });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({ id: 'user-1' });
  });

  it('rejects a request without the Authorization header', async () => {
    const { context } = contextWith({});

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a scheme other than Bearer', async () => {
    const token = await jwt.signAsync({ sub: 'user-1' }, { expiresIn: '1h' });
    const { context } = contextWith({ authorization: `Basic ${token}` });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a token signed with another secret', async () => {
    const forged = await new JwtService({ secret: 'another-secret-with-at-least-32-chars!!' }).signAsync(
      { sub: 'user-1' },
      { expiresIn: '1h' },
    );
    const { context } = contextWith({ authorization: `Bearer ${forged}` });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an expired token', async () => {
    const expired = await jwt.signAsync({ sub: 'user-1' }, { expiresIn: '-1s' });
    const { context } = contextWith({ authorization: `Bearer ${expired}` });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a token without a subject', async () => {
    const token = await jwt.signAsync({}, { expiresIn: '1h' });
    const { context } = contextWith({ authorization: `Bearer ${token}` });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
