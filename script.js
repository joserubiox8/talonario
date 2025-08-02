class TalonarioRifa {
    constructor() {
        this.numeros = {};
        this.numerosSeleccionados = new Set();
        this.init();
    }

    init() {
        this.crearTalonario();
        this.setupEventListeners();
        this.cargarDatos();
    }

    crearTalonario() {
        const talonario = document.getElementById('talonario');

        for (let i = 0; i <= 99; i++) {
            const numeroElement = document.createElement('div');
            numeroElement.className = 'numero disponible';
            numeroElement.textContent = i.toString().padStart(2, '0');
            numeroElement.dataset.numero = i;

            numeroElement.addEventListener('click', () => this.seleccionarNumero(i));

            talonario.appendChild(numeroElement);

            // Inicializar estado del número
            this.numeros[i] = {
                estado: 'disponible',
                telefono: null
            };
        }
    }

    seleccionarNumero(numero) {
        const numeroElement = document.querySelector(`[data-numero="${numero}"]`);

        // No permitir seleccionar números ya asignados
        if (this.numeros[numero].estado === 'asignado') {
            return;
        }

        if (this.numerosSeleccionados.has(numero)) {
            // Deseleccionar
            this.numerosSeleccionados.delete(numero);
            numeroElement.classList.remove('seleccionado');
            numeroElement.classList.add('disponible');
        } else {
            // Seleccionar
            this.numerosSeleccionados.add(numero);
            numeroElement.classList.remove('disponible');
            numeroElement.classList.add('seleccionado');
        }

        this.actualizarBotonAsignar();
    }

    actualizarBotonAsignar() {
        const boton = document.getElementById('assignMultiple');
        const contador = document.getElementById('selectedCount');

        if (this.numerosSeleccionados.size > 0) {
            boton.style.display = 'block';
            contador.textContent = this.numerosSeleccionados.size;
        } else {
            boton.style.display = 'none';
        }
    }

    abrirModal() {
        if (this.numerosSeleccionados.size === 0) return;

        const modal = document.getElementById('modal');
        const selectedNumbers = document.getElementById('selectedNumbers');
        const phoneInput = document.getElementById('phoneInput');

        // Mostrar números seleccionados ordenados
        const numerosOrdenados = Array.from(this.numerosSeleccionados)
            .sort((a, b) => a - b)
            .map(n => n.toString().padStart(2, '0'));

        selectedNumbers.textContent = numerosOrdenados.join(', ');
        phoneInput.value = '';
        modal.style.display = 'block';

        // Focus en el input
        setTimeout(() => phoneInput.focus(), 100);
    }

    cerrarModal() {
        const modal = document.getElementById('modal');
        modal.style.display = 'none';
    }

    asignarNumeros() {
        const telefono = document.getElementById('phoneInput').value.trim();

        if (!telefono) {
            alert('Por favor ingresa un número de teléfono');
            return;
        }

        // Validar formato básico de teléfono
        if (!/^[\d\s\-\+\(\)]+$/.test(telefono)) {
            alert('Por favor ingresa un número de teléfono válido');
            return;
        }

        // Asignar todos los números seleccionados
        this.numerosSeleccionados.forEach(numero => {
            this.numeros[numero] = {
                estado: 'asignado',
                telefono: telefono
            };

            const numeroElement = document.querySelector(`[data-numero="${numero}"]`);
            numeroElement.classList.remove('seleccionado', 'disponible');
            numeroElement.classList.add('asignado');
            numeroElement.title = `Asignado a: ${telefono}`;
        });

        // Limpiar selección
        this.numerosSeleccionados.clear();
        this.actualizarBotonAsignar();
        this.cerrarModal();
        this.guardarDatos();

        // Mostrar confirmación
        const numerosAsignados = Array.from(this.numerosSeleccionados).length;
        alert(`¡Números asignados exitosamente a ${telefono}!`);
    }

    setupEventListeners() {
        // Botón para asignar múltiples números
        document.getElementById('assignMultiple').addEventListener('click', () => {
            this.abrirModal();
        });

        // Botón para exportar datos
        document.getElementById('exportData').addEventListener('click', () => {
            this.abrirModalDatos();
        });

        // Modal events
        document.getElementById('closeModal').addEventListener('click', () => {
            this.cerrarModal();
        });

        document.getElementById('assignBtn').addEventListener('click', () => {
            this.asignarNumeros();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.cerrarModal();
        });

        // Cerrar modal al hacer click fuera
        document.getElementById('modal').addEventListener('click', (e) => {
            if (e.target.id === 'modal') {
                this.cerrarModal();
            }
        });

        // Enter en el input de teléfono
        document.getElementById('phoneInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.asignarNumeros();
            }
        });

        // Escape para cerrar modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.cerrarModal();
                this.cerrarModalDatos();
            }
        });

        // Modal de datos events
        document.getElementById('closeDataModal').addEventListener('click', () => {
            this.cerrarModalDatos();
        });

        document.getElementById('dataModal').addEventListener('click', (e) => {
            if (e.target.id === 'dataModal') {
                this.cerrarModalDatos();
            }
        });

        // Búsqueda de número ganador
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.buscarNumero();
        });

        document.getElementById('searchNumber').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.buscarNumero();
            }
        });

        // Botones de exportación
        document.getElementById('downloadTxt').addEventListener('click', () => {
            this.descargarTXT();
        });

        document.getElementById('downloadCsv').addEventListener('click', () => {
            this.descargarCSV();
        });

        document.getElementById('copyData').addEventListener('click', () => {
            this.copiarDatos();
        });
    }

    guardarDatos() {
        localStorage.setItem('talonarioRifa', JSON.stringify(this.numeros));
    }

    cargarDatos() {
        const datosGuardados = localStorage.getItem('talonarioRifa');
        if (datosGuardados) {
            this.numeros = JSON.parse(datosGuardados);

            // Actualizar la interfaz
            Object.keys(this.numeros).forEach(numero => {
                const numeroElement = document.querySelector(`[data-numero="${numero}"]`);
                const estado = this.numeros[numero].estado;

                numeroElement.className = `numero ${estado}`;

                if (estado === 'asignado') {
                    numeroElement.title = `Asignado a: ${this.numeros[numero].telefono}`;
                }
            });
        }
    }

    abrirModalDatos() {
        const modal = document.getElementById('dataModal');
        modal.style.display = 'block';
        this.mostrarDatosAsignados();
        document.getElementById('searchNumber').value = '';
        document.getElementById('searchResult').innerHTML = '';
    }

    cerrarModalDatos() {
        const modal = document.getElementById('dataModal');
        modal.style.display = 'none';
    }

    mostrarDatosAsignados() {
        const dataList = document.getElementById('dataList');
        const numerosAsignados = Object.keys(this.numeros)
            .filter(num => this.numeros[num].estado === 'asignado')
            .sort((a, b) => parseInt(a) - parseInt(b));

        if (numerosAsignados.length === 0) {
            dataList.innerHTML = '<p style="text-align: center; color: #666;">No hay números asignados aún</p>';
            return;
        }

        let html = `<h3>Total asignados: ${numerosAsignados.length}/100</h3>`;

        numerosAsignados.forEach(numero => {
            const numeroFormateado = numero.padStart(2, '0');
            const telefono = this.numeros[numero].telefono;
            html += `
                <div class="data-item">
                    <span class="numero-asignado">Número ${numeroFormateado}</span>
                    <span class="telefono-asignado">${telefono}</span>
                </div>
            `;
        });

        dataList.innerHTML = html;
    }

    buscarNumero() {
        const numeroInput = document.getElementById('searchNumber').value.trim();
        const searchResult = document.getElementById('searchResult');

        if (!numeroInput) {
            searchResult.innerHTML = '';
            return;
        }

        // Convertir a número y formatear
        const numero = parseInt(numeroInput);
        if (isNaN(numero) || numero < 0 || numero > 99) {
            searchResult.innerHTML = '<div class="search-result not-found">❌ Número inválido. Ingresa un número del 00 al 99</div>';
            return;
        }

        const numeroFormateado = numero.toString().padStart(2, '0');
        const estadoNumero = this.numeros[numero];

        if (estadoNumero.estado === 'asignado') {
            searchResult.innerHTML = `
                <div class="search-result found">
                    🎉 ¡GANADOR ENCONTRADO! 🎉<br>
                    Número ${numeroFormateado} pertenece a:<br>
                    <strong>${estadoNumero.telefono}</strong>
                </div>
            `;
        } else {
            searchResult.innerHTML = `
                <div class="search-result available">
                    ⚠️ El número ${numeroFormateado} está disponible<br>
                    (No ha sido asignado a ningún participante)
                </div>
            `;
        }
    }

    descargarTXT() {
        const numerosAsignados = Object.keys(this.numeros)
            .filter(num => this.numeros[num].estado === 'asignado')
            .sort((a, b) => parseInt(a) - parseInt(b));

        let contenido = `TALONARIO DE RIFA - ${new Date().toLocaleDateString()}\n`;
        contenido += `Total de números asignados: ${numerosAsignados.length}/100\n\n`;

        numerosAsignados.forEach(numero => {
            const numeroFormateado = numero.padStart(2, '0');
            const telefono = this.numeros[numero].telefono;
            contenido += `Número ${numeroFormateado}: ${telefono}\n`;
        });

        this.descargarArchivo(contenido, 'talonario-rifa.txt', 'text/plain');
    }

    descargarCSV() {
        const numerosAsignados = Object.keys(this.numeros)
            .filter(num => this.numeros[num].estado === 'asignado')
            .sort((a, b) => parseInt(a) - parseInt(b));

        let contenido = 'Numero,Telefono\n';

        numerosAsignados.forEach(numero => {
            const numeroFormateado = numero.padStart(2, '0');
            const telefono = this.numeros[numero].telefono;
            contenido += `${numeroFormateado},${telefono}\n`;
        });

        this.descargarArchivo(contenido, 'talonario-rifa.csv', 'text/csv');
    }

    copiarDatos() {
        const numerosAsignados = Object.keys(this.numeros)
            .filter(num => this.numeros[num].estado === 'asignado')
            .sort((a, b) => parseInt(a) - parseInt(b));

        let contenido = `TALONARIO DE RIFA - ${new Date().toLocaleDateString()}\n`;
        contenido += `Total: ${numerosAsignados.length}/100 números asignados\n\n`;

        numerosAsignados.forEach(numero => {
            const numeroFormateado = numero.padStart(2, '0');
            const telefono = this.numeros[numero].telefono;
            contenido += `${numeroFormateado}: ${telefono}\n`;
        });

        navigator.clipboard.writeText(contenido).then(() => {
            alert('¡Datos copiados al portapapeles!');
        }).catch(() => {
            alert('No se pudo copiar. Usa los botones de descarga.');
        });
    }

    descargarArchivo(contenido, nombreArchivo, tipo) {
        const blob = new Blob([contenido], { type: tipo });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    // Método para resetear el talonario (útil para desarrollo)
    resetear() {
        if (confirm('¿Estás seguro de que quieres resetear todo el talonario?')) {
            localStorage.removeItem('talonarioRifa');
            location.reload();
        }
    }
}

// Inicializar la aplicación cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    window.talonario = new TalonarioRifa();

    // Agregar método de reset accesible desde consola
    console.log('Talonario de Rifa cargado. Usa talonario.resetear() para limpiar todos los datos.');
});

// Prevenir zoom en doble tap en móviles
document.addEventListener('touchend', (e) => {
    const now = new Date().getTime();
    const timeSince = now - (window.lastTouchEnd || 0);

    if (timeSince < 300 && timeSince > 0) {
        e.preventDefault();
    }

    window.lastTouchEnd = now;
}, false);