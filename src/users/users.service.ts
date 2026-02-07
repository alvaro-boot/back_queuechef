import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto, storeId: number): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { name: createUserDto.name, store_id: storeId },
    });

    if (existingUser) {
      throw new BadRequestException('El nombre de usuario ya existe');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.credentials, 10);

    const user = this.usersRepository.create({
      store_id: storeId,
      role_id: createUserDto.role_id,
      name: createUserDto.name,
      credentials: hashedPassword,
      status: createUserDto.status || UserStatus.ACTIVO,
    });

    return this.usersRepository.save(user);
  }

  async findAll(storeId: number): Promise<User[]> {
    return this.usersRepository.find({
      where: { store_id: storeId },
      relations: ['role'],
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['role', 'store'],
    });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.credentials) {
      updateUserDto.credentials = await bcrypt.hash(
        updateUserDto.credentials,
        10,
      );
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async updateStatus(id: number, status: UserStatus): Promise<User> {
    if (!Object.values(UserStatus).includes(status)) {
      throw new BadRequestException('Estado inválido');
    }
    const user = await this.findOne(id);
    user.status = status;
    return this.usersRepository.save(user);
  }
}
