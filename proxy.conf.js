/**
 * For more configuration, please refer to https://angular.io/guide/build#proxying-to-a-backend-server
 *
 * 更多配置描述请参考 https://angular.cn/guide/build#proxying-to-a-backend-server
 *
 * Note: The proxy is only valid for real requests, Mock does not actually generate requests, so the priority of Mock will be higher than the proxy
 */
module.exports = {
    /**
     * The following means that all requests are directed to the backend `https://localhost:9000/`
     */
    '/': {
        // target: 'https://zeus-pre.ideamake.cn/daas-admin',
        // secure: true, // Ignore invalid SSL certificates
        // target: 'https://www.erupt.xyz/demo',
        // secure: true,
        target: 'http://localhost:9999',
        changeOrigin: true,
        // target: 'https://www.erupt.xyz/demo',
        // secure: true, // SSL certificates
        // changeOrigin: true
    }
};
