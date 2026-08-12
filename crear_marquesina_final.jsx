/**
 * ============================================================
 * MARQUESINA D1 - Sistema de Pre-Composición + Máscara Fija
 * ============================================================
 * 
 * Arquitectura:
 *   [Comp Principal]
 *     └── Capa: "Ticker_Precomp" (con máscara fija de 659x64)
 *           └── [Pre-Comp: "Ticker_Inner"] (muy ancha: 4000px)
 *                 └── Capa de Texto moviéndose en X
 * 
 * De esta manera:
 *   - La máscara es fija (no se mueve con el texto)
 *   - El texto se desplaza indefinidamente dentro de ella
 *   - Puedes mover/escalar la capa en la comp principal libremente
 * ============================================================
 */

// ----------------------------------------------------------------
// FUNCIÓN: Diálogo para pedir el texto de la marquesina
// Devuelve el texto ingresado, o null si el usuario cancela.
// ----------------------------------------------------------------
function pedirTextoMarquesina() {
    var dlg = new Window("dialog", "Texto de la Marquesina");
    dlg.orientation = "column";
    dlg.alignChildren = "fill";

    // Instrucciones
    var grpInstr = dlg.add("group");
    grpInstr.orientation = "row";
    grpInstr.add("statictext", undefined, "Escribe el texto que quieres mostrar en la marquesina:");

    // Campo de texto (multilínea)
    var txtInput = dlg.add("edittext", undefined, "D1 • Moda • Calzado • Hogar • Belleza • Vehículos • Servicios");
    txtInput.preferredSize = [420, 60];
    txtInput.helpTip = "Escribe aquí el texto de la marquesina";

    // Botones
    var grpBtns = dlg.add("group");
    grpBtns.alignment = "right";
    var btnListo = grpBtns.add("button", undefined, "Listo");
    var btnCancelar = grpBtns.add("button", undefined, "Cancelar");

    // Comportamiento de los botones
    btnListo.onClick = function() {
        dlg.close(1); // Código 1 = Listo
    };
    btnCancelar.onClick = function() {
        dlg.close(0); // Código 0 = Cancelar
    };

    // Mostrar el diálogo (modal)
    var resultado = dlg.show();

    if (resultado === 1) {
        return txtInput.text; // Devuelve el texto ingresado
    } else {
        return null; // Cancelado
    }
}

(function crearMarquesinaProfesional() {
    app.beginUndoGroup("Marquesina D1 Profesional");

    // ----------------------------------------------------------------
    // PARÁMETROS CONFIGURABLES (editar estos valores fácilmente)
    // ----------------------------------------------------------------
    var MASK_W     = 659;   // Ancho visible de la marquesina en px
    var MASK_H     = 64;    // Alto visible de la marquesina en px
    var FONT_SIZE  = 36;    // Tamaño de fuente en px
    var FONT_COLOR = [0.93, 0.11, 0.14]; // Rojo D1
    var VELOCIDAD  = 180;   // Velocidad en px/segundo
    var INNER_W    = 4000;  // Ancho de la pre-comp interna (debe ser > ancho total del texto)
    var FPS        = 30;
    var DURACION   = 60;    // Segundos de duración

    var SEPARADOR  = "  •  ";

    // ----------------------------------------------------------------
    // PEDIR EL TEXTO AL USUARIO ANTES DE EJECUTAR
    // ----------------------------------------------------------------
    var TEXTO = pedirTextoMarquesina();
    if (TEXTO === null) {
        // El usuario canceló → salir sin hacer nada
        app.endUndoGroup();
        return;
    }
    if (TEXTO === "") {
        // Texto vacío → usar el texto por defecto
        TEXTO = "D1 • Moda • Calzado • Hogar • Belleza • Vehículos • Servicios";
    }

    // ----------------------------------------------------------------
    // VERIFICAR QUE HAY UN PROYECTO ABIERTO
    // ----------------------------------------------------------------
    if (!app.project) app.newProject();

    var mainComp = app.project.activeItem;
    if (!(mainComp instanceof CompItem)) {
        alert("Por favor, abre o selecciona en el panel una composición principal primero,\nluego vuelve a ejecutar el script.");
        app.endUndoGroup();
        return;
    }

    // ----------------------------------------------------------------
    // 1. CREAR LA PRE-COMPOSICIÓN INTERNA (Ticker_Inner)
    //    Esta es la "cinta transportadora" del texto. Es muy ancha.
    // ----------------------------------------------------------------
    var innerComp = app.project.items.addComp(
        "Ticker_Inner",
        INNER_W, // Muy ancha para que quepa el texto moviendose
        MASK_H,  // Misma altura que la máscara
        1.0,
        DURACION,
        FPS
    );

    // Texto triplicado para asegurar bucle sin huecos
    var fullText = TEXTO + SEPARADOR + TEXTO + SEPARADOR + TEXTO + SEPARADOR;

    // Añadir capa de texto a la pre-comp interna
    var textLayer = innerComp.layers.addText(fullText);
    textLayer.name = "Texto_Ticker";

    // Aplicar estilo de texto
    var srcText = textLayer.property("Source Text");
    var doc = srcText.value;
    doc.fontSize = FONT_SIZE;
    doc.fillColor = FONT_COLOR;
    try { doc.font = "Montserrat-Black"; } catch(e) {}
    srcText.setValue(doc);

    // Medir el texto para centrado vertical real
    var tRect = textLayer.sourceRectAtTime(0, false);
    var anchorY = (tRect.height === 0) ? 0 : tRect.top + (tRect.height / 2);
    textLayer.property("Anchor Point").setValue([0, anchorY, 0]);

    // Posición inicial: comenzar desde el borde derecho de la máscara
    // El texto empieza en X = MASK_W (borde derecho) y se mueve hacia la izquierda
    textLayer.property("Position").setValue([MASK_W, MASK_H / 2, 0]);

    // Añadir slider de velocidad AL TEXTO en la pre-comp
    var sliderVel = textLayer.Effects.addProperty("ADBE Slider Control");
    sliderVel.name = "Velocidad (px/s)";
    sliderVel.property(1).setValue(VELOCIDAD);

    // ----------------------------------------------------------------
    // EXPRESIÓN DE MOVIMIENTO: mueve el texto de derecha a izquierda.
    // - value[0] es la posición X inicial (= MASK_W, borde derecho)
    // - Se resta la distancia recorrida en el tiempo
    // - El módulo (%) hace que se reinicie cuando termine UN bloque
    // ----------------------------------------------------------------
    var totalTextW = INNER_W; // Usamos el ancho completo de la pre-comp
    var expr =
        "// ---- Marquesina D1 - Script de Movimiento ----\n" +
        "var spd = effect('Velocidad (px/s)')(1);\n" +  
        "var totalTxtW = sourceRectAtTime().width;\n" +
        "var blockW = totalTxtW / 3;\n" +        // 1 bloque = 1/3 del texto total (triplicado)
        "var startX = " + MASK_W + ";\n" +       // Empieza en el borde derecho de la máscara
        "var moved = (time * spd) % blockW;\n" + // Avance en módulo de 1 bloque
        "[startX - moved, value[1]];";

    textLayer.property("Position").expression = expr;

    // Fondo transparente (sin sólido) para que la pre-comp sea solo el texto
    innerComp.bgColor = [0, 0, 0]; // Negro dentro de la pre-comp (se verá solo dentro de la máscara)

    // ----------------------------------------------------------------
    // 2. AÑADIR LA PRE-COMP A LA COMPOSICIÓN PRINCIPAL
    // ----------------------------------------------------------------
    var tickerLayer = mainComp.layers.add(innerComp);
    tickerLayer.name = "Ticker_D1 ← Mover aquí";

    // Posicionar la capa al centro de la comp principal como punto de partida
    var cx = mainComp.width  / 2;
    var cy = mainComp.height / 2;

    // El anchor point de la capa de pre-comp debe ser la esquina superior izquierda
    // para que la máscara se defina fácilmente en coordenadas locales
    tickerLayer.property("Anchor Point").setValue([0, 0, 0]);
    tickerLayer.property("Position").setValue([cx - MASK_W / 2, cy - MASK_H / 2, 0]);

    // ----------------------------------------------------------------
    // 3. AÑADIR MÁSCARA RECTANGULAR FIJA A LA CAPA DE PRE-COMP
    //    Esta máscara recorta la pre-comp a exactamente MASK_W x MASK_H
    //    y NUNCA se mueve (es parte de la capa, no del contenido).
    // ----------------------------------------------------------------
    var mask = tickerLayer.Masks.addProperty("Mask");
    mask.name = "Ventana_Marquesina";
    mask.maskMode = MaskMode.ADD;
    mask.maskFeather = [0, 0]; // Sin difuminado (bordes duros)

    // Definir el rectángulo de la máscara en coordenadas de CAPA LOCAL
    // (0,0) → esquina superior izquierda del rectángulo
    var shape = new Shape();
    shape.vertices = [
        [0,      0     ],
        [MASK_W, 0     ],
        [MASK_W, MASK_H],
        [0,      MASK_H]
    ];
    shape.inTangents  = [[0,0],[0,0],[0,0],[0,0]];
    shape.outTangents = [[0,0],[0,0],[0,0],[0,0]];
    shape.closed = true;

    mask.property("maskShape").setValue(shape);

    // ----------------------------------------------------------------
    // 4. AÑADIR CONTROL DE TAMAÑO A LA MÁSCARA POR EXPRESIÓN
    //    Slider "Ancho Máscara" y "Alto Máscara" para ajustar sin abrir
    //    el path manualmente.
    // ----------------------------------------------------------------
    var sliderW = tickerLayer.Effects.addProperty("ADBE Slider Control");
    sliderW.name = "Ancho Mascara";
    sliderW.property(1).setValue(MASK_W);

    var sliderH = tickerLayer.Effects.addProperty("ADBE Slider Control");
    sliderH.name = "Alto Mascara";
    sliderH.property(1).setValue(MASK_H);

    // Expresión en maskShape para que responda a los sliders
    var maskExpr =
        "var w = effect('Ancho Mascara')(1);\n" +
        "var h = effect('Alto Mascara')(1);\n" +
        "var s = new Shape();\n" +
        "s.vertices    = [[0,0],[w,0],[w,h],[0,h]];\n" +
        "s.inTangents  = [[0,0],[0,0],[0,0],[0,0]];\n" +
        "s.outTangents = [[0,0],[0,0],[0,0],[0,0]];\n" +
        "s.closed = true;\n" +
        "s;";

    mask.property("maskShape").expression = maskExpr;

    // ----------------------------------------------------------------
    // LISTO
    // ----------------------------------------------------------------
    app.endUndoGroup();

    alert(
        "✅ ¡Marquesina Profesional Creada!\n\n" +
        "Capas creadas:\n" +
        "  • Pre-comp 'Ticker_Inner' → Contiene el texto en movimiento.\n" +
        "  • Capa 'Ticker_D1' en tu comp → Tiene la máscara fija.\n\n" +
        "Para ajustar:\n" +
        "  1. Selecciona la capa 'Ticker_D1 ← Mover aquí'.\n" +
        "  2. En Efectos > 'Ancho Mascara' y 'Alto Mascara' cambia las dimensiones.\n" +
        "  3. Mueve la capa a donde quieras en tu composición.\n" +
        "  4. Para cambiar velocidad: entra a la pre-comp 'Ticker_Inner',\n" +
        "     selecciona la capa de texto y cambia el slider 'Velocidad (px/s)'."
    );

})();
