import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Quick role check
    if (
      !user ||
      (!requiredRoles.includes(user.role) && !requiredRoles.includes('ANY'))
    ) {
      return false;
    }

    // Specific Parent Route Bound Check
    if (
      user.role === 'PARENT' &&
      request.route.path.includes('/api/parent/student/:id/records')
    ) {
      // In a real application, you'd fetch the student by ID and check if the guardian matches this user.
      // E.g. proxying user.userId down to health MS to assert bounds.
      request.parentGuardId = user.userId;
    }

    return true;
  }
}
