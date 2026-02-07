import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ToppingsService } from './toppings.service';
import { CreateToppingDto } from './dto/create-topping.dto';
import { UpdateToppingDto } from './dto/update-topping.dto';
import { ToppingStatus } from './entities/topping.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Store } from '../common/decorators/store.decorator';

@Controller('toppings')
@UseGuards(JwtAuthGuard)
export class ToppingsController {
  constructor(private readonly toppingsService: ToppingsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('Administrador')
  create(@Body() createToppingDto: CreateToppingDto, @Store() storeId: number) {
    return this.toppingsService.create(createToppingDto, storeId);
  }

  @Get()
  findAll(@Store() storeId: number, @Query('all') all?: string) {
    const includeInactive = all === 'true';
    return this.toppingsService.findAll(storeId, includeInactive);
  }

  @Get('all')
  @UseGuards(RolesGuard)
  @Roles('Administrador')
  findAllIncludingInactive(@Store() storeId: number) {
    return this.toppingsService.findAll(storeId, true);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.toppingsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('Administrador')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateToppingDto: UpdateToppingDto,
  ) {
    return this.toppingsService.update(id, updateToppingDto);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('Administrador')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: ToppingStatus,
  ) {
    return this.toppingsService.updateStatus(id, status);
  }
}
