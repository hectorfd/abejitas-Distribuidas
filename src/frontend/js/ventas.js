class VentasManager {
  constructor() {
    this.carrito = [];
    this.port = window.api.getPort();
    this.usuario = JSON.parse(localStorage.getItem('usuario'));
  }

  async render() {
    const pageContent = document.getElementById('pageContent');

    pageContent.innerHTML = `
      <div class="ventas-page">
        <div class="page-header">
          <div>
            <h1>Ventas</h1>
            <p>Gestión de ventas</p>
          </div>
          <button class="btn-primary" id="btnAbrirNuevaVenta" disabled>
            <i data-lucide="loader"></i>
            Cargando...
          </button>
        </div>

        <div class="content-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Fecha</th>
                <th>Vendedor</th>
                <th>Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="tablaVentas">
              <tr>
                <td colspan="5" style="text-align: center; padding: 40px;">Cargando...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div id="modalVenta" class="modal" style="display: none;">
        <div class="modal-content" style="max-width: 1000px;">
          <div class="modal-header">
            <h2>Nueva Venta</h2>
            <button class="modal-close" id="btnCerrarModal">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div style="padding: 20px;">
            <input
              type="text"
              id="inputBuscar"
              placeholder="Buscar producto..."
              style="width: 100%; padding: 12px; font-size: 16px; margin-bottom: 10px; border: 2px solid #4CAF50; border-radius: 5px;"
              autocomplete="off"
            >
            <div id="sugerencias"></div>

            <div style="margin-top: 20px;">
              <h3>Productos</h3>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Precio</th>
                    <th>Cantidad</th>
                    <th>Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody id="tablaCarrito">
                  <tr>
                    <td colspan="5" style="text-align: center; padding: 20px; color: #999;">Sin productos</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style="margin-top: 20px; text-align: right;">
              <h2>Total: S/ <span id="totalVenta">0.00</span></h2>
              <button class="btn-primary" id="btnGuardar" disabled>Guardar Venta</button>
            </div>
          </div>
        </div>
      </div>

      <div id="modalDetalle" class="modal" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Detalle</h2>
            <button class="modal-close" id="btnCerrarDetalle">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div id="contenidoDetalle" style="padding: 20px;"></div>
        </div>
      </div>
    `;

    lucide.createIcons();
    await this.cargarVentas();
    this.attachEvents();

    const btn = document.getElementById('btnAbrirNuevaVenta');
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="plus"></i> Nueva Venta';
    lucide.createIcons();
  }

  attachEvents() {
    document.getElementById('btnAbrirNuevaVenta').onclick = () => this.abrirModal();
    document.getElementById('btnCerrarModal').onclick = () => this.cerrarModal();
    document.getElementById('btnCerrarDetalle').onclick = () => {
      document.getElementById('modalDetalle').style.display = 'none';
    };
  }

  abrirModal() {
    this.carrito = [];
    const modal = document.getElementById('modalVenta');
    const modalContent = modal.querySelector('.modal-content');

    modalContent.innerHTML = `
      <div class="modal-header">
        <h2>Nueva Venta</h2>
        <button class="modal-close" id="btnCerrarModal">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div style="padding: 20px;">
        <input
          type="text"
          id="inputBuscar"
          placeholder="Buscar producto..."
          style="width: 100%; padding: 12px; font-size: 16px; margin-bottom: 10px; border: 2px solid #4CAF50; border-radius: 5px;"
          autocomplete="off"
        >
        <div id="sugerencias"></div>

        <div style="margin-top: 20px;">
          <h3>Productos</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio</th>
                <th>Cantidad</th>
                <th>Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="tablaCarrito">
              <tr>
                <td colspan="5" style="text-align: center; padding: 20px; color: #999;">Sin productos</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="margin-top: 20px; text-align: right;">
          <h2>Total: S/ <span id="totalVenta">0.00</span></h2>
          <button class="btn-primary" id="btnGuardar" disabled>Guardar Venta</button>
        </div>
      </div>
    `;

    modal.style.display = 'flex';

    const input = document.getElementById('inputBuscar');
    input.onkeyup = (e) => this.buscar(e.target.value);

    document.getElementById('btnCerrarModal').onclick = () => this.cerrarModal();
    document.getElementById('btnGuardar').onclick = () => this.guardar();

    setTimeout(() => input.focus(), 100);
    lucide.createIcons();
  }

  cerrarModal() {
    document.getElementById('modalVenta').style.display = 'none';
    this.carrito = [];
  }

  async buscar(query) {
    const container = document.getElementById('sugerencias');

    if (query.length < 2) {
      container.innerHTML = '';
      return;
    }

    try {
      const response = await fetch(`http://localhost:${this.port}/api/productos`);
      const data = await response.json();

      if (data.success) {
        const filtrados = data.productos.filter(p =>
          p.Nombre.toLowerCase().includes(query.toLowerCase()) ||
          p.Codigo.toLowerCase().includes(query.toLowerCase())
        );

        if (filtrados.length > 0) {
          container.innerHTML = filtrados.map(p => `
            <div class="producto-sugerencia" style="padding: 10px; cursor: pointer; border-bottom: 1px solid #eee;"
                 data-id="${p.ProductoID}"
                 data-nombre="${p.Nombre}"
                 data-precio="${p.PrecioVenta}"
                 data-stock="${p.Stock}">
              <strong>${p.Codigo} - ${p.Nombre}</strong>
              <span style="float: right;">S/ ${parseFloat(p.PrecioVenta).toFixed(2)} (Stock: ${p.Stock})</span>
            </div>
          `).join('');

          container.querySelectorAll('.producto-sugerencia').forEach(div => {
            div.onclick = () => {
              this.agregar({
                ProductoID: div.dataset.id,
                Nombre: div.dataset.nombre,
                PrecioUnitario: parseFloat(div.dataset.precio),
                Stock: parseInt(div.dataset.stock)
              });
              document.getElementById('inputBuscar').value = '';
              container.innerHTML = '';
            };
          });
        } else {
          container.innerHTML = '<p style="padding: 10px;">No encontrado</p>';
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  agregar(producto) {
    const existe = this.carrito.find(p => p.ProductoID === producto.ProductoID);

    if (existe) {
      if (existe.Cantidad < producto.Stock) {
        existe.Cantidad++;
      } else {
        alert('Stock insuficiente');
        return;
      }
    } else {
      this.carrito.push({...producto, Cantidad: 1});
    }

    this.renderCarrito();
  }

  renderCarrito() {
    const tbody = document.getElementById('tablaCarrito');

    if (this.carrito.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #999;">Sin productos</td></tr>';
      document.getElementById('totalVenta').textContent = '0.00';
      document.getElementById('btnGuardar').disabled = true;
      return;
    }

    tbody.innerHTML = this.carrito.map((item, index) => `
      <tr>
        <td>${item.Nombre}</td>
        <td>S/ ${item.PrecioUnitario.toFixed(2)}</td>
        <td>
          <button onclick="ventasManager.cambiarCantidad(${index}, -1)" style="padding: 5px 10px;">-</button>
          <span style="margin: 0 10px;">${item.Cantidad}</span>
          <button onclick="ventasManager.cambiarCantidad(${index}, 1)" style="padding: 5px 10px;">+</button>
        </td>
        <td>S/ ${(item.PrecioUnitario * item.Cantidad).toFixed(2)}</td>
        <td>
          <button onclick="ventasManager.quitar(${index})" class="btn-icon danger">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      </tr>
    `).join('');

    const total = this.carrito.reduce((sum, item) => sum + (item.PrecioUnitario * item.Cantidad), 0);
    document.getElementById('totalVenta').textContent = total.toFixed(2);
    document.getElementById('btnGuardar').disabled = false;

    lucide.createIcons();
  }

  cambiarCantidad(index, delta) {
    const item = this.carrito[index];
    const nueva = item.Cantidad + delta;

    if (nueva > 0 && nueva <= item.Stock) {
      item.Cantidad = nueva;
      this.renderCarrito();
    } else if (nueva > item.Stock) {
      alert('Stock insuficiente');
    }
  }

  quitar(index) {
    this.carrito.splice(index, 1);
    this.renderCarrito();
  }

  async guardar() {
    if (this.carrito.length === 0) return;

    const btn = document.getElementById('btnGuardar');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    try {
      const response = await fetch(`http://localhost:${this.port}/api/ventas`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          UsuarioID: this.usuario.id,
          Detalles: this.carrito.map(item => ({
            ProductoID: item.ProductoID,
            Cantidad: item.Cantidad,
            PrecioUnitario: item.PrecioUnitario
          }))
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Venta guardada');
        this.cerrarModal();
        await this.cargarVentas();
      } else {
        alert(data.error || 'Error');
        btn.disabled = false;
        btn.textContent = 'Guardar Venta';
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar');
      btn.disabled = false;
      btn.textContent = 'Guardar Venta';
    }
  }

  async cargarVentas() {
    try {
      const response = await fetch(`http://localhost:${this.port}/api/ventas`);
      const data = await response.json();

      const tbody = document.getElementById('tablaVentas');

      if (data.success && data.ventas.length > 0) {
        tbody.innerHTML = data.ventas.map(v => `
          <tr>
            <td>${v.NumeroVenta}</td>
            <td>${new Date(v.FechaVenta).toLocaleString('es-PE')}</td>
            <td>${v.Vendedor}</td>
            <td>S/ ${parseFloat(v.Total).toFixed(2)}</td>
            <td>
              <button class="btn-icon" onclick="ventasManager.verDetalle('${v.VentaID}')">
                <i data-lucide="eye"></i>
              </button>
              <button class="btn-icon danger" onclick="ventasManager.eliminar('${v.VentaID}')">
                <i data-lucide="trash-2"></i>
              </button>
            </td>
          </tr>
        `).join('');
      } else {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No hay ventas</td></tr>';
      }

      lucide.createIcons();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async verDetalle(id) {
    try {
      const response = await fetch(`http://localhost:${this.port}/api/ventas/${id}`);
      const data = await response.json();

      if (data.success && data.venta) {
        const v = data.venta;
        document.getElementById('contenidoDetalle').innerHTML = `
          <p><strong>Número:</strong> ${v.NumeroVenta}</p>
          <p><strong>Fecha:</strong> ${new Date(v.FechaVenta).toLocaleString('es-PE')}</p>
          <p><strong>Vendedor:</strong> ${v.Vendedor}</p>
          <h3 style="margin-top: 20px;">Productos</h3>
          <table class="data-table">
            <thead>
              <tr><th>Producto</th><th>Precio</th><th>Cantidad</th><th>Subtotal</th></tr>
            </thead>
            <tbody>
              ${v.Detalles.map(d => `
                <tr>
                  <td>${d.ProductoNombre}</td>
                  <td>S/ ${parseFloat(d.PrecioUnitario).toFixed(2)}</td>
                  <td>${d.Cantidad}</td>
                  <td>S/ ${parseFloat(d.Subtotal).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <h2 style="text-align: right; margin-top: 20px;">Total: S/ ${parseFloat(v.Total).toFixed(2)}</h2>
        `;
        document.getElementById('modalDetalle').style.display = 'flex';
        lucide.createIcons();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async eliminar(id) {
    if (!confirm('¿Eliminar venta? Se restaurará stock.')) return;

    try {
      const response = await fetch(`http://localhost:${this.port}/api/ventas/${id}`, {method: 'DELETE'});
      const data = await response.json();

      if (data.success) {
        alert('Eliminada');
        await this.cargarVentas();
      } else {
        alert(data.error || 'Error');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error');
    }
  }
}

window.ventasManager = new VentasManager();
