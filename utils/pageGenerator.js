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
            const screenshotUrl = await this.takeScreenshot(html_v1, css_v1, js_v1);

            const critiqueCompletion_v1 = await websim.chat.completions.create({
                messages: [
                     {
                        role: "system",
                        content: "You are a senior web developer and UI/UX expert. Analyze the provided screenshot and code (HTML, CSS, JavaScript). Provide a concise critique focusing on visual appeal, layout, functionality, and responsiveness. Offer actionable suggestions for improvement. This critique will guide a second generation pass."
                    },
                    {
                        role: "user",
                        content: [
                            { 
                                type: "text", 
                                text: `Original Prompt: "${promptText}"\n\nCritique the following implementation based on the code and the visual screenshot. What can be improved visually and functionally?\n\nHTML:\n${html_v1}\n\nCSS:\n${css_v1}\n\nJavaScript:\n${js_v1}`
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
            updateStatus(critique_v1);
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

            // Step 9: Second Critique (Code-based)
            updateStep(`Step 9/${TOTAL_STEPS}: Performing final code review...`);
            const critiqueCompletion_v2 = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: "You are a senior web developer performing a final code review. Analyze the provided HTML, CSS, and JavaScript. Provide a concise critique and actionable suggestions for improvement in terms of structure, style, functionality, and best practices. Aim for production-ready code." },
                    { role: "user", content: `Original Prompt: "${promptText}"\n\nFirst-Pass Critique:\n${critique_v1}\n\nRevised HTML:\n${html_v2}\n\nRevised CSS:\n${css_v2}\n\nRevised JavaScript:\n${js_v2}` },
                ],
            });
            const critique_v2 = critiqueCompletion_v2.content;
            updateStatus(critique_v2);
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

    takeScreenshot(html, css, js) {
        return new Promise((resolve, reject) => {
            const iframe = document.createElement('iframe');
            iframe.style.position = 'absolute';
            iframe.style.left = '-9999px';
            iframe.style.top = '-9999px';
            iframe.style.width = '1280px';
            iframe.style.height = '720px';
            document.body.appendChild(iframe);

            iframe.onload = () => {
                setTimeout(async () => {
                    try {
                        const canvas = await html2canvas(iframe.contentWindow.document.body, {
                            logging: true,
                            useCORS: true,
                            width: 1280,
                            height: 720,
                            scrollX: 0,
                            scrollY: 0,
                        });
                        const screenshotDataUrl = canvas.toDataURL('image/png');
                        console.log("Screenshot captured successfully.");
                        document.body.removeChild(iframe);
                        resolve(screenshotDataUrl);
                    } catch (error) {
                        console.error("html2canvas error:", error);
                        document.body.removeChild(iframe);
                        reject(error);
                    }
                }, 500);
            };
            
            iframe.srcdoc = `
                <html>
                    <head><style>${css}</style></head>
                    <body>
                        ${html}
                        <script>${js}<\/script>
                    </body>
                </html>
            `;
        });
    }
};