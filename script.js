// Variables globales para guardar los coeficientes actuales (b y c) y la instancia de la API de GeoGebra
let bActual = null;
let cActual = null;
let ggb = null;

// 1.- Carga el visor de GeoGebra Clásico cuando termina de cargar la ventana
window.addEventListener("load", function () {
    new GGBApplet({
        appName: "classic", // Usa la versión clásica de GeoGebra
        width: 625,
        height: 380,
        language: "es",
        appletOnLoad: function (api) {
            ggb = api;  // Guarda el objeto API cuando GeoGebra termina de inicializar
        }
    }, true).inject("ggb-element"); // Inserta el visor dentro del elemento con id "ggb-element"
});

// 2.- Genera valores aleatorios enteros para b y c entre -3 y 3
function generar() {
    let b, c;

    // 50% de probabilidad de que salgan b = 0 y c = 0 ("Sin función")
    if (Math.random() < 0.50) {
        b = 0;
        c = 0;
    } else {
        b = Math.floor(Math.random() * 7) - 3;
        c = Math.floor(Math.random() * 7) - 3;
    }

    mostrar(b, c);
    graficar(b, c);
}

// Formatea un término o expresión algebraica de forma legible para mostrar en pantalla
function formatearExpresion(b, c) {
    if (b === 0 && c === 0) return "f(x) = 0";
    if (b === 0) return `f(x) = ${c}`;
    if (c === 0) return `f(x) = ${b}x`;
    const signo = c > 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
    return `f(x) = ${b}x ${signo}`;
}

// 3.- Muestra los coeficientes, clasifica el resultado y muestra cada función en su respectivo bloque
function mostrar(b, c) {
    // Guarda los coeficientes actuales
    bActual = b;
    cActual = c;

    // Muestra b y c en pantalla y habilita el botón de descarga
    document.getElementById("valorB").innerText = b;
    document.getElementById("valorC").innerText = c;
    document.getElementById("btnDescargar").disabled = false;

    // Referencias a los elementos del DOM
    const res = document.getElementById("resultado");
    const lineal = document.getElementById("lineal");
    const afin = document.getElementById("afin");
    const constante = document.getElementById("constante");
    const sinFuncion = document.getElementById("sinFuncion");

    // Muestra siempre la forma/expresión de cada función aunque no sea la activa en este turno
    lineal.innerHTML = `<p><b>Función Lineal:</b> f(x) = mx <i>(forma general: ${b !== 0 ? `f(x) = ${b}x` : "requiere b ≠ 0 y c = 0"})</i></p><p>No corresponde en este caso.</p>`;
    afin.innerHTML = `<p><b>Función Afín:</b> f(x) = mx + n <i>(forma general: ${b !== 0 && c !== 0 ? formatearExpresion(b, c) : "requiere b ≠ 0 y c ≠ 0"})</i></p><p>No corresponde en este caso.</p>`;
    constante.innerHTML = `<p><b>Función Constante:</b> f(x) = k <i>(forma general: ${b === 0 && c !== 0 ? `f(x) = ${c}` : "requiere b = 0 y c ≠ 0"})</i></p><p>No corresponde en este caso.</p>`;
    sinFuncion.innerHTML = `<p><b>Sin función:</b> f(x) = 0 <i>(ocurre cuando b = 0 y c = 0)</i></p><p>No aplica en este caso.</p>`;

    // Caso 1: b = 0 y c = 0 "Sin función"
    if (b === 0 && c === 0) {
        res.innerText = "Sin función";
        sinFuncion.innerHTML = `
            <p><b>f(x) = 0</b> (Activa)</p>
            <p>No hay función cuando b = 0 y c = 0.</p>
        `;
    }
    // Caso 2: b = 0 y c != 0 "Función constante"
    else if (b === 0) {
        res.innerText = "Función Constante";
        constante.innerHTML = `
            <p><b>f(x) = ${c}</b> (Activa)</p>
            <p>Recta horizontal (pendiente 0).</p>
            <p>Corta el eje Y en (0, ${c}).</p>
        `;
    }
    // Caso 3: c = 0 y b != 0 "Función lineal"
    else if (c === 0) {
        res.innerText = "Función Lineal";
        lineal.innerHTML = `
            <p><b>f(x) = ${b}x</b> (Activa)</p>
            <p>Pasa por el origen (0, 0).</p>
            <p>Pendiente: ${b} (${b > 0 ? "creciente" : "decreciente"}).</p>
        `;
    }
    // Caso 4: b != 0 y c != 0 "Función afín"
    else {
        const signo = c > 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
        res.innerText = "Función Afín";
        afin.innerHTML = `
            <p><b>f(x) = ${b}x ${signo}</b> (Activa)</p>
            <p>No pasa por el origen (0, 0).</p>
            <p>Corta el eje Y en (0, ${c}).</p>
            <p>Pendiente: ${b} (${b > 0 ? "creciente" : "decreciente"}).</p>
            <p>Traslación vertical de ${c} unidades.</p>
        `;
    }
}

// Función auxiliar para probar directamente el caso "Sin función" (b = 0, c = 0)
function probarSinFuncion() {
    mostrar(0, 0);
    graficar(0, 0);
}

// 4.- Dibuja la función en el visor de GeoGebra según los valores de b y c
function graficar(b, c) {
    // Evita errores si la API de GeoGebra aún no ha terminado de cargar
    if (!ggb) return;

    // Limpia el gráfico anterior antes de dibujar uno nuevo
    ggb.reset();

    // Evalúa el comando matemático correspondiente en GeoGebra
    if (b === 0 && c === 0) {
        ggb.evalCommand("0");
    } else if (b === 0) {
        ggb.evalCommand(`f(x) = ${c}`);
    } else if (c === 0) {
        ggb.evalCommand(`f(x) = ${b}*x`);
    } else {
        ggb.evalCommand(`f(x) = ${b}*x + (${c})`);
    }
}

// 6.- Descarga el archivo .ggb generado desde el visor actual de GeoGebra
function descargarGGB() {
    // Verifica que existan valores generados y que GeoGebra esté disponible
    if (bActual === null || cActual === null || !ggb) return;

    // Solicita el archivo en formato Base64 y dispara su descarga
    ggb.getBase64(function (base64) {
        const a = document.createElement("a");
        a.href = "data:application/vnd.geogebra.file;base64," + base64;
        a.download = `funcion_b${bActual}_c${cActual}.ggb`;
        a.click();
    });
}

// 7.- Sube un archivo .ggb, lo muestra en GeoGebra y extrae b y c desde su XML interno
document.getElementById("archivo").addEventListener("change", async function () {
    const file = this.files[0];
    const nombre = document.getElementById("nombreArchivo");
    if (!file) return;

    // Valida que el archivo tenga extensión .ggb
    if (!file.name.endsWith(".ggb")) {
        nombre.innerText = "Selecciona un archivo .ggb válido.";
        return;
    }

    nombre.innerText = "Archivo seleccionado: " + file.name;

    // Lee el contenido binario del archivo .ggb
    const buffer = await file.arrayBuffer();

    // Convierte los bytes a Base64 para cargar el archivo en el visor de GeoGebra
    let bin = "";
    new Uint8Array(buffer).forEach(byte => bin += String.fromCharCode(byte));
    if (ggb) ggb.setBase64(btoa(bin));

    // Descomprime el .ggb (es un ZIP) y lee "geogebra.xml" para extraer b y c
    try {
        const zip = await JSZip.loadAsync(buffer);
        const xml = await zip.file("geogebra.xml").async("string");
        const doc = new DOMParser().parseFromString(xml, "text/xml");

        // Busca etiquetas <expression> con la ecuación de la recta o constante
        for (const nodo of doc.getElementsByTagName("expression")) {
            const limpia = (nodo.getAttribute("exp") || "")
                .replace(/\s+/g, "")
                .replace(/^[a-zA-Z0-9_]+\(x\)=|^y=/i, "")
                .replace(/\*/g, "");

            // Coincide con expresiones que contienen "x" (ej: 2x+3, -x, x-1)
            const conX = limpia.match(/^([+-]?\d*\.?\d*)x([+-]\d+\.?\d*)?$/i);
            if (conX) {
                const b = conX[1] === "" || conX[1] === "+" ? 1 : conX[1] === "-" ? -1 : Number(conX[1]);
                const c = conX[2] ? Number(conX[2]) : 0;

                if (!Number.isNaN(b) && !Number.isNaN(c)) {
                    mostrar(b, c);
                    break;
                }
            }

            // Coincide con expresiones numéricas sin "x" (función constante: b = 0)
            const soloNum = limpia.match(/^([+-]?\d+\.?\d*)$/);
            if (soloNum && !Number.isNaN(Number(soloNum[1]))) {
                mostrar(0, Number(soloNum[1]));
                break;
            }
        }
    } catch (err) {
        console.error("Error al leer el archivo .ggb:", err);
        nombre.innerText = "No se pudo leer la expresión interna del archivo .ggb.";
    }
});