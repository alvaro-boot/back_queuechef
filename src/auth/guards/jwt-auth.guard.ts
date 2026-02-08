import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private authService: AuthService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Primero validar el JWT con Passport
    const canActivate = await super.canActivate(context);
    if (!canActivate) {
      return false;
    }

    // Luego validar que la sesión existe en BD
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    const token = authHeader.replace('Bearer ', '');
    const isValidSession = await this.authService.validateSession(token);
    
    if (!isValidSession) {
      throw new UnauthorizedException('Sesión inválida o cerrada');
    }

    return true;
  }
}
