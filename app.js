async function fetchSampleConfig() {
  try {
    const response = await fetch('/api/sample-config');
    if (!response.ok) throw new Error('Örnek yapılandırma yüklenemedi.');
    const text = await response.text();
    document.getElementById('yaml-editor').value = text;
  } catch (error) {
    document.getElementById('yaml-status').textContent = error.message;
    document.getElementById('yaml-status').classList.add('alert-error');
  }
}

async function parseYamlConfig() {
  const yamlText = document.getElementById('yaml-editor').value;
  const status = document.getElementById('yaml-status');
  const resultBox = document.getElementById('yaml-result');
  status.textContent = 'YAML analiz ediliyor...';
  status.className = 'alert';
  resultBox.textContent = '';

  try {
    const response = await fetch('/api/parse-yaml', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: yamlText,
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'YAML çözümlenemedi.');
    }

    status.textContent = 'YAML başarıyla çözümlandı.';
    status.classList.add('alert-success');
    resultBox.textContent = JSON.stringify(data.data, null, 2);
  } catch (error) {
    status.textContent = error.message;
    status.classList.add('alert-error');
  }
}

async function loadNetworkConfig() {
  try {
    const response = await fetch('/api/network');
    if (!response.ok) throw new Error('Ağ yapılandırması yüklenemedi.');
    const config = await response.json();
    document.getElementById('network-mode').value = config.mode;
    document.getElementById('network-ip').value = config.ip;
    document.getElementById('network-gateway').value = config.gateway;
    document.getElementById('network-dns').value = config.dns.join(', ');
  } catch (error) {
    document.getElementById('network-status').textContent = error.message;
    document.getElementById('network-status').classList.add('alert-error');
  }
}

async function submitNetworkConfig(event) {
  event.preventDefault();
  const status = document.getElementById('network-status');
  status.textContent = 'Ağ yapılandırması güncelleniyor...';
  status.className = 'alert';

  const payload = {
    mode: document.getElementById('network-mode').value,
    ip: document.getElementById('network-ip').value,
    gateway: document.getElementById('network-gateway').value,
    dns: document.getElementById('network-dns').value,
  };

  try {
    const response = await fetch('/api/network', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) throw new Error('Ağ yapılandırması kaydedilemedi.');
    status.textContent = 'Ağ ayarları başarıyla güncellendi.';
    status.classList.add('alert-success');
    await loadNetworkConfig();
  } catch (error) {
    status.textContent = error.message;
    status.classList.add('alert-error');
  }
}

function attachEventHandlers() {
  document.getElementById('yaml-parse-button').addEventListener('click', parseYamlConfig);
  document.getElementById('network-form').addEventListener('submit', submitNetworkConfig);
}

window.addEventListener('DOMContentLoaded', () => {
  fetchSampleConfig();
  loadNetworkConfig();
  attachEventHandlers();
});
