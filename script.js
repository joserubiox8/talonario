class TalonarioRifa {
    constructor() {
        this.numeros = {};
        this.numerosSeleccionados = new Set();
        // IMPORTANTE: Reemplaza esta URL con la tuya de Google Apps Script
        this.SHEETS_URL = 'https://script.google.com/macros/s/AKfycbyRbVi7MUTzf4maWa_DcgtH-JJ0elnLSIVA5CFWMzn0JHvGJY85C4tEVqorTIEXeK88dQ/exec';
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

        // Botón para limpiar datos
        document.getElementById('clearData').addEventListener('click', () => {
            this.limpiarTodosDatos();
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

    async guardarDatos() {
        // Guardar localmente como respaldo
        localStorage.setItem('talonarioRifa', JSON.stringify(this.numeros));

        // Guardar en Google Sheets
        try {
            const numerosAsignados = Object.keys(this.numeros)
                .filter(num => this.numeros[num].estado === 'asignado')
                .map(num => ({
                    numero: num.padStart(2, '0'),
                    telefono: this.numeros[num].telefono
                }));

            const response = await fetch(this.SHEETS_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'save',
                    numeros: numerosAsignados
                })
            });

            if (response.ok) {
                console.log('✅ Datos guardados en Google Sheets');
                this.mostrarEstado('Guardado en la nube ☁️', 'success');
            } else {
                throw new Error('Error al guardar');
            }
        } catch (error) {
            console.error('❌ Error guardando en Sheets:', error);
            this.mostrarEstado('Guardado solo localmente ⚠️', 'warning');
        }
    }

    async cargarDatos() {
        // Intentar cargar desde Google Sheets primero
        try {
            const response = await fetch(this.SHEETS_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'load'
                })
            });

            if (response.ok) {
                const datosSheets = await response.json();

                // Inicializar todos los números como disponibles
                for (let i = 0; i <= 99; i++) {
                    this.numeros[i] = {
                        estado: 'disponible',
                        telefono: null
                    };
                }

                // Aplicar datos de Sheets
                Object.keys(datosSheets).forEach(numero => {
                    if (this.numeros[numero]) {
                        this.numeros[numero] = datosSheets[numero];
                    }
                });

                console.log('✅ Datos cargados desde Google Sheets');
                this.mostrarEstado('Cargado desde la nube ☁️', 'success');

                // Guardar localmente como respaldo
                localStorage.setItem('talonarioRifa', JSON.stringify(this.numeros));
            } else {
                throw new Error('Error al cargar desde Sheets');
            }
        } catch (error) {
            console.error('❌ Error cargando desde Sheets, usando datos locales:', error);
            this.mostrarEstado('Cargado localmente 💾', 'warning');

            // Fallback a localStorage
            const datosGuardados = localStorage.getItem('talonarioRifa');
            if (datosGuardados) {
                this.numeros = JSON.parse(datosGuardados);
            }
        }

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

    mostrarEstado(mensaje, tipo) {
        // Crear o actualizar el indicador de estado
        let statusDiv = document.getElementById('connectionStatus');
        if (!statusDiv) {
            statusDiv = document.createElement('div');
            statusDiv.id = 'connectionStatus';
            statusDiv.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                padding: 8px 12px;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: bold;
                z-index: 1000;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(statusDiv);
        }

        statusDiv.textContent = mensaje;

        if (tipo === 'success') {
            statusDiv.style.backgroundColor = '#d4edda';
            statusDiv.style.color = '#155724';
            statusDiv.style.border = '1px solid #c3e6cb';
        } else if (tipo === 'warning') {
            statusDiv.style.backgroundColor = '#fff3cd';
            statusDiv.style.color = '#856404';
            statusDiv.style.border = '1px solid #ffeaa7';
        } else {
            statusDiv.style.backgroundColor = '#f8d7da';
            statusDiv.style.color = '#721c24';
            statusDiv.style.border = '1px solid #f5c6cb';
        }

        // Ocultar después de 3 segundos
        setTimeout(() => {
            if (statusDiv) {
                statusDiv.style.opacity = '0';
                setTimeout(() => {
                    if (statusDiv && statusDiv.parentNode) {
                        statusDiv.parentNode.removeChild(statusDiv);
                    }
                }, 300);
            }
        }, 3000);
    }

    async limpiarTodosDatos() {
        const confirmacion = confirm(
            '⚠️ ATENCIÓN ⚠️\n\n' +
            'Esto borrará TODOS los números asignados tanto localmente como en Google Sheets.\n\n' +
            '¿Estás completamente seguro de que quieres continuar?'
        );
        
        if (!confirmacion) return;

        const segundaConfirmacion = confirm(
            '🚨 ÚLTIMA CONFIRMACIÓN 🚨\n\n' +
            'Esta acción NO se puede deshacer.\n' +
            'Se perderán todos los datos de participantes.\n\n' +
            '¿Proceder con el borrado completo?'
        );
        
        if (!segundaConfirmacion) return;

        try {
            // Limpiar Google Sheets
            const response = await fetch(this.SHEETS_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'save',
                    numeros: [] // Array vacío para limpiar
                })
            });

            if (response.ok) {
                console.log('✅ Datos borrados de Google Sheets');
                this.mostrarEstado('Datos borrados de la nube ☁️', 'success');
            } else {
                throw new Error('Error al borrar de Sheets');
            }
        } catch (error) {
            console.error('❌ Error borrando de Sheets:', error);
            this.mostrarEstado('Error borrando de la nube ⚠️', 'error');
        }

        // Limpiar datos locales
        localStorage.removeItem('talonarioRifa');
        
        // Reinicializar todos los números
        for (let i = 0; i <= 99; i++) {
            this.numeros[i] = {
                estado: 'disponible',
                telefono: null
            };
            
            const numeroElement = document.querySelector(`[data-numero="${i}"]`);
            numeroElement.className = 'numero disponible';
            numeroElement.title = '';
        }

        // Limpiar selecciones actuales
        this.numerosSeleccionados.clear();
        this.actualizarBotonAsignar();

        alert('✅ Talonario limpiado completamente.\nTodos los números están ahora disponibles.');
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