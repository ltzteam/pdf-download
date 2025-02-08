document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'findPDFs' }, (response) => {
      const pdfList = document.getElementById('pdfList');
      
      if (response && response.pdfLinks.length > 0) {
        response.pdfLinks.forEach(pdf => {
          const button = document.createElement('button');
          button.textContent = `下载: ${pdf.text}`;
          button.onclick = () => {
            // 创建下载选项
            const downloadOptions = {
              url: pdf.url,
              filename: pdf.text.replace(/[<>:"/\\|?*]/g, '_') + '.pdf'
            };

            // 如果有headers，添加到URL中
            if (pdf.headers) {
              const urlObj = new URL(pdf.url);
              // 将headers作为查询参数添加到URL中
              Object.entries(pdf.headers).forEach(([key, value]) => {
                urlObj.searchParams.append(key, value);
              });
              downloadOptions.url = urlObj.toString();
            }

            chrome.downloads.download(downloadOptions);
          };
          pdfList.appendChild(button);
        });
      } else {
        pdfList.innerHTML = '<p>当前页面未找到 PDF 文件</p>';
      }
    });
  });
}); 