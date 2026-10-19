# Akuma Fit 🏋️‍♂️

Aplicación moderna para entrenadores personales y atletas construida con **React 19, Vite 8, React Router 7 y Supabase**.

---

## 🚀 Puesta en marcha

### 1. Clonar e instalar dependencias
```bash
git clone https://github.com/albertokalim/akuma-fit.git
cd akuma-fit
npm install
```

### 2. Configurar variables de entorno
Copia `.env.example` a `.env.local` en la raíz del proyecto:
```bash
cp .env.example .env.local
```
Rellena las variables con las credenciales de tu proyecto Supabase:
```env
VITE_SUPABASE_URL=https://<tu-project-id>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<tu-publishable-anon-key>
```

### 3. Configuración de Base de Datos en Supabase
En el **SQL Editor** de tu panel de Supabase, ejecuta por orden los scripts que se encuentran en `src/migrations/`:

1. `001_types.sql` - Tipos enumerados (roles, adherencia, género).
2. `002_tables.sql` - Esquema de tablas relacionales.
3. `003_functions.sql` - Funciones PL/pgSQL y de cálculo.
4. `004_rls_policies.sql` - Políticas de seguridad a nivel de fila (RLS).
5. `005_storage.sql` - Creación de buckets privados para avatares, fotos y vídeos.
6. `006_constraints_indexes.sql` - Claves foráneas con CASCADE, índices y restricciones.
7. `007_seed.sql` - **(Recomendado)** Datos semilla con biblioteca base de ejercicios, alimentos con macros por 100g y etiquetas.
8. `008_security_coaches.sql` - **(Recomendado)** Seguridad reforzada en fotos corporales y tabla `coach_has_client`.

### 4. Crear tu cuenta de Entrenador (Coach)
Al registrarte en la aplicación recibirás por defecto el rol de atleta (`client`). Para ascender tu cuenta a Entrenador, ve al **SQL Editor** de Supabase y ejecuta:
```sql
SELECT public.promote_to_coach('tu_email@ejemplo.com');
```

### 5. Iniciar en desarrollo
```bash
npm run dev
```

---

## 🛠️ Comandos disponibles

- `npm run dev`: Inicia el servidor de desarrollo Vite con hot-reload.
- `npm run build`: Compila el bundle de producción en la carpeta `dist/`.
- `npm run lint`: Ejecuta el análisis estático de código con ESLint.
- `npm run test:run`: Ejecuta la suite de pruebas unitarias con Vitest.
- `npm run preview`: Previsualiza el bundle compilado localmente.

---

## 📱 Características destacadas

- **Gestión integral de clientes:** Vista del coach con búsqueda, estado de adherencia, asignación de rutinas y fichas de valoración.
- **Modo entrenamiento en vivo:** Registro interactivo de repeticiones y peso, feedback de series y **temporizador de descanso sonoro y con vibración** integrado.
- **Nutrición & Dietas:** Constructor visual de menús por comidas (slots), biblioteca de alimentos y recetas con cálculo automático de macronutrientes.
- **Seguimiento & Check-Ins:** Gráficos evolutivos de peso, adherencia semanal, comparación fotográfica corporal y alertas de atención requerida.
- **PWA & Mobile Ready:** Configurada con Web App Manifest y lista para instalar en pantalla de inicio.
- **Despliegue SPA:** Incluye reglas de reescritura para **Vercel** (`vercel.json`) y **Netlify/Cloudflare** (`_redirects`).

---

## 📄 Licencia

[MIT](LICENSE).