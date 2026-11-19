let bActual = null;
let cActual = null;
let ggbApplet = null;

// Inicializar el visor visual de GeoGebra Clásico al cargar la página
window.addEventListener("load", function () {
    const params = {
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
    const applet = new GGBApplet(params, true);
    applet.inject("ggb-element");
});

function generar() {
    let b = Math.floor(Math.random() * 21) - 3;
    let esLineal = Math.random() < 0.5;
    let c = 0;

    if (!esLineal) {
        do {
            c = Math.floor(Math.random() * 21) - 3;
        } while (c === 0);
    }

    bActual = b;
    cActual = c;

    actualizarInterfaz(b, c);
    document.getElementById("btnDescargar").disabled = false;

    // Graficar la función en el visor visual de GeoGebra
    if (ggbApplet) {
        ggbApplet.reset();
        const expresion = c === 0 ? `f(x) = ${b}*x` : `f(x) = ${b}*x + (${c})`;
        ggbApplet.evalCommand(expresion);
    }
}

// Actualiza coeficientes, resultado y cajas LINEAL / AFÍN
function actualizarInterfaz(b, c) {
    document.getElementById("valorB").innerText = b;
    document.getElementById("valorC").innerText = c;

    if (c === 0) {
        document.getElementById("resultado").innerText = "Funcion Lineal";

        document.getElementById("lineal").innerHTML =
            "f(x) = " + b + "x" +
            "<p>Pasa por el origen (0,0).</p>" +
            "<p>Pendiente: " + b + "</p>" +
            "<p>" + (b > 0 ? "Es creciente" : b < 0 ? "Es decreciente" : "Es constante") + "</p>";

        document.getElementById("afin").innerHTML =
            "No corresponde a una funcion afin.";
    } else {
        document.getElementById("resultado").innerText = "Funcion Afin";

        const signoC = c > 0 ? "+ " + c : "- " + Math.abs(c);

        document.getElementById("afin").innerHTML =
            "f(x) = " + b + "x " + signoC +
            "<p>No pasa por el origen.</p>" +
            "<p>Corta el eje Y en (0," + c + ").</p>" +
            "<p>Pendiente: " + b + "</p>" +
            "<p>" + (b > 0 ? "Es creciente" : b < 0 ? "Es decreciente" : "Es constante") + "</p>" +
            "<p>Traslacion vertical de " + c + " unidades.</p>";

        document.getElementById("lineal").innerHTML =
            "No corresponde a una funcion lineal.";
    }
}

// Descargar la construcción actual del visor como archivo .ggb
async function descargarGGB() {
    if (bActual === null || cActual === null) return;

    if (ggbApplet && typeof ggbApplet.getBase64 === "function") {
        ggbApplet.getBase64(function (base64) {
            const enlace = document.createElement("a");
            enlace.href = "data:application/vnd.geogebra.file;base64," + base64;
            enlace.download = `funcion_b${bActual}_c${cActual}.ggb`;
            enlace.click();
        });
    }
}

// Subir archivo .ggb externo, cargarlo en el visor y actualizar las cajas de esquema
document.getElementById("archivo").addEventListener("change", function () {
    let archivo = this.files[0];

    if (archivo && archivo.name.endsWith(".ggb")) {
        document.getElementById("nombreArchivo").innerText =
            "Archivo seleccionado: " + archivo.name;

        const reader = new FileReader();

        reader.onload = async function (e) {
            const arrayBuffer = e.target.result;

            // 1. Cargar el archivo en el visor visual de GeoGebra
            const bytes = new Uint8Array(arrayBuffer);
            let binary = "";
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const base64 = btoa(binary);

            if (ggbApplet) {
                ggbApplet.setBase64(base64, function () {
                    analizarDesdeApplet();
                });
            }

            // 2. Leer el XML interno del .ggb para clasificar en las cajas
            try {
                const zip = await JSZip.loadAsync(arrayBuffer);
                const xmlFile = zip.file("geogebra.xml");
                if (xmlFile) {
                    const xmlText = await xmlFile.async("string");
                    analizarFuncionDesdeXML(xmlText);
                }
            } catch (err) {
                console.error("Error al leer el .ggb:", err);
            }
        };

        reader.readAsArrayBuffer(archivo);

    } else if (archivo) {
        document.getElementById("nombreArchivo").innerText =
            "Selecciona un archivo .ggb valido.";
    }
});

// Extrae los coeficientes b y c desde una expresión algebraica
function parsearExpresionLineal(texto) {
    if (!texto) return null;

    let limpia = texto
        .replace(/\s+/g, "")
        .replace(/^[a-zA-Z0-9_]+\(x\)=|^y=/i, "")
        .replace(/\+\((-?\d+\.?\d*)\)/g, "+$1")
        .replace(/\+-/g, "-")
        .replace(/--/g, "+")
        .replace(/\*/g, "");

    const matchConX = limpia.match(/^([+-]?\d*\.?\d*)x([+-]\d+\.?\d*)?$/i);
    if (matchConX) {
        let bStr = matchConX[1];
        let cStr = matchConX[2];

        let b = (bStr === "" || bStr === "+") ? 1 : (bStr === "-") ? -1 : parseFloat(bStr);
        let c = cStr ? parseFloat(cStr) : 0;

        if (!isNaN(b) && !isNaN(c)) {
            return { b, c };
        }
    }

    const matchConstante = limpia.match(/^([+-]?\d+\.?\d*)$/);
    if (matchConstante) {
        let c = parseFloat(matchConstante[1]);
        if (!isNaN(c)) {
            return { b: 0, c };
        }
    }

    return null;
}

// Analiza el XML del archivo .ggb subido
function analizarFuncionDesdeXML(xmlText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

    const expresiones = xmlDoc.getElementsByTagName("expression");
    for (let i = 0; i < expresiones.length; i++) {
        const exp = expresiones[i].getAttribute("exp");
        const resultado = parsearExpresionLineal(exp);
        if (resultado) {
            aplicarResultadoDetectado(resultado.b, resultado.c);
            return true;
        }
    }

    const comandos = xmlDoc.getElementsByTagName("command");
    for (let i = 0; i < comandos.length; i++) {
        const input = comandos[i].getElementsByTagName("input")[0];
        if (input) {
            const a0 = input.getAttribute("a0");
            const resultado = parsearExpresionLineal(a0);
            if (resultado) {
                aplicarResultadoDetectado(resultado.b, resultado.c);
                return true;
            }
        }
    }

    return false;
}

// Consulta los objetos cargados en el visor como respaldo
function analizarDesdeApplet() {
    if (!ggbApplet) return;
    const total = ggbApplet.getObjectNumber();

    for (let i = 0; i < total; i++) {
        const nombre = ggbApplet.getObjectName(i);
        const tipo = ggbApplet.getObjectType(nombre);

        if (tipo === "function" || tipo === "line") {
            const definicion = ggbApplet.getDefinitionString(nombre) || ggbApplet.getValueString(nombre);
            const resultado = parsearExpresionLineal(definicion);
            if (resultado) {
                aplicarResultadoDetectado(resultado.b, resultado.c);
                return;
            }
        }
    }
}

function aplicarResultadoDetectado(b, c) {
    bActual = b;
    cActual = c;
    actualizarInterfaz(b, c);
    document.getElementById("btnDescargar").disabled = false;
}