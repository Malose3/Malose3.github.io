# malose3.github.io

Web-portfolio estática de **Manuel López Serrano** (`Malose3`), pensada para GitHub Pages.
Versión lista para revisión: **no publicada todavía**. Contenido basado en el CV de Manuel y en sus repositorios públicos.

## Estructura

```
.
├── .nojekyll              # GitHub Pages sirve los archivos tal cual (sin Jekyll)
├── index.html             # Página única: hero con retrato, marquee, sobre mí + toolbox, trayectoria, proyectos, contacto
├── 404.html               # Página de error (rutas absolutas, válida desde cualquier URL)
├── robots.txt
├── sitemap.xml
└── assets/
    ├── css/site.css       # Estilos (responsive y con prefers-reduced-motion)
    ├── js/main.js         # Menú, retrato con inclinación 3D, física de la toolbox, línea de tiempo
    ├── img/manuel-portrait.{webp,jpg}  # Retrato 4:5 (960×1200, sin EXIF)
    └── cv/CV-Manuel-Lopez-Serrano.pdf  # CV oficial en PDF
```

Stack: HTML5, CSS3 y JavaScript vanilla. Sin dependencias, sin frameworks y sin paso de build.

## Probar en local

```sh
cd malose3-github-io
python3 -m http.server 8000
# abrir http://localhost:8000
```

`node --check assets/js/main.js` valida la sintaxis del JavaScript.

## Reglas de contenido

- Solo hechos verificables en el GitHub público de `Malose3` o confirmados por Manuel. Nada de inflar experiencia, fechas, títulos, métricas ni certificaciones.
- El código y los datos de la app privada del club no se enlazan ni se describen más allá del caso de estudio público `Malose3/swim-club-case-study`.
- Antes de publicar, comprobar que el enlace de LinkedIn abre el perfil correcto y que el CV en PDF es la versión vigente.
- El sitio publica el email y la ubicación (Sax, Alicante) por decisión de Manuel; el PDF del CV será descargable por cualquiera.

## Publicar (solo con el OK de Manuel)

1. Crear en GitHub el repositorio **público** `Malose3/Malose3.github.io` (el nombre debe ser exactamente `<usuario>.github.io`), sin README inicial.
2. Desde esta carpeta:
   ```sh
   git init -b main
   git add .
   git commit -m "Portfolio: esqueleto inicial"
   git remote add origin https://github.com/Malose3/Malose3.github.io.git
   git push -u origin main
   ```
3. En el repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, rama `main`, carpeta `/ (root)`.
4. Esperar a que termine el despliegue y comprobar `https://malose3.github.io/` y una ruta inexistente (debe mostrar `404.html`).
5. Opcional: activar **Enforce HTTPS** y añadir la URL en el campo *Website* del perfil de GitHub.
