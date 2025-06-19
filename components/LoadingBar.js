const LoadingBar = ({ isLoading, loadingProgress, loadingStatus, stepDescription, animationDuration }) => {
    if (!isLoading) return null;

    return React.createElement('div', {
        className: 'loading-bar-container',
        title: stepDescription
    }, [
        React.createElement('div', {
            key: 'progress',
            className: 'loading-bar-progress',
            style: { width: `${loadingProgress}%` }
        }),
        React.createElement('div', {
            key: 'text-container',
            className: 'loading-bar-text-container'
        }, 
            React.createElement('div', {
                className: 'loading-bar-text',
                style: { animationDuration }
            }, [
                React.createElement('span', {
                    key: 'segment1',
                    className: 'loading-bar-text-segment'
                }, loadingStatus),
                React.createElement('span', {
                    key: 'segment2',
                    className: 'loading-bar-text-segment'
                }, loadingStatus)
            ])
        )
    ]);
};