const PromptForm = ({ onSubmit, isLoading, isSubmitting, inputValue, setInputValue }) => {
    return React.createElement('form', {
        className: 'prompt-form',
        onSubmit: onSubmit
    }, [
        React.createElement('input', {
            key: 'input',
            type: 'text',
            className: 'prompt-input',
            value: inputValue,
            onChange: (e) => setInputValue(e.target.value),
            placeholder: 'e.g., a photorealistic cat gallery with a dark mode toggle',
            disabled: isLoading || isSubmitting
        }),
        React.createElement('button', {
            key: 'button',
            type: 'submit',
            className: 'prompt-submit',
            disabled: isLoading || isSubmitting || !inputValue.trim()
        }, isSubmitting ? 'Saving...' : 'Save Idea')
    ]);
};