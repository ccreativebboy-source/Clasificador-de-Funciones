let bActual = null;
let cActual = null;
let ggb = null;

// Carga el visor de GeoGebra Clásico
window.addEventListener("load", function () {
    new GGBApplet({
        appName: "classic",
        width: 600,
        height: 380,
        showToolBar: true,
        showAlgebraInput: true,
        showMenuBar: false,
        language: "es",
        appletOnLoad: function (api) { ggb = api; }
    }, true).inject("ggb-element");
});

// Genera b y c aleatorios entre -3 y 3
function generar() {
    const b = Math.floor(Math.random() * 7) - 3;
    const c = Math.floor(Math.random() * 7) - 3;
    mostrar(b, c);
    graficar(b, c);
}

// Muestra coeficientes y clasifica en las 4 cajas
function mostrar(b, c) {
    bActual = b;
    cActual = c;

    document.getElementById("valorB").innerText = b;
    document.getElementById("valorC").innerText = c;
    document.getElementById("btnDescargar").disabled = false;

    const res = document.getElementById("resultado");
    const lineal = document.getElementById("lineal");
    const afin = document.getElementById("afin");
    const constante = document.getElementById("constante");
    const sinFuncion = document.getElementById("sinFuncion");

    lineal.innerHTML = "No corresponde a una función lineal.";
    afin.innerHTML = "No corresponde a una función afín.";
    constante.innerHTML = "No corresponde a una función constante.";
    sinFuncion.innerHTML = "No aplica (hay función).";

    if (b === 0 && c === 0) {
        res.innerText = "Sin función";
        sinFuncion.innerHTML = "<p><b>f(x) = 0</b></p><p>No hay función cuando b = 0 y c = 0.</p>";
    } else if (b === 0) {
        res.innerText = "Función Constante";
        constante.innerHTML = `<p><b>f(x) = ${c}</b></p><p>Recta horizontal (pendiente 0).</p><p>Corta el eje Y en (0, ${c}).</p>`;
    } else if (c === 0) {
        res.innerText = "Función Lineal";
        lineal.innerHTML = `<p><b>f(x) = ${b}x</b></p><p>Pasa por el origen (0, 0).</p><p>Pendiente: ${b} (${b > 0 ? "creciente" : "decreciente"}).</p>`;
    } else {
        const signo = c > 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
        res.innerText = "Función Afín";
        afin.innerHTML = `<p><b>f(x) = ${b}x ${signo}</b></p><p>No pasa por el origen (0, 0).</p><p>Corta el eje Y en (0, ${c}).</p><p>Pendiente: ${b} (${b > 0 ? "creciente" : "decreciente"}).</p><p>Traslación vertical de ${c} unidades.</p>`;
    }
}

// Dibuja en GeoGebra
function graficar(b, c) {
    if (!ggb) return;
    ggb.reset();
    if (b === 0 && c === 0) ggb.evalCommand("0");
    else if (b === 0) ggb.evalCommand(`f(x) = ${c}`);
    else if (c === 0) ggb.evalCommand(`f(x) = ${b}*x`);
    else ggb.evalCommand(`f(x) = ${b}*x + (${c})`);
}

// Descarga el .ggb actual
function descargarGGB() {
    if (bActual === null || cActual === null || !ggb) return;
    ggb.getBase64(function (base64) {
        const a = document.createElement("a");
        a.href = "data:application/vnd.geogebra.file;base64," + base64;
        a.download = `funcion_b${bActual}_c${cActual}.ggb`;
        a.click();
    });
}

// Sube un .ggb, lo muestra y lee b y c
document.getElementById("archivo").addEventListener("change", async function () {
    const file = this.files[0];
    const nombre = document.getElementById("nombreArchivo");
    if (!file) return;

    if (!file.name.endsWith(".ggb")) {
        nombre.innerText = "Selecciona un archivo .ggb válido.";
        return;
    }

    nombre.innerText = "Archivo seleccionado: " + file.name;
    const buffer = await file.arrayBuffer();

    // Cargar en el visor
    let bin = "";
    new Uint8Array(buffer).forEach(byte => bin += String.fromCharCode(byte));
    if (ggb) ggb.setBase64(btoa(bin));

    // Leer el XML interno del .ggb
    try {
        const zip = await JSZip.loadAsync(buffer);
        const xml = await zip.file("geogebra.xml").async("string");
        const doc = new DOMParser().parseFromString(xml, "text/xml");

        for (const nodo of doc.getElementsByTagName("expression")) {
            const limpia = (nodo.getAttribute("exp") || "")
                .replace(/\s+/g, "")
                .replace(/^[a-zA-Z0-9_]+\(x\)=|^y=/i, "")
                .replace(/\*/g, "");

            const conX = limpia.match(/^([+-]?\d*\.?\d*)x([+-]\d+\.?\d*)?$/i);
            if (conX) {
                const b = conX[1] === "" || conX[1] === "+" ? 1 : conX[1] === "-" ? -1 : Number(conX[1]);
                const c = conX[2] ? Number(conX[2]) : 0;
                if (!Number.isNaN(b) && !Number.isNaN(c)) {
                    mostrar(b, c);
                    break;
                }
            }

            const soloNum = limpia.match(/^([+-]?\d+\.?\d*)$/);
            if (soloNum && !Number.isNaN(Number(soloNum[1]))) {
                mostrar(0, Number(soloNum[1]));
                break;
            }
        }
    } catch (err) {
        console.error(err);
    }
});
