const API_URL = '/api';

// Utility functions
function showError(message) {
  const errorDiv = document.getElementById('error-message');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 5000);
}

function updateStatus(message, isError = false) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.style.color = isError ? '#ef4444' : '#10b981';
}

// Format uptime
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}

// Fetch and display system stats
async function fetchStats() {
  try {
    updateStatus('📊 Metrikleri güncelleniyor...');
    const response = await fetch(`${API_URL}/system/stats`);
    if (!response.ok) throw new Error('Stats API hatası');
    
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    
    const stats = data.data;
    
    // Update CPU
    const cpuUsage = parseFloat(stats.cpu.usage);
    document.getElementById('cpu-usage').textContent = cpuUsage.toFixed(1) + '%';
    document.getElementById('cpu-bar').style.width = Math.min(cpuUsage, 100) + '%';
    
    // Update Memory
    const memPercent = parseFloat(stats.memory.percent);
    document.getElementById('mem-usage').textContent = 
      `${stats.memory.used}GB / ${stats.memory.total}GB (${memPercent.toFixed(1)}%)`;
    document.getElementById('mem-bar').style.width = Math.min(memPercent, 100) + '%';
    
    // Update OS
    document.getElementById('os-info').textContent = `${stats.os.distro} ${stats.os.release}`;
    
    // Update Uptime
    document.getElementById('uptime-info').textContent = formatUptime(stats.os.uptime);
    
    updateStatus('✅ Metrikleri güncellendi');
    console.log('Stats updated:', stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    showError('Sistem metrikleri yüklenemedi: ' + error.message);
    updateStatus('❌ Hata oluştu', true);
  }
}

// Fetch and display Docker containers
async function fetchContainers() {
  try {
    updateStatus('🐳 Konteynerler yükleniyor...');
    const response = await fetch(`${API_URL}/docker/containers`);
    if (!response.ok) throw new Error('Containers API hatası');
    
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    
    const containers = data.data.containers;
    const containersList = document.getElementById('containers-list');
    
    if (containers.length === 0) {
      containersList.innerHTML = '<p class="loading">Aktif konteyner yok</p>';
      updateStatus('✅ 0 konteyner bulundu');
      return;
    }
    
    containersList.innerHTML = containers.map(container => {
      const isRunning = container.state === 'running';
      const statusClass = isRunning ? 'status-running' : 'status-stopped';
      const statusText = isRunning ? '🟢 Çalışıyor' : '🔴 Durduruldu';
      
      return `
        <div class="container-item">
          <div class="container-info">
            <div class="container-name">${container.name}</div>
            <div class="container-status">
              <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            <div class="container-status">Image: ${container.image}</div>
            <div class="container-status">ID: ${container.id.substring(0, 12)}</div>
          </div>
          <div class="container-actions">
            ${isRunning ? 
              `<button class="btn btn-danger" onclick="stopContainer('${container.id}')">⛔ Durdur</button>
               <button class="btn btn-secondary" onclick="removeContainer('${container.id}')">🗑️ Sil</button>` :
              `<button class="btn btn-primary" onclick="startContainer('${container.id}')">▶️ Başlat</button>
               <button class="btn btn-danger" onclick="removeContainer('${container.id}')">🗑️ Sil</button>`
            }
          </div>
        </div>
      `;
    }).join('');
    
    updateStatus(`✅ ${containers.length} konteyner bulundu`);
    console.log('Containers fetched:', containers);
  } catch (error) {
    console.error('Error fetching containers:', error);
    showError('Konteynerler yüklenemedi: ' + error.message);
    updateStatus('❌ Hata oluştu', true);
  }
}

// Start container
async function startContainer(containerId) {
  try {
    updateStatus(`▶️ Konteyner başlatılıyor...`);
    const response = await fetch(`${API_URL}/docker/container/${containerId}/start`, {
      method: 'POST',
    });
    const data = await response.json();
    
    if (!response.ok || !data.success) throw new Error(data.error || 'Başlatma hatası');
    
    updateStatus('✅ Konteyner başlatıldı');
    setTimeout(fetchContainers, 1000);
  } catch (error) {
    console.error('Error starting container:', error);
    showError('Konteyner başlatılamadı: ' + error.message);
    updateStatus('❌ Hata oluştu', true);
  }
}

// Stop container
async function stopContainer(containerId) {
  try {
    updateStatus(`⛔ Konteyner durdurluyor...`);
    const response = await fetch(`${API_URL}/docker/container/${containerId}/stop`, {
      method: 'POST',
    });
    const data = await response.json();
    
    if (!response.ok || !data.success) throw new Error(data.error || 'Durdurma hatası');
    
    updateStatus('✅ Konteyner durduruldu');
    setTimeout(fetchContainers, 1000);
  } catch (error) {
    console.error('Error stopping container:', error);
    showError('Konteyner durdurulamadı: ' + error.message);
    updateStatus('❌ Hata oluştu', true);
  }
}

// Remove container
async function removeContainer(containerId) {
  if (!confirm('Bu konteyneri silmek istediğinizden emin misiniz?')) return;
  
  try {
    updateStatus(`🗑️ Konteyner siliniyor...`);
    const response = await fetch(`${API_URL}/docker/container/${containerId}/remove`, {
      method: 'POST',
    });
    const data = await response.json();
    
    if (!response.ok || !data.success) throw new Error(data.error || 'Silme hatası');
    
    updateStatus('✅ Konteyner silindi');
    setTimeout(fetchContainers, 1000);
  } catch (error) {
    console.error('Error removing container:', error);
    showError('Konteyner silinemedi: ' + error.message);
    updateStatus('❌ Hata oluştu', true);
  }
}

// Fetch and display Docker images
async function fetchImages() {
  try {
    updateStatus('📦 İmalar yükleniyor...');
    const response = await fetch(`${API_URL}/docker/images`);
    if (!response.ok) throw new Error('Images API hatası');
    
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    
    const images = data.data.images;
    const imagesList = document.getElementById('images-list');
    
    if (images.length === 0) {
      imagesList.innerHTML = '<p class="loading">İma bulunamadı</p>';
      updateStatus('✅ 0 ima bulundu');
      return;
    }
    
    imagesList.innerHTML = images.map(image => {
      const tags = image.RepoTags ? image.RepoTags.join(', ') : 'untagged';
      const size = (image.Size / 1024 / 1024).toFixed(2);
      
      return `
        <div class="image-item">
          <div class="image-info">
            <div class="image-name">${tags}</div>
            <div class="image-repo">ID: ${image.Id.substring(0, 12)}</div>
            <div class="image-repo">Boyut: ${size}MB</div>
          </div>
        </div>
      `;
    }).join('');
    
    updateStatus(`✅ ${images.length} ima bulundu`);
    console.log('Images fetched:', images);
  } catch (error) {
    console.error('Error fetching images:', error);
    showError('İmalar yüklenemedi: ' + error.message);
    updateStatus('❌ Hata oluştu', true);
  }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  updateStatus('⏳ Başlatılıyor...');
  fetchStats();
  fetchContainers();
  fetchImages();
  
  // Auto-refresh every 30 seconds
  setInterval(fetchStats, 30000);
  setInterval(fetchContainers, 30000);
});
