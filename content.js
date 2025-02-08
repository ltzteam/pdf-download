function processUrl(url) {
  // 将 r3-ndr-private 替换为 r3-ndr
  return url.replace('r3-ndr-private.', 'r3-ndr.');
}

function findPDFLinks() {
  const links = [];
  
  // 查找普通的PDF链接
  const allLinks = document.getElementsByTagName('a');
  for (const link of allLinks) {
    const href = link.href.toLowerCase();
    if (href.endsWith('.pdf') || href.includes('.pdf?')) {
      links.push({
        url: processUrl(link.href),
        text: link.textContent.trim() || '未命名PDF',
        headers: null
      });
    }
  }
  
  // 查找iframe中的PDF
  const iframes = document.getElementsByTagName('iframe');
  for (const iframe of iframes) {
    const src = iframe.src || '';
    if (src.includes('viewer.html?file=')) {
      try {
        const url = new URL(src);
        let pdfUrl = url.searchParams.get('file');
        let headers = url.searchParams.get('headers');
        
        if (pdfUrl) {
          pdfUrl = processUrl(pdfUrl);
          
          // 解析headers
          let parsedHeaders = null;
          if (headers) {
            try {
              parsedHeaders = JSON.parse(decodeURIComponent(headers));
            } catch (e) {
              console.error('解析headers时出错:', e);
            }
          }
          
          const decodedUrl = decodeURIComponent(pdfUrl);
          const fileName = decodedUrl.split('/').pop().split('?')[0];
          
          links.push({
            url: pdfUrl,
            text: fileName || '未命名PDF',
            headers: parsedHeaders
          });
        }
      } catch (e) {
        console.error('解析PDF URL时出错:', e);
      }
    }
  }
  
  return links;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'findPDFs') {
    const pdfLinks = findPDFLinks();
    sendResponse({ pdfLinks });
  }
}); 