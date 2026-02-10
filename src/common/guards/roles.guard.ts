import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
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

    const { user } = context.switchToHttp().getRequest();
    console.log('RolesGuard - requiredRoles:', requiredRoles);
    console.log('RolesGuard - user:', user);
    console.log('RolesGuard - user.roleName:', user?.roleName);
    
    const hasRole = requiredRoles.some((role) => user?.roleName === role);
    console.log('RolesGuard - hasRole:', hasRole);
    
    if (!hasRole) {
      console.error('RolesGuard - Acceso denegado. Rol requerido:', requiredRoles, 'Rol del usuario:', user?.roleName);
      throw new ForbiddenException(
        `Acceso denegado. Se requiere uno de los siguientes roles: ${requiredRoles.join(', ')}. Tu rol actual: ${user?.roleName || 'No definido'}`
      );
    }
    
    return true;
  }
}
