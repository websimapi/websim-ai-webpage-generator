const { useState, useEffect, useSyncExternalStore, useMemo } = React;

const room = new WebsimSocket();

const App = () => {
    const prompts = useSyncExternalStore(
        room.collection('prompts_v1').subscribe,
        room.collection('prompts_v1').getList
    ) || [];

    const [isLoading, setIsLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingStatus, setLoadingStatus] = useState("");
    const [stepDescription, setStepDescription] = useState("");
    const [generatedPage, setGeneratedPage] = useState(null);
    const [showGeneratedPage, setShowGeneratedPage] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [inputValue, setInputValue] = useState("");

    const handleCreatePrompt = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || isSubmitting) return;
        setIsSubmitting(true);
        console.log("Creating new prompt:", inputValue);
        try {
            await room.collection('prompts_v1').create({ text: inputValue });
            setInputValue("");
        } catch (error) {
            console.error("Failed to create prompt:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePromptClick = async (promptText, promptId) => {
        if (isLoading) return;

        setIsLoading(true);
        setLoadingProgress(0);
        setGeneratedPage(null);
        setStepDescription("");
        setLoadingStatus("Initializing generation process...");

        const updateCallbacks = {
            updateProgress: (step) => setLoadingProgress((step / 12) * 100),
            updateStatus: (text) => {
                const cleanText = text.replace(/\n/g, ' ');
                setLoadingStatus(cleanText);
                console.log("Status Update:", cleanText);
            },
            updateStep: (text) => {
                setStepDescription(text);
                console.log("Current Step:", text);
            }
        };

        try {
            // Check if this prompt has cached results
            const promptRecord = prompts.find(p => p.id === promptId);
            const hasCachedResults = promptRecord && promptRecord.cachedHtml;
            
            let result;
            if (hasCachedResults) {
                updateCallbacks.updateStatus("Found cached version - iterating to improve it...");
                console.log("Using cached results as starting point for iteration");
                result = await PageGenerator.iterateOnCachedPage(
                    promptText, 
                    {
                        html: promptRecord.cachedHtml,
                        css: promptRecord.cachedCss,
                        js: promptRecord.cachedJs
                    },
                    updateCallbacks
                );
            } else {
                updateCallbacks.updateStatus("No cached version found - generating from scratch...");
                console.log("No cached results found, generating from scratch");
                result = await PageGenerator.generatePage(promptText, updateCallbacks);
            }
            
            // Cache the results
            console.log("Caching generated results...");
            await room.collection('prompts_v1').update(promptId, {
                cachedHtml: result.html,
                cachedCss: result.css,
                cachedJs: result.js,
                lastGenerated: new Date().toISOString()
            });
            
            setGeneratedPage(result);
            updateCallbacks.updateStep("Generation complete! Opening page...");
            updateCallbacks.updateStatus("All steps completed successfully!");
            setTimeout(() => {
                setShowGeneratedPage(true);
                setIsLoading(false);
            }, 500);
        } catch (error) {
            console.error("Error during page generation:", error);
            updateCallbacks.updateStep("An error occurred. Please try again.");
            updateCallbacks.updateStatus(error.message || "An unknown error occurred.");
            setIsLoading(false);
        }
    };
    
    const handleCloseGeneratedPage = () => {
        setShowGeneratedPage(false);
        setGeneratedPage(null);
        setLoadingProgress(0);
        setLoadingStatus("");
    };

    const animationDuration = useMemo(() => {
        return Helpers.calculateAnimationDuration(loadingStatus);
    }, [loadingStatus]);

    return React.createElement('div', {
        className: 'app-container'
    }, [
        React.createElement('h1', { key: 'title' }, 'AI Webpage Generator'),
        React.createElement('p', { key: 'description' }, 'Enter an idea, and the AI will build a webpage for it. Click on a previously generated idea to see it again.'),
        React.createElement(PromptForm, {
            key: 'prompt-form',
            onSubmit: handleCreatePrompt,
            isLoading,
            isSubmitting,
            inputValue,
            setInputValue
        }),
        React.createElement(LoadingBar, {
            key: 'loading-bar',
            isLoading,
            loadingProgress,
            loadingStatus,
            stepDescription,
            animationDuration
        }),
        React.createElement(PromptList, {
            key: 'prompt-list',
            prompts,
            onPromptClick: handlePromptClick,
            truncateText: Helpers.truncateText
        }),
        showGeneratedPage && generatedPage && React.createElement(GeneratedPageView, {
            key: 'generated-page',
            page: generatedPage,
            onClose: handleCloseGeneratedPage
        })
    ]);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));