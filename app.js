// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const chartRenderer = new ChartRenderer();
    const uiController = new UIController(chartRenderer);
    const fileHandler = new FileHandler();

    // Expose for debugging
    window.app = {
        chartRenderer,
        uiController,
        fileHandler
    };
});
