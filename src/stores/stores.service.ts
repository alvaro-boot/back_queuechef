import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store, StoreStatus } from './entities/store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private storesRepository: Repository<Store>,
  ) {}

  async create(createStoreDto: CreateStoreDto): Promise<Store> {
    const store = this.storesRepository.create({
      ...createStoreDto,
      status: createStoreDto.status || StoreStatus.ACTIVA,
    });
    return this.storesRepository.save(store);
  }

  async findAll(): Promise<Store[]> {
    return this.storesRepository.find();
  }

  async findOne(id: number): Promise<Store> {
    const store = await this.storesRepository.findOne({ where: { id } });
    if (!store) {
      throw new NotFoundException(`Tienda con ID ${id} no encontrada`);
    }
    return store;
  }

  async update(id: number, updateStoreDto: UpdateStoreDto): Promise<Store> {
    const store = await this.findOne(id);
    Object.assign(store, updateStoreDto);
    return this.storesRepository.save(store);
  }

  async updateStatus(id: number, status: StoreStatus): Promise<Store> {
    if (!Object.values(StoreStatus).includes(status)) {
      throw new BadRequestException('Estado inválido');
    }
    const store = await this.findOne(id);
    store.status = status;
    return this.storesRepository.save(store);
  }
}
