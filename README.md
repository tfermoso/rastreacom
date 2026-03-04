# RastreaCom

Sistema web para **analizar sitios web y extraer información de
contacto** (emails y teléfonos) automáticamente.

La aplicación rastrea una URL, explora páginas internas relevantes y
extrae información pública de contacto.\
Los resultados se guardan en **MongoDB** para acelerar consultas
posteriores mediante **caché**.

------------------------------------------------------------------------

## Características

-   Análisis automático de sitios web
-   Extracción de:
    -   Emails
    -   Teléfonos
-   Exploración de páginas internas (contacto, about, etc.)
-   Sistema de **caché en MongoDB**
-   Autenticación de usuarios
-   Dashboard con estadísticas
-   Historial de sitios analizados
-   Interfaz moderna con **parallax y diseño responsive**

------------------------------------------------------------------------

## Tecnologías utilizadas

### Backend

-   Node.js
-   Express
-   MongoDB
-   Mongoose

### Frontend

-   HTML
-   CSS
-   Bootstrap
-   JavaScript

### Arquitectura

-   MVC ligero
-   Sistema de sesiones
-   API interna para análisis de URLs

------------------------------------------------------------------------

## Estructura del proyecto

    src
     ├── lib
     │    ├── analyzeSite.js
     │    ├── discoverUrls.js
     │    ├── extract.js
     │    └── fetchHtmlLimited.js
     │
     ├── models
     │    ├── Site.js
     │    └── User.js
     │
     ├── routes
     │    ├── auth.routes.js
     │    └── user.routes.js
     │
     ├── middlewares
     │    └── requireAuth.js
     │
     └── views
          ├── auth
          └── user

------------------------------------------------------------------------

## Cómo funciona el análisis

1.  El usuario introduce una URL.
2.  El sistema descarga el HTML de la página principal.
3.  Se extraen los datos de contacto.
4.  Se detectan enlaces relevantes dentro del sitio.
5.  Se analizan varias páginas adicionales.
6.  Se combinan los resultados.
7.  Se guarda el resultado en MongoDB.

Si la web ya fue analizada recientemente, el sistema devuelve el
resultado **desde caché**.

------------------------------------------------------------------------

## Caché de resultados

Los análisis se guardan en MongoDB con un tiempo de vida configurable.

Variables utilizadas:

    ANALYSIS_CACHE_TTL_DAYS=7

Esto evita volver a rastrear la misma web innecesariamente.

------------------------------------------------------------------------

## Instalación

### 1. Clonar repositorio

``` bash
git clone https://github.com/tuusuario/RastreaCom.git
cd RastreaCom
```

### 2. Instalar dependencias

``` bash
npm install
```

### 3. Configurar variables de entorno

Crear archivo `.env`

    PORT=3000
    MONGO_URI=mongodb://localhost:27017/RastreaCom
    SESSION_SECRET=supersecret
    ANALYSIS_CACHE_TTL_DAYS=7

### 4. Ejecutar aplicación

``` bash
npm start
```

Servidor disponible en:

    http://localhost:3000

------------------------------------------------------------------------

## Uso de la aplicación

### Landing

Explica el funcionamiento del sistema.

### Registro / Login

Sistema de autenticación de usuarios.

### Dashboard

Muestra:

-   Número de usuarios
-   Número de sitios analizados
-   Acceso al analizador

### Analizador de URLs

Permite:

1.  Introducir una URL
2.  Analizar el sitio
3.  Ver:
    -   Emails encontrados
    -   Teléfonos encontrados
    -   Páginas visitadas

### Historial

En el lateral se muestran **las últimas URLs analizadas**.

------------------------------------------------------------------------

## API interna

### Analizar URL

    POST /user/analyze

Body:

``` json
{
  "url": "https://example.com"
}
```

Respuesta:

``` json
{
  "source": "fresh",
  "result": {
    "name": "Example Company",
    "url": "https://example.com",
    "emails": ["info@example.com"],
    "phones": ["+34 900000000"]
  }
}
```

Si la web ya fue analizada:

``` json
{
  "source": "cache"
}
```

------------------------------------------------------------------------

## Seguridad

-   Validación de URLs
-   Restricción a protocolos HTTP / HTTPS
-   Sistema de autenticación con sesiones
-   Middleware `requireAuth` para proteger rutas privadas

------------------------------------------------------------------------

## Posibles mejoras

-   Exportar resultados a CSV
-   Búsqueda avanzada de empresas
-   Sistema de scraping distribuido
-   Panel de administración
-   API pública
-   Cola de procesamiento con Redis

------------------------------------------------------------------------

## Autor

Proyecto desarrollado como herramienta de análisis web y demostración de
scraping controlado con Node.js.
