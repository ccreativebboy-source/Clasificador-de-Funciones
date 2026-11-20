let bActual = null;
let cActual = null;
let ggbApplet = null;

// Inicia GeoGebra Clásico cuando carga la página
window.addEventListener("load", function () {
    const config = {
        appName: "classic",
        width: 600,
        height: 380,
        showToolBar: true,
        showAlgebraInput: true,
        showMenuBar: false,
        language: "es",
        appletOnLoad: function (api) {
            ggbApplet = api;
        }
    };

    const applet = new GGBApplet(config, true);
    applet.inject("ggb-element");
});

// Genera un número entero aleatorio entre min y max (ambos incluidos)
function numeroAleatorio(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Genera b y c entre -3 y 3, actualiza todo y grafica en GeoGebra
function generar() {
    const b = numeroAleatorio(-3, 3);
    const c = numeroAleatorio(-3, 3);

    aplicarValores(b, c);
    graficarEnGeoGebra(b, c);
}

// Guarda valores, habilita descarga y actualiza pantalla
function aplicarValores(b, c) {
    bActual = b;
    cActual = c;

    document.getElementById("valorB").innerText = b;
    document.getElementById("valorC").innerText = c;
    document.getElementById("btnDescargar").disabled = false;

    clasificarFuncion(b, c);
}

// Clasifica según las reglas de b y c
function clasificarFuncion(b, c) {
    const elResultado = document.getElementById("resultado");
    const elLineal = document.getElementById("lineal");
    const elAfin = document.getElementById("afin");
    const elConstante = document.getElementById("constante");
    const elSinFuncion = document.getElementById("sinFuncion");

    // Limpia todas las cajas antes de llenar la que corresponde
    elLineal.innerHTML = "No corresponde a una función lineal.";
    elAfin.innerHTML = "No corresponde a una función afín.";
    elConstante.innerHTML = "No corresponde a una función constante.";
    elSinFuncion.innerHTML = "No aplica (hay función).";

    // 1. Sin función: b = 0 y c = 0
    if (b === 0 && c === 0) {
        elResultado.innerText = "Sin función";
        elSinFuncion.innerHTML =
            "<p><b>f(x) = 0</b></p>" +
            "<p>Como b = 0 y c = 0, no representa una función lineal, afín ni constante.</p>";
        return;
    }

    // 2. Función constante: b = 0 y c != 0
    if (b === 0 && c !== 0) {
        elResultado.innerText = "Función Constante";
        elConstante.innerHTML =
            "<p><b>f(x) = " + c + "</b></p>" +
            "<p>Recta horizontal (pendiente = 0).</p>" +
            "<p>Corta el eje Y en (0, " + c + ").</p>";
        return;
    }

    // 3. Función lineal: b != 0 y c = 0
    if (b !== 0 && c === 0) {
        elResultado.innerText = "Función Lineal";
        elLineal.innerHTML =
            "<p><b>f(x) = " + b + "x</b></p>" +
            "<p>Pasa por el origen (0, 0).</p>" +
            "<p>Pendiente: " + b + " (" + (b > 0 ? "creciente" : "decreciente") + ").</p>";
        return;
    }

    // 4. Función afín: b != 0 y c != 0
    const signoC = c > 0 ? " + " + c : " - " + Math.abs(c);
    elResultado.innerText = "Función Afín";
    elAfin.innerHTML =
        "<p><b>f(x) = " + b + "x" + signoC + "</b></p>" +
        "<p>No pasa por el origen (0, 0).</p>" +
        "<p>Corta el eje Y en (0, " + c + ").</p>" +
        "<p>Pendiente: " + b + " (" + (b > 0 ? "creciente" : "decreciente") + ").</p>" +
        "<p>Traslación vertical de " + c + " unidades.</p>";
}

// Dibuja la expresión en el visor de GeoGebra
function graficarEnGeoGebra(b, c) {
    if (!ggbApplet) return;

    ggbApplet.reset();

    if (b === 0 && c === 0) {
        ggbApplet.evalCommand("0");
    } else if (b === 0) {
        ggbApplet.evalCommand("f(x) = " + c);
    } else if (c === 0) {
        ggbApplet.evalCommand("f(x) = " + b + "*x");
    } else {
        ggbApplet.evalCommand("f(x) = " + b + "*x + (" + c + ")");
    }
}

// Descarga el archivo .ggb actual
function descargarGGB() {
    if (bActual === null || cActual === null || !ggbApplet) return;

    if (typeof ggbApplet.getBase64 === "function") {
        ggbApplet.getBase64(function (base64) {
            const enlace = document.createElement("a");
            enlace.href = "data:application/vnd.geogebra.file;base64," + base64;
            enlace.download = "funcion_b" + bActual + "_c" + cActual + ".ggb";
            enlace.click();
        });
    }
}

// Sube un archivo .ggb, lo muestra en el visor y lee su expresión
document.getElementById("archivo").addEventListener("change", function () {
    const archivo = this.files[0];
    const textoNombre = document.getElementById("nombreArchivo");

    if (!archivo) return;

    if (!archivo.name.endsWith(".ggb")) {
        textoNombre.innerText = "Selecciona un archivo .ggb válido.";
        return;
    }

    textoNombre.innerText = "Archivo seleccionado: " + archivo.name;

    const lector = new FileReader();
    lector.onload = async function (evento) {
        const buffer = evento.target.result;

        // Cargar en GeoGebra
        const bytes = new Uint8Array(buffer);
        let binario = "";
        for (let i = 0; i < bytes.length; i++) {
            binario += String.fromCharCode(bytes[i]);
        }
        if (ggbApplet) {
            ggbApplet.setBase64(btoa(binario));
        }

        // Leer geogebra.xml dentro del .ggb para obtener b y c
        try {
            const zip = await JSZip.loadAsync(buffer);
            const xmlArchivo = zip.file("geogebra.xml");
            if (!xmlArchivo) return;

            const xmlTexto = await xmlArchivo.async("string");
            const coef = extraerCoeficientesDesdeXML(xmlTexto);
            if (coef) {
                aplicarValores(coef.b, coef.c);
            }
        } catch (error) {
            console.error("No se pudo leer el archivo .ggb:", error);
        }
    };

    lector.readAsArrayBuffer(archivo);
});

// Busca una expresión tipo "3x + 2", "5x" o "3" dentro del XML del .ggb
function extraerCoeficientesDesdeXML(xmlTexto) {
    const doc = new DOMParser().parseFromString(xmlTexto, "text/xml");
    const expresiones = doc.getElementsByTagName("expression");

    for (let i = 0; i < expresiones.length; i++) {
        const exp = expresiones[i].getAttribute("exp");
        if (!exp) continue;

        // Limpia espacios y partes como "f(x) =" o "y ="
        const limpia = exp
            .replace(/\s+/g, "")
            .replace(/^[a-zA-Z0-9_]+\(x\)=|^y=/i, "")
            .replace(/\*/g, "");

        // Caso con x: ej. 3x+2, -x-1, 5x
        const conX = limpia.match(/^([+-]?\d*\.?\d*)x([+-]\d+\.?\d*)?$/i);
        if (conX) {
            const bTexto = conX[1];
            const cTexto = conX[2];
            const b = bTexto === "" || bTexto === "+" ? 1 : bTexto === "-" ? -1 : Number(bTexto);
            const c = cTexto ? Number(cTexto) : 0;
            if (!Number.isNaN(b) && !Number.isNaN(c)) {
                return { b, c };
            }
        }

        // Caso sin x (constante): ej. 3, -2, 0
        const soloNumero = limpia.match(/^([+-]?\d+\.?\d*)$/);
        if (soloNumero) {
            const c = Number(soloNumero[1]);
            if (!Number.isNaN(c)) {
                return { b: 0, c };
            }
        }
    }

    return null;
}