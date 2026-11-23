// guardan el ultimo b y c generados o leidos para descargar el .ggb con ese nombre
let bActual = null;
let cActual = null;
// guarda la api de geogebra cuando termine de cargar el visor
let ggb = null;

// 1.- Carga el visor de GeoGebra Clásico
function iniciarGeoGebra() {
    // opciones del visor (tipo classic, tamano, idioma en espanol y callback al cargar)
    const parametros = {
        appName: "classic",
        width: 625,
        height: 380,
        language: "es",
        // cuando cargue geogebra guardamos la api aqui para poder usarla despues
        appletOnLoad: function (api) {
            ggb = api;
        }
    };

    // crea el applet y lo mete dentro del div "ggb-element" del html[cite: 1]
    const applet = new GGBApplet(parametros, true);
    applet.inject("ggb-element");
}

// 2.- Genera b y c valores aleatorios entre -3 y 3
function generar() {
    // Math.random() da entre 0 y 0.999..., por 7 da hasta 6.99..., floor deja 0..6, y -3 deja de -3 a 3
    const b = Math.floor(Math.random() * 7) - 3;
    const c = Math.floor(Math.random() * 7) - 3;
    // muestra los resultados y dibuja la funcion al tiro
    mostrar(b, c);
    graficar(b, c);
}

// 3.- Muestra coeficientes y clasifica en las 4 si son lineal, afin, constante, sin funcion
function mostrar(b, c) {
    // actualiza los valores guardados globalmente
    bActual = b;
    cActual = c;

    // pone los numeros en pantalla y activa el boton de descargar .ggb
    document.getElementById("valorB").innerText = b;
    document.getElementById("valorC").innerText = c;
    document.getElementById("btnDescargar").disabled = false;

    // toma los elementos del html donde ira el resumen y cada tipo de funcion
    const res = document.getElementById("resultado");
    const lineal = document.getElementById("lineal");
    const afin = document.getElementById("afin");
    const constante = document.getElementById("constante");
    const sinFuncion = document.getElementById("sinFuncion");

    // estos son los textos que se mostraran cuando se seleccionen de los coeficientes uno como principal
    // (ejemplo: si es una funcion lineal, las otras por descarte mostraran un texto que dira que no cataloga como otra funcion)
    lineal.innerHTML = "No corresponde a una función lineal.";
    afin.innerHTML = "No corresponde a una función afín.";
    constante.innerHTML = "No corresponde a una función constante.";
    sinFuncion.innerHTML = "No aplica (hay función).";

    if (b === 0 && c === 0) {
        // Si es sin funcion, se mostrara este texto en la caja "sinfuncion"
        res.innerText = "Sin función";
        sinFuncion.innerHTML = "<p><b>f(x) = 0</b></p><p>No hay función cuando b = 0 y c = 0.</p>";
    } else if (b === 0) {
        // Si no es asi el calculo entonces se dara como funcion constante, mostrando el texto en la caja de "funcion constante"
        res.innerText = "Función Constante";
        constante.innerHTML = "<p><b>f(x) = " + c + "</b></p><p>Recta horizontal (pendiente 0).</p><p>Corta el eje Y en (0, " + c + ").</p>";
    } else if (c === 0) {
        // si el coeficiente pasa por el origen 0,se mostrara este texto en su caja "funcion lineal"
        res.innerText = "Función Lineal";
        lineal.innerHTML = "<p><b>f(x) = " + b + "x</b></p><p>Pasa por el origen (0, 0).</p><p>Pendiente: " + b + " (" + (b > 0 ? "creciente" : "decreciente") + ").</p>";
    } else {
        // acomoda el signo de c para que no quede "+ -2", sino "- 2"
        const signo = c > 0 ? "+ " + c : "- " + Math.abs(c);
        // y por ultimo, si no pasa se le catalogara como afin, mostrando este texto en la caja "funcion afin"
        res.innerText = "Función Afín";
        afin.innerHTML = "<p><b>f(x) = " + b + "x " + signo + "</b></p><p>No pasa por el origen (0, 0).</p><p>Corta el eje Y en (0, " + c + ").</p><p>Pendiente: " + b + " (" + (b > 0 ? "creciente" : "decreciente") + ").</p><p>Traslación vertical de " + c + " unidades.</p>";
    }
}

// 4.- Dibujar la en GeoGebra
// esta al tener un numero random con las propiedades de b y c, aparte de identificar que funcion es, tambien se mostrara en el grafico visualmente de geogebra
function graficar(b, c) {
    // si todavia no carga geogebra, sale para no tirar error
    if (!ggb) return;
    // limpia el lienzo antes de dibujar la nueva recta
    ggb.reset();
    // manda el comando segun el caso de b y c
    if (b === 0 && c === 0) ggb.evalCommand("0");
    else if (b === 0) ggb.evalCommand("f(x) = " + c);
    else if (c === 0) ggb.evalCommand("f(x) = " + b + "*x");
    else ggb.evalCommand("f(x) = " + b + "*x + (" + c + ")");
}

// 5.- Descarga el .ggb de la pagina
function descargarGGB() {
    // evita descargar si aun no hay funcion generada o no esta listo geogebra
    if (bActual === null || cActual === null || !ggb) return;
    // pide el archivo en base64, crea un link invisible y fuerza la descarga con b y c en el nombre
    ggb.getBase64(function (base64) {
        const a = document.createElement("a");
        a.href = "data:application/vnd.geogebra.file;base64," + base64;
        a.download = "funcion_b" + bActual + "_c" + cActual + ".ggb";
        a.click();
    });
}

// limpia la expresion para sacar b y c sin enredarse con lo que haya antes del =
function extraerCoeficientesDesdeTexto(expresion) {
    // saca espacios en blanco para trabajar mas limpio
    let limpia = (expresion || "").split(" ").join("");
    // corta lo que va antes del = (ej: f(x)= o y=)
    const posIgual = limpia.indexOf("=");
    if (posIgual !== -1) {
        limpia = limpia.slice(posIgual + 1);
    }
    // quita los asteriscos de multiplicacion
    limpia = limpia.split("*").join("");
    // si quedo vacio, no sirve
    if (limpia === "") return null;
    // busca donde esta la x (sin importar mayuscula o minuscula)
    const posX = limpia.toLowerCase().indexOf("x");

    if (posX !== -1) {
        // separa lo que va antes de la x (b) y lo que va despues (c)
        const parteB = limpia.slice(0, posX);
        const parteC = limpia.slice(posX + 1);

        // ve cuanto vale b si no hay numero delante de la x
        let b = 1;
        if (parteB === "" || parteB === "+") b = 1;
        else if (parteB === "-") b = -1;
        else b = Number(parteB);

        // si no hay nada despues de la x entonces c es 0
        const c = parteC === "" ? 0 : Number(parteC);

        // valida que ambos sean numeros reales y los devuelve
        if (!Number.isNaN(b) && !Number.isNaN(c)) {
            return { b: b, c: c };
        }
        return null;
    }

    // si no tiene x es constante (b = 0)
    const num = Number(limpia);
    if (!Number.isNaN(num)) {
        return { b: 0, c: num };
    }

    return null;
}

// 6.- Sube un .ggb, lo muestra y lee b y c, incluyendo geogebra.
async function leerArchivoGGB(evento) {
    // obtiene el primer archivo elegido y el parrafo donde se muestra el nombre
    const file = evento.target.files.item(0);
    const nombre = document.getElementById("nombreArchivo");
    if (!file) return;

    // revisa que tenga extension .ggb
    if (!file.name.endsWith(".ggb")) {
        nombre.innerText = "Selecciona un archivo .ggb válido.";
        return;
    }

    // muestra el nombre del archivo y lee su contenido binario
    nombre.innerText = "Archivo seleccionado: " + file.name;
    const buffer = await file.arrayBuffer();

    // Cargar en el visual (convierte los bytes a base64 para pasarselos a geogebra)
    let bin = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) {
        bin += String.fromCharCode(bytes.at(i));
    }
    if (ggb) ggb.setBase64(btoa(bin));

    // Leer el XML interno del .ggb (por dentro es un zip)
    try {
        // abre el zip y saca el archivo geogebra.xml como texto
        const zip = await JSZip.loadAsync(buffer);
        const xml = await zip.file("geogebra.xml").async("string");
        // parsea el xml y busca todas las etiquetas <expression>
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        const nodos = doc.getElementsByTagName("expression");

        // revisa cada expresion hasta encontrar una que pueda convertir a b y c
        for (let i = 0; i < nodos.length; i++) {
            const nodo = nodos.item(i);
            const coef = extraerCoeficientesDesdeTexto(nodo.getAttribute("exp"));
            if (coef) {
                mostrar(coef.b, coef.c);
                break;
            }
        }
    } catch (err) {
        // si el archivo no tiene ese xml o falla al leer, muestra el error en consola
        console.error(err);
    }
}

// 7.- Espera a que cargue toda la pagina para armar todo sin errores
window.addEventListener("load", function () {
    // levanta el visor de geogebra cuando ya esta listo el html
    iniciarGeoGebra();
    // busca el input de subir archivo y le activa el lector cuando elijas un .ggb
    const inputArchivo = document.getElementById("archivo");
    if (inputArchivo) {
        inputArchivo.addEventListener("change", leerArchivoGGB);
    }
});