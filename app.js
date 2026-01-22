// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const cacheManager = new CacheManager();
    const chartRenderer = new ChartRenderer();
    const uiController = new UIController(chartRenderer);
    const fileHandler = new FileHandler(cacheManager);

    // Expose for debugging
    window.app = {
        cacheManager,
        chartRenderer,
        uiController,
        fileHandler
    };
});
