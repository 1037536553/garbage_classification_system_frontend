export const baseURL1='http://172.20.10.8:5000';
export const baseURL2='http://10.242.22.231:5000';
export const baseURL3='http://192.168.171.23:5000';

export const baseURL4='http://192.168.171.110:5000';
// config.js (简化版)
export const baseURL = (() => {
    // 尝试从localStorage读取缓存
    const cachedURL = localStorage.getItem('apiBaseURL');
    if (cachedURL) return cachedURL;
    
    // 根据当前域名自动判断
    const hostname = window.location.hostname;
    
    if (hostname.startsWith('192.168.171')) {
        return baseURL4;
    } else if (hostname.startsWith('172.20.10')) {
        return baseURL1;
    } else if (hostname.startsWith('10.242.22')) {
        return baseURL2;
    }
    
    // 默认URL
    return 'http://192.168.171.110:5000';
})();

// 在应用启动时可以缓存URL
// localStorage.setItem('apiBaseURL', baseURL);