import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from '../../config/jwt.config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: any) {
    console.log('JwtStrategy.validate - payload recibido:', payload);
    const user = await this.usersService.findOne(payload.userId);
    if (!user || user.status !== 'activo') {
      throw new UnauthorizedException();
    }
    // Obtener el nombre del rol del payload o del usuario
    const roleName = payload.roleName || user.role?.name || 'Usuario';
    const userData = {
      userId: user.id,
      storeId: user.store_id,
      roleId: user.role_id,
      roleName: roleName,
    };
    console.log('JwtStrategy.validate - userData retornado:', userData);
    return userData;
  }
}
