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
      ventasManager.render();
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

