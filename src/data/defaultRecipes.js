/**
 * Catálogo predeterminado de recetas fitness para Akuma Fit.
 * Diseñado para cubrir todos los momentos del día con ingredientes del catálogo nutricional.
 */

export const RECIPE_CATEGORIES = [
    'Todas',
    'Desayuno',
    'Media Mañana',
    'Comida',
    'Merienda',
    'Cena',
    'Post-Entreno'
];

const FOOD_CATALOG = {
    avena: {
        name: 'Copos de Avena Integrales',
        calories: 375.0,
        protein: 13.5,
        carbs: 60.0,
        fat: 7.0,
        fiber: 10.0,
        serving_size: '100g'
    },
    claras: {
        name: 'Clara de Huevo Pasteurizada',
        calories: 50.0,
        protein: 11.0,
        carbs: 0.7,
        fat: 0.2,
        fiber: 0.0,
        serving_size: '100g'
    },
    huevo: {
        name: 'Huevo Entero Clase L',
        calories: 143.0,
        protein: 12.6,
        carbs: 0.7,
        fat: 9.5,
        fiber: 0.0,
        serving_size: '100g'
    },
    platano: {
        name: 'Plátano',
        calories: 89.0,
        protein: 1.1,
        carbs: 23.0,
        fat: 0.3,
        fiber: 2.6,
        serving_size: '100g'
    },
    pollo: {
        name: 'Pechuga de Pollo',
        calories: 120.0,
        protein: 23.5,
        carbs: 0.0,
        fat: 2.6,
        fiber: 0.0,
        serving_size: '100g'
    },
    pavo: {
        name: 'Pechuga de Pavo',
        calories: 111.0,
        protein: 24.1,
        carbs: 0.0,
        fat: 1.6,
        fiber: 0.0,
        serving_size: '100g'
    },
    ternera: {
        name: 'Ternera Magra (Filete/Solomillo)',
        calories: 135.0,
        protein: 22.0,
        carbs: 0.0,
        fat: 5.0,
        fiber: 0.0,
        serving_size: '100g'
    },
    salmon: {
        name: 'Salmón Fresco',
        calories: 208.0,
        protein: 20.4,
        carbs: 0.0,
        fat: 13.4,
        fiber: 0.0,
        serving_size: '100g'
    },
    merluza: {
        name: 'Merluza Fresca / Congelada',
        calories: 71.0,
        protein: 16.5,
        carbs: 0.0,
        fat: 0.7,
        fiber: 0.0,
        serving_size: '100g'
    },
    atun: {
        name: 'Atún Claro al Natural',
        calories: 101.0,
        protein: 23.5,
        carbs: 0.0,
        fat: 0.8,
        fiber: 0.0,
        serving_size: '100g'
    },
    fiambrePavo: {
        name: 'Fiambre de Pavo (>90% carne)',
        calories: 89.0,
        protein: 17.5,
        carbs: 1.5,
        fat: 1.2,
        fiber: 0.0,
        serving_size: '100g'
    },
    arrozBlanco: {
        name: 'Arroz Blanco Cocido',
        calories: 130.0,
        protein: 2.7,
        carbs: 28.2,
        fat: 0.3,
        fiber: 0.4,
        serving_size: '100g'
    },
    pastaIntegral: {
        name: 'Pasta Integral',
        calories: 348.0,
        protein: 13.0,
        carbs: 65.0,
        fat: 2.5,
        fiber: 8.0,
        serving_size: '100g'
    },
    patata: {
        name: 'Patata Cocida / Asada',
        calories: 77.0,
        protein: 2.0,
        carbs: 17.5,
        fat: 0.1,
        fiber: 2.2,
        serving_size: '100g'
    },
    boniato: {
        name: 'Boniato / Batata Asada',
        calories: 86.0,
        protein: 1.6,
        carbs: 20.1,
        fat: 0.1,
        fiber: 3.0,
        serving_size: '100g'
    },
    panIntegral: {
        name: 'Pan Integral 100%',
        calories: 250.0,
        protein: 9.5,
        carbs: 45.0,
        fat: 2.8,
        fiber: 6.5,
        serving_size: '100g'
    },
    tortitasArroz: {
        name: 'Tortitas de Arroz Inflado',
        calories: 385.0,
        protein: 8.0,
        carbs: 82.0,
        fat: 2.5,
        fiber: 2.8,
        serving_size: '100g'
    },
    garbanzos: {
        name: 'Garbanzos Cocidos',
        calories: 139.0,
        protein: 7.5,
        carbs: 22.0,
        fat: 2.6,
        fiber: 6.5,
        serving_size: '100g'
    },
    quesoBatido: {
        name: 'Queso Fresco Batido 0% M.G.',
        calories: 48.0,
        protein: 8.5,
        carbs: 3.5,
        fat: 0.1,
        fiber: 0.0,
        serving_size: '100g'
    },
    yogurGriego: {
        name: 'Yogur Griego Ligero 0%',
        calories: 58.0,
        protein: 10.3,
        carbs: 4.0,
        fat: 0.2,
        fiber: 0.0,
        serving_size: '100g'
    },
    quesoCottage: {
        name: 'Queso Cottage',
        calories: 98.0,
        protein: 11.5,
        carbs: 3.4,
        fat: 4.3,
        fiber: 0.0,
        serving_size: '100g'
    },
    lecheSemidesnatada: {
        name: 'Leche Semidesnatada',
        calories: 46.0,
        protein: 3.2,
        carbs: 4.8,
        fat: 1.6,
        fiber: 0.0,
        serving_size: '100g'
    },
    proteinaWhey: {
        name: 'Proteína Whey en Polvo (Concentrado)',
        calories: 390.0,
        protein: 78.0,
        carbs: 6.0,
        fat: 6.0,
        fiber: 1.5,
        serving_size: '100g'
    },
    aove: {
        name: 'Aceite de Oliva Virgen Extra (AOVE)',
        calories: 884.0,
        protein: 0.0,
        carbs: 0.0,
        fat: 100.0,
        fiber: 0.0,
        serving_size: '100g'
    },
    cremaCacahuete: {
        name: 'Mantequilla de Cacahuete 100%',
        calories: 588.0,
        protein: 25.0,
        carbs: 20.0,
        fat: 50.0,
        fiber: 8.0,
        serving_size: '100g'
    },
    almendras: {
        name: 'Almendras Naturales / Tostadas',
        calories: 579.0,
        protein: 21.2,
        carbs: 21.6,
        fat: 49.9,
        fiber: 12.5,
        serving_size: '100g'
    },
    nueces: {
        name: 'Nueces Peladas',
        calories: 654.0,
        protein: 15.2,
        carbs: 13.7,
        fat: 65.2,
        fiber: 6.7,
        serving_size: '100g'
    },
    aguacate: {
        name: 'Aguacate Hass',
        calories: 160.0,
        protein: 2.0,
        carbs: 8.5,
        fat: 14.7,
        fiber: 6.7,
        serving_size: '100g'
    },
    brocoli: {
        name: 'Brócoli al Vapor / Crudo',
        calories: 34.0,
        protein: 2.8,
        carbs: 6.6,
        fat: 0.4,
        fiber: 2.6,
        serving_size: '100g'
    },
    espinacas: {
        name: 'Espinacas Frescas',
        calories: 23.0,
        protein: 2.9,
        carbs: 3.6,
        fat: 0.4,
        fiber: 2.2,
        serving_size: '100g'
    },
    esparragos: {
        name: 'Espárragos Verdes',
        calories: 20.0,
        protein: 2.2,
        carbs: 3.9,
        fat: 0.1,
        fiber: 2.1,
        serving_size: '100g'
    },
    tomate: {
        name: 'Tomate de Ensalada',
        calories: 18.0,
        protein: 0.9,
        carbs: 3.9,
        fat: 0.2,
        fiber: 1.2,
        serving_size: '100g'
    },
    pimientoRojo: {
        name: 'Pimiento Rojo',
        calories: 31.0,
        protein: 1.0,
        carbs: 6.0,
        fat: 0.3,
        fiber: 2.1,
        serving_size: '100g'
    },
    calabacin: {
        name: 'Calabacín con Piel',
        calories: 17.0,
        protein: 1.2,
        carbs: 3.1,
        fat: 0.3,
        fiber: 1.0,
        serving_size: '100g'
    },
    arandanos: {
        name: 'Arándanos Frescos',
        calories: 57.0,
        protein: 0.7,
        carbs: 14.5,
        fat: 0.3,
        fiber: 2.4,
        serving_size: '100g'
    },
    fresas: {
        name: 'Fresas Frescas',
        calories: 32.0,
        protein: 0.7,
        carbs: 7.7,
        fat: 0.3,
        fiber: 2.0,
        serving_size: '100g'
    }
};

export const DEFAULT_RECIPES = [
    // ==========================================
    // 1. DESAYUNOS (4 Recetas)
    // ==========================================
    {
        id: 'default-recipe-1',
        isDefault: true,
        name: 'Tortitas de avena y claras con plátano',
        category: 'Desayuno',
        description: 'Deliciosas tortitas fitness ricas en carbohidratos complejos y proteína de alto valor biológico, ideales para empezar el día con energía.',
        instructions: '1. En el vaso de la batidora, añade los copos de avena, las claras de huevo y medio plátano.\n2. Tritura todo hasta obtener una mezcla homogénea y sin grumos.\n3. Calienta una sartén antiadherente a fuego medio y engrásala con unas gotas de AOVE retirando el exceso con papel.\n4. Vierte porciones de masa formando tortitas y cocina durante 2 minutos hasta que aparezcan burbujas en la superficie.\n5. Dales la vuelta con una espátula y cocina 1 minuto más por el otro lado hasta dorar.\n6. Sirve en un plato decorando con el resto del plátano cortado en rodajas finas.',
        preparation_time: 15,
        servings: 1,
        tags: [
            { id: 'tag-desayuno', name: 'Desayuno', category: 'dieta' },
            { id: 'tag-alta-proteina', name: 'Alta Proteína', category: 'dieta' },
            { id: 'tag-volumen', name: 'Volumen', category: 'dieta' }
        ],
        ingredients: [
            {
                id: 'def-ing-1-1',
                quantity_g: 60,
                notes: 'Triturados con las claras para la masa',
                food: FOOD_CATALOG.avena
            },
            {
                id: 'def-ing-1-2',
                quantity_g: 180,
                notes: 'Aportan proteína limpia sin grasas',
                food: FOOD_CATALOG.claras
            },
            {
                id: 'def-ing-1-3',
                quantity_g: 100,
                notes: 'Mitad para la masa y mitad en rodajas para topping',
                food: FOOD_CATALOG.platano
            },
            {
                id: 'def-ing-1-4',
                quantity_g: 3,
                notes: 'Para engrasar la sartén antiadherente',
                food: FOOD_CATALOG.aove
            }
        ]
    },
    {
        id: 'default-recipe-2',
        isDefault: true,
        name: 'Porridge proteico con frutos rojos y almendras',
        category: 'Desayuno',
        description: 'Gachas de avena cremosa cocinadas con leche y enriquecidas con proteína Whey, coronadas con arándanos frescos y almendras crujientes.',
        instructions: '1. En un cazo pequeño, calienta la leche semidesnatada junto con los copos de avena a fuego medio-bajo.\n2. Remueve constantemente con una cuchara durante 5-7 minutos hasta que la avena absorba la leche y adquiera textura cremosa.\n3. Retira el cazo del fuego y deja reposar durante 1 minuto para que baje ligeramente la temperatura.\n4. Añade el cazo de proteína Whey en polvo y remueve enérgicamente con una varilla para evitar que se formen grumos.\n5. Vierte el porridge cremoso en un bol hondo.\n6. Decora por encima con los arándanos frescos previamente lavados y las almendras picadas.',
        preparation_time: 10,
        servings: 1,
        tags: [
            { id: 'tag-desayuno', name: 'Desayuno', category: 'dieta' },
            { id: 'tag-alta-proteina', name: 'Alta Proteína', category: 'dieta' },
            { id: 'tag-rapida', name: 'Rápida', category: 'dieta' }
        ],
        ingredients: [
            {
                id: 'def-ing-2-1',
                quantity_g: 50,
                notes: 'Copos suaves de avena integral',
                food: FOOD_CATALOG.avena
            },
            {
                id: 'def-ing-2-2',
                quantity_g: 200,
                notes: 'Para cocer la avena a fuego suave',
                food: FOOD_CATALOG.lecheSemidesnatada
            },
            {
                id: 'def-ing-2-3',
                quantity_g: 30,
                notes: 'Proteína whey concentrada (vainilla o neutra)',
                food: FOOD_CATALOG.proteinaWhey
            },
            {
                id: 'def-ing-2-4',
                quantity_g: 50,
                notes: 'Arándanos frescos lavados',
                food: FOOD_CATALOG.arandanos
            },
            {
                id: 'def-ing-2-5',
                quantity_g: 15,
                notes: 'Almendras picadas para dar toque crujiente',
                food: FOOD_CATALOG.almendras
            }
        ]
    },
    {
        id: 'default-recipe-3',
        isDefault: true,
        name: 'Tostadas integrales con huevos revueltos y aguacate',
        category: 'Desayuno',
        description: 'Clásico desayuno equilibrado con pan integral tostado, aguacate machacado y huevos revueltos cremosos con toque de aceite de oliva.',
        instructions: '1. Coloca las rebanadas de pan integral en la tostadora hasta que queden doradas y crujientes por fuera.\n2. En un cuenco, casca los huevos enteros, añade una pizca de sal y bate ligeramente con un tenedor.\n3. Pon una sartén a fuego medio con la mitad del AOVE y añade los huevos batidos.\n4. Remueve suavemente con una espátula de silicona durante 2 minutos hasta que cuajen manteniendo una consistencia jugosa y tierna.\n5. En un plato aparte, aplasta la pulpa del aguacate Hass con un tenedor y úntala generosamente sobre las tostadas calientes.\n6. Coloca los huevos revueltos sobre el aguacate y corona con las gotas restantes de AOVE y pimienta recién molida.',
        preparation_time: 10,
        servings: 1,
        tags: [
            { id: 'tag-desayuno', name: 'Desayuno', category: 'dieta' },
            { id: 'tag-alta-proteina', name: 'Alta Proteína', category: 'dieta' },
            { id: 'tag-definicion', name: 'Definición', category: 'dieta' }
        ],
        ingredients: [
            {
                id: 'def-ing-3-1',
                quantity_g: 80,
                notes: '2 rebanadas de pan integral bien tostadas',
                food: FOOD_CATALOG.panIntegral
            },
            {
                id: 'def-ing-3-2',
                quantity_g: 120,
                notes: '2 huevos camperos enteros',
                food: FOOD_CATALOG.huevo
            },
            {
                id: 'def-ing-3-3',
                quantity_g: 50,
                notes: 'Medio aguacate maduro machacado',
                food: FOOD_CATALOG.aguacate
            },
            {
                id: 'def-ing-3-4',
                quantity_g: 5,
                notes: 'Para engrasar la sartén y aliñar',
                food: FOOD_CATALOG.aove
            }
        ]
    },
    {
        id: 'default-recipe-4',
        isDefault: true,
        name: 'Bowl de yogur griego 0% con avena y nueces',
        category: 'Desayuno',
        description: 'Desayuno express completo con yogur griego bajo en grasa, avena integral cruda, nueces ricas en omega 3 y fresas dulces.',
        instructions: '1. Vierte el yogur griego ligero 0% en un bol hondo y remueve con una cuchara para que quede sedoso y cremoso.\n2. Espolvorea los copos de avena integrales crudos sobre el yogur para que aporten textura.\n3. Lava las fresas frescas bajo el grifo, retira las hojas verdes y córtalas en rodajas uniformes.\n4. Distribuye las fresas laminadas y las nueces peladas troceadas con las manos por la superficie del bol.\n5. Mezcla todos los ingredientes con cada cucharada para combinar frescura y textura crujiente.',
        preparation_time: 5,
        servings: 1,
        tags: [
            { id: 'tag-desayuno', name: 'Desayuno', category: 'dieta' },
            { id: 'tag-alta-proteina', name: 'Alta Proteína', category: 'dieta' },
            { id: 'tag-rapida', name: 'Rápida', category: 'dieta' },
            { id: 'tag-definicion', name: 'Definición', category: 'dieta' }
        ],
        ingredients: [
            {
                id: 'def-ing-4-1',
                quantity_g: 200,
                notes: 'Base cremosa alta en caseína',
                food: FOOD_CATALOG.yogurGriego
            },
            {
                id: 'def-ing-4-2',
                quantity_g: 40,
                notes: 'Copos integrales crudos',
                food: FOOD_CATALOG.avena
            },
            {
                id: 'def-ing-4-3',
                quantity_g: 20,
                notes: 'Nueces peladas troceadas a mano',
                food: FOOD_CATALOG.nueces
            },
            {
                id: 'def-ing-4-4',
                quantity_g: 80,
                notes: 'Fresas dulces laminadas',
                food: FOOD_CATALOG.fresas
            }
        ]
    },

    // ==========================================
    // 2. MEDIA MAÑANA / POST-ENTRENO (2 Recetas)
    // ==========================================
    {
        id: 'default-recipe-5',
        isDefault: true,
        name: 'Batido post-entreno Whey con plátano y avena',
        category: 'Post-Entreno',
        description: 'Batido de absorción óptima para reponer glucógeno y suministrar aminoácidos esenciales a las fibras musculares tras el entrenamiento.',
        instructions: '1. Vierte la leche semidesnatada fría en el vaso de la batidora.\n2. Pela el plátano, córtalo en varios trozos e incorpóralo al vaso.\n3. Agrega los copos de avena integrales para aportar carbohidratos de asimilación progresiva.\n4. Añade un cazo de proteína Whey en polvo sabor chocolate o vainilla.\n5. Tritura a velocidad máxima durante 45-60 segundos hasta que la mezcla sea suave, espumosa y sin grumos.\n6. Sírvelo en un vaso grande o shaker y tómalo en los primeros 45 minutos tras terminar la sesión de pesas.',
        preparation_time: 5,
        servings: 1,
        tags: [
            { id: 'tag-post-entreno', name: 'Post-Entreno', category: 'dieta' },
            { id: 'tag-alta-proteina', name: 'Alta Proteína', category: 'dieta' },
            { id: 'tag-rapida', name: 'Rápida', category: 'dieta' },
            { id: 'tag-volumen', name: 'Volumen', category: 'dieta' }
        ],
        ingredients: [
            {
                id: 'def-ing-5-1',
                quantity_g: 30,
                notes: '1 cazo de proteína Whey concentrada',
                food: FOOD_CATALOG.proteinaWhey
            },
            {
                id: 'def-ing-5-2',
                quantity_g: 110,
                notes: '1 plátano maduro troceado',
                food: FOOD_CATALOG.platano
            },
            {
                id: 'def-ing-5-3',
                quantity_g: 40,
                notes: 'Copos de avena fina',
                food: FOOD_CATALOG.avena
            },
            {
                id: 'def-ing-5-4',
                quantity_g: 250,
                notes: 'Leche fría para diluir y mezclar',
                food: FOOD_CATALOG.lecheSemidesnatada
            }
        ]
    },
    {
        id: 'default-recipe-6',
        isDefault: true,
        name: 'Sándwich integral de pavo y queso cottage',
        category: 'Media Mañana',
        description: 'Snack saciante y limpio de media mañana con pan integral, alto contenido de pavo magro y queso cottage fresco con rodajas de tomate.',
        instructions: '1. Dispón las dos rebanadas de pan integral sobre una superficie limpia o tabla de cocina.\n2. Unta el queso cottage uniformemente sobre una de las caras de cada rebanada.\n3. Lava el tomate de ensalada, córtalo en rodajas finas y sazónalo con una pizca de orégano y sal.\n4. Coloca las rodajas de tomate sobre la base de queso cottage.\n5. Distribuye las lonchas de fiambre de pavo dobladas en capas para darle volumen y textura al sándwich.\n6. Cubre con la otra rebanada de pan, presiona ligeramente y corta en diagonal por la mitad.',
        preparation_time: 5,
        servings: 1,
        tags: [
            { id: 'tag-media-manana', name: 'Media Mañana', category: 'dieta' },
            { id: 'tag-alta-proteina', name: 'Alta Proteína', category: 'dieta' },
            { id: 'tag-baja-grasas', name: 'Baja en Grasas', category: 'dieta' },
            { id: 'tag-rapida', name: 'Rápida', category: 'dieta' }
        ],
        ingredients: [
            {
                id: 'def-ing-6-1',
                quantity_g: 80,
                notes: '2 rebanadas de pan integral de grano entero',
                food: FOOD_CATALOG.panIntegral
            },
            {
                id: 'def-ing-6-2',
                quantity_g: 100,
                notes: 'Lonchas finas de fiambre de pavo de alta calidad (>90%)',
                food: FOOD_CATALOG.fiambrePavo
            },
            {
                id: 'def-ing-6-3',
                quantity_g: 60,
                notes: 'Queso cottage fresco y granulado',
                food: FOOD_CATALOG.quesoCottage
            },
            {
                id: 'def-ing-6-4',
                quantity_g: 60,
                notes: 'Tomate maduro en rodajas',
                food: FOOD_CATALOG.tomate
            }
        ]
    },

    // ==========================================
    // 3. COMIDAS (4 Recetas)
    // ==========================================
    {
        id: 'default-recipe-7',
        isDefault: true,
        name: 'Pollo a la plancha con arroz blanco y brócoli',
        category: 'Comida',
        description: 'El pilar de la nutrición fitness: pechuga tierna dorada a la plancha, arroz blanco suave y brócoli al vapor con AOVE.',
        instructions: '1. Corta el brócoli en ramilletes pequeños, lávalos bien y cocínalos al vapor durante 6-8 minutos hasta que estén tiernos pero crujientes.\n2. Calienta el arroz blanco previamente cocido en microondas o sartén para servirlo a temperatura agradable.\n3. Seca los filetes de pechuga de pollo con papel absorbente y salpimienta al gusto con ajo en polvo y sal marina.\n4. Pon una plancha o sartén gruesa a fuego vivo con el aceite de oliva virgen extra.\n5. Cocina el pollo durante 3-4 minutos por cada lado hasta que adquiera un color dorado exterior sin resecar el interior.\n6. Sirve en un plato hondo disponiendo el arroz, el brócoli al vapor y la pechuga jugosa fileteada en tiras.',
        preparation_time: 20,
        servings: 1,
        tags: [
            { id: 'tag-comida', name: 'Comida', category: 'dieta' },
            { id: 'tag-alta-proteina', name: 'Alta Proteína', category: 'dieta' },
            { id: 'tag-definicion', name: 'Definición', category: 'dieta' },
            { id: 'tag-baja-grasas', name: 'Baja en Grasas', category: 'dieta' }
        ],
        ingredients: [
            {
                id: 'def-ing-7-1',
                quantity_g: 180,
                notes: 'Filetes limpios de pechuga de pollo',
                food: FOOD_CATALOG.pollo
            },
            {
                id: 'def-ing-7-2',
                quantity_g: 180,
                notes: 'Arroz blanco cocido de grano largo',
                food: FOOD_CATALOG.arrozBlanco
            },
            {
                id: 'def-ing-7-3',
                quantity_g: 150,
                notes: 'Ramilletes de brócoli al vapor',
                food: FOOD_CATALOG.brocoli
            },
            {
                id: 'def-ing-7-4',
                quantity_g: 10,
                notes: '1 cucharada de AOVE para marcar el pollo y aliñar',
                food: FOOD_CATALOG.aove
            }
        ]
    },
    {
        id: 'default-recipe-8',
        isDefault: true,
        name: 'Pasta integral boloñesa de ternera magra',
        category: 'Comida',
        description: 'Pasta integral con boloñesa fitness casera de ternera magra picada, tomate natural y especias mediterráneas como orégano y albahaca.',
        instructions: '1. Llena una cacerola con agua, añade sal y lleva a ebullición. Vierte la pasta integral y cuece de 9 a 11 minutos al dente.\n2. En una sartén antiadherente a fuego medio, añade el aceite de oliva virgen extra.\n3. Incorpora la ternera magra picada, desmenuzándola con la cuchara y cocinándola durante 4-5 minutos hasta que empiece a dorarse.\n4. Tritura o pica muy fino el tomate de ensalada y añádelo a la sartén junto con orégano, albahaca seca y una pizca de sal.\n5. Baja a fuego lento y deja que la salsa de tomate reduzca durante 7-8 minutos concentrando sus sabores.\n6. Escurre la pasta integral reservando una cucharada de agua de cocción, mézclala con la salsa boloñesa y saltea todo junto durante 1 minuto.',
        preparation_time: 25,
        servings: 1,
        tags: [
            { id: 'tag-comida', name: 'Comida', category: 'dieta' },
            { id: 'tag-alta-proteina', name: 'Alta Proteína', category: 'dieta' },
            { id: 'tag-volumen', name: 'Volumen', category: 'dieta' }
        ],
        ingredients: [
            {
                id: 'def-ing-8-1',
                quantity_g: 80,
                notes: 'Pasta de trigo integral en seco',
                food: FOOD_CATALOG.pastaIntegral
            },
            {
                id: 'def-ing-8-2',
                quantity_g: 150,
                notes: 'Carne picada de ternera magra sin grasa añadida',
                food: FOOD_CATALOG.ternera
            },
            {
                id: 'def-ing-8-3',
                quantity_g: 120,
                notes: 'Tomates maduros triturados para la salsa',
                food: FOOD_CATALOG.tomate
            },
            {
                id: 'def-ing-8-4',
                quantity_g: 8,
                notes: 'AOVE para sofreír la carne',
                food: FOOD_CATALOG.aove
            }
        ]
    },
    {
        id: 'default-recipe-9',
        isDefault: true,
        name: 'Bowl mediterráneo de garbanzos y atún',
        category: 'Comida',
        description: 'Ensalada completa fresca y reconstituyente que combina legumbres ricas en fibra, atún al natural, aguacate cremoso y tomate fresco.',
        instructions: '1. Vierte los garbanzos cocidos en un colador y acláralos bajo el chorro de agua fría hasta retirar el líquido de conservación. Escurre bien.\n2. Coloca los garbanzos limpios en el fondo de un cuenco grande para ensaladas.\n3. Abre las latas de atún claro al natural, escurre el agua sobrante presionando con la tapa y desmenuza el atún sobre los garbanzos.\n4. Lava el tomate de ensalada y córtalo en dados medianos.\n5. Corta el aguacate por la mitad, retira el hueso y corta la pulpa en cubitos regulares.\n6. Añade el tomate y el aguacate al bol, condimenta con el aceite de oliva virgen extra, sal y zumo de limón, y mezcla suavemente.',
        preparation_time: 10,
        servings: 1,
        tags: [
            { id: 'tag-comida', name: 'Comida', category: 'dieta' },
            { id: 'tag-alta-proteina', name: 'Alta Proteína', category: 'dieta' },
            { id: 'tag-rapida', name: 'Rápida', category: 'dieta' }
        ],
        ingredients: [
            {
                id: 'def-ing-9-1',
                quantity_g: 180,
                notes: 'Garbanzos cocidos de bote bien enjuagados',
                food: FOOD_CATALOG.garbanzos
            },
            {
                id: 'def-ing-9-2',
                quantity_g: 120,
                notes: 'Atún en conserva al natural escurrido',
                food: FOOD_CATALOG.atun
            },
            {
                id: 'def-ing-9-3',
                quantity_g: 50,
                notes: 'Aguacate Hass en dados',
                food: FOOD_CATALOG.aguacate
            },
            {
                id: 'def-ing-9-4',
                quantity_g: 100,
                notes: 'Tomate fresco en dados',
                food: FOOD_CATALOG.tomate
            },
            {
                id: 'def-ing-9-5',
                quantity_g: 8,
                notes: 'AOVE virgen extra para el aliño',
                food: FOOD_CATALOG.aove
            }
        ]
    },
    {
        id: 'default-recipe-10',
        isDefault: true,
        name: 'Salteado de pavo con boniato asado y verduras',
        category: 'Comida',
        description: 'Combinación rica en antioxidantes y carbohidratos de bajo índice glucémico con dados de pechuga de pavo, boniato asado, pimiento y calabacín.',
        instructions: '1. Si no dispones de boniato asado con antelación, pélalo, córtalo en dados y ásalo al microondas en recipiente tapado durante 5-6 minutos hasta que esté blando.\n2. Corta la pechuga de pavo limpia en dados de 2 cm. Corta el pimiento rojo y el calabacín con piel en cubos similares.\n3. Calienta un wok o sartén amplia a fuego alto con el aceite de oliva virgen extra.\n4. Saltea los dados de pavo salpimentados durante 4 minutos hasta dorar la superficie. Retira a un plato.\n5. En la misma sartén añade el pimiento rojo y el calabacín, salteando con energía durante 4-5 minutos hasta que queden al dente.\n6. Reincorpora el pavo y suma los dados de boniato asado; remueve todo a fuego vivo durante 2 minutos sazonando con pimentón dulce.',
        preparation_time: 25,
        servings: 1,
        tags: [
            { id: 'tag-comida', name: 'Comida', category: 'dieta' },
            { id: 'tag-alta-proteina', name: 'Alta Proteína', category: 'dieta' },
            { id: 'tag-definicion', name: 'Definición', category: 'dieta' }
        ],
        ingredients: [
            {
                id: 'def-ing-10-1',
                quantity_g: 180,
                notes: 'Pechuga magra de pavo en cubos',
                food: FOOD_CATALOG.pavo
            },
            {
                id: 'def-ing-10-2',
                quantity_g: 180,
                notes: 'Boniato asado en dados tiernos',
                food: FOOD_CATALOG.boniato
            },
            {
                id: 'def-ing-10-3',
                quantity_g: 80,
                notes: 'Pimiento rojo fresco en cubos',
                food: FOOD_CATALOG.pimientoRojo
            },
            {
                id: 'def-ing-10-4',
                quantity_g: 80,
                notes: 'Calabacín fresco con piel en cubos',
                food: FOOD_CATALOG.calabacin
            },
            {
                id: 'def-ing-10-5',
                quantity_g: 10,
                notes: 'AOVE para saltear verduras y carne al wok',
                food: FOOD_CATALOG.aove
            }
        ]
    },

    // ==========================================
    // 4. MERIENDAS (2 Recetas)
    // ==========================================
    {
        id: 'default-recipe-11',
        isDefault: true,
        name: 'Bowl de queso fresco batido con crema de cacahuete y tortitas de arroz',
        category: 'Merienda',
        description: 'Snack proteico de absorción sostenida (caseína y grasas monoinsaturadas) perfecto para mantener la saciedad durante la tarde.',
        instructions: '1. Vierte el queso fresco batido 0% M.G. en un bol hondo individual.\n2. Con la ayuda de una cuchara, incorpora la mantequilla de cacahuete 100% pura y haz movimientos circulares para integrarla parcialmente o crear vetas.\n3. Toma las tortitas de arroz inflado y rómpelas con las manos en trozos de tamaño bocado.\n4. Añade las tortitas troceadas sobre la superficie del bol para conseguir un contraste crujiente irresistible.\n5. Opcional: añade canela de Ceilán en polvo por encima y consúmelo al momento.',
        preparation_time: 5,
        servings: 1,
        tags: [
            { id: 'tag-merienda', name: 'Merienda', category: 'dieta' },
            { id: 'tag-alta-proteina', name: 'Alta Proteína', category: 'dieta' },
            { id: 'tag-rapida', name: 'Rápida', category: 'dieta' },
            { id: 'tag-volumen', name: 'Volumen', category: 'dieta' }
        ],
        ingredients: [
            {
                id: 'def-ing-11-1',
                quantity_g: 250,
                notes: 'Queso fresco batido desnatado alto en caseína',
                food: FOOD_CATALOG.quesoBatido
            },
            {
                id: 'def-ing-11-2',
                quantity_g: 20,
                notes: 'Crema de cacahuete 100% natural sin azúcares añadidos',
                food: FOOD_CATALOG.cremaCacahuete
            },
            {
                id: 'def-ing-11-3',
                quantity_g: 24,
                notes: '3 tortitas de arroz inflado troceadas crujientes',
                food: FOOD_CATALOG.tortitasArroz
            }
        ]
    },
    {
        id: 'default-recipe-12',
        isDefault: true,
        name: 'Pudin proteico de yogur y fresas',
        category: 'Merienda',
        description: 'Merienda fresca y ligera con yogur griego 0%, un extra de proteína Whey para potenciar el valor biológico y fresas naturales troceadas.',
        instructions: '1. Coloca el yogur griego ligero 0% en un cuenco hondo.\n2. Añade el cazo de proteína Whey en polvo poco a poco, batiendo con una cuchara o varilla pequeña hasta que espese y adquiera textura similar a un pudin cremoso.\n3. Lava bien las fresas frescas, desecha las hojas y córtalas en daditos pequeños.\n4. Incorpora la mitad de los dados de fresa dentro de la mezcla proteica removiendo suavemente.\n5. Coloca la otra mitad de las fresas en la parte superior como decoración.\n6. Deja enfriar 10-15 minutos en el frigorífico antes de comer para intensificar su frescura y firmeza.',
        preparation_time: 5,
        servings: 1,
        tags: [
            { id: 'tag-merienda', name: 'Merienda', category: 'dieta' },
            { id: 'tag-alta-proteina', name: 'Alta Proteína', category: 'dieta' },
            { id: 'tag-definicion', name: 'Definición', category: 'dieta' },
            { id: 'tag-baja-grasas', name: 'Baja en Grasas', category: 'dieta' }
        ],
        ingredients: [
            {
                id: 'def-ing-12-1',
                quantity_g: 180,
                notes: 'Yogur griego desnatado espeso',
                food: FOOD_CATALOG.yogurGriego
            },
            {
                id: 'def-ing-12-2',
                quantity_g: 20,
                notes: 'Proteína whey sabor fresa o vainilla',
                food: FOOD_CATALOG.proteinaWhey
            },
            {
                id: 'def-ing-12-3',
                quantity_g: 100,
                notes: 'Fresas maduras en cubos',
                food: FOOD_CATALOG.fresas
            }
        ]
    },

    // ==========================================
    // 5. CENAS (4 Recetas)
    // ==========================================
    {
        id: 'default-recipe-13',
        isDefault: true,
        name: 'Salmón al horno con patata asada y espinacas',
        category: 'Cena',
        description: 'Cena rica en ácidos grasos omega 3, potasio y micronutrientes, con lomo de salmón jugoso al horno, patata asada y espinacas frescas salteadas.',
        instructions: '1. Precalienta el horno a 200°C. Lava la patata y cuécela al vapor o ásala al microondas durante 6-7 minutos hasta que esté tierna por dentro.\n2. Coloca el lomo de salmón fresco sobre una bandeja forrada con papel de horno y sazona con sal, pimienta y unas gotas de limón.\n3. Hornea el salmón a 190°C durante 12-14 minutos, vigilando que el centro quede sonrosado y tierno.\n4. Mientras tanto, calienta una sartén con el aceite de oliva virgen extra y saltea las espinacas frescas durante 2 minutos hasta que mengüen y queden verdes vivas.\n5. Abre la patata asada por la mitad en el plato y añade una pizca de sal marina.\n6. Emplata el salmón al horno junto con la patata caliente y la guarnición de espinacas salteadas.',
        preparation_time: 25,
        servings: 1,
        tags: [
            { id: 'tag-cena', name: 'Cena', category: 'dieta' },
            { id: 'tag-alta-proteina', name: 'Alta Proteína', category: 'dieta' },
            { id: 'tag-definicion', name: 'Definición', category: 'dieta' }
        ],
        ingredients: [
            {
                id: 'def-ing-13-1',
                quantity_g: 160,
                notes: 'Lomo limpio de salmón fresco con piel',
                food: FOOD_CATALOG.salmon
            },
            {
                id: 'def-ing-13-2',
                quantity_g: 150,
                notes: 'Patata mediana asada o cocida',
                food: FOOD_CATALOG.patata
            },
            {
                id: 'def-ing-13-3',
                quantity_g: 100,
                notes: 'Hojas tiernas de espinacas frescas',
                food: FOOD_CATALOG.espinacas
            },
            {
                id: 'def-ing-13-4',
                quantity_g: 5,
                notes: 'AOVE para saltear las espinacas',
                food: FOOD_CATALOG.aove
            }
        ]
    },
    {
        id: 'default-recipe-14',
        isDefault: true,
        name: 'Merluza a la plancha con espárragos verdes y patata',
        category: 'Cena',
        description: 'Cena hipocalórica y digestiva perfecta para etapas de definición: merluza blanca magra, espárragos verdes a la parrilla y patata cocida.',
        instructions: '1. Lava los espárragos verdes y corta la parte inferior leñosa del tallo.\n2. Calienta una plancha o sartén acanalada con la mitad del aceite de oliva virgen extra y asa los espárragos a fuego medio-alto durante 6-7 minutos hasta que estén dorados.\n3. Saca los lomos de merluza, sécalos con papel de cocina y sálalos ligeramente.\n4. En la misma plancha o sartén caliente con el resto del AOVE, marca la merluza durante 3 minutos por cada lado con cuidado al darle la vuelta para no desmenuzarla.\n5. Corta la patata previamente cocida en rodajas gruesas y caliéntala si fuera necesario.\n6. Emplata los lomos de merluza dorados acompañados de los espárragos crujientes y las rodajas de patata con perejil picado.',
        preparation_time: 20,
        servings: 1,
        tags: [
            { id: 'tag-cena', name: 'Cena', category: 'dieta' },
            { id: 'tag-alta-proteina', name: 'Alta Proteína', category: 'dieta' },
            { id: 'tag-baja-grasas', name: 'Baja en Grasas', category: 'dieta' },
            { id: 'tag-definicion', name: 'Definición', category: 'dieta' }
        ],
        ingredients: [
            {
                id: 'def-ing-14-1',
                quantity_g: 180,
                notes: 'Lomos limpios sin espinas de merluza',
                food: FOOD_CATALOG.merluza
            },
            {
                id: 'def-ing-14-2',
                quantity_g: 120,
                notes: 'Espárragos verdes tiernos a la plancha',
                food: FOOD_CATALOG.esparragos
            },
            {
                id: 'def-ing-14-3',
                quantity_g: 120,
                notes: 'Patata cocida en rodajas',
                food: FOOD_CATALOG.patata
            },
            {
                id: 'def-ing-14-4',
                quantity_g: 8,
                notes: 'AOVE para la plancha y aliño ligero',
                food: FOOD_CATALOG.aove
            }
        ]
    },
    {
        id: 'default-recipe-15',
        isDefault: true,
        name: 'Tortilla francesa de claras y huevo con ensalada de tomate y aguacate',
        category: 'Cena',
        description: 'Tortilla ligera y esponjosa combinando un huevo entero con claras pasteurizadas, acompañada de una ensalada fresca de tomate y aguacate.',
        instructions: '1. En un plato hondo o bol, bate con energía el huevo entero junto con la clara de huevo pasteurizada y una pizca de sal hasta obtener una mezcla espumosa.\n2. Pon una sartén antiadherente a calentar a fuego medio con la mitad del aceite de oliva virgen extra.\n3. Vierte los huevos batidos y mueve la sartén con suavidad para que el huevo cubra toda la superficie.\n4. Cuando los bordes estén firmes pero el centro aún jugoso, pliega la tortilla sobre sí misma formando un rollo tierno y deja dorar 30 segundos más.\n5. Corta el tomate de ensalada en gajos y corta el aguacate maduro en dados medianos.\n6. Sirve la tortilla francesa caliente en el plato junto a los gajos de tomate y aguacate, aderezando la ensalada con el resto del AOVE y una pizca de sal.',
        preparation_time: 15,
        servings: 1,
        tags: [
            { id: 'tag-cena', name: 'Cena', category: 'dieta' },
            { id: 'tag-alta-proteina', name: 'Alta Proteína', category: 'dieta' },
            { id: 'tag-definicion', name: 'Definición', category: 'dieta' },
            { id: 'tag-rapida', name: 'Rápida', category: 'dieta' }
        ],
        ingredients: [
            {
                id: 'def-ing-15-1',
                quantity_g: 60,
                notes: '1 huevo campero entero para textura y sabor',
                food: FOOD_CATALOG.huevo
            },
            {
                id: 'def-ing-15-2',
                quantity_g: 150,
                notes: 'Claras pasteurizadas para maximizar la proteína limpia',
                food: FOOD_CATALOG.claras
            },
            {
                id: 'def-ing-15-3',
                quantity_g: 120,
                notes: 'Tomate de ensalada en gajos frescos',
                food: FOOD_CATALOG.tomate
            },
            {
                id: 'def-ing-15-4',
                quantity_g: 40,
                notes: 'Aguacate en dados cremosos',
                food: FOOD_CATALOG.aguacate
            },
            {
                id: 'def-ing-15-5',
                quantity_g: 6,
                notes: 'AOVE para la sartén y aderezo',
                food: FOOD_CATALOG.aove
            }
        ]
    },
    {
        id: 'default-recipe-16',
        isDefault: true,
        name: 'Fajitas / salteado ligero de pollo con pimientos y calabacín',
        category: 'Cena',
        description: 'Salteado estilo fajita sin tortillas, con tiras jugosas de pechuga de pollo, pimiento rojo y calabacín especiados con comino y orégano.',
        instructions: '1. Corta la pechuga de pollo en tiras finas alargadas de bocado y sazona con comino en polvo, ajo, orégano, sal y pimienta.\n2. Lava el pimiento rojo y el calabacín con piel y córtalos en tiras alargadas estilo fajita.\n3. Calienta a fuego vivo una sartén amplia o wok con el aceite de oliva virgen extra.\n4. Añade las tiras de pollo y saltea con fuerza durante 4-5 minutos hasta que tomen un apetecible color dorado exterior. Reserva en un plato.\n5. En la misma sartén bien caliente, añade las tiras de pimiento y calabacín; saltea durante 4 minutos manteniendo las verduras al dente y crujientes.\n6. Devuelve el pollo a la sartén junto con las verduras, saltea todo junto durante 1 minuto a fuego fuerte para amalgamar los sabores y sirve inmediatamente.',
        preparation_time: 20,
        servings: 1,
        tags: [
            { id: 'tag-cena', name: 'Cena', category: 'dieta' },
            { id: 'tag-alta-proteina', name: 'Alta Proteína', category: 'dieta' },
            { id: 'tag-definicion', name: 'Definición', category: 'dieta' },
            { id: 'tag-baja-grasas', name: 'Baja en Grasas', category: 'dieta' }
        ],
        ingredients: [
            {
                id: 'def-ing-16-1',
                quantity_g: 180,
                notes: 'Pechuga magra en tiras alargadas',
                food: FOOD_CATALOG.pollo
            },
            {
                id: 'def-ing-16-2',
                quantity_g: 90,
                notes: 'Pimiento rojo fresco en tiras tipo juliana',
                food: FOOD_CATALOG.pimientoRojo
            },
            {
                id: 'def-ing-16-3',
                quantity_g: 90,
                notes: 'Calabacín fresco con piel en tiras',
                food: FOOD_CATALOG.calabacin
            },
            {
                id: 'def-ing-16-4',
                quantity_g: 8,
                notes: 'AOVE para saltear en sartén caliente',
                food: FOOD_CATALOG.aove
            }
        ]
    }
];
