/**
 * Utilidades para manejo de fechas con zona horaria de Colombia
 */

/**
 * Obtiene la fecha y hora actual en la zona horaria de Colombia (America/Bogota)
 * @returns Date con la hora de Colombia
 */
export function getColombiaDate(): Date {
  // Crear una fecha en UTC
  const now = new Date();
  
  // Obtener la hora en Colombia (UTC-5)
  // Colombia no tiene horario de verano, siempre es UTC-5
  const colombiaOffset = -5 * 60; // -5 horas en minutos
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  const colombiaTime = new Date(utcTime + (colombiaOffset * 60 * 1000));
  
  return colombiaTime;
}

/**
 * Convierte una fecha a la zona horaria de Colombia
 * @param date Fecha a convertir
 * @returns Date con la hora de Colombia
 */
export function toColombiaDate(date: Date): Date {
  const colombiaOffset = -5 * 60; // -5 horas en minutos
  const utcTime = date.getTime() + (date.getTimezoneOffset() * 60 * 1000);
  const colombiaTime = new Date(utcTime + (colombiaOffset * 60 * 1000));
  return colombiaTime;
}
