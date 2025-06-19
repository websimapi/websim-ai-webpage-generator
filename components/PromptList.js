const PromptList = ({ prompts, onPromptClick, truncateText }) => {
    return React.createElement('div', {
        className: 'prompt-list-container'
    }, 
        prompts.slice().reverse().map(prompt => 
            React.createElement('span', {
                key: prompt.id,
                className: `prompt-item ${prompt.cachedHtml ? 'cached' : ''}`,
                onClick: () => onPromptClick(prompt.text, prompt.id),
                title: `${prompt.text}${prompt.cachedHtml ? ' (Cached - will iterate)' : ' (New generation)'}`
            }, [
                truncateText(prompt.text, 80),
                prompt.cachedHtml && React.createElement('i', {
                    key: 'cached-icon',
                    className: 'fas fa-sync-alt cached-icon'
                })
            ])
        )
    );
};

