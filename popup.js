document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'findPDFs' }, (response) => {
      const pdfList = document.getElementById('pdfList');
      
      if (response && response.pdfLinks.length > 0) {
        response.pdfLinks.forEach(pdf => {
          const button = document.createElement('button');
          button.textContent = `下载: ${pdf.text}`;
          button.onclick = () => {
            const filename = pdf.text.replace(/[<>:"/\\|?*]/g, '_') + '.pdf';
            
            // 发送消息给 background script 处理下载
            chrome.runtime.sendMessage({
              action: 'downloadWithHeaders',
              url: pdf.url,
              filename: filename,
              headers: pdf.headers
            });
          };
          pdfList.appendChild(button);
        });
      } else {
        pdfList.innerHTML = '<p>当前页面未找到 PDF 文件</p>';
      }
    });
  });
}); 