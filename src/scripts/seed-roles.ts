import { AppDataSource } from '../config/database.config';
import { Role } from '../roles/entities/role.entity';

async function seedRoles() {
  try {
    await AppDataSource.initialize();
    console.log('Conectado a la base de datos');

    const roleRepository = AppDataSource.getRepository(Role);

    const roles = [
      { name: 'Administrador' },
      { name: 'Mesero' },
      { name: 'Cocina' },
    ];

    for (const roleData of roles) {
      const existingRole = await roleRepository.findOne({
        where: { name: roleData.name },
      });

      if (!existingRole) {
        const role = roleRepository.create(roleData);
        await roleRepository.save(role);
        console.log(`Rol "${roleData.name}" creado`);
      } else {
        console.log(`Rol "${roleData.name}" ya existe`);
      }
    }

    console.log('Seed completado');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error en seed:', error);
    process.exit(1);
  }
}

seedRoles();
