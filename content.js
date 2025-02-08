function processUrl(url) {
  // 将 r3-ndr-private 替换为 r3-ndr
  const processedUrl = url.replace('r3-ndr-private.', 'r3-ndr.');
  console.log('原始URL:', url);
  console.log('处理后URL:', processedUrl);
  return processedUrl;
}

function getPDFTitle() {
  // 尝试从URL中获取文件名（URL中包含了完整的书名）
  const pdfIframe = document.getElementById('pdfPlayerFirefox');
  if (pdfIframe && pdfIframe.src) {
    try {
      const url = new URL(pdfIframe.src);
      const fileUrl = url.searchParams.get('file');
      if (fileUrl) {
        const decodedUrl = decodeURIComponent(fileUrl);
        // 从路径中提取文件名
        const fileName = decodedUrl.split('/').pop();
        // 移除文件名末尾的时间戳（如果存在）
        const cleanName = fileName.replace(/_\d+\.pdf$/, '.pdf');
        return cleanName;
      }
    } catch (e) {
      console.error('解析PDF文件名时出错:', e);
    }
  }

  // 尝试从父窗口获取标题
  try {
    // 尝试从页面中获取标题
    const titleElement = document.querySelector('.book-title, .pdf-title, h1');
    if (titleElement) {
      return titleElement.textContent.trim();
    }
    
    // 尝试从面包屑导航获取
    const breadcrumb = document.querySelector('.breadcrumb');
    if (breadcrumb) {
      const lastItem = breadcrumb.lastElementChild;
      if (lastItem) {
        return lastItem.textContent.trim();
      }
    }
  } catch (e) {
    console.error('获取页面标题时出错:', e);
  }
  
  return null;
}

function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkElement = () => {
      const element = document.getElementById(selector);
      if (element) {
        console.log('找到元素:', selector);
        resolve(element);
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        console.log('等待元素超时:', selector);
        reject(new Error('等待元素超时'));
        return;
      }
      
      setTimeout(checkElement, 500);
    };
    
    checkElement();
  });
}

async function findPDFLinks() {
  const links = [];
  
  try {
    // 等待 iframe 加载
    const iframe = await waitForElement('pdfPlayerFirefox');
    console.log('找到 PDF iframe:', iframe);
    
    // 等待 iframe 的 src 属性设置完成
    if (!iframe.src) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const src = iframe.src;
    console.log('iframe src:', src);
    
    if (src) {
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
          const fileName = decodedUrl.split('/').pop().replace(/_\d+\.pdf$/, '.pdf');
          
          console.log('最终PDF信息:', {
            url: pdfUrl,
            fileName: fileName,
            headers: parsedHeaders
          });
          
          links.push({
            url: pdfUrl,
            text: fileName,
            headers: parsedHeaders
          });
        }
      } catch (e) {
        console.error('解析PDF URL时出错:', e);
      }
    }
  } catch (e) {
    console.error('查找PDF链接时出错:', e);
  }
  
  console.log('找到的所有PDF链接:', links);
  return links;
}

// 监听消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    sendResponse({ status: 'ok' });
    return;
  }
  
  if (request.action === 'findPDFs') {
    findPDFLinks().then(pdfLinks => {
      sendResponse({ pdfLinks });
    });
    return true; // 保持消息通道开放
  }
});

// 监听动态内容变化
const observer = new MutationObserver((mutations) => {
  console.log('检测到页面变化');
});

observer.observe(document.body, {
  childList: true,
  subtree: true
}); 