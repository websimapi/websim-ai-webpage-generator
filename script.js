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
        setStepDescription("");
        setLoadingStatus("Initializing generation process...");

        try {
            const updateStatus = (text) => setLoadingStatus(text.replace(/\n/g, ' '));
            const updateStep = (text) => setStepDescription(text);

            // Step 1: Analysis
            updateStep("Step 1/8: Analyzing prompt and planning structure...");
            setLoadingProgress(5);
            const analysisCompletion = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: "You are a web development planning assistant. Analyze the user's prompt and create a concise plan for building a webpage. Describe the key components, layout, and functionality. This plan will be used to guide the generation of HTML, CSS, and JavaScript." },
                    { role: "user", content: promptText },
                ],
            });
            const analysis = analysisCompletion.content;
            updateStatus(analysis);
            setLoadingProgress(12.5);

            // Step 2: HTML (v1)
            updateStep("Step 2/8: Generating initial HTML...");
            const htmlCompletion_v1 = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: "You are an expert HTML developer. Based on the user's prompt and the provided development plan, generate clean, semantic HTML code for the webpage. Do not include any CSS, JavaScript, or markdown formatting. Respond with only the raw HTML code inside a <body> tag." },
                    { role: "user", content: `Prompt: "${promptText}"\n\nDevelopment Plan: ${analysis}` },
                ],
            });
            const html_v1 = htmlCompletion_v1.content.replace(/```html|```/g, '').trim();
            updateStatus(html_v1);
            setLoadingProgress(25);

            // Step 3: CSS (v1)
            updateStep("Step 3/8: Generating initial CSS...");
            const cssCompletion_v1 = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: "You are an expert CSS developer. Based on the user's prompt, the development plan, and the provided HTML, generate CSS to style the webpage. Do not include any HTML, JavaScript, or markdown formatting. Respond with only the raw CSS code." },
                    { role: "user", content: `Prompt: "${promptText}"\n\nPlan: ${analysis}\n\nHTML:\n${html_v1}` },
                ],
            });
            const css_v1 = cssCompletion_v1.content.replace(/```css|```/g, '').trim();
            updateStatus(css_v1);
            setLoadingProgress(37.5);

            // Step 4: JavaScript (v1)
            updateStep("Step 4/8: Generating initial JavaScript...");
            const jsCompletion_v1 = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: "You are an expert JavaScript developer. Based on the user's prompt, plan, and HTML, generate the necessary JavaScript to make the page interactive. Do not include any HTML, CSS, or markdown formatting. Respond with only the raw JavaScript code." },
                    { role: "user", content: `Prompt: "${promptText}"\n\nPlan: ${analysis}\n\nHTML:\n${html_v1}` },
                ],
            });
            const js_v1 = jsCompletion_v1.content.replace(/```javascript|```js|```/g, '').trim();
            updateStatus(js_v1);
            setLoadingProgress(50);

            // Step 5: Critique
            updateStep("Step 5/8: Critiquing generated code...");
            const critiqueCompletion = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: "You are a senior web developer performing a code review. Analyze the provided HTML, CSS, and JavaScript. Provide a concise critique and actionable suggestions for improvement in terms of structure, style, functionality, and best practices. This critique will guide a second generation pass." },
                    { role: "user", content: `Original Prompt: "${promptText}"\n\nHTML:\n${html_v1}\n\nCSS:\n${css_v1}\n\nJavaScript:\n${js_v1}` },
                ],
            });
            const critique = critiqueCompletion.content;
            updateStatus(critique);
            setLoadingProgress(62.5);

            // Step 6: HTML (v2)
            updateStep("Step 6/8: Refining HTML based on critique...");
            const htmlCompletion_v2 = await websim.chat.completions.create({
                 messages: [
                    { role: "system", content: "You are an expert HTML developer. Revise the initial HTML based on the provided critique to improve it. Respond with only the complete, raw, revised HTML code for the <body> tag." },
                    { role: "user", content: `Critique:\n${critique}\n\nOriginal HTML:\n${html_v1}` },
                ],
            });
            const html_v2 = htmlCompletion_v2.content.replace(/```html|```/g, '').trim();
            updateStatus(html_v2);
            setLoadingProgress(75);

            // Step 7: CSS (v2)
            updateStep("Step 7/8: Refining CSS based on critique...");
            const cssCompletion_v2 = await websim.chat.completions.create({
                 messages: [
                    { role: "system", content: "You are an expert CSS developer. Revise the initial CSS based on the provided critique and the (potentially updated) HTML. Respond with only the complete, raw, revised CSS code." },
                    { role: "user", content: `Critique:\n${critique}\n\nRevised HTML:\n${html_v2}\n\nOriginal CSS:\n${css_v1}` },
                ],
            });
            const css_v2 = cssCompletion_v2.content.replace(/```css|```/g, '').trim();
            updateStatus(css_v2);
            setLoadingProgress(87.5);

            // Step 8: JavaScript (v2)
            updateStep("Step 8/8: Refining JavaScript based on critique...");
            const jsCompletion_v2 = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: "You are an expert JavaScript developer. Revise the initial JavaScript based on the provided critique and the revised HTML. Respond with only the complete, raw, revised JavaScript code." },
                    { role: "user", content: `Critique:\n${critique}\n\nRevised HTML:\n${html_v2}\n\nOriginal JavaScript:\n${js_v1}` },
                ],
            });
            const js_v2 = jsCompletion_v2.content.replace(/```javascript|```js|```/g, '').trim();
            updateStatus(js_v2);
            setLoadingProgress(100);

            setGeneratedPage({ html: html_v2, css: css_v2, js: js_v2 });
            updateStep("Generation complete! Opening page...");
            updateStatus("All steps completed successfully!");
            setTimeout(() => {
                setShowGeneratedPage(true);
                setIsLoading(false);
            }, 500);

        } catch (error) {
            console.error("Error during page generation:", error);
            updateStep("An error occurred. Please try again.");
            updateStatus(error.message || "An unknown error occurred.");
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
        // Adjust scroll speed based on text length to keep it readable
        const charsPerSecond = 100;
        const duration = Math.max(10, (loadingStatus.length || 0) / charsPerSecond);
        return `${duration}s`;
    }, [loadingStatus]);

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
                <div className="loading-bar-container" title={stepDescription}>
                    <div className="loading-bar-progress" style={{ width: `${loadingProgress}%` }}></div>
                    <div className="loading-bar-text-container">
                        <div className="loading-bar-text" style={{ animationDuration }}>
                            <span className="loading-bar-text-segment">{loadingStatus}</span>
                            <span className="loading-bar-text-segment">{loadingStatus}</span>
                        </div>
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