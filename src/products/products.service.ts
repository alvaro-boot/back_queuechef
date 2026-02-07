import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    storeId: number,
  ): Promise<Product> {
    console.log('ProductsService.create - DTO recibido:', createProductDto);
    console.log('ProductsService.create - storeId recibido:', storeId);

    if (!storeId) {
      throw new BadRequestException('storeId es requerido');
    }

    if (createProductDto.base_price < 0) {
      throw new BadRequestException('El precio base no puede ser negativo');
    }

    const product = this.productsRepository.create({
      ...createProductDto,
      store_id: storeId,
      availability: createProductDto.availability ?? true,
    });

    console.log('ProductsService.create - Producto a guardar:', product);

    const savedProduct = await this.productsRepository.save(product);
    console.log('ProductsService.create - Producto guardado:', savedProduct);

    return savedProduct;
  }

  async findAll(storeId: number): Promise<Product[]> {
    return this.productsRepository.find({
      where: { store_id: storeId },
    });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    if (
      updateProductDto.base_price !== undefined &&
      updateProductDto.base_price < 0
    ) {
      throw new BadRequestException('El precio base no puede ser negativo');
    }

    Object.assign(product, updateProductDto);
    return this.productsRepository.save(product);
  }

  async updateAvailability(id: number, availability: boolean): Promise<Product> {
    const product = await this.findOne(id);
    product.availability = availability;
    return this.productsRepository.save(product);
  }
}
