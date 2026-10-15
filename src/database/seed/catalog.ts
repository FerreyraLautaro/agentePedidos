// Seed catalog for a neighborhood grocery store (almacén). Prices are in ARS cents.
// Descriptions intentionally mention attributes (gluten-free, vegan, breakfast...) for semantic search in phase 5.

export interface SeedProduct {
  sku: string;
  name: string;
  description: string;
  category: string;
  priceCents: number;
  stock: number;
}

export const catalog: SeedProduct[] = [
  // almacen
  { sku: 'ALM-001', name: 'Arroz largo fino 1 kg', description: 'Arroz blanco largo fino, ideal para guarniciones y ensaladas. Apto celíacos (sin TACC).', category: 'almacen', priceCents: 180000, stock: 60 },
  { sku: 'ALM-002', name: 'Arroz integral 1 kg', description: 'Arroz integral de grano largo, rico en fibra. Apto celíacos (sin TACC) y vegano.', category: 'almacen', priceCents: 240000, stock: 35 },
  { sku: 'ALM-003', name: 'Fideos tirabuzón 500 g', description: 'Pasta seca de sémola de trigo candeal, cocción 9 minutos. Vegano.', category: 'almacen', priceCents: 120000, stock: 80 },
  { sku: 'ALM-004', name: 'Fideos spaghetti 500 g', description: 'Spaghetti de sémola de trigo candeal, cocción 10 minutos. Vegano.', category: 'almacen', priceCents: 120000, stock: 75 },
  { sku: 'ALM-005', name: 'Fideos de arroz sin TACC 500 g', description: 'Pasta de harina de arroz para personas celíacas. Apto celíacos (sin TACC) y vegano.', category: 'almacen', priceCents: 290000, stock: 25 },
  { sku: 'ALM-006', name: 'Harina 000 1 kg', description: 'Harina de trigo 000 para panificados, pizzas y tortas.', category: 'almacen', priceCents: 110000, stock: 50 },
  { sku: 'ALM-007', name: 'Premezcla sin TACC 1 kg', description: 'Premezcla para preparar pan, pizza y tortas sin gluten. Apto celíacos (sin TACC).', category: 'almacen', priceCents: 350000, stock: 20 },
  { sku: 'ALM-008', name: 'Aceite de girasol 1,5 L', description: 'Aceite de girasol refinado para cocinar y freír. Vegano y sin TACC.', category: 'almacen', priceCents: 320000, stock: 45 },
  { sku: 'ALM-009', name: 'Aceite de oliva extra virgen 500 ml', description: 'Aceite de oliva extra virgen de primera prensada en frío, ideal para ensaladas. Vegano y sin TACC.', category: 'almacen', priceCents: 890000, stock: 18 },
  { sku: 'ALM-010', name: 'Puré de tomate 520 g', description: 'Puré de tomate natural para salsas y guisos. Vegano y sin TACC.', category: 'almacen', priceCents: 95000, stock: 70 },
  { sku: 'ALM-011', name: 'Lentejas secas 500 g', description: 'Legumbre seca rica en proteínas y hierro, ideal para guisos. Vegano y sin TACC.', category: 'almacen', priceCents: 160000, stock: 40 },
  { sku: 'ALM-012', name: 'Garbanzos secos 500 g', description: 'Garbanzos secos para guisos, hummus y ensaladas. Vegano y sin TACC.', category: 'almacen', priceCents: 170000, stock: 30 },
  { sku: 'ALM-013', name: 'Azúcar 1 kg', description: 'Azúcar blanca refinada para endulzar infusiones y repostería. Sin TACC.', category: 'almacen', priceCents: 130000, stock: 65 },
  { sku: 'ALM-014', name: 'Sal fina 500 g', description: 'Sal fina de mesa enriquecida con yodo. Sin TACC.', category: 'almacen', priceCents: 60000, stock: 55 },
  { sku: 'ALM-015', name: 'Atún al natural 170 g', description: 'Lomitos de atún al natural en lata, fuente de proteína para ensaladas. Sin TACC.', category: 'almacen', priceCents: 260000, stock: 40 },

  // lacteos
  { sku: 'LAC-001', name: 'Leche entera 1 L', description: 'Leche entera pasteurizada en sachet, para el desayuno o la merienda. Sin TACC.', category: 'lacteos', priceCents: 150000, stock: 90 },
  { sku: 'LAC-002', name: 'Leche descremada 1 L', description: 'Leche descremada con menos grasa, ideal para dietas livianas. Sin TACC.', category: 'lacteos', priceCents: 155000, stock: 60 },
  { sku: 'LAC-003', name: 'Leche deslactosada 1 L', description: 'Leche sin lactosa para personas intolerantes. Sin TACC.', category: 'lacteos', priceCents: 190000, stock: 35 },
  { sku: 'LAC-004', name: 'Yogur bebible de frutilla 1 L', description: 'Yogur bebible sabor frutilla, ideal para el desayuno de los chicos. Sin TACC.', category: 'lacteos', priceCents: 230000, stock: 30 },
  { sku: 'LAC-005', name: 'Yogur natural sin azúcar 190 g', description: 'Yogur firme natural, sin azúcar agregada. Sin TACC.', category: 'lacteos', priceCents: 95000, stock: 40 },
  { sku: 'LAC-006', name: 'Queso cremoso 500 g', description: 'Queso cremoso de pasta blanda, ideal para pizzas y sándwiches. Sin TACC.', category: 'lacteos', priceCents: 520000, stock: 25 },
  { sku: 'LAC-007', name: 'Queso rallado 150 g', description: 'Queso duro rallado para pastas y gratinados. Sin TACC.', category: 'lacteos', priceCents: 360000, stock: 30 },
  { sku: 'LAC-008', name: 'Manteca 200 g', description: 'Manteca de primera calidad para untar y cocinar. Sin TACC.', category: 'lacteos', priceCents: 280000, stock: 35 },
  { sku: 'LAC-009', name: 'Dulce de leche 400 g', description: 'Dulce de leche clásico para untar en tostadas o rellenar tortas. Sin TACC.', category: 'lacteos', priceCents: 250000, stock: 45 },
  { sku: 'LAC-010', name: 'Crema de leche 200 ml', description: 'Crema de leche para batir, salsas y postres. Sin TACC.', category: 'lacteos', priceCents: 210000, stock: 25 },
  { sku: 'LAC-011', name: 'Queso untable 290 g', description: 'Queso blanco untable, liviano, para el desayuno. Sin TACC.', category: 'lacteos', priceCents: 240000, stock: 30 },
  { sku: 'LAC-012', name: 'Bebida de almendras 1 L', description: 'Bebida vegetal de almendras sin azúcar, alternativa a la leche. Vegano y sin TACC.', category: 'lacteos', priceCents: 340000, stock: 20 },

  // panaderia
  { sku: 'PAN-001', name: 'Pan lactal blanco 550 g', description: 'Pan de molde blanco para sándwiches y tostadas.', category: 'panaderia', priceCents: 260000, stock: 30 },
  { sku: 'PAN-002', name: 'Pan lactal integral 550 g', description: 'Pan de molde integral con salvado, rico en fibra.', category: 'panaderia', priceCents: 290000, stock: 25 },
  { sku: 'PAN-003', name: 'Pan sin TACC 300 g', description: 'Pan de molde elaborado sin gluten. Apto celíacos (sin TACC).', category: 'panaderia', priceCents: 480000, stock: 12 },
  { sku: 'PAN-004', name: 'Pan rallado 500 g', description: 'Pan rallado para milanesas y rebozados.', category: 'panaderia', priceCents: 140000, stock: 35 },
  { sku: 'PAN-005', name: 'Tostadas de arroz 150 g', description: 'Tostadas crocantes de arroz inflado, livianas. Apto celíacos (sin TACC) y vegano.', category: 'panaderia', priceCents: 170000, stock: 30 },
  { sku: 'PAN-006', name: 'Prepizzas x2', description: 'Dos bases de pizza listas para hornear con salsa.', category: 'panaderia', priceCents: 220000, stock: 20 },
  { sku: 'PAN-007', name: 'Tapas para empanadas x12', description: 'Discos de masa para empanadas al horno o fritas.', category: 'panaderia', priceCents: 160000, stock: 25 },
  { sku: 'PAN-008', name: 'Grisines 200 g', description: 'Palitos de pan crocantes para picar.', category: 'panaderia', priceCents: 150000, stock: 20 },
  { sku: 'PAN-009', name: 'Budín de limón 250 g', description: 'Budín húmedo sabor limón, ideal para la merienda.', category: 'panaderia', priceCents: 210000, stock: 15 },
  { sku: 'PAN-010', name: 'Pan de hamburguesa x4', description: 'Pan esponjoso con sésamo para hamburguesas.', category: 'panaderia', priceCents: 190000, stock: 25 },

  // desayuno-merienda
  { sku: 'DES-001', name: 'Yerba mate 1 kg', description: 'Yerba mate con palo, sabor tradicional para el mate. Vegano y sin TACC.', category: 'desayuno-merienda', priceCents: 420000, stock: 50 },
  { sku: 'DES-002', name: 'Yerba mate suave 500 g', description: 'Yerba mate de molienda suave, menos amarga. Vegano y sin TACC.', category: 'desayuno-merienda', priceCents: 240000, stock: 35 },
  { sku: 'DES-003', name: 'Café molido 250 g', description: 'Café tostado molido para cafetera de filtro o italiana. Vegano y sin TACC.', category: 'desayuno-merienda', priceCents: 560000, stock: 25 },
  { sku: 'DES-004', name: 'Café instantáneo 100 g', description: 'Café soluble para preparar en segundos. Vegano y sin TACC.', category: 'desayuno-merienda', priceCents: 480000, stock: 20 },
  { sku: 'DES-005', name: 'Té en saquitos x50', description: 'Té negro en saquitos para el desayuno o la merienda. Vegano y sin TACC.', category: 'desayuno-merienda', priceCents: 150000, stock: 40 },
  { sku: 'DES-006', name: 'Mate cocido x50', description: 'Yerba mate en saquitos para preparar mate cocido. Vegano y sin TACC.', category: 'desayuno-merienda', priceCents: 140000, stock: 30 },
  { sku: 'DES-007', name: 'Cacao en polvo 360 g', description: 'Cacao azucarado para chocolatada con leche. Sin TACC.', category: 'desayuno-merienda', priceCents: 310000, stock: 30 },
  { sku: 'DES-008', name: 'Cereales de maíz 300 g', description: 'Copos de maíz azucarados para el desayuno con leche o yogur. Sin TACC.', category: 'desayuno-merienda', priceCents: 290000, stock: 25 },
  { sku: 'DES-009', name: 'Avena arrollada 400 g', description: 'Avena en hojuelas para porridge, licuados y galletas. Vegano.', category: 'desayuno-merienda', priceCents: 160000, stock: 30 },
  { sku: 'DES-010', name: 'Granola con frutos secos 350 g', description: 'Granola crocante con almendras, nueces y miel para el desayuno.', category: 'desayuno-merienda', priceCents: 450000, stock: 18 },
  { sku: 'DES-011', name: 'Mermelada de durazno 390 g', description: 'Mermelada de durazno para untar en tostadas. Vegano y sin TACC.', category: 'desayuno-merienda', priceCents: 200000, stock: 30 },
  { sku: 'DES-012', name: 'Galletitas de agua 300 g', description: 'Galletitas de agua clásicas para untar en el desayuno. Vegano.', category: 'desayuno-merienda', priceCents: 130000, stock: 45 },
  { sku: 'DES-013', name: 'Galletitas dulces de vainilla 300 g', description: 'Galletitas dulces sabor vainilla para la merienda.', category: 'desayuno-merienda', priceCents: 150000, stock: 40 },
  { sku: 'DES-014', name: 'Galletitas sin TACC 200 g', description: 'Galletitas dulces elaboradas sin gluten. Apto celíacos (sin TACC).', category: 'desayuno-merienda', priceCents: 260000, stock: 15 },

  // bebidas
  { sku: 'BEB-001', name: 'Agua mineral sin gas 2 L', description: 'Agua mineral natural de bajo sodio. Sin TACC.', category: 'bebidas', priceCents: 110000, stock: 80 },
  { sku: 'BEB-002', name: 'Agua con gas 2 L', description: 'Agua gasificada para acompañar comidas. Sin TACC.', category: 'bebidas', priceCents: 110000, stock: 50 },
  { sku: 'BEB-003', name: 'Gaseosa cola 2,25 L', description: 'Bebida gaseosa sabor cola, ideal para compartir. Sin TACC.', category: 'bebidas', priceCents: 350000, stock: 60 },
  { sku: 'BEB-004', name: 'Gaseosa cola sin azúcar 2,25 L', description: 'Bebida gaseosa sabor cola sin azúcar, cero calorías. Sin TACC.', category: 'bebidas', priceCents: 350000, stock: 45 },
  { sku: 'BEB-005', name: 'Gaseosa lima limón 2,25 L', description: 'Bebida gaseosa sabor lima limón. Sin TACC.', category: 'bebidas', priceCents: 330000, stock: 40 },
  { sku: 'BEB-006', name: 'Jugo de naranja 1 L', description: 'Jugo de naranja exprimido listo para tomar, ideal para el desayuno. Sin TACC.', category: 'bebidas', priceCents: 260000, stock: 30 },
  { sku: 'BEB-007', name: 'Jugo en polvo naranja x10', description: 'Sobres de jugo en polvo para preparar 1 litro cada uno. Sin TACC.', category: 'bebidas', priceCents: 180000, stock: 50 },
  { sku: 'BEB-008', name: 'Agua saborizada pomelo 1,5 L', description: 'Agua saborizada sin gas sabor pomelo, baja en calorías. Sin TACC.', category: 'bebidas', priceCents: 190000, stock: 35 },
  { sku: 'BEB-009', name: 'Bebida isotónica 500 ml', description: 'Bebida deportiva para rehidratarse después de entrenar. Sin TACC.', category: 'bebidas', priceCents: 160000, stock: 30 },
  { sku: 'BEB-010', name: 'Soda en sifón 1,5 L', description: 'Soda para cortar el vino o tomar sola. Sin TACC.', category: 'bebidas', priceCents: 90000, stock: 25 },
  { sku: 'BEB-011', name: 'Tónica 1,5 L', description: 'Agua tónica para tragos o para tomar fría. Sin TACC.', category: 'bebidas', priceCents: 240000, stock: 20 },

  // bebidas-alcoholicas
  { sku: 'ALC-001', name: 'Cerveza rubia lata 473 ml', description: 'Cerveza rubia tipo lager en lata. Contiene alcohol, venta solo a mayores de 18 años.', category: 'bebidas-alcoholicas', priceCents: 180000, stock: 72 },
  { sku: 'ALC-002', name: 'Cerveza negra lata 473 ml', description: 'Cerveza negra tipo stout en lata. Contiene alcohol, venta solo a mayores de 18 años.', category: 'bebidas-alcoholicas', priceCents: 200000, stock: 36 },
  { sku: 'ALC-003', name: 'Cerveza sin alcohol lata 473 ml', description: 'Cerveza rubia sin alcohol, sabor clásico.', category: 'bebidas-alcoholicas', priceCents: 170000, stock: 24 },
  { sku: 'ALC-004', name: 'Vino tinto Malbec 750 ml', description: 'Vino tinto Malbec, ideal para acompañar carnes y asados. Contiene alcohol, venta solo a mayores de 18 años.', category: 'bebidas-alcoholicas', priceCents: 650000, stock: 30 },
  { sku: 'ALC-005', name: 'Vino blanco Torrontés 750 ml', description: 'Vino blanco Torrontés aromático, ideal con pescados. Contiene alcohol, venta solo a mayores de 18 años.', category: 'bebidas-alcoholicas', priceCents: 600000, stock: 20 },
  { sku: 'ALC-006', name: 'Vino tinto de mesa 1 L', description: 'Vino tinto de mesa en tetra brick, para el día a día. Contiene alcohol, venta solo a mayores de 18 años.', category: 'bebidas-alcoholicas', priceCents: 280000, stock: 40 },
  { sku: 'ALC-007', name: 'Fernet 750 ml', description: 'Aperitivo amargo de hierbas, clásico con cola. Contiene alcohol, venta solo a mayores de 18 años.', category: 'bebidas-alcoholicas', priceCents: 1350000, stock: 25 },
  { sku: 'ALC-008', name: 'Aperitivo rojo 750 ml', description: 'Aperitivo de naranja amarga para tragos con soda. Contiene alcohol, venta solo a mayores de 18 años.', category: 'bebidas-alcoholicas', priceCents: 720000, stock: 15 },
  { sku: 'ALC-009', name: 'Sidra 750 ml', description: 'Sidra de manzana espumante para brindar. Contiene alcohol, venta solo a mayores de 18 años.', category: 'bebidas-alcoholicas', priceCents: 380000, stock: 20 },

  // fiambreria
  { sku: 'FIA-001', name: 'Jamón cocido 200 g', description: 'Jamón cocido feteado para sándwiches. Sin TACC.', category: 'fiambreria', priceCents: 380000, stock: 25 },
  { sku: 'FIA-002', name: 'Queso de máquina 200 g', description: 'Queso tybo feteado para sándwiches y tostados. Sin TACC.', category: 'fiambreria', priceCents: 330000, stock: 25 },
  { sku: 'FIA-003', name: 'Salame 200 g', description: 'Salame tipo milán feteado para picadas. Sin TACC.', category: 'fiambreria', priceCents: 450000, stock: 20 },
  { sku: 'FIA-004', name: 'Mortadela 200 g', description: 'Mortadela feteada para sándwiches. Sin TACC.', category: 'fiambreria', priceCents: 220000, stock: 20 },
  { sku: 'FIA-005', name: 'Salchichas x6', description: 'Salchichas tipo viena para panchos. Sin TACC.', category: 'fiambreria', priceCents: 240000, stock: 30 },
  { sku: 'FIA-006', name: 'Paleta cocida 200 g', description: 'Paleta de cerdo cocida feteada, alternativa económica al jamón.', category: 'fiambreria', priceCents: 290000, stock: 20 },
  { sku: 'FIA-007', name: 'Aceitunas verdes 200 g', description: 'Aceitunas verdes descarozadas para picadas y pizzas. Vegano y sin TACC.', category: 'fiambreria', priceCents: 260000, stock: 25 },
  { sku: 'FIA-008', name: 'Queso azul 150 g', description: 'Queso azul de sabor intenso para picadas y salsas. Sin TACC.', category: 'fiambreria', priceCents: 410000, stock: 12 },
  { sku: 'FIA-009', name: 'Tofu firme 300 g', description: 'Tofu firme de soja, fuente de proteína vegetal. Vegano y sin TACC.', category: 'fiambreria', priceCents: 350000, stock: 10 },

  // verduleria
  { sku: 'VER-001', name: 'Papa 1 kg', description: 'Papa blanca para hervir, freír o hacer puré. Vegano y sin TACC.', category: 'verduleria', priceCents: 90000, stock: 100 },
  { sku: 'VER-002', name: 'Cebolla 1 kg', description: 'Cebolla blanca para salsas, guisos y ensaladas. Vegano y sin TACC.', category: 'verduleria', priceCents: 85000, stock: 80 },
  { sku: 'VER-003', name: 'Tomate redondo 1 kg', description: 'Tomate fresco para ensaladas y salsas. Vegano y sin TACC.', category: 'verduleria', priceCents: 180000, stock: 50 },
  { sku: 'VER-004', name: 'Lechuga criolla (unidad)', description: 'Planta de lechuga fresca para ensaladas. Vegano y sin TACC.', category: 'verduleria', priceCents: 120000, stock: 30 },
  { sku: 'VER-005', name: 'Zanahoria 1 kg', description: 'Zanahoria fresca para ensaladas, guisos y jugos. Vegano y sin TACC.', category: 'verduleria', priceCents: 95000, stock: 60 },
  { sku: 'VER-006', name: 'Banana 1 kg', description: 'Banana fresca, ideal para el desayuno o licuados. Vegano y sin TACC.', category: 'verduleria', priceCents: 190000, stock: 50 },
  { sku: 'VER-007', name: 'Manzana roja 1 kg', description: 'Manzana roja dulce para comer como fruta o en tartas. Vegano y sin TACC.', category: 'verduleria', priceCents: 210000, stock: 45 },
  { sku: 'VER-008', name: 'Naranja para jugo 1 kg', description: 'Naranja jugosa para exprimir en el desayuno. Vegano y sin TACC.', category: 'verduleria', priceCents: 130000, stock: 60 },
  { sku: 'VER-009', name: 'Limón 1 kg', description: 'Limón fresco para ensaladas, tragos y repostería. Vegano y sin TACC.', category: 'verduleria', priceCents: 160000, stock: 30 },
  { sku: 'VER-010', name: 'Palta (unidad)', description: 'Palta madura para tostadas y ensaladas. Vegano y sin TACC.', category: 'verduleria', priceCents: 150000, stock: 25 },
  { sku: 'VER-011', name: 'Zapallo anco 1 kg', description: 'Zapallo anco para puré, al horno o en sopas. Vegano y sin TACC.', category: 'verduleria', priceCents: 110000, stock: 30 },
  { sku: 'VER-012', name: 'Huevos blancos x12', description: 'Docena de huevos frescos de gallina. Sin TACC.', category: 'verduleria', priceCents: 320000, stock: 40 },

  // congelados
  { sku: 'CON-001', name: 'Hamburguesas de carne x4', description: 'Medallones de carne vacuna congelados para la parrilla o plancha. Sin TACC.', category: 'congelados', priceCents: 420000, stock: 25 },
  { sku: 'CON-002', name: 'Hamburguesas de lentejas x4', description: 'Medallones vegetales de lentejas y arroz congelados. Vegano.', category: 'congelados', priceCents: 380000, stock: 15 },
  { sku: 'CON-003', name: 'Papas fritas congeladas 1 kg', description: 'Papas bastón precocidas para horno o freidora. Vegano y sin TACC.', category: 'congelados', priceCents: 360000, stock: 30 },
  { sku: 'CON-004', name: 'Medallones de pollo x4', description: 'Medallones de pollo rebozados congelados, listos en 15 minutos.', category: 'congelados', priceCents: 340000, stock: 20 },
  { sku: 'CON-005', name: 'Espinaca congelada 500 g', description: 'Espinaca en hojas congelada para tartas y rellenos. Vegano y sin TACC.', category: 'congelados', priceCents: 230000, stock: 20 },
  { sku: 'CON-006', name: 'Pizza muzzarella congelada', description: 'Pizza de muzzarella congelada lista para hornear en 12 minutos.', category: 'congelados', priceCents: 450000, stock: 15 },
  { sku: 'CON-007', name: 'Helado de dulce de leche 1 kg', description: 'Helado cremoso sabor dulce de leche para el postre. Sin TACC.', category: 'congelados', priceCents: 680000, stock: 12 },
  { sku: 'CON-008', name: 'Arvejas congeladas 500 g', description: 'Arvejas congeladas listas para ensaladas y guisos. Vegano y sin TACC.', category: 'congelados', priceCents: 200000, stock: 20 },
  { sku: 'CON-009', name: 'Filet de merluza 500 g', description: 'Filet de merluza congelado sin espinas para horno o milanesas. Sin TACC.', category: 'congelados', priceCents: 590000, stock: 15 },
  { sku: 'CON-010', name: 'Empanadas de carne congeladas x12', description: 'Empanadas de carne listas para hornear.', category: 'congelados', priceCents: 720000, stock: 10 },

  // snacks-golosinas
  { sku: 'SNK-001', name: 'Papas fritas de paquete 150 g', description: 'Papas fritas clásicas para picar. Sin TACC.', category: 'snacks-golosinas', priceCents: 250000, stock: 40 },
  { sku: 'SNK-002', name: 'Maní salado 200 g', description: 'Maní tostado y salado para la picada. Vegano y sin TACC.', category: 'snacks-golosinas', priceCents: 160000, stock: 35 },
  { sku: 'SNK-003', name: 'Palitos salados 150 g', description: 'Palitos de harina salados para picar.', category: 'snacks-golosinas', priceCents: 140000, stock: 30 },
  { sku: 'SNK-004', name: 'Chocolate con leche 100 g', description: 'Tableta de chocolate con leche para un gusto dulce.', category: 'snacks-golosinas', priceCents: 280000, stock: 35 },
  { sku: 'SNK-005', name: 'Chocolate amargo 70% 100 g', description: 'Tableta de chocolate amargo 70% cacao. Vegano y sin TACC.', category: 'snacks-golosinas', priceCents: 350000, stock: 20 },
  { sku: 'SNK-006', name: 'Alfajor de chocolate', description: 'Alfajor triple bañado en chocolate relleno de dulce de leche, para la merienda.', category: 'snacks-golosinas', priceCents: 120000, stock: 60 },
  { sku: 'SNK-007', name: 'Alfajor sin TACC', description: 'Alfajor de maicena relleno de dulce de leche elaborado sin gluten. Apto celíacos (sin TACC).', category: 'snacks-golosinas', priceCents: 150000, stock: 25 },
  { sku: 'SNK-008', name: 'Caramelos masticables 150 g', description: 'Caramelos masticables surtidos de frutas. Sin TACC.', category: 'snacks-golosinas', priceCents: 110000, stock: 40 },
  { sku: 'SNK-009', name: 'Chicles de menta x10', description: 'Chicles sin azúcar sabor menta. Sin TACC.', category: 'snacks-golosinas', priceCents: 90000, stock: 50 },
  { sku: 'SNK-010', name: 'Mix de frutos secos 200 g', description: 'Mezcla de almendras, nueces, pasas y castañas, snack saludable. Vegano y sin TACC.', category: 'snacks-golosinas', priceCents: 520000, stock: 20 },
  { sku: 'SNK-011', name: 'Barrita de cereal x6', description: 'Barritas de cereal con frutas para llevar en la mochila.', category: 'snacks-golosinas', priceCents: 260000, stock: 30 },

  // limpieza
  { sku: 'LIM-001', name: 'Detergente para vajilla 750 ml', description: 'Detergente concentrado para lavar platos, aroma limón.', category: 'limpieza', priceCents: 210000, stock: 40 },
  { sku: 'LIM-002', name: 'Lavandina 1 L', description: 'Lavandina para desinfectar baños, pisos y cocina.', category: 'limpieza', priceCents: 95000, stock: 50 },
  { sku: 'LIM-003', name: 'Jabón líquido para ropa 3 L', description: 'Jabón líquido para lavarropas, para ropa blanca y de color.', category: 'limpieza', priceCents: 980000, stock: 20 },
  { sku: 'LIM-004', name: 'Suavizante para ropa 900 ml', description: 'Suavizante de ropa con perfume duradero.', category: 'limpieza', priceCents: 320000, stock: 25 },
  { sku: 'LIM-005', name: 'Limpiador de pisos 900 ml', description: 'Limpiador líquido para pisos con aroma a lavanda.', category: 'limpieza', priceCents: 190000, stock: 30 },
  { sku: 'LIM-006', name: 'Limpiador de baño en spray 500 ml', description: 'Limpiador antisarro para azulejos, inodoro y grifería del baño.', category: 'limpieza', priceCents: 290000, stock: 20 },
  { sku: 'LIM-007', name: 'Desengrasante de cocina 500 ml', description: 'Desengrasante en spray para hornallas, campanas y mesadas.', category: 'limpieza', priceCents: 310000, stock: 20 },
  { sku: 'LIM-008', name: 'Esponjas de cocina x3', description: 'Esponjas doble faz para lavar vajilla.', category: 'limpieza', priceCents: 150000, stock: 35 },
  { sku: 'LIM-009', name: 'Bolsas de residuos x30', description: 'Bolsas de basura medianas resistentes.', category: 'limpieza', priceCents: 170000, stock: 40 },
  { sku: 'LIM-010', name: 'Rollo de cocina x3', description: 'Rollos de papel absorbente para la cocina.', category: 'limpieza', priceCents: 260000, stock: 30 },
  { sku: 'LIM-011', name: 'Trapo de piso', description: 'Trapo de piso de algodón grueso.', category: 'limpieza', priceCents: 120000, stock: 25 },
  { sku: 'LIM-012', name: 'Insecticida en aerosol 360 ml', description: 'Insecticida para moscas y mosquitos de uso doméstico.', category: 'limpieza', priceCents: 390000, stock: 15 },

  // perfumeria
  { sku: 'PER-001', name: 'Papel higiénico x4', description: 'Papel higiénico doble hoja, 30 metros por rollo.', category: 'perfumeria', priceCents: 280000, stock: 50 },
  { sku: 'PER-002', name: 'Jabón de tocador x3', description: 'Jabón en barra humectante para manos y cuerpo.', category: 'perfumeria', priceCents: 210000, stock: 35 },
  { sku: 'PER-003', name: 'Shampoo 400 ml', description: 'Shampoo para todo tipo de cabello.', category: 'perfumeria', priceCents: 360000, stock: 25 },
  { sku: 'PER-004', name: 'Acondicionador 400 ml', description: 'Acondicionador para desenredar y suavizar el cabello.', category: 'perfumeria', priceCents: 360000, stock: 20 },
  { sku: 'PER-005', name: 'Pasta dental 90 g', description: 'Crema dental con flúor para prevenir caries.', category: 'perfumeria', priceCents: 190000, stock: 40 },
  { sku: 'PER-006', name: 'Cepillo de dientes', description: 'Cepillo dental de cerdas medias.', category: 'perfumeria', priceCents: 150000, stock: 30 },
  { sku: 'PER-007', name: 'Desodorante en aerosol 150 ml', description: 'Desodorante antitranspirante de larga duración.', category: 'perfumeria', priceCents: 330000, stock: 25 },
  { sku: 'PER-008', name: 'Jabón líquido para manos 250 ml', description: 'Jabón líquido para manos con dosificador.', category: 'perfumeria', priceCents: 240000, stock: 25 },
  { sku: 'PER-009', name: 'Pañales talle G x30', description: 'Pañales descartables para bebés talle grande.', category: 'perfumeria', priceCents: 1250000, stock: 12 },
  { sku: 'PER-010', name: 'Toallitas húmedas x50', description: 'Toallitas húmedas para bebés, sin alcohol.', category: 'perfumeria', priceCents: 260000, stock: 25 },
  { sku: 'PER-011', name: 'Protector solar FPS 50 200 ml', description: 'Protector solar de amplio espectro para piel sensible.', category: 'perfumeria', priceCents: 1450000, stock: 8 },
  { sku: 'PER-012', name: 'Alcohol en gel 250 ml', description: 'Alcohol en gel para higiene de manos.', category: 'perfumeria', priceCents: 210000, stock: 30 },

  // mascotas
  { sku: 'MAS-001', name: 'Alimento para perro adulto 3 kg', description: 'Alimento balanceado seco para perros adultos de raza mediana.', category: 'mascotas', priceCents: 1150000, stock: 15 },
  { sku: 'MAS-002', name: 'Alimento para gato adulto 1 kg', description: 'Alimento balanceado seco para gatos adultos.', category: 'mascotas', priceCents: 690000, stock: 15 },
  { sku: 'MAS-003', name: 'Alimento húmedo para gato 85 g', description: 'Sobre de alimento húmedo sabor pescado para gatos.', category: 'mascotas', priceCents: 120000, stock: 40 },
  { sku: 'MAS-004', name: 'Piedras sanitarias 2 kg', description: 'Piedras absorbentes para la caja sanitaria del gato.', category: 'mascotas', priceCents: 350000, stock: 20 },
  { sku: 'MAS-005', name: 'Snacks dentales para perro x7', description: 'Huesitos para la limpieza dental del perro.', category: 'mascotas', priceCents: 280000, stock: 15 },
];
