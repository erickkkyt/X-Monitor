/**
 * 初始化应用服务
 * 这个函数应该在应用启动时被调用
 */
export function initializeServices() {
  console.log('正在初始化应用服务...');
  
  // 注册应用关闭事件处理程序
  registerShutdownHandlers();
  
  console.log('应用服务初始化完成');
}

/**
 * 注册应用关闭事件处理程序
 * 确保在应用关闭时正确清理资源
 */
function registerShutdownHandlers() {
  // 处理进程终止信号
  const handleShutdown = () => {
    console.log('应用正在关闭...');
    
    console.log('应用已安全关闭');
    process.exit(0);
  };
  
  // 注册进程信号处理程序
  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);
  process.on('SIGHUP', handleShutdown);
  
  // 处理未捕获的异常和拒绝
  process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error);
    handleShutdown();
  });
  
  process.on('unhandledRejection', (reason) => {
    console.error('未处理的Promise拒绝:', reason);
    // 对于未处理的Promise拒绝，我们记录但不立即关闭应用
  });
}