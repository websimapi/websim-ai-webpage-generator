const PageGenerator = {
    async generatePage(promptText, updateCallbacks) {
        const { updateProgress, updateStatus, updateStep } = updateCallbacks;
        const TOTAL_STEPS = 12;

        console.log(`Starting generation for prompt: "${promptText}"`);

        try {
            // Create new generation record
            const generationRecord = await room.collection('page_generations_v1').create({
                prompt_text: promptText,
                completed_steps: 0,
                is_complete: false
            });

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
            
            // Save step 1
            await room.collection('page_generations_v1').update(generationRecord.id, {
                analysis: analysis,
                completed_steps: 1
            });
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
            
            // Save step 2
            await room.collection('page_generations_v1').update(generationRecord.id, {
                html_v1: html_v1,
                completed_steps: 2
            });
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
            
            // Save step 3
            await room.collection('page_generations_v1').update(generationRecord.id, {
                css_v1: css_v1,
                completed_steps: 3
            });
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
            
            // Save step 4
            await room.collection('page_generations_v1').update(generationRecord.id, {
                js_v1: js_v1,
                completed_steps: 4
            });
            updateProgress(4);

            // Continue with remaining steps and save each one...
            const result = await this.continueFromStep5({
                id: generationRecord.id,
                prompt_text: promptText,
                analysis: analysis,
                html_v1: html_v1,
                css_v1: css_v1,
                js_v1: js_v1,
                completed_steps: 4
            }, updateCallbacks);

            return result;

        } catch (error) {
            console.error("Error during page generation:", error);
            throw error;
        }
    },

    async continueFromStep5(generationData, updateCallbacks) {
        const { updateProgress, updateStatus, updateStep } = updateCallbacks;
        const TOTAL_STEPS = 12;

        // Step 5: Visual Critique with Screenshot
        updateStep(`Step 5/${TOTAL_STEPS}: Capturing screenshot and performing visual critique...`);
        updateStatus("Generating screenshot for visual analysis...");
        const screenshotUrl = await this.takeScreenshot(generationData.html_v1, generationData.css_v1, generationData.js_v1);
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
                            text: `Original Prompt: "${generationData.prompt_text}"\n\nAnalyze this first implementation. What works well visually and functionally? What specific improvements are needed?\n\nHTML:\n${generationData.html_v1}\n\nCSS:\n${generationData.css_v1}\n\nJavaScript:\n${generationData.js_v1}`
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
        
        // Save step 5
        await room.collection('page_generations_v1').update(generationData.id, {
            critique_v1: critique_v1,
            screenshot_v1: screenshotUrl,
            completed_steps: 5
        });
        updateProgress(5);

        // Continue with steps 6-12...
        const result = await this.completeRemainingSteps({
            ...generationData,
            critique_v1: critique_v1,
            screenshot_v1: screenshotUrl,
            completed_steps: 5
        }, updateCallbacks);

        return result;
    },

    async completeRemainingSteps(generationData, updateCallbacks) {
        const { updateProgress, updateStatus, updateStep } = updateCallbacks;
        const TOTAL_STEPS = 12;

        // Step 6: HTML (v2)
        updateStep(`Step 6/${TOTAL_STEPS}: Refining HTML based on visual critique...`);
        const htmlCompletion_v2 = await websim.chat.completions.create({
             messages: [
                { role: "system", content: "You are an expert HTML developer. Revise the initial HTML based on the provided critique to improve it. Respond with only the complete, raw, revised HTML code for the <body> tag." },
                { role: "user", content: `Critique:\n${generationData.critique_v1}\n\nOriginal HTML:\n${generationData.html_v1}` },
            ],
        });
        const html_v2 = htmlCompletion_v2.content.replace(/```html|```/g, '').trim();
        updateStatus(html_v2);
        
        await room.collection('page_generations_v1').update(generationData.id, {
            html_v2: html_v2,
            completed_steps: 6
        });
        updateProgress(6);

        // Step 7: CSS (v2)
        updateStep(`Step 7/${TOTAL_STEPS}: Refining CSS based on visual critique...`);
        const cssCompletion_v2 = await websim.chat.completions.create({
             messages: [
                { role: "system", content: "You are an expert CSS developer. Revise the initial CSS based on the provided critique and the (potentially updated) HTML. Respond with only the complete, raw, revised CSS code." },
                { role: "user", content: `Critique:\n${generationData.critique_v1}\n\nRevised HTML:\n${html_v2}\n\nOriginal CSS:\n${generationData.css_v1}` },
            ],
        });
        const css_v2 = cssCompletion_v2.content.replace(/```css|```/g, '').trim();
        updateStatus(css_v2);
        
        await room.collection('page_generations_v1').update(generationData.id, {
            css_v2: css_v2,
            completed_steps: 7
        });
        updateProgress(7);

        // Step 8: JavaScript (v2)
        updateStep(`Step 8/${TOTAL_STEPS}: Refining JavaScript based on visual critique...`);
        const jsCompletion_v2 = await websim.chat.completions.create({
            messages: [
                { role: "system", content: "You are an expert JavaScript developer. Revise the initial JavaScript based on the provided critique and the revised HTML. Respond with only the complete, raw, revised JavaScript code." },
                { role: "user", content: `Critique:\n${generationData.critique_v1}\n\nRevised HTML:\n${html_v2}\n\nOriginal JavaScript:\n${generationData.js_v1}` },
            ],
        });
        const js_v2 = jsCompletion_v2.content.replace(/```javascript|```js|```/g, '').trim();
        updateStatus(js_v2);
        
        await room.collection('page_generations_v1').update(generationData.id, {
            js_v2: js_v2,
            completed_steps: 8
        });
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
                            text: `Original Prompt: "${generationData.prompt_text}"\n\nPrevious Critique: ${generationData.critique_v1}\n\nAnalyze the improvements made in this second iteration. What visual and functional improvements were successfully implemented? What still needs refinement?\n\nRevised HTML:\n${html_v2}\n\nRevised CSS:\n${css_v2}\n\nRevised JavaScript:\n${js_v2}`
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
        
        await room.collection('page_generations_v1').update(generationData.id, {
            critique_v2: critique_v2,
            screenshot_v2: screenshotUrl_v2,
            completed_steps: 9
        });
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
        
        await room.collection('page_generations_v1').update(generationData.id, {
            html_v3: html_v3,
            completed_steps: 10
        });
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
        
        await room.collection('page_generations_v1').update(generationData.id, {
            css_v3: css_v3,
            completed_steps: 11
        });
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
        
        // Mark as complete
        await room.collection('page_generations_v1').update(generationData.id, {
            js_v3: js_v3,
            completed_steps: 12,
            is_complete: true
        });
        updateProgress(12);

        return { html: html_v3, css: css_v3, js: js_v3 };
    },

    async refineExistingPage(existingGeneration, updateCallbacks) {
        const { updateProgress, updateStatus, updateStep } = updateCallbacks;
        
        updateStep("Refining existing generation with steps 5-12...");
        updateStatus("Starting refinement process on existing page...");
        
        // Start refinement from step 5 with existing data
        const result = await this.continueFromStep5(existingGeneration, updateCallbacks);
        return result;
    },

    async continueGeneration(existingGeneration, promptText, updateCallbacks) {
        const { updateProgress, updateStatus, updateStep } = updateCallbacks;
        
        updateStep(`Continuing generation from step ${existingGeneration.completed_steps + 1}...`);
        updateStatus("Resuming interrupted generation...");
        
        if (existingGeneration.completed_steps < 5) {
            // Continue from where we left off in first phase
            return await this.generatePage(promptText, updateCallbacks);
        } else {
            // Continue from refinement phase
            return await this.continueFromStep5(existingGeneration, updateCallbacks);
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