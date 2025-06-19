const Helpers = {
    truncateText: (text, maxLength) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    },

    calculateAnimationDuration: (loadingStatus) => {
        const charsPerSecond = 100;
        const duration = Math.max(10, (loadingStatus.length || 0) / charsPerSecond);
        return `${duration}s`;
    }
};

