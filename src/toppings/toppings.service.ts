import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topping, ToppingStatus } from './entities/topping.entity';
import { CreateToppingDto } from './dto/create-topping.dto';
import { UpdateToppingDto } from './dto/update-topping.dto';

@Injectable()
export class ToppingsService {
  constructor(
    @InjectRepository(Topping)
    private toppingsRepository: Repository<Topping>,
  ) {}

  async create(
    createToppingDto: CreateToppingDto,
    storeId: number,
  ): Promise<Topping> {
    if (createToppingDto.additional_price < 0) {
      throw new BadRequestException(
        'El precio adicional no puede ser negativo',
      );
    }

    const topping = this.toppingsRepository.create({
      ...createToppingDto,
      store_id: storeId,
      status: createToppingDto.status || ToppingStatus.ACTIVO,
    });

    return this.toppingsRepository.save(topping);
  }

  async findAll(storeId: number, includeInactive = false): Promise<Topping[]> {
    const where: any = { store_id: storeId };
    if (!includeInactive) {
      where.status = ToppingStatus.ACTIVO;
    }
    return this.toppingsRepository.find({ where });
  }

  async findOne(id: number): Promise<Topping> {
    const topping = await this.toppingsRepository.findOne({ where: { id } });
    if (!topping) {
      throw new NotFoundException(`Topping con ID ${id} no encontrado`);
    }
    return topping;
  }

  async update(id: number, updateToppingDto: UpdateToppingDto): Promise<Topping> {
    const topping = await this.findOne(id);

    if (
      updateToppingDto.additional_price !== undefined &&
      updateToppingDto.additional_price < 0
    ) {
      throw new BadRequestException(
        'El precio adicional no puede ser negativo',
      );
    }

    Object.assign(topping, updateToppingDto);
    return this.toppingsRepository.save(topping);
  }

  async updateStatus(id: number, status: ToppingStatus): Promise<Topping> {
    if (!Object.values(ToppingStatus).includes(status)) {
      throw new BadRequestException('Estado inválido');
    }
    const topping = await this.findOne(id);
    topping.status = status;
    return this.toppingsRepository.save(topping);
  }
}
