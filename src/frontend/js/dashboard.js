const usuario = JSON.parse(localStorage.getItem('usuario'));

if (!usuario || !usuario.username) {
  window.location.href = 'login.html';
}

document.getElementById('sidebarUserName').textContent = usuario.fullName;
document.getElementById('sidebarUserBranch').textContent = usuario.branch;

if (usuario.branch === 'LIM') {
  const sincronizacionNav = document.querySelector('.nav-sincronizacion');
  if (sincronizacionNav) {
    sincronizacionNav.style.display = 'none';
  }
}

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('usuario');
  window.location.href = 'login.html';
});

const navItems = document.querySelectorAll('.nav-item');
const pageContent = document.getElementById('pageContent');

navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    navItems.forEach(nav => nav.classList.remove('active'));
    item.classList.add('active');

    const page = item.getAttribute('data-page');
    loadPage(page);
  });
});

function loadPage(page) {
  switch(page) {
    case 'home':
      renderHomePage();
      break;
    case 'productos':
      renderProductosPage();
      break;
    case 'ventas':
      renderVentasPage();
      break;
    case 'sincronizacion':
      renderSincronizacionPage();
      break;
    case 'reportes':
      renderReportesPage();
      break;
    default:
      renderHomePage();
  }

  lucide.createIcons();
}

async function renderHomePage() {
  const port = window.api.getPort();

  let stats = {
    productos: 0,
    ventas: 0,
    ventasHoy: 0,
    sincronizacion: 'Pendiente'
  };

  try {
    const response = await fetch(`http://localhost:${port}/api/stats`);
    if (response.ok) {
      stats = await response.json();
    }
  } catch (error) {
    console.error('Error al cargar estadisticas:', error);
  }

  pageContent.innerHTML = `
    <div class="page-header">
      <h1>Bienvenido, ${usuario.fullName}</h1>
      <p>Panel de control - ${usuario.branch}</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue">
          <i data-lucide="package"></i>
        </div>
        <div class="stat-info">
          <h3>${stats.productos}</h3>
          <p>Productos</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon green">
          <i data-lucide="shopping-cart"></i>
        </div>
        <div class="stat-info">
          <h3>${stats.ventas}</h3>
          <p>Ventas Totales</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon orange">
          <i data-lucide="dollar-sign"></i>
        </div>
        <div class="stat-info">
          <h3>${stats.ventasHoy}</h3>
          <p>Ventas Hoy</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon purple">
          <i data-lucide="refresh-cw"></i>
        </div>
        <div class="stat-info">
          <h3>${stats.sincronizacion}</h3>
          <p>Sincronizacion</p>
        </div>
      </div>
    </div>
  `;
}

async function renderProductosPage() {
  const port = window.api.getPort();

  pageContent.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Productos</h1>
        <p>Gestion de inventario</p>
      </div>
      <button class="btn-primary" id="btnNuevoProducto">
        <i data-lucide="plus"></i>
        Nuevo Producto
      </button>
    </div>

    <div class="content-card">
      <div class="search-bar">
        <i data-lucide="search"></i>
        <input type="text" id="searchProductos" placeholder="Buscar productos...">
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Nombre</th>
              <th>P. Compra</th>
              <th>P. Venta</th>
              <th>Stock</th>
              <th>Stock Minimo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="productosTableBody">
            <tr>
              <td colspan="7" style="text-align: center; padding: 40px;">
                <i data-lucide="loader" style="width: 32px; height: 32px;"></i>
                <p>Cargando productos...</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div id="modalProducto" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="modalTitle">Nuevo Producto</h2>
          <button class="modal-close" id="btnCloseModal">
            <i data-lucide="x"></i>
          </button>
        </div>
        <form id="formProducto">
          <input type="hidden" id="productoId">
          <div class="form-group">
            <label for="productoNombre">Nombre *</label>
            <input type="text" id="productoNombre" required placeholder="Ingrese el nombre del producto">
          </div>
          <div class="form-group">
            <label for="productoDescripcion">Descripcion</label>
            <textarea id="productoDescripcion" rows="3" placeholder="Descripcion opcional del producto"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="productoPrecioCompra">Precio Compra</label>
              <input type="number" id="productoPrecioCompra" step="0.01" min="0" placeholder="0.00">
            </div>
            <div class="form-group">
              <label for="productoPrecioVenta">Precio Venta *</label>
              <input type="number" id="productoPrecioVenta" step="0.01" min="0" required placeholder="0.00">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="productoStock">Stock Actual</label>
              <input type="number" id="productoStock" min="0" placeholder="0">
            </div>
            <div class="form-group">
              <label for="productoStockMinimo">Stock Minimo</label>
              <input type="number" id="productoStockMinimo" min="0" placeholder="5">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" id="btnCancelModal">Cancelar</button>
            <button type="submit" class="btn-primary">Guardar Producto</button>
          </div>
        </form>
      </div>
    </div>
  `;

  lucide.createIcons();

  await loadProductos();

  document.getElementById('btnNuevoProducto').addEventListener('click', () => {
    openProductoModal();
  });

  document.getElementById('btnCloseModal').addEventListener('click', () => {
    closeProductoModal();
  });

  document.getElementById('btnCancelModal').addEventListener('click', () => {
    closeProductoModal();
  });

  document.getElementById('formProducto').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveProducto();
  });

  document.getElementById('searchProductos').addEventListener('input', (e) => {
    filterProductos(e.target.value);
  });
}

async function loadProductos() {
  const port = window.api.getPort();
  const tbody = document.getElementById('productosTableBody');

  try {
    const response = await fetch(`http://localhost:${port}/api/productos`);
    const data = await response.json();

    if (data.success && data.productos) {
      window.productosData = data.productos;
      renderProductosTable(data.productos);
    } else {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No hay productos</td></tr>';
    }
  } catch (error) {
    console.error('Error al cargar productos:', error);
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: red;">Error al cargar productos</td></tr>';
  }
}

function renderProductosTable(productos) {
  const tbody = document.getElementById('productosTableBody');

  if (productos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No hay productos</td></tr>';
    return;
  }

  tbody.innerHTML = productos.map(p => `
    <tr>
      <td>${p.Codigo}</td>
      <td>${p.Nombre}</td>
      <td>S/ ${parseFloat(p.PrecioCompra || 0).toFixed(2)}</td>
      <td>S/ ${parseFloat(p.PrecioVenta || 0).toFixed(2)}</td>
      <td ${p.Stock <= p.StockMinimo ? 'style="color: red; font-weight: bold;"' : ''}>${p.Stock}</td>
      <td>${p.StockMinimo}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-icon" onclick="editProducto('${p.ProductoID}')" title="Editar">
            <i data-lucide="edit"></i>
          </button>
          <button class="btn-icon danger" onclick="deleteProducto('${p.ProductoID}')" title="Eliminar">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  lucide.createIcons();
}

function filterProductos(search) {
  const filtered = window.productosData.filter(p =>
    p.Nombre.toLowerCase().includes(search.toLowerCase()) ||
    p.Codigo.toLowerCase().includes(search.toLowerCase())
  );
  renderProductosTable(filtered);
}

function openProductoModal(producto = null) {
  const modal = document.getElementById('modalProducto');
  const title = document.getElementById('modalTitle');
  const form = document.getElementById('formProducto');

  form.reset();

  if (producto) {
    title.textContent = 'Editar Producto';
    document.getElementById('productoId').value = producto.ProductoID;
    document.getElementById('productoNombre').value = producto.Nombre;
    document.getElementById('productoDescripcion').value = producto.Descripcion || '';
    document.getElementById('productoPrecioCompra').value = producto.PrecioCompra || 0;
    document.getElementById('productoPrecioVenta').value = producto.PrecioVenta;
    document.getElementById('productoStock').value = producto.Stock;
    document.getElementById('productoStockMinimo').value = producto.StockMinimo;
  } else {
    title.textContent = 'Nuevo Producto';
    document.getElementById('productoId').value = '';
  }

  modal.style.display = 'flex';
}

function closeProductoModal() {
  document.getElementById('modalProducto').style.display = 'none';
}

async function saveProducto() {
  const port = window.api.getPort();
  const id = document.getElementById('productoId').value;

  const producto = {
    Nombre: document.getElementById('productoNombre').value,
    Descripcion: document.getElementById('productoDescripcion').value,
    PrecioCompra: parseFloat(document.getElementById('productoPrecioCompra').value) || 0,
    PrecioVenta: parseFloat(document.getElementById('productoPrecioVenta').value),
    Stock: parseInt(document.getElementById('productoStock').value) || 0,
    StockMinimo: parseInt(document.getElementById('productoStockMinimo').value) || 5
  };

  try {
    const url = id ? `http://localhost:${port}/api/productos/${id}` : `http://localhost:${port}/api/productos`;
    const method = id ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(producto)
    });

    const data = await response.json();

    if (data.success) {
      closeProductoModal();
      await loadProductos();
    } else {
      alert(data.error || 'Error al guardar producto');
    }
  } catch (error) {
    alert('Error al guardar producto');
  }
}

window.editProducto = function(id) {
  const producto = window.productosData.find(p => p.ProductoID == id);
  if (producto) {
    openProductoModal(producto);
  }
};

window.deleteProducto = async function(id) {
  if (!confirm('¿Esta seguro de eliminar este producto?')) {
    return;
  }

  const port = window.api.getPort();

  try {
    const response = await fetch(`http://localhost:${port}/api/productos/${id}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (data.success) {
      await loadProductos();
    } else {
      alert(data.error || 'Error al eliminar producto');
    }
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    alert('Error al eliminar producto');
  }
};

async function renderVentasPage() {
  const port = window.api.getPort();

  pageContent.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Ventas</h1>
        <p>Registro de ventas</p>
      </div>
      <button class="btn-primary" id="btnNuevaVenta">
        <i data-lucide="plus"></i>
        Nueva Venta
      </button>
    </div>

    <div id="viewVentas">
      <div class="content-card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Numero</th>
                <th>Fecha</th>
                <th>Vendedor</th>
                <th>Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="ventasTableBody">
              <tr>
                <td colspan="5" style="text-align: center; padding: 40px;">
                  <i data-lucide="loader" style="width: 32px; height: 32px;"></i>
                  <p>Cargando ventas...</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div id="viewNuevaVenta" style="display: none;">
      <div class="content-card">
        <div style="margin-bottom: 20px;">
          <button class="btn-secondary" id="btnVolverVentas">
            <i data-lucide="arrow-left"></i>
            Volver
          </button>
        </div>

        <div class="search-bar" style="margin-bottom: 20px;">
          <i data-lucide="search"></i>
          <input type="text" id="searchProductoVenta" placeholder="Buscar producto por codigo o nombre...">
        </div>

        <div id="productosSugerencias" style="display: none; background: white; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 20px; max-height: 200px; overflow-y: auto;"></div>

        <div class="sale-products">
          <h3>Productos en la venta</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio</th>
                <th>Cantidad</th>
                <th>Subtotal</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="saleProductsBody">
              <tr>
                <td colspan="5" style="text-align: center; padding: 20px; color: #999;">
                  No hay productos en la venta
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="sale-total">
          <h2>Total: S/ <span id="saleTotal">0.00</span></h2>
          <button class="btn-primary" id="btnFinalizarVenta" disabled>
            <i data-lucide="check"></i>
            Finalizar Venta
          </button>
        </div>
      </div>
    </div>

    <div id="modalDetalleVenta" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Detalle de Venta</h2>
          <button class="modal-close" id="btnCloseDetalleModal">
            <i data-lucide="x"></i>
          </button>
        </div>
        <div id="detalleVentaContent" style="padding: 20px;">
          <p>Cargando...</p>
        </div>
      </div>
    </div>
  `;

  lucide.createIcons();

  window.saleItems = [];

  await loadVentas();

  document.getElementById('btnNuevaVenta').addEventListener('click', () => {
    showNuevaVentaView();
  });

  document.getElementById('btnVolverVentas').addEventListener('click', () => {
    showVentasListView();
  });

  // Guardar la función de búsqueda para poder reasignarla
  window.searchProductoVentaHandler = async (e) => {
    await searchProductosForSale(e.target.value);
  };

  document.getElementById('searchProductoVenta').addEventListener('input', window.searchProductoVentaHandler);

  document.getElementById('btnFinalizarVenta').addEventListener('click', async () => {
    await finalizarVenta();
  });

  document.getElementById('btnCloseDetalleModal').addEventListener('click', () => {
    document.getElementById('modalDetalleVenta').style.display = 'none';
  });
}

async function loadVentas() {
  const port = window.api.getPort();
  const tbody = document.getElementById('ventasTableBody');

  try {
    const response = await fetch(`http://localhost:${port}/api/ventas`);
    const data = await response.json();

    if (data.success && data.ventas) {
      renderVentasTable(data.ventas);
    } else {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No hay ventas</td></tr>';
    }
  } catch (error) {
    console.error('Error al cargar ventas:', error);
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: red;">Error al cargar ventas</td></tr>';
  }
}

function renderVentasTable(ventas) {
  const tbody = document.getElementById('ventasTableBody');

  if (ventas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No hay ventas</td></tr>';
    return;
  }

  tbody.innerHTML = ventas.map(v => `
    <tr>
      <td>${v.NumeroVenta}</td>
      <td>${new Date(v.FechaVenta).toLocaleString('es-PE')}</td>
      <td>${v.Vendedor}</td>
      <td>S/ ${parseFloat(v.Total).toFixed(2)}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-icon" onclick="verDetalleVenta('${v.VentaID}')" title="Ver detalle">
            <i data-lucide="eye"></i>
          </button>
          <button class="btn-icon danger" onclick="eliminarVenta('${v.VentaID}')" title="Eliminar">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  lucide.createIcons();
}

function showNuevaVentaView() {
  document.getElementById('viewVentas').style.display = 'none';
  document.getElementById('viewNuevaVenta').style.display = 'block';

  // Limpiar completamente el estado de la venta
  window.saleItems = [];

  // Obtener referencias a los elementos
  const searchInput = document.getElementById('searchProductoVenta');
  const sugerenciasDiv = document.getElementById('productosSugerencias');
  const tbody = document.getElementById('saleProductsBody');
  const btnFinalizar = document.getElementById('btnFinalizarVenta');

  // Remover event listener anterior y agregar uno nuevo para evitar duplicados
  if (window.searchProductoVentaHandler) {
    searchInput.removeEventListener('input', window.searchProductoVentaHandler);
    searchInput.addEventListener('input', window.searchProductoVentaHandler);
  }

  // Limpiar campos
  searchInput.value = '';
  searchInput.disabled = false; // Asegurar que esté habilitado
  searchInput.readOnly = false; // Asegurar que no esté en modo solo lectura
  sugerenciasDiv.style.display = 'none';

  // Limpiar y renderizar la tabla vacía
  tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #999;">No hay productos en la venta</td></tr>';

  // Actualizar el total y resetear el botón
  document.getElementById('saleTotal').textContent = '0.00';
  btnFinalizar.disabled = true;
  btnFinalizar.innerHTML = '<i data-lucide="check"></i> Finalizar Venta';

  // Hacer foco en el campo de búsqueda
  setTimeout(() => {
    searchInput.focus();
  }, 100);

  lucide.createIcons();
}

function showVentasListView() {
  document.getElementById('viewVentas').style.display = 'block';
  document.getElementById('viewNuevaVenta').style.display = 'none';
  loadVentas();
}

async function searchProductosForSale(query) {
  const sugerenciasDiv = document.getElementById('productosSugerencias');

  if (query.length < 2) {
    sugerenciasDiv.style.display = 'none';
    return;
  }

  const port = window.api.getPort();

  try {
    const response = await fetch(`http://localhost:${port}/api/productos`);
    const data = await response.json();

    if (data.success && data.productos) {
      const filtered = data.productos.filter(p =>
        p.Nombre.toLowerCase().includes(query.toLowerCase()) ||
        p.Codigo.toLowerCase().includes(query.toLowerCase())
      );

      if (filtered.length > 0) {
        sugerenciasDiv.innerHTML = filtered.map(p => `
          <div class="producto-sugerencia" onclick='addProductoToSale("${p.ProductoID}", "${p.Nombre.replace(/"/g, '&quot;')}", ${p.PrecioVenta}, ${p.Stock})'>
            <strong>${p.Codigo} - ${p.Nombre}</strong>
            <span>S/ ${parseFloat(p.PrecioVenta).toFixed(2)} (Stock: ${p.Stock})</span>
          </div>
        `).join('');
        sugerenciasDiv.style.display = 'block';
      } else {
        sugerenciasDiv.style.display = 'none';
      }
    }
  } catch (error) {
    console.error('Error al buscar productos:', error);
  }
}

window.addProductoToSale = function(productoID, nombre, precio, stock) {
  const existing = window.saleItems.find(item => item.ProductoID === productoID);

  if (existing) {
    if (existing.Cantidad < stock) {
      existing.Cantidad++;
    } else {
      alert('No hay suficiente stock');
      return;
    }
  } else {
    window.saleItems.push({
      ProductoID: productoID,
      Nombre: nombre,
      PrecioUnitario: precio,
      Cantidad: 1,
      Stock: stock
    });
  }

  renderSaleProducts();
  document.getElementById('searchProductoVenta').value = '';
  document.getElementById('productosSugerencias').style.display = 'none';
};

function renderSaleProducts() {
  const tbody = document.getElementById('saleProductsBody');

  if (window.saleItems.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #999;">No hay productos en la venta</td></tr>';
    updateSaleTotal();
    return;
  }

  tbody.innerHTML = window.saleItems.map((item, index) => `
    <tr>
      <td>${item.Nombre}</td>
      <td>S/ ${parseFloat(item.PrecioUnitario).toFixed(2)}</td>
      <td>
        <div class="quantity-controls">
          <button onclick="decreaseQuantity(${index})">-</button>
          <span>${item.Cantidad}</span>
          <button onclick="increaseQuantity(${index})">+</button>
        </div>
      </td>
      <td>S/ ${(item.PrecioUnitario * item.Cantidad).toFixed(2)}</td>
      <td>
        <button class="btn-icon danger" onclick="removeFromSale(${index})">
          <i data-lucide="trash-2"></i>
        </button>
      </td>
    </tr>
  `).join('');

  updateSaleTotal();
  lucide.createIcons();
}

window.increaseQuantity = function(index) {
  const item = window.saleItems[index];
  if (item.Cantidad < item.Stock) {
    item.Cantidad++;
    renderSaleProducts();
  } else {
    alert('No hay suficiente stock');
  }
};

window.decreaseQuantity = function(index) {
  const item = window.saleItems[index];
  if (item.Cantidad > 1) {
    item.Cantidad--;
    renderSaleProducts();
  }
};

window.removeFromSale = function(index) {
  window.saleItems.splice(index, 1);
  renderSaleProducts();
};

function updateSaleTotal() {
  const total = window.saleItems.reduce((sum, item) => sum + (item.PrecioUnitario * item.Cantidad), 0);
  document.getElementById('saleTotal').textContent = total.toFixed(2);
  document.getElementById('btnFinalizarVenta').disabled = window.saleItems.length === 0;
}

async function finalizarVenta() {
  if (window.saleItems.length === 0) {
    alert('Agregue productos a la venta');
    return;
  }

  const btnFinalizar = document.getElementById('btnFinalizarVenta');
  if (btnFinalizar.disabled) return;

  btnFinalizar.disabled = true;
  btnFinalizar.innerHTML = '<i data-lucide="loader"></i> Procesando...';
  lucide.createIcons();

  const port = window.api.getPort();
  const usuario = JSON.parse(localStorage.getItem('usuario'));

  const venta = {
    UsuarioID: usuario.id,
    Detalles: window.saleItems.map(item => ({
      ProductoID: item.ProductoID,
      Cantidad: item.Cantidad,
      PrecioUnitario: item.PrecioUnitario
    }))
  };

  try {
    const response = await fetch(`http://localhost:${port}/api/ventas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(venta)
    });

    const data = await response.json();

    if (data.success) {
      alert('Venta registrada exitosamente');
      // Limpiar completamente el estado de la venta
      window.saleItems = [];
      document.getElementById('searchProductoVenta').value = '';
      document.getElementById('productosSugerencias').style.display = 'none';
      showVentasListView();
    } else {
      btnFinalizar.disabled = false;
      btnFinalizar.innerHTML = '<i data-lucide="check"></i> Finalizar Venta';
      lucide.createIcons();
      alert(data.error || 'Error al registrar venta');
    }
  } catch (error) {
    console.error('Error al registrar venta:', error);
    btnFinalizar.disabled = false;
    btnFinalizar.innerHTML = '<i data-lucide="check"></i> Finalizar Venta';
    lucide.createIcons();
    alert('Error al registrar venta');
  }
}

window.verDetalleVenta = async function(ventaID) {
  const port = window.api.getPort();
  const modal = document.getElementById('modalDetalleVenta');
  const content = document.getElementById('detalleVentaContent');

  modal.style.display = 'flex';
  content.innerHTML = '<p>Cargando...</p>';

  try {
    const response = await fetch(`http://localhost:${port}/api/ventas/${ventaID}`);
    const data = await response.json();

    if (data.success && data.venta) {
      const v = data.venta;
      content.innerHTML = `
        <div class="venta-detalle-header">
          <p><strong>Numero de Venta:</strong> ${v.NumeroVenta}</p>
          <p><strong>Fecha:</strong> ${new Date(v.FechaVenta).toLocaleString('es-PE')}</p>
          <p><strong>Vendedor:</strong> ${v.Vendedor}</p>
        </div>
        <h3>Productos</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Precio</th>
              <th>Cantidad</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${v.Detalles.map(d => `
              <tr>
                <td>${d.ProductoNombre} (${d.ProductoCodigo})</td>
                <td>S/ ${parseFloat(d.PrecioUnitario).toFixed(2)}</td>
                <td>${d.Cantidad}</td>
                <td>S/ ${parseFloat(d.Subtotal).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="venta-detalle-total">
          <h2>Total: S/ ${parseFloat(v.Total).toFixed(2)}</h2>
        </div>
        <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
          <button class="btn-primary" onclick="imprimirBoleta('${v.VentaID}')">
            <i data-lucide="printer"></i>
            Imprimir Boleta
          </button>
        </div>
      `;
      lucide.createIcons();
    } else {
      content.innerHTML = '<p style="color: red;">Error al cargar detalle</p>';
    }
  } catch (error) {
    console.error('Error al cargar detalle:', error);
    content.innerHTML = '<p style="color: red;">Error al cargar detalle</p>';
  }
};

window.eliminarVenta = async function(ventaID) {
  if (!confirm('¿Estas seguro de eliminar esta venta? Se restaurara el stock de los productos.')) {
    return;
  }

  const port = window.api.getPort();

  try {
    const response = await fetch(`http://localhost:${port}/api/ventas/${ventaID}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (data.success) {
      alert('Venta eliminada exitosamente');
      await loadVentas();
    } else {
      alert(data.error || 'Error al eliminar venta');
    }
  } catch (error) {
    console.error('Error al eliminar venta:', error);
    alert('Error al eliminar venta');
  }
};

window.imprimirBoleta = async function(ventaID) {
  const port = window.api.getPort();

  try {
    const response = await fetch(`http://localhost:${port}/api/ventas/${ventaID}`);
    const data = await response.json();

    if (data.success && data.venta) {
      const v = data.venta;
      const usuario = JSON.parse(localStorage.getItem('usuario'));

      // Crear ventana de impresión
      const ventanaImpresion = window.open('', '_blank', 'width=800,height=600');

      const boletaHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Boleta de Venta - ${v.NumeroVenta}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              max-width: 80mm;
              margin: 0 auto;
              padding: 10px;
              font-size: 12px;
            }
            .header {
              text-align: center;
              border-bottom: 2px dashed #000;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .header h2 {
              margin: 5px 0;
              font-size: 16px;
            }
            .info {
              margin: 10px 0;
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
            }
            .info p {
              margin: 3px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
            }
            th {
              text-align: left;
              border-bottom: 1px solid #000;
              padding: 5px 0;
            }
            td {
              padding: 3px 0;
            }
            .total {
              border-top: 2px solid #000;
              margin-top: 10px;
              padding-top: 10px;
              text-align: right;
              font-size: 14px;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              border-top: 1px dashed #000;
              padding-top: 10px;
              font-size: 10px;
            }
            @media print {
              body {
                padding: 0;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>SISTEMA DE VENTAS</h2>
            <p>Sucursal: ${usuario.branch}</p>
            <p>BOLETA DE VENTA</p>
          </div>

          <div class="info">
            <p><strong>N° Venta:</strong> ${v.NumeroVenta}</p>
            <p><strong>Fecha:</strong> ${new Date(v.FechaVenta).toLocaleString('es-PE')}</p>
            <p><strong>Vendedor:</strong> ${v.Vendedor}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cant.</th>
                <th>P.U.</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${v.Detalles.map(d => `
                <tr>
                  <td>${d.ProductoNombre}</td>
                  <td>${d.Cantidad}</td>
                  <td>S/ ${parseFloat(d.PrecioUnitario).toFixed(2)}</td>
                  <td>S/ ${parseFloat(d.Subtotal).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total">
            <p>TOTAL: S/ ${parseFloat(v.Total).toFixed(2)}</p>
          </div>

          <div class="footer">
            <p>Gracias por su compra</p>
            <p>${new Date().toLocaleString('es-PE')}</p>
          </div>

          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer;">
              Imprimir
            </button>
            <button onclick="window.close()" style="padding: 10px 20px; font-size: 14px; cursor: pointer; margin-left: 10px;">
              Cerrar
            </button>
          </div>
        </body>
        </html>
      `;

      ventanaImpresion.document.write(boletaHTML);
      ventanaImpresion.document.close();

      // Auto-imprimir después de cargar
      ventanaImpresion.onload = function() {
        setTimeout(() => {
          ventanaImpresion.focus();
        }, 250);
      };

    } else {
      alert('Error al cargar datos de la venta');
    }
  } catch (error) {
    console.error('Error al imprimir boleta:', error);
    alert('Error al imprimir boleta');
  }
};

async function renderSincronizacionPage() {
  const port = window.api.getPort();

  pageContent.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Sincronizacion</h1>
        <p>Sincronizar datos con central</p>
      </div>
      <button class="btn-primary" id="btnEjecutarSync">
        <i data-lucide="refresh-cw"></i>
        Sincronizar Ahora
      </button>
    </div>

    <div class="sync-status-card">
      <div class="sync-status-item">
        <i data-lucide="database"></i>
        <div>
          <h3 id="syncSucursal">Cargando...</h3>
          <p>Sucursal</p>
        </div>
      </div>
      <div class="sync-status-item">
        <i data-lucide="clock"></i>
        <div>
          <h3 id="syncUltima">Cargando...</h3>
          <p>Ultima Sincronizacion</p>
        </div>
      </div>
      <div class="sync-status-item">
        <i data-lucide="shopping-bag"></i>
        <div>
          <h3 id="syncPendientes">0</h3>
          <p>Ventas Pendientes</p>
        </div>
      </div>
      <div class="sync-status-item">
        <i data-lucide="check-circle"></i>
        <div>
          <h3 id="syncEstado">-</h3>
          <p>Estado</p>
        </div>
      </div>
    </div>

    <div class="content-card" style="margin-top: 30px;">
      <h3>Historial de Sincronizacion</h3>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Mensaje</th>
            </tr>
          </thead>
          <tbody id="syncLogsBody">
            <tr>
              <td colspan="4" style="text-align: center; padding: 40px;">
                <i data-lucide="loader" style="width: 32px; height: 32px;"></i>
                <p>Cargando historial...</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  lucide.createIcons();

  await loadSyncStatus();
  await loadSyncLogs();

  document.getElementById('btnEjecutarSync').addEventListener('click', async () => {
    await ejecutarSincronizacion();
  });
}

async function loadSyncStatus() {
  const port = window.api.getPort();

  try {
    const response = await fetch(`http://localhost:${port}/api/sincronizacion/estado`);
    const data = await response.json();

    if (data.success && data.status) {
      const status = data.status;
      document.getElementById('syncSucursal').textContent = status.sucursal;
      document.getElementById('syncPendientes').textContent = status.ventasPendientes;

      if (status.ultimaSincronizacion) {
        const fecha = new Date(status.ultimaSincronizacion.FechaHora);
        document.getElementById('syncUltima').textContent = fecha.toLocaleString('es-PE');
        document.getElementById('syncEstado').textContent = status.ultimaSincronizacion.Estado;

        const estadoElement = document.getElementById('syncEstado');
        if (status.ultimaSincronizacion.Estado === 'EXITOSA') {
          estadoElement.style.color = '#4caf50';
        } else {
          estadoElement.style.color = '#f44336';
        }
      } else {
        document.getElementById('syncUltima').textContent = 'Nunca';
        document.getElementById('syncEstado').textContent = 'Pendiente';
      }
    }
  } catch (error) {
    console.error('Error al cargar estado:', error);
  }
}

async function loadSyncLogs() {
  const port = window.api.getPort();
  const tbody = document.getElementById('syncLogsBody');

  try {
    const response = await fetch(`http://localhost:${port}/api/sincronizacion/logs`);
    const data = await response.json();

    if (data.success && data.logs) {
      if (data.logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">No hay registros de sincronizacion</td></tr>';
        return;
      }

      tbody.innerHTML = data.logs.map(log => {
        const fecha = new Date(log.FechaHora);
        const estadoClass = log.Estado === 'EXITOSA' ? 'sync-success' : 'sync-error';

        return `
          <tr>
            <td>${fecha.toLocaleString('es-PE')}</td>
            <td>${log.TipoSincronizacion}</td>
            <td><span class="sync-badge ${estadoClass}">${log.Estado}</span></td>
            <td>${log.Mensaje}</td>
          </tr>
        `;
      }).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">No hay registros</td></tr>';
    }

    lucide.createIcons();
  } catch (error) {
    console.error('Error al cargar logs:', error);
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: red;">Error al cargar historial</td></tr>';
  }
}

async function ejecutarSincronizacion() {
  const port = window.api.getPort();
  const btn = document.getElementById('btnEjecutarSync');

  btn.disabled = true;
  btn.innerHTML = '<i data-lucide="loader"></i> Sincronizando...';
  lucide.createIcons();

  try {
    const response = await fetch(`http://localhost:${port}/api/sincronizacion/ejecutar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();

    if (data.success) {
      alert(data.message);
      await loadSyncStatus();
      await loadSyncLogs();
    } else {
      alert(data.error || 'Error al sincronizar');
    }
  } catch (error) {
    console.error('Error al ejecutar sincronizacion:', error);
    alert('Error al sincronizar');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="refresh-cw"></i> Sincronizar Ahora';
    lucide.createIcons();
  }
}

function renderReportesPage() {
  const hoy = new Date().toISOString().split('T')[0];
  const hace7Dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  pageContent.innerHTML = `
    <div class="page-header">
      <h1>Reportes</h1>
      <p>Analisis y reportes</p>
    </div>

    <div class="report-tabs">
      <button class="report-tab active" data-tab="ventas">Ventas por Fecha</button>
      <button class="report-tab" data-tab="productos">Productos Mas Vendidos</button>
      <button class="report-tab" data-tab="vendedores">Ventas por Vendedor</button>
      <button class="report-tab" data-tab="stock">Productos Bajo Stock</button>
    </div>

    <div id="reportVentas" class="report-content active">
      <div class="content-card">
        <div class="report-filters">
          <div class="form-group">
            <label>Fecha Inicio</label>
            <input type="date" id="ventasFechaInicio" value="${hace7Dias}">
          </div>
          <div class="form-group">
            <label>Fecha Fin</label>
            <input type="date" id="ventasFechaFin" value="${hoy}">
          </div>
          <button class="btn-primary" id="btnGenerarReporteVentas">
            <i data-lucide="file-text"></i>
            Generar Reporte
          </button>
        </div>
        <div id="ventasReporte"></div>
      </div>
    </div>

    <div id="reportProductos" class="report-content">
      <div class="content-card">
        <div class="report-filters">
          <div class="form-group">
            <label>Fecha Inicio</label>
            <input type="date" id="productosFechaInicio" value="${hace7Dias}">
          </div>
          <div class="form-group">
            <label>Fecha Fin</label>
            <input type="date" id="productosFechaFin" value="${hoy}">
          </div>
          <div class="form-group">
            <label>Limite</label>
            <input type="number" id="productosLimite" value="10" min="5" max="50">
          </div>
          <button class="btn-primary" id="btnGenerarReporteProductos">
            <i data-lucide="file-text"></i>
            Generar Reporte
          </button>
        </div>
        <div id="productosReporte"></div>
      </div>
    </div>

    <div id="reportVendedores" class="report-content">
      <div class="content-card">
        <div class="report-filters">
          <div class="form-group">
            <label>Fecha Inicio</label>
            <input type="date" id="vendedoresFechaInicio" value="${hace7Dias}">
          </div>
          <div class="form-group">
            <label>Fecha Fin</label>
            <input type="date" id="vendedoresFechaFin" value="${hoy}">
          </div>
          <button class="btn-primary" id="btnGenerarReporteVendedores">
            <i data-lucide="file-text"></i>
            Generar Reporte
          </button>
        </div>
        <div id="vendedoresReporte"></div>
      </div>
    </div>

    <div id="reportStock" class="report-content">
      <div class="content-card">
        <button class="btn-primary" id="btnGenerarReporteStock">
          <i data-lucide="file-text"></i>
          Generar Reporte
        </button>
        <div id="stockReporte" style="margin-top: 20px;"></div>
      </div>
    </div>
  `;

  lucide.createIcons();

  setupReportTabs();
  setupReportHandlers();
}

function setupReportTabs() {
  const tabs = document.querySelectorAll('.report-tab');
  const contents = document.querySelectorAll('.report-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const tabId = tab.getAttribute('data-tab');
      document.getElementById(`report${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`).classList.add('active');
    });
  });
}

function setupReportHandlers() {
  document.getElementById('btnGenerarReporteVentas').addEventListener('click', generarReporteVentas);
  document.getElementById('btnGenerarReporteProductos').addEventListener('click', generarReporteProductos);
  document.getElementById('btnGenerarReporteVendedores').addEventListener('click', generarReporteVendedores);
  document.getElementById('btnGenerarReporteStock').addEventListener('click', generarReporteStock);
}

async function generarReporteVentas() {
  const port = window.api.getPort();
  const fechaInicio = document.getElementById('ventasFechaInicio').value;
  const fechaFin = document.getElementById('ventasFechaFin').value;
  const container = document.getElementById('ventasReporte');

  container.innerHTML = '<p style="text-align: center; padding: 20px;">Generando reporte...</p>';

  try {
    const response = await fetch(`http://localhost:${port}/api/reportes/ventas-por-fecha?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
    const data = await response.json();

    if (data.success) {
      container.innerHTML = `
        <div class="report-summary">
          <div class="summary-item">
            <h3>${data.resumen.cantidadVentas}</h3>
            <p>Total Ventas</p>
          </div>
          <div class="summary-item">
            <h3>S/ ${data.resumen.totalVentas.toFixed(2)}</h3>
            <p>Monto Total</p>
          </div>
          <div class="summary-item">
            <h3>S/ ${data.resumen.promedioVenta.toFixed(2)}</h3>
            <p>Promedio por Venta</p>
          </div>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Numero</th>
              <th>Fecha</th>
              <th>Vendedor</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${data.ventas.map(v => `
              <tr>
                <td>${v.NumeroVenta}</td>
                <td>${new Date(v.FechaVenta).toLocaleString('es-PE')}</td>
                <td>${v.Vendedor}</td>
                <td>S/ ${parseFloat(v.Total).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      container.innerHTML = '<p style="color: red; padding: 20px;">Error al generar reporte</p>';
    }
  } catch (error) {
    console.error('Error:', error);
    container.innerHTML = '<p style="color: red; padding: 20px;">Error al generar reporte</p>';
  }
}

async function generarReporteProductos() {
  const port = window.api.getPort();
  const fechaInicio = document.getElementById('productosFechaInicio').value;
  const fechaFin = document.getElementById('productosFechaFin').value;
  const limite = document.getElementById('productosLimite').value;
  const container = document.getElementById('productosReporte');

  container.innerHTML = '<p style="text-align: center; padding: 20px;">Generando reporte...</p>';

  try {
    const response = await fetch(`http://localhost:${port}/api/reportes/productos-mas-vendidos?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}&limite=${limite}`);
    const data = await response.json();

    if (data.success) {
      container.innerHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>Posicion</th>
              <th>Codigo</th>
              <th>Producto</th>
              <th>Cantidad Vendida</th>
              <th>Total Vendido</th>
            </tr>
          </thead>
          <tbody>
            ${data.productos.map((p, index) => `
              <tr>
                <td><strong>#${index + 1}</strong></td>
                <td>${p.Codigo}</td>
                <td>${p.Nombre}</td>
                <td>${p.CantidadVendida}</td>
                <td>S/ ${parseFloat(p.TotalVendido).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      container.innerHTML = '<p style="color: red; padding: 20px;">Error al generar reporte</p>';
    }
  } catch (error) {
    console.error('Error:', error);
    container.innerHTML = '<p style="color: red; padding: 20px;">Error al generar reporte</p>';
  }
}

async function generarReporteVendedores() {
  const port = window.api.getPort();
  const fechaInicio = document.getElementById('vendedoresFechaInicio').value;
  const fechaFin = document.getElementById('vendedoresFechaFin').value;
  const container = document.getElementById('vendedoresReporte');

  container.innerHTML = '<p style="text-align: center; padding: 20px;">Generando reporte...</p>';

  try {
    const response = await fetch(`http://localhost:${port}/api/reportes/ventas-por-vendedor?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
    const data = await response.json();

    if (data.success) {
      container.innerHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>Vendedor</th>
              <th>Cantidad de Ventas</th>
              <th>Total Vendido</th>
              <th>Promedio por Venta</th>
            </tr>
          </thead>
          <tbody>
            ${data.vendedores.map(v => `
              <tr>
                <td>${v.Vendedor}</td>
                <td>${v.CantidadVentas}</td>
                <td>S/ ${parseFloat(v.TotalVentas).toFixed(2)}</td>
                <td>S/ ${(parseFloat(v.TotalVentas) / v.CantidadVentas).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      container.innerHTML = '<p style="color: red; padding: 20px;">Error al generar reporte</p>';
    }
  } catch (error) {
    console.error('Error:', error);
    container.innerHTML = '<p style="color: red; padding: 20px;">Error al generar reporte</p>';
  }
}

async function generarReporteStock() {
  const port = window.api.getPort();
  const container = document.getElementById('stockReporte');

  container.innerHTML = '<p style="text-align: center; padding: 20px;">Generando reporte...</p>';

  try {
    const response = await fetch(`http://localhost:${port}/api/reportes/productos-bajo-stock`);
    const data = await response.json();

    if (data.success) {
      if (data.productos.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 20px; color: green;">No hay productos con stock bajo</p>';
        return;
      }

      container.innerHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Producto</th>
              <th>Stock Actual</th>
              <th>Stock Minimo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${data.productos.map(p => {
              const alerta = p.Stock === 0 ? 'AGOTADO' : 'BAJO STOCK';
              const color = p.Stock === 0 ? '#f44336' : '#ff9800';
              return `
                <tr>
                  <td>${p.Codigo}</td>
                  <td>${p.Nombre}</td>
                  <td style="color: ${color}; font-weight: bold;">${p.Stock}</td>
                  <td>${p.StockMinimo}</td>
                  <td><span class="sync-badge" style="background: ${color}20; color: ${color};">${alerta}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    } else {
      container.innerHTML = '<p style="color: red; padding: 20px;">Error al generar reporte</p>';
    }
  } catch (error) {
    console.error('Error:', error);
    container.innerHTML = '<p style="color: red; padding: 20px;">Error al generar reporte</p>';
  }
}

loadPage('home');
