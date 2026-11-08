/**
 * Generador del catálogo DEMO de YoeCell -> data/catalog.json
 * Uso: node scripts/seed-catalog.mjs
 *
 * Los datos son de demostración (precios, existencias, imágenes generadas).
 * El archivo data/catalog.json es la fuente de datos que consume el sitio
 * y que el panel de administración modifica.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const INCLUDED = ['Cover protector', 'Mica protectora', 'Cargador, cable y adaptador', 'Llave SIM'];
const PAYMENTS = ['USD', 'CUP', 'Zelle', 'MEX', 'IBAN'];
const WARRANTY = 'Una semana de garantía por defectos de fábrica.';

const phones = [
  {
    id: 'prd-s24u', slug: 'samsung-galaxy-s24-ultra', name: 'Samsung Galaxy S24 Ultra 256 GB',
    brand: 'Samsung', price: 1099, previousPrice: null, stock: 3, status: 'ultimas-unidades',
    condition: 'nuevo', featured: true, isNew: true, ram: '12 GB', storage: '256 GB',
    color: 'Titanium Black', colors: ['Titanium Black', 'Titanium Gray', 'Titanium Violet'],
    art: { body: '#2B2F36', accent: '#9B8CFF', glow: '#00B8FF', finish: 'metal' },
    short: 'Pantalla QHD+ de 6.8", cámara de 200 MP y S Pen integrado.',
    description: 'El Galaxy S24 Ultra es el equipo más completo de nuestro catálogo. Su pantalla QHD+ de 6.8 pulgadas con refresco de 120 Hz y brillo de hasta 2600 nits se lee con nitidez incluso a pleno sol, y el S Pen integrado permite tomar notas y editar fotos sin tocar la pantalla. El sensor principal de 200 MP con estabilización ofrece fotos con mucho detalle en cualquier hora del día, y el zoom óptico de 5x llega hasta la tribuna. Antes de reservar, confirmamos por WhatsApp el color exacto de fábrica y el estado de la pantalla.',
    specs: {
      'Pantalla': '6.8" Dynamic AMOLED 2X, QHD+ 120 Hz',
      'Procesador': 'Snapdragon 8 Gen 3',
      'Memoria RAM': '12 GB',
      'Almacenamiento': '256 GB',
      'Cámara principal': '200 MP + 12 MP ultra gran angular + 50 MP teleobjetivo 5x',
      'Cámara frontal': '12 MP',
      'Batería': '5000 mAh, carga rápida 45 W',
      'Sistema': 'Android 14 con 7 años de actualizaciones',
      'Red': '5G, WiFi 6E, Bluetooth 5.3, NFC',
      'Resistencia': 'IP68, Gorilla Glass Armor',
      'SIM': 'Nano SIM + eSIM'
    },
    tags: ['gama alta', '5g', '5G', 'cámara', 'nuevo']
  },
  {
    id: 'prd-a54', slug: 'samsung-galaxy-a54', name: 'Samsung Galaxy A54 5G 128 GB',
    brand: 'Samsung', price: 379, previousPrice: null, stock: 12, status: 'disponible',
    condition: 'nuevo', featured: true, isNew: false, ram: '8 GB', storage: '128 GB',
    color: 'Awesome Graphite', colors: ['Awesome Graphite', 'Awesome Navy', 'Awesome Iceblue'],
    art: { body: '#3A3F4B', accent: '#6FA8FF', glow: '#00B8FF', finish: 'matte' },
    short: 'El equilibrio del catálogo: cámara de 50 MP, 5000 mAh y pantalla de 120 Hz.',
    description: 'El Galaxy A54 es el teléfono que más recomendamos a quien busca un equipo que aguante el día sin complicarse. La pantalla Super AMOLED de 6.4 pulgadas a 120 Hz se ve nítida en interiores y con luz directa, y los 5000 mAh de batería dan margen real para la jornada. La cámara de 50 MP con estabilización resuelve fotos de día sin esfuerzo y con colores fieles. Cada A54 sale de la tienda con los cuatro accesorios de serie: cover, mica, cargador con cable y llave SIM.',
    specs: {
      'Pantalla': '6.4" Super AMOLED 120 Hz',
      'Procesador': 'Exynos 1380',
      'Memoria RAM': '8 GB',
      'Almacenamiento': '128 GB',
      'Cámara principal': '50 MP + 12 MP ultra gran angular + 5 MP macro',
      'Cámara frontal': '32 MP',
      'Batería': '5000 mAh, carga rápida 25 W',
      'Sistema': 'Android 13 con 4 años de actualizaciones',
      'Red': '5G, WiFi 6, Bluetooth 5.3, NFC',
      'Resistencia': 'IP67',
      'SIM': 'Nano SIM + eSIM'
    },
    tags: ['5g', '5G', 'batería', 'nuevo']
  },
  {
    id: 'prd-a15', slug: 'samsung-galaxy-a15', name: 'Samsung Galaxy A15 128 GB',
    brand: 'Samsung', price: 219, previousPrice: null, stock: 18, status: 'disponible',
    condition: 'nuevo', featured: false, isNew: true, ram: '6 GB', storage: '128 GB',
    color: 'Blue Black', colors: ['Blue Black', 'Yellow', 'Light Blue'],
    art: { body: '#242A36', accent: '#4FC3F7', glow: '#3D6BFF', finish: 'matte' },
    short: 'Entrada a Android con pantalla de 90 Hz y hasta 32 GB de memoria expandible.',
    description: 'Un equipo directo y sin adornos: pantalla de 6.5 pulgadas a 90 Hz, cámara de 50 MP y 5000 mAh para todo el día. Es la opción más razonable cuando el presupuesto manda y aun así se quiere una marca con garantía de servicio. Se entrega con cover, mica, cargador y llave SIM, igual que el resto del catálogo.',
    specs: {
      'Pantalla': '6.5" Super AMOLED 90 Hz',
      'Procesador': 'MediaTek Helio G99',
      'Memoria RAM': '6 GB',
      'Almacenamiento': '128 GB',
      'Cámara principal': '50 MP + 5 MP ultra gran angular',
      'Cámara frontal': '13 MP',
      'Batería': '5000 mAh, carga rápida 25 W',
      'Sistema': 'Android 14',
      'Red': '4G LTE, WiFi ac, Bluetooth 5.2',
      'SIM': 'Nano SIM + microSD'
    },
    tags: ['batería', 'nuevo']
  },
  {
    id: 'prd-a04s', slug: 'samsung-galaxy-a04s', name: 'Samsung Galaxy A04s 64 GB',
    brand: 'Samsung', price: 119, previousPrice: 139, stock: 9, status: 'disponible',
    condition: 'usado', featured: false, isNew: false, ram: '4 GB', storage: '64 GB',
    color: 'Awesome Silver', colors: ['Awesome Silver', 'Awesome Black'],
    art: { body: '#5A6068', accent: '#B7C3D6', glow: '#7C8AA5', finish: 'matte' },
    short: 'Usado revisado: 64 GB, 4 GB de RAM y pantalla amplia de 6.7".',
    description: 'Un A04s usado, revisado equipo por equipo en el taller de YoeCell: carga, batería, pantalla, cámara y conectividad. Es la forma más directa de tener un Samsung con poco uso por menos de 120 USD. Incluye los cuatro accesorios de serie y una semana de garantía por defectos de fábrica.',
    specs: {
      'Pantalla': '6.7" PLS LCD 90 Hz',
      'Procesador': 'MediaTek Helio P65',
      'Memoria RAM': '4 GB',
      'Almacenamiento': '64 GB',
      'Cámara principal': '50 MP + 2 MP macro',
      'Cámara frontal': '13 MP',
      'Batería': '5000 mAh, carga rápida 15 W',
      'Sistema': 'Android 12',
      'Red': '4G LTE, WiFi ac, Bluetooth 5.0',
      'SIM': 'Nano SIM + microSD'
    },
    tags: ['usado', 'económico']
  },
  {
    id: 'prd-s23', slug: 'samsung-galaxy-s23', name: 'Samsung Galaxy S23 128 GB',
    brand: 'Samsung', price: 429, previousPrice: null, stock: 5, status: 'disponible',
    condition: 'usado', featured: true, isNew: false, ram: '8 GB', storage: '128 GB',
    color: 'Onyx Black', colors: ['Onyx Black', 'Cream', 'Marble Gray'],
    art: { body: '#22262E', accent: '#8C9EFF', glow: '#5A5BFF', finish: 'glass' },
    short: 'Usado de gama alta: 8 GB de RAM, cámara triple y 3900 mAh.',
    description: 'Un S23 revisado y limpio, con la potencia de Snapdragon 8 Gen 2 y una cámara triple que sigue siendo de las mejores de su generación en fotografía nocturna. Es el equipo usado que mejor aguanta el paso del tiempo, y sale con la misma garantía de una semana por defectos de fábrica que todos los demás.',
    specs: {
      'Pantalla': '6.1" Dynamic AMOLED 2X 120 Hz',
      'Procesador': 'Snapdragon 8 Gen 2',
      'Memoria RAM': '8 GB',
      'Almacenamiento': '128 GB',
      'Cámara principal': '50 MP + 12 MP ultra gran angular + 10 MP teleobjetivo 3x',
      'Cámara frontal': '12 MP',
      'Batería': '3900 mAh, carga rápida 25 W',
      'Sistema': 'Android 14',
      'Red': '5G, WiFi 6E, Bluetooth 5.3, NFC',
      'Resistencia': 'IP68',
      'SIM': 'Nano SIM + eSIM'
    },
    tags: ['usado', 'gama alta', '5g', '5G', 'cámara']
  },
  {
    id: 'prd-s22', slug: 'samsung-galaxy-s22', name: 'Samsung Galaxy S22 128 GB',
    brand: 'Samsung', price: 299, previousPrice: 349, stock: 4, status: 'disponible',
    condition: 'usado', featured: false, isNew: false, ram: '8 GB', storage: '128 GB',
    color: 'Phantom Black', colors: ['Phantom Black', 'CLOUD White'],
    art: { body: '#1F242B', accent: '#7DD3FC', glow: '#3D6BFF', finish: 'glass' },
    short: 'Usado: pantalla compacta de 6.1" y cuerpo que se sostiene con una mano.',
    description: 'El S22 es el flagship compacto del catálogo: cabe en la mano, pesa poco y rinde como un tope de gama. Revisado en taller (pantalla, batería, carga, cámaras) y entregado con los accesorios de serie y una semana de garantía por defectos de fábrica.',
    specs: {
      'Pantalla': '6.1" Dynamic AMOLED 2X 120 Hz',
      'Procesador': 'Snapdragon 8 Gen 1',
      'Memoria RAM': '8 GB',
      'Almacenamiento': '128 GB',
      'Cámara principal': '50 MP + 12 MP ultra gran angular + 10 MP teleobjetivo 3x',
      'Cámara frontal': '10 MP',
      'Batería': '3700 mAh, carga rápida 25 W',
      'Sistema': 'Android 13',
      'Red': '5G, WiFi 6, Bluetooth 5.2, NFC',
      'Resistencia': 'IP68',
      'SIM': 'Nano SIM'
    },
    tags: ['usado', '5g', '5G']
  },
  {
    id: 'prd-xiaomi14', slug: 'xiaomi-14', name: 'Xiaomi 14 256 GB',
    brand: 'Xiaomi', price: 869, previousPrice: null, stock: 4, status: 'ultimas-unidades',
    condition: 'nuevo', featured: true, isNew: true, ram: '12 GB', storage: '256 GB',
    color: 'Black', colors: ['Black', 'White', 'Jade Green'],
    art: { body: '#1E2226', accent: '#3DDC97', glow: '#00C2A8', finish: 'glass' },
    short: 'Leica en la cámara, Snapdragon 8 Gen 3 y 90 W de carga rápida.',
    description: 'El Xiaomi 14 combina la óptica Leica con un Snapdragon 8 Gen 3 y una pantalla LTPO de 120 Hz de 6.36 pulgadas. Los 90 W de carga cargan el equipo de 0 a 100 % en poco más de media hora, y el cuerpo compacto esconde una batería de 4610 mAh. Se entrega con los accesorios de serie y garantía de una semana.',
    specs: {
      'Pantalla': '6.36" AMOLED LTPO 120 Hz',
      'Procesador': 'Snapdragon 8 Gen 3',
      'Memoria RAM': '12 GB',
      'Almacenamiento': '256 GB',
      'Cámara principal': '50 MP Leica + 50 MP ultra gran angular + 50 MP teleobjetivo',
      'Cámara frontal': '32 MP',
      'Batería': '4610 mAh, carga rápida 90 W',
      'Sistema': 'Android 14 con HyperOS',
      'Red': '5G, WiFi 7, Bluetooth 5.3, NFC',
      'Resistencia': 'IP68',
      'SIM': 'Nano SIM + eSIM'
    },
    tags: ['nuevo', 'gama alta', '5g', '5G', 'cámara', 'carga rápida']
  },
  {
    id: 'prd-note13pro', slug: 'xiaomi-redmi-note-13-pro', name: 'Xiaomi Redmi Note 13 Pro 256 GB',
    brand: 'Redmi', price: 339, previousPrice: null, stock: 14, status: 'disponible',
    condition: 'nuevo', featured: true, isNew: false, ram: '8 GB', storage: '256 GB',
    color: 'Midnight Black', colors: ['Midnight Black', 'Arctic White', 'Ocean Teal'],
    art: { body: '#1B2126', accent: '#FF9A3C', glow: '#FF6900', finish: 'metal' },
    short: 'Cámara de 200 MP, 67 W de carga y 256 GB: el Redmi más completo.',
    description: 'El Redmi Note 13 Pro es el Xiaomi que más se vende en YoeCell y el motivo es simple: cámara de 200 MP, 256 GB de memoria, 67 W de carga y una pantalla AMOLED de 120 Hz que no se ve como un teléfono de su precio. Todos los equipos salen revisados y con los accesorios de serie.',
    specs: {
      'Pantalla': '6.67" AMOLED 120 Hz',
      'Procesador': 'Snapdragon 7s Gen 2',
      'Memoria RAM': '8 GB',
      'Almacenamiento': '256 GB',
      'Cámara principal': '200 MP + 8 MP ultra gran angular + 2 MP macro',
      'Cámara frontal': '16 MP',
      'Batería': '5100 mAh, carga rápida 67 W',
      'Sistema': 'Android 13 con HyperOS',
      'Red': '4G LTE, WiFi 6, Bluetooth 5.3, NFC',
      'Resistencia': 'IP54',
      'SIM': 'Nano SIM + microSD'
    },
    tags: ['nuevo', 'cámara', 'carga rápida']
  },
  {
    id: 'prd-note13', slug: 'xiaomi-redmi-note-13', name: 'Xiaomi Redmi Note 13 128 GB',
    brand: 'Redmi', price: 229, previousPrice: 259, stock: 20, status: 'disponible',
    condition: 'nuevo', featured: false, isNew: true, ram: '8 GB', storage: '128 GB',
    color: 'Midnight Black', colors: ['Midnight Black', 'Ice Blue', 'Mint Green'],
    art: { body: '#1F262B', accent: '#7BD389', glow: '#FF6900', finish: 'matte' },
    short: 'Pantalla AMOLED de 120 Hz y 108 MP a un precio de entrada.',
    description: 'El Redmi Note 13 mantiene lo esencial bien hecho: AMOLED de 120 Hz, cámara de 108 MP, 5000 mAh y 33 W de carga. Es el punto dulce de la gama y el que más recomendamos a clientes que vienen de un equipo antiguo.',
    specs: {
      'Pantalla': '6.67" AMOLED 120 Hz',
      'Procesador': 'Snapdragon 685',
      'Memoria RAM': '8 GB',
      'Almacenamiento': '128 GB',
      'Cámara principal': '108 MP + 8 MP ultra gran angular + 2 MP macro',
      'Cámara frontal': '16 MP',
      'Batería': '5000 mAh, carga rápida 33 W',
      'Sistema': 'Android 13 con HyperOS',
      'Red': '4G LTE, WiFi ac, Bluetooth 5.3, NFC',
      'SIM': 'Nano SIM + microSD'
    },
    tags: ['nuevo']
  },
  {
    id: 'prd-note12', slug: 'xiaomi-redmi-note-12', name: 'Xiaomi Redmi Note 12 128 GB',
    brand: 'Redmi', price: 169, previousPrice: null, stock: 8, status: 'disponible',
    condition: 'usado', featured: false, isNew: false, ram: '6 GB', storage: '128 GB',
    color: 'Midnight Black', colors: ['Midnight Black', 'Ice Blue'],
    art: { body: '#242A2E', accent: '#9FB2C7', glow: '#5F7C8C', finish: 'matte' },
    short: 'Usado revisado: AMOLED de 120 Hz y 128 GB de memoria.',
    description: 'Un Redmi Note 12 usado, revisado en taller y con el mismo estándar del resto del catálogo: carga, batería, pantalla y cámaras comprobadas antes de salir de la tienda. Incluye los cuatro accesorios de serie y una semana de garantía por defectos de fábrica.',
    specs: {
      'Pantalla': '6.67" AMOLED 120 Hz',
      'Procesador': 'Snapdragon 685',
      'Memoria RAM': '6 GB',
      'Almacenamiento': '128 GB',
      'Cámara principal': '108 MP + 8 MP ultra gran angular + 2 MP macro',
      'Cámara frontal': '16 MP',
      'Batería': '5000 mAh, carga rápida 33 W',
      'Sistema': 'Android 13 con MIUI 14',
      'Red': '4G LTE, WiFi ac, Bluetooth 5.3, NFC',
      'SIM': 'Nano SIM + microSD'
    },
    tags: ['usado', 'económico']
  },
  {
    id: 'prd-13c', slug: 'xiaomi-redmi-13c', name: 'Xiaomi Redmi 13C 128 GB',
    brand: 'Redmi', price: 139, previousPrice: null, stock: 16, status: 'disponible',
    condition: 'nuevo', featured: false, isNew: false, ram: '6 GB', storage: '128 GB',
    color: 'Midnight Black', colors: ['Midnight Black', 'Navy Blue', 'Clover Green'],
    art: { body: '#1D2328', accent: '#66C2FF', glow: '#2E7DFF', finish: 'matte' },
    short: 'El Redmi más vendido en YoeCell: 128 GB y batería de dos días.',
    description: 'El Redmi 13C es el teléfono que más sale del mostrador: 128 GB de memoria, pantalla de 6.74 pulgadas y 5000 mAh que aguantan el día sin problema. Ideal como primer teléfono Android o como equipo de trabajo.',
    specs: {
      'Pantalla': '6.74" IPS LCD 90 Hz',
      'Procesador': 'MediaTek Helio G85',
      'Memoria RAM': '6 GB',
      'Almacenamiento': '128 GB',
      'Cámara principal': '50 MP + 2 MP macro',
      'Cámara frontal': '8 MP',
      'Batería': '5000 mAh, carga rápida 18 W',
      'Sistema': 'Android 13 con MIUI 14',
      'Red': '4G LTE, WiFi ac, Bluetooth 5.3',
      'SIM': 'Nano SIM + microSD'
    },
    tags: ['nuevo', 'económico', 'batería']
  },
  {
    id: 'prd-12c', slug: 'xiaomi-redmi-12c', name: 'Xiaomi Redmi 12C 64 GB',
    brand: 'Redmi', price: 99, previousPrice: null, stock: 15, status: 'disponible',
    condition: 'usado', featured: false, isNew: false, ram: '4 GB', storage: '64 GB',
    color: 'Graphite Black', colors: ['Graphite Black', 'Sky Blue'],
    art: { body: '#2A2F34', accent: '#A0AEC0', glow: '#6B7A8F', finish: 'matte' },
    short: 'Usado: 64 GB y pantalla grande para uso diario a precio bajo.',
    description: 'Un Redmi 12C usado y revisado, el modo más económico de entrar a Android con un equipo estable. Se entrega con cover, mica, cargador con cable y llave SIM, igual que todos los teléfonos de la tienda.',
    specs: {
      'Pantalla': '6.78" IPS LCD 60 Hz',
      'Procesador': 'MediaTek Helio G85',
      'Memoria RAM': '4 GB',
      'Almacenamiento': '64 GB',
      'Cámara principal': '50 MP + 2 MP macro',
      'Cámara frontal': '8 MP',
      'Batería': '5000 mAh, carga rápida 18 W',
      'Sistema': 'Android 13 con MIUI 14',
      'Red': '4G LTE, WiFi b/g/n, Bluetooth 5.3',
      'SIM': 'Nano SIM + microSD'
    },
    tags: ['usado', 'económico']
  },
  {
    id: 'prd-poco-c55', slug: 'xiaomi-poco-c55', name: 'Xiaomi Poco C55 128 GB',
    brand: 'Xiaomi', price: 159, previousPrice: null, stock: 11, status: 'disponible',
    condition: 'nuevo', featured: false, isNew: false, ram: '6 GB', storage: '128 GB',
    color: 'Black', colors: ['Black', 'Blue', 'Green'],
    art: { body: '#1E2429', accent: '#FFD54A', glow: '#FFB020', finish: 'matte' },
    short: '120 Hz y 45 W de carga en la gama de entrada de Xiaomi.',
    description: 'El Poco C55 sube el listón en la entrada: pantalla de 120 Hz, 45 W de carga y cámara de 64 MP con modo macro. Un equipo pensado para quien quiere un teléfono nuevo sin pagar de más.',
    specs: {
      'Pantalla': '6.72" IPS LCD 120 Hz',
      'Procesador': 'MediaTek Helio G85',
      'Memoria RAM': '6 GB',
      'Almacenamiento': '128 GB',
      'Cámara principal': '64 MP + 2 MP macro',
      'Cámara frontal': '8 MP',
      'Batería': '5000 mAh, carga rápida 45 W',
      'Sistema': 'Android 13 con MIUI 14',
      'Red': '4G LTE, WiFi ac, Bluetooth 5.3',
      'SIM': 'Nano SIM + microSD'
    },
    tags: ['nuevo', 'económico']
  },
  {
    id: 'prd-g54', slug: 'motorola-moto-g54', name: 'Motorola Moto G54 128 GB',
    brand: 'Motorola', price: 199, previousPrice: 229, stock: 13, status: 'disponible',
    condition: 'nuevo', featured: false, isNew: true, ram: '8 GB', storage: '128 GB',
    color: 'Midnight Blue', colors: ['Midnight Blue', 'Marshmallow Blue', 'Pearl White'],
    art: { body: '#1B2230', accent: '#6FA8FF', glow: '#0056D3', finish: 'matte' },
    short: 'Android limpio, 8 GB de RAM y pantalla de 120 Hz.',
    description: 'El Moto G54 es de los equipos con mejor relación precio-calidad que YoeCell ofrece: Android casi sin capa de personalización, 8 GB de RAM que mantienen el equipo fluido y una pantalla de 120 Hz. Ideal si te importa que el teléfono vaya fluido y no te importa cambiar de launcher.',
    specs: {
      'Pantalla': '6.6" IPS LCD 120 Hz',
      'Procesador': 'MediaTek Helio G99',
      'Memoria RAM': '8 GB',
      'Almacenamiento': '128 GB',
      'Cámara principal': '50 MP + 2 MP macro',
      'Cámara frontal': '16 MP',
      'Batería': '5000 mAh, carga rápida 33 W',
      'Sistema': 'Android 13, 2 actualizaciones de Android',
      'Red': '4G LTE, WiFi ac, Bluetooth 5.2, NFC',
      'SIM': 'Nano SIM + microSD'
    },
    tags: ['nuevo', 'batería']
  },
  {
    id: 'prd-g34', slug: 'motorola-moto-g34', name: 'Motorola Moto G34 128 GB',
    brand: 'Motorola', price: 149, previousPrice: null, stock: 6, status: 'disponible',
    condition: 'usado', featured: false, isNew: false, ram: '6 GB', storage: '128 GB',
    color: 'Charcoal Grey', colors: ['Charcoal Grey', 'Ice Blue'],
    art: { body: '#252B33', accent: '#9FB6D8', glow: '#4E77B8', finish: 'matte' },
    short: 'Usado revisado con 128 GB y pantalla de 120 Hz.',
    description: 'Moto G34 usado, revisado en taller y con los accesorios de serie. Buen equipo para redes sociales y uso diario, con pantalla de 120 Hz que se nota en el scroll.',
    specs: {
      'Pantalla': '6.5" IPS LCD 120 Hz',
      'Procesador': 'MediaTek Helio G99',
      'Memoria RAM': '6 GB',
      'Almacenamiento': '128 GB',
      'Cámara principal': '50 MP + 2 MP macro',
      'Cámara frontal': '16 MP',
      'Batería': '5000 mAh, carga rápida 33 W',
      'Sistema': 'Android 13',
      'Red': '4G LTE, WiFi ac, Bluetooth 5.2, NFC',
      'SIM': 'Nano SIM + microSD'
    },
    tags: ['usado', 'económico']
  },
  {
    id: 'prd-realme-c55', slug: 'realme-c55', name: 'Realme C55 128 GB',
    brand: 'Realme', price: 169, previousPrice: null, stock: 10, status: 'disponible',
    condition: 'nuevo', featured: false, isNew: false, ram: '6 GB', storage: '128 GB',
    color: 'Sunny Oasis', colors: ['Sunny Oasis', 'Night Blue', 'Leather Brown'],
    art: { body: '#20303A', accent: '#FFC24A', glow: '#FF8A3D', finish: 'leather' },
    short: 'Cámara de 64 MP con modo retrato y 33 W de carga.',
    description: 'El Realme C55 combina cámara de 64 MP con sensor de profundidad, pantalla de 90 Hz y 5000 mAh. Es un equipo táctico y probado en el uso diario que entregamos con los cuatro accesorios de serie.',
    specs: {
      'Pantalla': '6.72" IPS LCD 90 Hz',
      'Procesador': 'MediaTek Helio G88',
      'Memoria RAM': '6 GB',
      'Almacenamiento': '128 GB',
      'Cámara principal': '64 MP + 2 MP macro',
      'Cámara frontal': '8 MP',
      'Batería': '5000 mAh, carga rápida 33 W',
      'Sistema': 'Android 13 con realme UI',
      'Red': '4G LTE, WiFi ac, Bluetooth 5.2',
      'SIM': 'Nano SIM + microSD'
    },
    tags: ['nuevo', 'cámara']
  },
  {
    id: 'prd-oppo-a78', slug: 'oppo-a78', name: 'Oppo A78 128 GB',
    brand: 'Oppo', price: 189, previousPrice: null, stock: 0, status: 'agotado',
    condition: 'nuevo', featured: false, isNew: false, ram: '8 GB', storage: '128 GB',
    color: 'Misty Green', colors: ['Misty Green', 'Deep Blue'],
    art: { body: '#1B2B26', accent: '#5BE3A4', glow: '#0A6B4D', finish: 'glass' },
    short: 'Aviso de reposición: cámara de 50 MP y carga de 67 W.',
    description: 'El Oppo A78 está agotado por ahora. Se repone con regularidad: deja tu número en WhatsApp y te avisamos en cuanto llegue.',
    specs: {
      'Pantalla': '6.43" AMOLED 120 Hz',
      'Procesador': 'Snapdragon 680',
      'Memoria RAM': '8 GB',
      'Almacenamiento': '128 GB',
      'Cámara principal': '50 MP + 2 MP macro',
      'Cámara frontal': '8 MP',
      'Batería': '5000 mAh, carga rápida 67 W',
      'Sistema': 'Android 13 con ColorOS',
      'Red': '4G LTE, WiFi ac, Bluetooth 5.2',
      'SIM': 'Nano SIM + microSD'
    },
    tags: ['nuevo', 'carga rápida']
  }
];

const accessories = [
  {
    id: 'prd-acc-funda', slug: 'funda-siliconada-universal', name: 'Funda siliconada universal',
    brand: 'YoeCell', price: 9, stock: 40, status: 'disponible', type: 'accesorio',
    art: { body: '#1D2632', accent: '#00B8FF', glow: '#00B8FF', finish: 'matte' },
    short: 'Silicone flexible con cámara elevada, disponible en negro y transparente.',
    description: 'Funda de silicone flexible con Interior de microfibra y borde elevado para proteger la cámara. Disponible en negro y transparente.',
    specs: { 'Material': 'Silicone + microfibra', 'Colores': 'Negro, transparente', 'Compatibilidad': 'Modelos de 6.5" a 6.8"' }
  },
  {
    id: 'prd-acc-mica', slug: 'mica-cristal-templado', name: 'Mica de cristal templado',
    brand: 'YoeCell', price: 5, stock: 65, status: 'disponible', type: 'accesorio',
    art: { body: '#232A33', accent: '#8CE8FF', glow: '#5AC8FA', finish: 'glass' },
    short: 'Cristal templado 9H con adhesivo de instalación simple.',
    description: 'Mica de cristal templado con dureza 9H, bordes redondeados y kit de instalación sin burbujas. Todas las micas se entregan con el teléfono.',
    specs: { 'Material': 'Cristal templado', 'Dureza': '9H', 'Incluye': 'Alcohol, paño, adhesivo' }
  },
  {
    id: 'prd-acc-cable', slug: 'cable-usb-c-1m', name: 'Cable USB-C 1 m',
    brand: 'YoeCell', price: 6, stock: 55, status: 'disponible', type: 'accesorio',
    art: { body: '#242A31', accent: '#FFB020', glow: '#FFB020', finish: 'metal' },
    short: 'Carga y datos a 60 W con Tricapacitor de nylon trenzado.',
    description: 'Cable trenzado de nylon de 1 metro con conectores USB-C reforzados. Admite hasta 60 W de carga y transferencia de datos.',
    specs: { 'Longitud': '1 m', 'Potencia': '60 W', 'Conector': 'USB-C a USB-C' }
  },
  {
    id: 'prd-acc-cargador', slug: 'cargador-33w', name: 'Cargador 33 W',
    brand: 'YoeCell', price: 18, stock: 32, status: 'disponible', type: 'accesorio',
    art: { body: '#262B33', accent: '#7C8CFF', glow: '#5A5BFF', finish: 'metal' },
    short: 'Carga rápida de 33 W con protección contra sobrecalentamiento.',
    description: 'Adaptador de carga rápida de 33 W con protección contra sobrecarga y sobrecalentamiento. Compatible con los cargadores de la mayoría de teléfonos Android.',
    specs: { 'Potencia': '33 W', 'Entrada': '100-240 V', 'Protección': 'Sobrecarga, sobrecalentamiento, cortocircuito' }
  }
];

function buildPhone(p) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    category: 'smartphones',
    type: 'telefono',
    condition: p.condition,
    price: p.price,
    previousPrice: p.previousPrice ?? null,
    currency: 'USD',
    stock: p.stock,
    status: p.status,
    featured: Boolean(p.featured),
    isNew: Boolean(p.isNew),
    ram: p.ram,
    storage: p.storage,
    color: p.color,
    colors: p.colors,
    art: p.art,
    images: [
      `/assets/img/products/${p.slug}-1.png`,
      `/assets/img/products/${p.slug}-2.png`,
      `/assets/img/products/${p.slug}-3.png`
    ],
    shortDescription: p.short,
    description: p.description,
    specs: p.specs,
    included: INCLUDED,
    warranty: WARRANTY,
    paymentMethods: PAYMENTS,
    tags: p.tags,
    demo: true
  };
}

function buildAccessory(a) {
  return {
    id: a.id,
    slug: a.slug,
    name: a.name,
    brand: a.brand,
    category: 'accesorios',
    type: 'accesorio',
    condition: 'nuevo',
    price: a.price,
    previousPrice: null,
    currency: 'USD',
    stock: a.stock,
    status: a.status,
    featured: false,
    isNew: false,
    ram: null,
    storage: null,
    color: null,
    colors: [],
    art: a.art,
    images: [`/assets/img/products/${a.slug}-1.png`],
    shortDescription: a.short,
    description: a.description,
    specs: a.specs,
    included: [],
    warranty: WARRANTY,
    paymentMethods: PAYMENTS,
    tags: ['accesorio'],
    demo: true
  };
}

const products = [...phones.map(buildPhone), ...accessories.map(buildAccessory)];

const offers = [
  {
    id: 'ofe-1',
    title: 'Gama alta con descuento',
    subtitle: 'Galaxy S24 Ultra y Xiaomi 14',
    productIds: ['prd-s24u', 'prd-xiaomi14'],
    discountPercent: 5,
    badge: 'GAMMA ALTA',
    until: '2026-12-31',
    active: true
  },
  {
    id: 'ofe-2',
    title: 'Xiaomi y Redmi a precio de tienda',
    subtitle: 'Modelos seleccionados de la gama media',
    productIds: ['prd-note13pro', 'prd-note13', 'prd-poco-c55'],
    discountPercent: 10,
    badge: 'PRECIO ESPECIAL',
    until: '2026-12-15',
    active: true
  },
  {
    id: 'ofe-3',
    title: 'Usados revisados',
    subtitle: 'Equipados probados en taller',
    productIds: ['prd-s23', 'prd-s22', 'prd-note12', 'prd-a04s'],
    discountPercent: 8,
    badge: 'REVISADOS',
    until: '2026-12-31',
    active: true
  }
];

const catalog = {
  demo: true,
  demoNotice: 'CATÁLOGO DEMO — precios, existencias e imágenes son de ejemplo.',
  version: 1,
  updatedAt: '2026-11-07',
  categories: [
    { id: 'smartphones', name: 'Teléfonos', slug: 'smartphones', description: 'Equipos nuevos y usados con garantía de una semana.', order: 1 },
    { id: 'accesorios', name: 'Accesorios', slug: 'accesorios', description: 'Fundas, micas, cables y cargadores.', order: 2 }
  ],
  brands: ['Samsung', 'Xiaomi', 'Redmi', 'Motorola', 'Realme', 'Oppo'],
  products,
  offers
};

mkdirSync(resolve(root, 'data'), { recursive: true });
writeFileSync(resolve(root, 'data/catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Catálogo DEMO generado: ${products.length} productos (${phones.length} teléfonos, ${accessories.length} accesorios), ${offers.length} ofertas.`);
