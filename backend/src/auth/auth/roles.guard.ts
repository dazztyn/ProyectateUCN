import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtenemos el usuario de la petición (inyectado por JwtStrategy)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user && user.role === 'admin') {
      return true;
    }
    
    throw new ForbiddenException('No tienes permisos de administrador para acceder.');
  }
}