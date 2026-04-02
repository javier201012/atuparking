# Atuparking

Proyecto base con Vite + React para una web de parking de caravanas.

## Stack

- Vite
- React
- CSS plano sin librerias adicionales

## Scripts

- `npm run api`: API local para Stripe y disponibilidad
- `npm run dev`: entorno de desarrollo
- `npm run dev:full`: frontend + API de Stripe a la vez
- `npm run build`: build de produccion
- `npm run lint`: revision con ESLint
- `npm run preview`: previsualizacion local del build

## Stripe

La integracion de pago usa Stripe Checkout con una API propia para no exponer la clave secreta en el frontend.

1. Crea un archivo `.env` a partir de `.env.example`
2. Añade tu clave `STRIPE_SECRET_KEY`
3. Ejecuta `npm run dev:full`

La API crea un alta inicial prorrateada a 2 euros por dia hasta fin de mes y deja preparada la renovacion mensual de 60 euros el primer dia de cada mes.

## Netlify

Para que el pago funcione en Netlify no basta con desplegar solo el frontend estatico: tambien hace falta una funcion serverless para el endpoint de checkout.

Variables de entorno necesarias en Netlify:

- `STRIPE_SECRET_KEY`
- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `ADMIN_PANEL_PASSWORD`

El proyecto incluye funciones en `netlify/functions/` para checkout, lectura de disponibilidad y actualizacion del panel admin, con redirects en `netlify.toml`.

## Estado actual

- Landing en espanol con branding Atuparking
- Primer cobro prorrateado y renovacion mensual automatica
- Panel admin basico para bloquear o liberar fechas
- Diseño responsive orientado a presentar servicios, ventajas y contacto

## Siguientes ampliaciones recomendadas

- Añadir autenticacion admin mas robusta si el negocio crece
- Integrar webhooks de Stripe para confirmar pagos y renovaciones
- Ajustar SEO y textos finales de marca
