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
    const [generatedPage, setGeneratedPage] = useState(null);
    const [showGeneratedPage, setShowGeneratedPage] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [inputValue, setInputValue] = useState("");

    const handleCreatePrompt = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await room.collection('prompts_v1').create({ text: inputValue });
            setInputValue("");
        } catch (error) {
            console.error("Failed to create prompt:", error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const truncateText = (text, maxLength) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    };

    const handlePromptClick = async (promptText) => {
        if (isLoading) return;

        setIsLoading(true);
        setLoadingProgress(0);
        setGeneratedPage(null);

        try {
            // Step 1: Analysis
            setLoadingStatus("Step 1/4: Analyzing prompt and planning structure...");
            setLoadingProgress(10);
            const analysisCompletion = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: "You are a web development planning assistant. Analyze the user's prompt and create a concise plan for building a webpage. Describe the key components, layout, and functionality. This plan will be used to guide the generation of HTML, CSS, and JavaScript." },
                    { role: "user", content: promptText },
                ],
            });
            const analysis = analysisCompletion.content;
            setLoadingProgress(25);

            // Step 2: HTML
            setLoadingStatus("Step 2/4: Generating HTML...");
            const htmlCompletion = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: "You are an expert HTML developer. Based on the user's prompt and the provided development plan, generate clean, semantic HTML code for the webpage. Do not include any CSS, JavaScript, or markdown formatting. Respond with only the raw HTML code inside a <body> tag." },
                    { role: "user", content: `Prompt: "${promptText}"\n\nDevelopment Plan: ${analysis}` },
                ],
            });
            const html = htmlCompletion.content.replace(/```html|```/g, '').trim();
            setLoadingProgress(50);

            // Step 3: CSS
            setLoadingStatus("Step 3/4: Generating CSS...");
            const cssCompletion = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: "You are an expert CSS developer. Based on the user's prompt, the development plan, and the provided HTML, generate CSS to style the webpage. Do not include any HTML, JavaScript, or markdown formatting. Respond with only the raw CSS code." },
                    { role: "user", content: `Prompt: "${promptText}"\n\nPlan: ${analysis}\n\nHTML:\n${html}` },
                ],
            });
            const css = cssCompletion.content.replace(/```css|```/g, '').trim();
            setLoadingProgress(75);

            // Step 4: JavaScript
            setLoadingStatus("Step 4/4: Generating JavaScript...");
            const jsCompletion = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: "You are an expert JavaScript developer. Based on the user's prompt, plan, HTML, and CSS, generate the necessary JavaScript to make the page interactive. Do not include any HTML, CSS, or markdown formatting. Respond with only the raw JavaScript code." },
                    { role: "user", content: `Prompt: "${promptText}"\n\nPlan: ${analysis}\n\nHTML:\n${html}` },
                ],
            });
            const js = jsCompletion.content.replace(/```javascript|```js|```/g, '').trim();
            setLoadingProgress(100);

            setGeneratedPage({ html, css, js });
            setLoadingStatus("Generation complete! Opening page...");
            setTimeout(() => {
                setShowGeneratedPage(true);
                setIsLoading(false);
            }, 500);

        } catch (error) {
            console.error("Error during page generation:", error);
            setLoadingStatus("An error occurred. Please try again.");
            setIsLoading(false);
        }
    };
    
    const handleCloseGeneratedPage = () => {
        setShowGeneratedPage(false);
        setGeneratedPage(null);
        setLoadingProgress(0);
        setLoadingStatus("");
    };

    return (
        <div className="app-container">
            <h1>AI Webpage Generator</h1>
            <p>Enter an idea, and the AI will build a webpage for it. Click on a previously generated idea to see it again.</p>
            <form className="prompt-form" onSubmit={handleCreatePrompt}>
                <input
                    type="text"
                    className="prompt-input"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="e.g., a photorealistic cat gallery with a dark mode toggle"
                    disabled={isLoading || isSubmitting}
                />
                <button type="submit" className="prompt-submit" disabled={isLoading || isSubmitting || !inputValue.trim()}>
                    {isSubmitting ? 'Saving...' : 'Save Idea'}
                </button>
            </form>

            {isLoading && (
                <div className="loading-bar-container" title={loadingStatus}>
                    <div className="loading-bar-progress" style={{ width: `${loadingProgress}%` }}></div>
                    <div className="loading-bar-text-container">
                        <p className="loading-bar-text">{loadingStatus}&nbsp;&nbsp;&nbsp;&nbsp;{loadingStatus}&nbsp;&nbsp;&nbsp;&nbsp;</p>
                    </div>
                </div>
            )}
            
            <div className="prompt-list-container">
                {prompts.slice().reverse().map(prompt => (
                    <span 
                        key={prompt.id} 
                        className="prompt-item" 
                        onClick={() => handlePromptClick(prompt.text)}
                        title={prompt.text}
                    >
                        {truncateText(prompt.text, 80)}
                    </span>
                ))}
            </div>

            {showGeneratedPage && generatedPage && (
                <GeneratedPageView page={generatedPage} onClose={handleCloseGeneratedPage} />
            )}
        </div>
    );
};

const GeneratedPageView = ({ page, onClose }) => {
    const iframeContent = `
        <html>
            <head>
                <style>${page.css}</style>
            </head>
            <body>
                ${page.html}
                <script>${page.js}<\/script>
            </body>
        </html>
    `;

    return (
        <div className="generated-page-view">
            <button className="close-button" onClick={onClose}>
                <i className="fas fa-times"></i>
            </button>
            <iframe
                className="generated-page-iframe"
                srcDoc={iframeContent}
                sandbox="allow-scripts allow-forms allow-same-origin"
            />
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

