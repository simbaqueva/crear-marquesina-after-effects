# Script: crear_marquesina_final.jsx

## ¿Qué hace este script?

Este script crea automáticamente una **marquesina (ticker de texto en movimiento)** dentro de **Adobe After Effects**. Es un script de automatización que, al ejecutarse, construye toda la estructura de composiciones necesaria para tener un texto que se desplaza horizontalmente de derecha a izquierda, recortado dentro de una ventana/máscara fija.

### Funcionalidades principales:
1. **Pide el texto** al usuario mediante un diálogo (con un texto por defecto: "D1 * Moda * Calzado * Hogar * Belleza * Vehículos * Servicios").
2. **Crea una pre-composición interna** (`Ticker_Inner`) muy ancha (4000px) que contiene el texto triplicado para garantizar un bucle continuo sin huecos.
3. **Añade una capa** (`Ticker_D1`) en la composición principal con una **máscara rectangular fija** de 659x64 px que recorta el texto.
4. **Aplica una expresión de movimiento** al texto para que se desplace a una velocidad configurable (180 px/s por defecto) usando módulo para que el bucle sea infinito.
5. **Añade controles deslizantes (sliders)** para ajustar fácilmente:
   - Ancho y alto de la máscara (sin editar el path manualmente).
   - Velocidad del texto (dentro de la pre-comp interna).

---

## ¿Para qué programa es?

Es un script para **Adobe After Effects** (extensión `.jsx`). Se ejecuta dentro del propio After Effects usando su motor de scripting (ExtendScript). **No es un script de navegador ni de Node.js** — debe ejecutarse desde el panel de scripts de After Effects.

---

## Requisitos previos

1. **Adobe After Effects** instalado (cualquier versión reciente, CC o superior).
2. **Un proyecto abierto** en After Effects.
3. **Una composición principal seleccionada/activa** en el panel de Proyecto (el script la usa como destino).
4. **Habilitar "Permitir scripts para escribir archivos y acceder a la red"** (opcional pero recomendado) en:
   - `Edición > Preferencias > General > Permitir scripts...` (Windows)
   - `After Effects > Preferencias > General > Permitir scripts...` (Mac)
5. **Colocar el archivo** en la carpeta de Scripts de After Effects:
   - Windows: `C:\Program Files\Adobe\Adobe After Effects <versión>\Support Files\Scripts\`
   - Mac: `/Applications/Adobe After Effects <versión>/Scripts/`
   - (O simplemente ejecutarlo desde `Archivo > Scripts > Ejecutar archivo de script...`)

---

## Cómo ejecutarlo

### Método 1: Desde el panel de Scripts (recomendado)
1. Copia el archivo `crear_marquesina_final.jsx` a la carpeta de Scripts de After Effects.
2. Abre After Effects y crea/abre un proyecto.
3. Selecciona en el panel de Proyecto la composición principal donde quieres la marquesina.
4. Ve a `Archivo > Scripts > crear_marquesina_final.jsx` (aparecerá en la lista).
5. Se abrirá un diálogo pidiendo el texto → escribe el texto deseado y pulsa "Listo".
6. El script creará automáticamente la marquesina y te mostrará un mensaje de confirmación.

### Método 2: Ejecutar archivo de script
1. En After Effects: `Archivo > Scripts > Ejecutar archivo de script...`
2. Navega hasta el archivo `.jsx` y selecciónalo.
3. Sigue los pasos del diálogo.

---

## Cómo funciona (arquitectura interna)

```
[Composición Principal]
   └── Capa: "Ticker_D1" (con máscara fija de 659x64)
         └── [Pre-Comp: "Ticker_Inner"] (muy ancha: 4000px)
               └── Capa de Texto moviéndose en X
```

### Pasos técnicos que realiza:
1. **Pide el texto** al usuario (o usa el predeterminado si se cancela o queda vacío).
2. **Crea la pre-comp interna** `Ticker_Inner` de 4000x64 px, 30 fps, 60 segundos.
3. **Triplica el texto** con separadores (`  *  `) para que el bucle no tenga huecos.
4. **Aplica estilo** al texto: tamaño 36px, color rojo D1 `[0.93, 0.11, 0.14]`, fuente Montserrat-Black (si está disponible).
5. **Añade la pre-comp** como capa en la composición principal, centrada.
6. **Crea la máscara rectangular fija** de 659x64 px sobre la capa.
7. **Añade sliders** de control para ancho/alto de máscara y velocidad.
8. **Aplica expresiones** para el movimiento del texto y el redimensionado dinámico de la máscara.

---

## Parámetros configurables (dentro del script)

| Parámetro | Valor por defecto | Descripción |
|-----------|-------------------|-------------|
| `MASK_W` | 659 | Ancho visible de la marquesina en px |
| `MASK_H` | 64 | Alto visible de la marquesina en px |
| `FONT_SIZE` | 36 | Tamaño de fuente en px |
| `FONT_COLOR` | `[0.93, 0.11, 0.14]` | Color rojo D1 |
| `VELOCIDAD` | 180 | Velocidad en px/segundo |
| `INNER_W` | 4000 | Ancho de la pre-comp interna |
| `FPS` | 30 | Fotogramas por segundo |
| `DURACION` | 60 | Segundos de duración |
| `SEPARADOR` | `"  *  "` | Separador entre repeticiones del texto |

---

## Ajustes posteriores (sin tocar el script)

1. **Mover la marquesina**: selecciona la capa `Ticker_D1 ← Mover aquí` y muévela en la composición.
2. **Cambiar tamaño de la ventana**: selecciona la capa y ajusta los sliders `Ancho Mascara` y `Alto Mascara` en Efectos.
3. **Cambiar velocidad**: entra a la pre-comp `Ticker_Inner`, selecciona la capa de texto y cambia el slider `Velocidad (px/s)`.
4. **Cambiar el texto**: entra a la pre-comp `Ticker_Inner` y edita la capa de texto directamente.