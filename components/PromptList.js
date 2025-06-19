const PromptList = ({ prompts, onPromptClick, truncateText }) => {
    return React.createElement('div', {
        className: 'prompt-list-container'
    }, 
        prompts.slice().reverse().map(prompt => 
            React.createElement('span', {
                key: prompt.id,
                className: 'prompt-item',
                onClick: () => onPromptClick(prompt.text),
                title: prompt.text
            }, truncateText(prompt.text, 80))
        )
    );
};

