const PageGenerator = {
    async generatePage(promptText, updateCallbacks) {
        const { updateProgress, updateStatus, updateStep } = updateCallbacks;
        const TOTAL_STEPS = 12;

        console.log(`Starting generation for prompt: "${promptText}"`);

        try {
            // Step 1: Analysis
            updateStep(`Step 1/${TOTAL_STEPS}: Analyzing prompt and planning structure...`);
            updateProgress(0);
            const analysisCompletion = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: "You are a web development planning assistant. Analyze the user's prompt and create a concise plan for building a webpage. Describe the key components, layout, and functionality. This plan will be used to guide the generation of HTML, CSS, and JavaScript." },
                    { role: "user", content: promptText },
                ],
            });
            const analysis = analysisCompletion.content;
            updateStatus(analysis);
            updateProgress(1);

            // Step 2: HTML (v1)
            updateStep(`Step 2/${TOTAL_STEPS}: Generating initial HTML...`);
            const htmlCompletion_v1 = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: "You are an expert HTML developer. Based on the user's prompt and the provided development plan, generate clean, semantic HTML code for the webpage. Do not include any CSS, JavaScript, or markdown formatting. Respond with only the raw HTML code inside a <body> tag." },
                    { role: "user", content: `Prompt: "${promptText}"\n\nDevelopment Plan: ${analysis}` },
                ],
            });
            const html_v1 = htmlCompletion_v1.content.replace(/```html|```/g, '').trim();
            updateStatus(html_v1);
            updateProgress(2);

            // Step 3: CSS (v1)
            updateStep(`Step 3/${TOTAL_STEPS}: Generating initial CSS...`);
            const cssCompletion_v1 = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: "You are an expert CSS developer. Based on the user's prompt, the development plan, and the provided HTML, generate CSS to style the webpage. Do not include any HTML, JavaScript, or markdown formatting. Respond with only the raw CSS code." },
                    { role: "user", content: `Prompt: "${promptText}"\n\nPlan: ${analysis}\n\nHTML:\n${html_v1}` },
                ],
            });
            const css_v1 = cssCompletion_v1.content.replace(/```css|```/g, '').trim();
            updateStatus(css_v1);
            updateProgress(3);

            // Step 4: JavaScript (v1)
            updateStep(`Step 4/${TOTAL_STEPS}: Generating initial JavaScript...`);
            const jsCompletion_v1 = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: "You are an expert JavaScript developer. Based on the user's prompt, plan, and HTML, generate the necessary JavaScript to make the page interactive. Do not include any HTML, CSS, or markdown formatting. Respond with only the raw JavaScript code." },
                    { role: "user", content: `Prompt: "${promptText}"\n\nPlan: ${analysis}\n\nHTML:\n${html_v1}` },
                ],
            });
            const js_v1 = jsCompletion_v1.content.replace(/```javascript|```js|```/g, '').trim();
            updateStatus(js_v1);
            updateProgress(4);

            // Step 5: Visual Critique with Screenshot
            updateStep(`Step 5/${TOTAL_STEPS}: Capturing screenshot and performing visual critique...`);
            updateStatus("Generating screenshot for visual analysis...");
            const screenshotUrl = await this.takeScreenshot(html_v1, css_v1, js_v1);
            updateStatus("Screenshot captured, analyzing visual implementation...");

            const critiqueCompletion_v1 = await websim.chat.completions.create({
                messages: [
                     {
                        role: "system",
                        content: "You are a senior web developer and UI/UX expert. Analyze the provided screenshot and code (HTML, CSS, JavaScript). Provide a detailed critique focusing on: 1) Visual appeal and layout quality, 2) Functionality and user experience, 3) Responsiveness and accessibility, 4) Code structure and best practices. Offer specific, actionable suggestions for improvement. This critique will guide the next iteration."
                    },
                    {
                        role: "user",
                        content: [
                            { 
                                type: "text", 
                                text: `Original Prompt: "${promptText}"\n\nAnalyze this first implementation. What works well visually and functionally? What specific improvements are needed?\n\nHTML:\n${html_v1}\n\nCSS:\n${css_v1}\n\nJavaScript:\n${js_v1}`
                            },
                            {
                                type: "image_url",
                                image_url: { url: screenshotUrl },
                            },
                        ],
                    },
                ],
            });
            const critique_v1 = critiqueCompletion_v1.content;
            updateStatus(`Visual analysis complete: ${critique_v1.substring(0, 200)}...`);
            console.log("Step 5 - Visual Critique v1:", critique_v1);
            updateProgress(5);

            // Step 6: HTML (v2)
            updateStep(`Step 6/${TOTAL_STEPS}: Refining HTML based on visual critique...`);
            const htmlCompletion_v2 = await websim.chat.completions.create({
                 messages: [
                    { role: "system", content: "You are an expert HTML developer. Revise the initial HTML based on the provided critique to improve it. Respond with only the complete, raw, revised HTML code for the <body> tag." },
                    { role: "user", content: `Critique:\n${critique_v1}\n\nOriginal HTML:\n${html_v1}` },
                ],
            });
            const html_v2 = htmlCompletion_v2.content.replace(/```html|```/g, '').trim();
            updateStatus(html_v2);
            updateProgress(6);

            // Step 7: CSS (v2)
            updateStep(`Step 7/${TOTAL_STEPS}: Refining CSS based on visual critique...`);
            const cssCompletion_v2 = await websim.chat.completions.create({
                 messages: [
                    { role: "system", content: "You are an expert CSS developer. Revise the initial CSS based on the provided critique and the (potentially updated) HTML. Respond with only the complete, raw, revised CSS code." },
                    { role: "user", content: `Critique:\n${critique_v1}\n\nRevised HTML:\n${html_v2}\n\nOriginal CSS:\n${css_v1}` },
                ],
            });
            const css_v2 = cssCompletion_v2.content.replace(/```css|```/g, '').trim();
            updateStatus(css_v2);
            updateProgress(7);

            // Step 8: JavaScript (v2)
            updateStep(`Step 8/${TOTAL_STEPS}: Refining JavaScript based on visual critique...`);
            const jsCompletion_v2 = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: "You are an expert JavaScript developer. Revise the initial JavaScript based on the provided critique and the revised HTML. Respond with only the complete, raw, revised JavaScript code." },
                    { role: "user", content: `Critique:\n${critique_v1}\n\nRevised HTML:\n${html_v2}\n\nOriginal JavaScript:\n${js_v1}` },
                ],
            });
            const js_v2 = jsCompletion_v2.content.replace(/```javascript|```js|```/g, '').trim();
            updateStatus(js_v2);
            updateProgress(8);

            // Step 9: Second Visual Critique with Updated Screenshot
            updateStep(`Step 9/${TOTAL_STEPS}: Capturing updated screenshot for final visual analysis...`);
            updateStatus("Generating screenshot of improved version...");
            const screenshotUrl_v2 = await this.takeScreenshot(html_v2, css_v2, js_v2);
            updateStatus("Updated screenshot captured, performing comparative analysis...");

            const critiqueCompletion_v2 = await websim.chat.completions.create({
                messages: [
                    { 
                        role: "system", 
                        content: "You are a senior web developer performing a final visual and code review. Compare the new screenshot with the previous critique to assess improvements. Analyze the updated HTML, CSS, and JavaScript for: 1) Visual improvements and remaining issues, 2) Code quality and structure, 3) Functionality and user experience, 4) Final recommendations for production readiness. Provide specific actionable suggestions for the final refinement pass."
                    },
                    { 
                        role: "user", 
                        content: [
                            {
                                type: "text",
                                text: `Original Prompt: "${promptText}"\n\nPrevious Critique: ${critique_v1}\n\nAnalyze the improvements made in this second iteration. What visual and functional improvements were successfully implemented? What still needs refinement?\n\nRevised HTML:\n${html_v2}\n\nRevised CSS:\n${css_v2}\n\nRevised JavaScript:\n${js_v2}`
                            },
                            {
                                type: "image_url",
                                image_url: { url: screenshotUrl_v2 },
                            },
                        ],
                    },
                ],
            });
            const critique_v2 = critiqueCompletion_v2.content;
            updateStatus(`Final visual analysis complete: ${critique_v2.substring(0, 200)}...`);
            console.log("Step 9 - Visual Critique v2:", critique_v2);
            updateProgress(9);

            // Step 10: HTML (v3)
            updateStep(`Step 10/${TOTAL_STEPS}: Applying final HTML refinements...`);
            const htmlCompletion_v3 = await websim.chat.completions.create({
                 messages: [
                    { role: "system", content: "You are an expert HTML developer. Apply the final revisions to the HTML based on the provided critique. Respond with only the complete, final, raw HTML code for the <body> tag." },
                    { role: "user", content: `Final Critique:\n${critique_v2}\n\nPrevious HTML:\n${html_v2}` },
                ],
            });
            const html_v3 = htmlCompletion_v3.content.replace(/```html|```/g, '').trim();
            updateStatus(html_v3);
            updateProgress(10);
            
            // Step 11: CSS (v3)
            updateStep(`Step 11/${TOTAL_STEPS}: Applying final CSS refinements...`);
            const cssCompletion_v3 = await websim.chat.completions.create({
                 messages: [
                    { role: "system", content: "You are an expert CSS developer. Apply the final revisions to the CSS based on the critique and the latest HTML. Respond with only the complete, final, raw CSS code." },
                    { role: "user", content: `Final Critique:\n${critique_v2}\n\nFinal HTML:\n${html_v3}\n\nPrevious CSS:\n${css_v2}` },
                ],
            });
            const css_v3 = cssCompletion_v3.content.replace(/```css|```/g, '').trim();
            updateStatus(css_v3);
            updateProgress(11);
            
            // Step 12: JavaScript (v3)
            updateStep(`Step 12/${TOTAL_STEPS}: Applying final JavaScript refinements...`);
            const jsCompletion_v3 = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: "You are an expert JavaScript developer. Apply the final revisions to the JavaScript based on the critique and the latest HTML. Respond with only the complete, final, raw JavaScript code." },
                    { role: "user", content: `Final Critique:\n${critique_v2}\n\nFinal HTML:\n${html_v3}\n\nPrevious JavaScript:\n${js_v2}` },
                ],
            });
            const js_v3 = jsCompletion_v3.content.replace(/```javascript|```js|```/g, '').trim();
            updateStatus(js_v3);
            updateProgress(12);

            return { html: html_v3, css: css_v3, js: js_v3 };

        } catch (error) {
            console.error("Error during page generation:", error);
            throw error;
        }
    },

    async iterateOnCachedPage(promptText, cachedPage, updateCallbacks) {
        const { updateProgress, updateStatus, updateStep } = updateCallbacks;
        const TOTAL_STEPS = 12;

        console.log(`Starting iteration on cached page for prompt: "${promptText}"`);
        console.log("Cached page HTML length:", cachedPage.html.length);
        console.log("Cached page CSS length:", cachedPage.css.length);
        console.log("Cached page JS length:", cachedPage.js.length);

        try {
            // Step 1-2: Skip initial analysis, go straight to visual critique
            updateStep(`Step 1/${TOTAL_STEPS}: Analyzing cached implementation...`);
            updateProgress(1);
            updateStatus("Taking screenshot of current cached version...");
            
            const screenshotUrl = await this.takeScreenshot(cachedPage.html, cachedPage.css, cachedPage.js);
            updateStatus("Screenshot captured, analyzing current implementation...");

            const iterationCritique = await websim.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are a senior web developer performing an iterative improvement analysis. This is a previously generated webpage that needs further refinement. Analyze the screenshot and code to identify: 1) Areas that could be enhanced visually, 2) Functionality that could be improved or added, 3) User experience optimizations, 4) Performance or code quality improvements. Provide specific, actionable suggestions for making this implementation significantly better."
                    },
                    {
                        role: "user",
                        content: [
                            { 
                                type: "text", 
                                text: `Original Prompt: "${promptText}"\n\nThis is a cached webpage that needs iterative improvement. What specific enhancements can make this better?\n\nCurrent HTML:\n${cachedPage.html}\n\nCurrent CSS:\n${cachedPage.css}\n\nCurrent JavaScript:\n${cachedPage.js}`
                            },
                            {
                                type: "image_url",
                                image_url: { url: screenshotUrl },
                            },
                        ],
                    },
                ],
            });
            const critique = iterationCritique.content;
            updateStatus(`Iteration analysis complete: ${critique.substring(0, 200)}...`);
            console.log("Iteration Critique:", critique);
            updateProgress(2);

            // Steps 3-5: First iteration improvements
            updateStep(`Step 3/${TOTAL_STEPS}: Enhancing HTML based on analysis...`);
            const htmlCompletion_iter1 = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: "You are an expert HTML developer. Improve the provided HTML based on the iteration critique. Focus on adding new features, improving structure, and enhancing semantic markup. Respond with only the complete, improved HTML code for the <body> tag." },
                    { role: "user", content: `Iteration Critique:\n${critique}\n\nCurrent HTML:\n${cachedPage.html}` },
                ],
            });
            const html_iter1 = htmlCompletion_iter1.content.replace(/```html|```/g, '').trim();
            updateStatus(html_iter1);
            updateProgress(3);

            updateStep(`Step 4/${TOTAL_STEPS}: Enhancing CSS based on analysis...`);
            const cssCompletion_iter1 = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: "You are an expert CSS developer. Improve the provided CSS based on the iteration critique and enhanced HTML. Focus on visual enhancements, animations, responsiveness, and modern styling techniques. Respond with only the complete, improved CSS code." },
                    { role: "user", content: `Iteration Critique:\n${critique}\n\nEnhanced HTML:\n${html_iter1}\n\nCurrent CSS:\n${cachedPage.css}` },
                ],
            });
            const css_iter1 = cssCompletion_iter1.content.replace(/```css|```/g, '').trim();
            updateStatus(css_iter1);
            updateProgress(4);

            updateStep(`Step 5/${TOTAL_STEPS}: Enhancing JavaScript based on analysis...`);
            const jsCompletion_iter1 = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: "You are an expert JavaScript developer. Improve the provided JavaScript based on the iteration critique and enhanced HTML. Focus on adding new interactive features, improving user experience, and optimizing performance. Respond with only the complete, improved JavaScript code." },
                    { role: "user", content: `Iteration Critique:\n${critique}\n\nEnhanced HTML:\n${html_iter1}\n\nCurrent JavaScript:\n${cachedPage.js}` },
                ],
            });
            const js_iter1 = jsCompletion_iter1.content.replace(/```javascript|```js|```/g, '').trim();
            updateStatus(js_iter1);
            updateProgress(5);

            // Steps 6-8: Continue with existing refinement process
            updateStep(`Step 6/${TOTAL_STEPS}: Visual validation of improvements...`);
            updateStatus("Capturing screenshot of improved version...");
            const screenshotUrl_iter1 = await this.takeScreenshot(html_iter1, css_iter1, js_iter1);
            updateStatus("Analyzing visual improvements...");

            const refinementCritique = await websim.chat.completions.create({
                messages: [
                    { 
                        role: "system", 
                        content: "You are a senior web developer performing final validation of iterative improvements. Compare this enhanced version with the original critique to assess progress. Provide final refinement suggestions for production readiness."
                    },
                    { 
                        role: "user", 
                        content: [
                            {
                                type: "text",
                                text: `Original Prompt: "${promptText}"\n\nOriginal Critique: ${critique}\n\nHow well were the improvements implemented? What final touches are needed?\n\nImproved HTML:\n${html_iter1}\n\nImproved CSS:\n${css_iter1}\n\nImproved JavaScript:\n${js_iter1}`
                            },
                            {
                                type: "image_url",
                                image_url: { url: screenshotUrl_iter1 },
                            },
                        ],
                    },
                ],
            });
            const refinement = refinementCritique.content;
            updateStatus(`Final refinement analysis: ${refinement.substring(0, 200)}...`);
            console.log("Refinement Critique:", refinement);
            updateProgress(6);

            // Steps 9-12: Final polishing
            updateStep(`Step 9/${TOTAL_STEPS}: Final HTML polishing...`);
            const htmlCompletion_final = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: "You are an expert HTML developer. Apply final polish to the HTML based on the refinement critique. Respond with only the complete, production-ready HTML code for the <body> tag." },
                    { role: "user", content: `Final Refinement:\n${refinement}\n\nCurrent HTML:\n${html_iter1}` },
                ],
            });
            const html_final = htmlCompletion_final.content.replace(/```html|```/g, '').trim();
            updateStatus(html_final);
            updateProgress(9);

            updateStep(`Step 10/${TOTAL_STEPS}: Final CSS polishing...`);
            const cssCompletion_final = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: "You are an expert CSS developer. Apply final polish to the CSS based on the refinement critique and final HTML. Respond with only the complete, production-ready CSS code." },
                    { role: "user", content: `Final Refinement:\n${refinement}\n\nFinal HTML:\n${html_final}\n\nCurrent CSS:\n${css_iter1}` },
                ],
            });
            const css_final = cssCompletion_final.content.replace(/```css|```/g, '').trim();
            updateStatus(css_final);
            updateProgress(10);

            updateStep(`Step 11/${TOTAL_STEPS}: Final JavaScript polishing...`);
            const jsCompletion_final = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: "You are an expert JavaScript developer. Apply final polish to the JavaScript based on the refinement critique and final HTML. Respond with only the complete, production-ready JavaScript code." },
                    { role: "user", content: `Final Refinement:\n${refinement}\n\nFinal HTML:\n${html_final}\n\nCurrent JavaScript:\n${js_iter1}` },
                ],
            });
            const js_final = jsCompletion_final.content.replace(/```javascript|```js|```/g, '').trim();
            updateStatus(js_final);
            updateProgress(11);

            updateStep(`Step 12/${TOTAL_STEPS}: Iteration complete!`);
            updateProgress(12);

            return { html: html_final, css: css_final, js: js_final };

        } catch (error) {
            console.error("Error during page iteration:", error);
            throw error;
        }
    },

    takeScreenshot(html, css, js) {
        return new Promise((resolve, reject) => {
            console.log("Starting screenshot capture process...");
            const iframe = document.createElement('iframe');
            iframe.style.position = 'absolute';
            iframe.style.left = '-9999px';
            iframe.style.top = '-9999px';
            iframe.style.width = '1280px';
            iframe.style.height = '720px';
            iframe.style.border = 'none';
            document.body.appendChild(iframe);

            iframe.onload = () => {
                console.log("Iframe loaded, waiting for content to render...");
                setTimeout(async () => {
                    try {
                        console.log("Attempting to capture screenshot with html2canvas...");
                        const iframeDoc = iframe.contentWindow.document;
                        const canvas = await html2canvas(iframeDoc.body, {
                            logging: false,
                            useCORS: true,
                            allowTaint: true,
                            width: 1280,
                            height: 720,
                            scrollX: 0,
                            scrollY: 0,
                            backgroundColor: '#ffffff',
                            foreignObjectRendering: true,
                        });
                        const screenshotDataUrl = canvas.toDataURL('image/png', 0.8);
                        console.log("Screenshot captured successfully, data URL length:", screenshotDataUrl.length);
                        document.body.removeChild(iframe);
                        resolve(screenshotDataUrl);
                    } catch (error) {
                        console.error("html2canvas error:", error);
                        document.body.removeChild(iframe);
                        reject(new Error(`Screenshot capture failed: ${error.message}`));
                    }
                }, 1000); // Increased wait time for better rendering
            };
            
            iframe.onerror = () => {
                console.error("Iframe failed to load");
                document.body.removeChild(iframe);
                reject(new Error("Failed to load iframe for screenshot"));
            };
            
            const iframeContent = `
                <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                        <style>${css}</style>
                    </head>
                    <body>
                        ${html}
                        <script>
                            try {
                                ${js}
                            } catch(e) {
                                console.error('JavaScript execution error:', e);
                            }
                        <\/script>
                    </body>
                </html>
            `;
            
            console.log("Setting iframe content for screenshot...");
            iframe.srcdoc = iframeContent;
        });
    }
};