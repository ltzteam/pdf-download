document.addEventListener('DOMContentLoaded', () => {
  const pdfList = document.getElementById('pdfList');
  
  function showLoading(message = '正在扫描PDF文件...') {
    pdfList.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <div class="message">${message}</div>
      </div>
    `;
  }
  
  function showError(message) {
    pdfList.innerHTML = `<p style="color: #e74c3c;">${message}</p>`;
  }
  
  function showPDFs(pdfs) {
    if (!pdfs || pdfs.length === 0) {
      pdfList.innerHTML = '<p>当前页面未找到 PDF 文件</p>';
      return;
    }
    
    pdfList.innerHTML = '';
    pdfs.forEach(pdf => {
      const button = document.createElement('button');
      button.textContent = `下载: ${pdf.text}`;
      button.onclick = () => {
        const filename = pdf.text.replace(/[<>:"/\\|?*]/g, '_') + '.pdf';
        chrome.runtime.sendMessage({
          action: 'downloadWithHeaders',
          url: pdf.url,
          filename: filename,
          headers: pdf.headers
        });
      };
      pdfList.appendChild(button);
    });
  }

  // 检查当前标签页
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]?.id) {
      showError('无法在此页面使用');
      return;
    }

    showLoading();

    // 先检查标签页是否可以访问
    chrome.tabs.sendMessage(tabs[0].id, { action: 'ping' }, response => {
      if (chrome.runtime.lastError) {
        showError('请刷新页面后重试');
        return;
      }

      // 如果可以连接，则发送查找PDF的消息
      chrome.tabs.sendMessage(tabs[0].id, { action: 'findPDFs' }, (response) => {
        if (response && response.pdfLinks) {
          showPDFs(response.pdfLinks);
        } else {
          showError('获取PDF信息失败');
        }
      });
    });
  });
}); 