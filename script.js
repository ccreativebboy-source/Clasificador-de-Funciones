let bActual = null;
let cActual = null;

function generar() {
    let b = Math.floor(Math.random() * 21) - 10;
    let esLineal = Math.random() < 0.5;
    let c = 0;

    if (!esLineal) {
        do {
            c = Math.floor(Math.random() * 21) - 10;
        } while (c === 0);
    }

    bActual = b;
    cActual = c;

    actualizarInterfaz(b, c);
    document.getElementById("btnDescargar").disabled = false;
}

// Pinta los resultados directamente en los coeficientes y en las cajas de esquema
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

// Genera y descarga un archivo .ggb válido para abrir en GeoGebra Clásico
async function descargarGGB() {
    if (bActual === null || cActual === null) return;

    const zip = new JSZip();
    const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<geogebra format="5.0" version="5.0.0.0" app="classic" platform="w">
<construction title="Funcion" author="" date="">
<expression label="f" exp="f(x) = ${bActual} * x + ${cActual}" type="function"/>
<element type="function" label="f">
    <show object="true" label="true"/>
    <objColor r="0" g="0" b="255" alpha="0"/>
    <layer val="0"/>
    <lineStyle thickness="5" type="0"/>
</element>
</construction>
</geogebra>`;

    zip.file("geogebra.xml", xmlContent);
    const blob = await zip.generateAsync({ type: "blob" });

    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(blob);
    enlace.download = `funcion_b${bActual}_c${cActual}.ggb`;
    enlace.click();
}

// Lee un archivo .ggb subido y actualiza automáticamente los resultados en pantalla
document.getElementById("archivo").addEventListener("change", function () {
    let archivo = this.files[0];

    if (archivo && archivo.name.endsWith(".ggb")) {
        document.getElementById("nombreArchivo").innerText =
            "Archivo seleccionado: " + archivo.name;

        const reader = new FileReader();

        reader.onload = async function (e) {
            const arrayBuffer = e.target.result;

            try {
                const zip = await JSZip.loadAsync(arrayBuffer);
                const xmlFile = zip.file("geogebra.xml");
                if (xmlFile) {
                    const xmlText = await xmlFile.async("string");
                    analizarFuncionDesdeXML(xmlText);
                } else {
                    alert("El archivo .ggb seleccionado no contiene un formato válido.");
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

// Interpreta expresiones algebraicas para extraer 'b' y 'c'
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

    // Buscar en expresiones
    const expresiones = xmlDoc.getElementsByTagName("expression");
    for (let i = 0; i < expresiones.length; i++) {
        const exp = expresiones[i].getAttribute("exp");
        const resultado = parsearExpresionLineal(exp);
        if (resultado) {
            aplicarResultadoDetectado(resultado.b, resultado.c);
            return true;
        }
    }

    // Buscar en comandos
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

    alert("No se encontró una función lineal o afín identificable en el archivo.");
    return false;
}

function aplicarResultadoDetectado(b, c) {
    bActual = b;
    cActual = c;
    actualizarInterfaz(b, c);
    document.getElementById("btnDescargar").disabled = false;
}