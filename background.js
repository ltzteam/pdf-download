chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'downloadWithHeaders') {
    const { url, filename, headers } = request;
    
    // 直接使用 chrome.downloads.download 下载
    chrome.downloads.download({
      url: url,
      filename: filename,
      headers: Object.entries(headers || {}).map(([name, value]) => ({
        name,
        value: value.toString()
      })),
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('下载出错:', chrome.runtime.lastError);
      }
    });
    
    return true; // 保持消息通道开放
  }
}); 