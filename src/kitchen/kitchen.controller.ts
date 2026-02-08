import {
  Controller,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { KitchenService } from './kitchen.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Store } from '../common/decorators/store.decorator';

@Controller('kitchen')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Cocina', 'Administrador')
export class KitchenController {
  constructor(private readonly kitchenService: KitchenService) {}

  @Get('queue')
  findAll(@Store() storeId: number) {
    return this.kitchenService.findAll(storeId);
  }

  @Get('queue/:id')
  findOne(@Param('id', ParseIntPipe) id: number, @Store() storeId: number) {
    return this.kitchenService.findOne(id, storeId);
  }

  @Patch('queue/:id/start')
  startPreparation(
    @Param('id', ParseIntPipe) id: number,
    @Store() storeId: number,
  ) {
    return this.kitchenService.startPreparation(id, storeId);
  }

  @Patch('queue/:id/complete')
  completePreparation(
    @Param('id', ParseIntPipe) id: number,
    @Store() storeId: number,
  ) {
    return this.kitchenService.completePreparation(id, storeId);
  }
}
