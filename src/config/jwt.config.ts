export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  // No expira por tiempo, solo cuando se cierra sesión
  // Usamos un tiempo muy largo (10 años) para que prácticamente nunca expire por tiempo
  expiresIn: process.env.JWT_EXPIRES_IN || '3650d', // 10 años
};
