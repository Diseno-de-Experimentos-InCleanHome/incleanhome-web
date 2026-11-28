/**
 * Distritos de Lima Metropolitana (43) y del Callao (7).
 * Capa: Shared / domain / constants
 *
 * Lista cerrada que acepta el API para el área de atención (US32) y las sugerencias (US33);
 * las claves son las mismas. Los nombres son propios, así que no se traducen.
 */
export const DISTRICTS = Object.freeze([
  ["ancon", "Ancón"], ["ate", "Ate"], ["barranco", "Barranco"],
  ["bellavista", "Bellavista"], ["brena", "Breña"], ["callao", "Callao"],
  ["carabayllo", "Carabayllo"], ["carmen_de_la_legua_reynoso", "Carmen de la Legua Reynoso"],
  ["cercado_de_lima", "Cercado de Lima"], ["chaclacayo", "Chaclacayo"], ["chorrillos", "Chorrillos"],
  ["cieneguilla", "Cieneguilla"], ["comas", "Comas"], ["el_agustino", "El Agustino"],
  ["independencia", "Independencia"], ["jesus_maria", "Jesús María"], ["la_molina", "La Molina"],
  ["la_perla", "La Perla"], ["la_punta", "La Punta"], ["la_victoria", "La Victoria"],
  ["lince", "Lince"], ["los_olivos", "Los Olivos"], ["lurigancho", "Lurigancho-Chosica"],
  ["lurin", "Lurín"], ["magdalena", "Magdalena del Mar"], ["mi_peru", "Mi Perú"],
  ["miraflores", "Miraflores"], ["pachacamac", "Pachacámac"], ["pucusana", "Pucusana"],
  ["pueblo_libre", "Pueblo Libre"], ["puente_piedra", "Puente Piedra"],
  ["punta_hermosa", "Punta Hermosa"], ["punta_negra", "Punta Negra"], ["rimac", "Rímac"],
  ["san_bartolo", "San Bartolo"], ["san_borja", "San Borja"], ["san_isidro", "San Isidro"],
  ["san_juan_de_lurigancho", "San Juan de Lurigancho"],
  ["san_juan_de_miraflores", "San Juan de Miraflores"], ["san_luis", "San Luis"],
  ["san_martin", "San Martín de Porres"], ["san_miguel", "San Miguel"],
  ["santa_anita", "Santa Anita"], ["santa_maria_del_mar", "Santa María del Mar"],
  ["santa_rosa", "Santa Rosa"], ["surco", "Santiago de Surco"], ["surquillo", "Surquillo"],
  ["ventanilla", "Ventanilla"], ["villa_el_salvador", "Villa El Salvador"],
  ["villa_maria_del_triunfo", "Villa María del Triunfo"],
].map(([key, name]) => Object.freeze({ key, name })));

const NAMES = new Map(DISTRICTS.map(({ key, name }) => [key, name]));

export const isDistrict = (key) => NAMES.has(key);

/** Nombre del distrito; una clave desconocida se muestra tal como llegó. */
export const districtName = (key) => NAMES.get(key) ?? key;
