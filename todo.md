# Cancún al Minuto - Portal de Noticias TODO

## Estructura y Base de Datos
- [x] Crear tabla `articles` en drizzle/schema.ts (id, title, excerpt, content, imageUrl, sourceUrl, sourceName, category, publishedAt, createdAt)
- [x] Crear tabla `rss_sources` en drizzle/schema.ts (id, name, url, category, active, lastFetched)
- [x] Ejecutar pnpm db:push para migrar esquema

## Backend - API de Noticias
- [x] Crear server/db-news.ts con queries para artículos y fuentes RSS
- [x] Crear server/routers/news.ts con procedimientos tRPC (getArticles, importFromRss, getSources)
- [x] Crear server/rss-importer.ts con lógica de importación RSS y decodificación HTML
- [x] Registrar routers en server/routers.ts

## Frontend - Interfaz Principal
- [x] Actualizar client/index.html con fuentes Google
- [x] Adaptar DashboardLayout para portal de noticias (menú con categorías)
- [x] Reescribir client/src/pages/Home.tsx como portal de noticias completo
- [x] Crear client/src/pages/Categoria.tsx para filtrar por categoría
- [x] Crear client/src/pages/Fuentes.tsx para gestionar fuentes RSS
- [x] Actualizar App.tsx con todas las rutas

## Funcionalidades
- [x] Buscador en tiempo real de noticias
- [x] Filtrado por categorías (Cancún, QRoo, Nacional, Deportes, General)
- [x] Paginación de artículos
- [x] Artículo destacado (hero) en la página principal
- [x] Botón "Actualizar" para importar noticias manualmente

## Automatización RSS
- [x] Fuentes RSS verificadas y activas (Noticaribe, Diario de Yucatán, Vanguardia MX, Latinus, Mexico News Daily, El Siglo de Torreón)
- [x] Configurar job de importación automática cada 30 minutos (heartbeat) - endpoint /api/scheduled/import-rss listo

## Pruebas y Deploy
- [x] Escribir tests vitest para importador RSS (15 tests pasando)
- [x] Verificar que el sitio funciona correctamente con noticias reales
- [x] Crear checkpoint final
- [x] Crear cron heartbeat cada 30 min - task_uid: a4ccnF3DuY8qd4fqjuS2kJ
- [ ] Respaldar en GitHub (requiere token PAT del usuario)
- [ ] Configurar dominio cancunalminuto.mx
