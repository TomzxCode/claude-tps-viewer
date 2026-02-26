// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const cacheManager = new CacheManager();
    const chartRenderer = new ChartRenderer();
    const uiController = new UIController(chartRenderer);
    const fileHandler = new FileHandler(cacheManager);
    const sqliteHandler = new SQLiteHandler(cacheManager);

    window.app = {
        cacheManager,
        chartRenderer,
        uiController,
        fileHandler,
        sqliteHandler
    };
});
