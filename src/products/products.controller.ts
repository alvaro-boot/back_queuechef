import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Store } from '../common/decorators/store.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('Administrador')
  create(@Body() createProductDto: CreateProductDto, @Store() storeId: number) {
    console.log('ProductsController.create - DTO:', createProductDto);
    console.log('ProductsController.create - storeId:', storeId);
    
    if (!storeId) {
      throw new BadRequestException('No se pudo obtener el storeId del token');
    }
    
    return this.productsService.create(createProductDto, storeId);
  }

  @Get()
  findAll(@Store() storeId: number) {
    return this.productsService.findAll(storeId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('Administrador')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Patch(':id/availability')
  @UseGuards(RolesGuard)
  @Roles('Administrador')
  updateAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Body('availability') availability: boolean,
  ) {
    return this.productsService.updateAvailability(id, availability);
  }
}
