import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserStatus } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Session } from './entities/session.entity';
import { jwtConstants } from '../config/jwt.config';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(Session)
    private sessionsRepository: Repository<Session>,
    private jwtService: JwtService,
  ) {}

  async validateUser(name: string, credentials: string): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: { name },
      relations: ['role', 'store'],
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.status !== 'activo') {
      throw new UnauthorizedException('Usuario inactivo');
    }

    const isPasswordValid = await bcrypt.compare(credentials, user.credentials);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.name, loginDto.credentials);

    const payload = {
      userId: user.id,
      storeId: user.store_id,
      roleId: user.role_id,
      roleName: user.role.name,
    };

    // Generar token JWT
    const token = this.jwtService.sign(payload);

    // Guardar sesión en base de datos
    const session = this.sessionsRepository.create({
      user_id: user.id,
      token: token,
      is_active: true,
    });

    await this.sessionsRepository.save(session);

    return {
      access_token: token,
      user: {
        id: user.id,
        name: user.name,
        storeId: user.store_id,
        roleId: user.role_id,
        roleName: user.role.name,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersRepository.findOne({
      where: { name: registerDto.name },
    });

    if (existingUser) {
      throw new BadRequestException('El nombre de usuario ya existe');
    }

    // Si no se proporciona role_id, buscar el rol "Administrador" por nombre
    let roleId = registerDto.role_id;
    if (!roleId) {
      const adminRole = await this.rolesRepository.findOne({
        where: { name: 'Administrador' },
      });
      if (!adminRole) {
        throw new BadRequestException('Rol Administrador no encontrado. Contacta al administrador del sistema.');
      }
      roleId = adminRole.id;
    }

    const hashedPassword = await bcrypt.hash(registerDto.credentials, 10);

    // Convertir status string a UserStatus enum
    const userStatus: UserStatus = registerDto.status 
      ? (registerDto.status === 'activo' ? UserStatus.ACTIVO : UserStatus.INACTIVO)
      : UserStatus.ACTIVO;

    const user = this.usersRepository.create({
      store_id: registerDto.store_id,
      role_id: roleId,
      name: registerDto.name,
      credentials: hashedPassword,
      status: userStatus,
    });

    const savedUser = await this.usersRepository.save(user) as User;

    // Obtener el usuario con relaciones para obtener el nombre del rol
    const userWithRole = await this.usersRepository.findOne({
      where: { id: savedUser.id },
      relations: ['role'],
    });

    const payload = {
      userId: savedUser.id,
      storeId: savedUser.store_id,
      roleId: savedUser.role_id,
      roleName: userWithRole?.role?.name || 'Usuario',
    };

    // Generar token JWT
    const token = this.jwtService.sign(payload);

    // Guardar sesión en base de datos
    const session = this.sessionsRepository.create({
      user_id: savedUser.id,
      token: token,
      is_active: true,
    });

    await this.sessionsRepository.save(session);

    return {
      access_token: token,
      user: {
        id: savedUser.id,
        name: savedUser.name,
        storeId: savedUser.store_id,
        roleId: savedUser.role_id,
        roleName: userWithRole?.role?.name,
      },
    };
  }

  async logout(token: string): Promise<void> {
    // Invalidar la sesión en base de datos
    const session = await this.sessionsRepository.findOne({
      where: { token, is_active: true },
    });

    if (session) {
      session.is_active = false;
      await this.sessionsRepository.save(session);
    }
  }

  async validateSession(token: string): Promise<boolean> {
    // Verificar que la sesión existe y está activa en BD
    const session = await this.sessionsRepository.findOne({
      where: { token, is_active: true },
    });

    return !!session;
  }

  async getProfile(userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['role', 'store'],
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return {
      id: user.id,
      name: user.name,
      storeId: user.store_id,
      storeName: user.store?.name,
      roleId: user.role_id,
      roleName: user.role?.name,
      status: user.status,
    };
  }
}
