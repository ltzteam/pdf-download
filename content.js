function processUrl(url) {
  // 将 r3-ndr-private 替换为 r3-ndr
  const processedUrl = url.replace('r3-ndr-private.', 'r3-ndr.');
  console.log('原始URL:', url);
  console.log('处理后URL:', processedUrl);
  return processedUrl;
}

function findPDFLinks() {
  const links = [];
  
  // 查找普通的PDF链接
  const allLinks = document.getElementsByTagName('a');
  for (const link of allLinks) {
    const href = link.href.toLowerCase();
    if (href.endsWith('.pdf') || href.includes('.pdf?')) {
      console.log('找到普通PDF链接:', href);
      links.push({
        url: processUrl(link.href),
        text: link.textContent.trim() || '未命名PDF',
        headers: null
      });
    }
  }
  
  // 查找iframe中的PDF
  const iframes = document.getElementsByTagName('iframe');
  console.log('找到的iframe数量:', iframes.length);
  
  for (const iframe of iframes) {
    const src = iframe.src || '';
    console.log('检查iframe src:', src);
    
    // 特别处理 pdfPlayerFirefox iframe
    if (iframe.id === 'pdfPlayerFirefox') {
      console.log('找到 pdfPlayerFirefox iframe');
      try {
        const url = new URL(src);
        let pdfUrl = url.searchParams.get('file');
        let headers = url.searchParams.get('headers');
        
        console.log('从iframe提取的PDF URL:', pdfUrl);
        console.log('从iframe提取的headers:', headers);
        
        if (pdfUrl) {
          pdfUrl = processUrl(pdfUrl);
          
          // 解析headers
          let parsedHeaders = null;
          if (headers) {
            try {
              parsedHeaders = JSON.parse(decodeURIComponent(headers));
              console.log('解析后的headers:', parsedHeaders);
            } catch (e) {
              console.error('解析headers时出错:', e);
            }
          }
          
          const decodedUrl = decodeURIComponent(pdfUrl);
          const fileName = decodedUrl.split('/').pop().split('?')[0];
          
          console.log('最终PDF信息:', {
            url: pdfUrl,
            fileName: fileName,
            headers: parsedHeaders
          });
          
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
  
  console.log('找到的所有PDF链接:', links);
  return links;
}

// 定期检查PDF链接
function checkForPDFs() {
  const pdfLinks = findPDFLinks();
  if (pdfLinks.length > 0) {
    console.log('找到PDF链接，停止检查');
    return pdfLinks;
  }
  
  // 如果没有找到PDF链接，继续检查
  console.log('未找到PDF链接，1秒后重试');
  setTimeout(checkForPDFs, 1000);
}

// 监听消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'findPDFs') {
    // 开始检查PDF链接
    const pdfLinks = findPDFLinks();
    if (pdfLinks.length > 0) {
      sendResponse({ pdfLinks });
    } else {
      // 如果没有立即找到，开始定期检查
      setTimeout(() => {
        const retryLinks = findPDFLinks();
        sendResponse({ pdfLinks: retryLinks });
      }, 1000);
      return true; // 保持消息通道开放
    }
  }
});

// 页面加载完成后开始检查
document.addEventListener('DOMContentLoaded', () => {
  console.log('页面加载完成，开始检查PDF');
  checkForPDFs();
});

// 监听动态内容变化
const observer = new MutationObserver((mutations) => {
  console.log('检测到页面变化，重新检查PDF');
  checkForPDFs();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
}); 