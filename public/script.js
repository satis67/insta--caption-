document.addEventListener('DOMContentLoaded', () => {
    const vibeButtons = document.querySelectorAll('.vibe-btn');
    const generateBtn = document.getElementById('generateBtn');
    const topicInput = document.getElementById('topic');
    const outputSection = document.getElementById('outputSection');
    const captionsContainer = document.getElementById('captionsContainer');
    const providerBadge = document.getElementById('providerBadge');
    const providerName = providerBadge.querySelector('span');
    const errorToast = document.getElementById('errorToast');

    let selectedVibe = 'Attitude'; // Default

    // Handle Vibe Selection
    vibeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            vibeButtons.forEach(b => b.classList.remove('active'));
            // Add to clicked
            btn.classList.add('active');
            selectedVibe = btn.dataset.vibe;
        });
    });

    // Handle Generation
    generateBtn.addEventListener('click', async () => {
        const topic = topicInput.value.trim();
        
        // UI Reset
        outputSection.classList.add('hidden');
        errorToast.classList.add('hidden');
        generateBtn.classList.add('loading');
        generateBtn.disabled = true;
        captionsContainer.innerHTML = '';

        try {
            const response = await fetch('/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, vibe: selectedVibe })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to generate captions');
            }

            // Successfully received captions
            displayCaptions(result.data);
            
            // Show Provider
            providerName.textContent = result.provider;
            providerBadge.classList.remove('hidden');
            outputSection.classList.remove('hidden');

            // Scroll to bottom smoothly
            setTimeout(() => {
                outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);

        } catch (error) {
            console.error('API Error:', error);
            errorToast.textContent = error.message;
            errorToast.classList.remove('hidden');
        } finally {
            generateBtn.classList.remove('loading');
            generateBtn.disabled = false;
        }
    });

    // Display Captions
    function displayCaptions(rawText) {
        captionsContainer.innerHTML = ''; // clear previous
        
        const card = document.createElement('div');
        card.className = 'caption-card full-output-card';
        card.style.position = 'relative';
        
        const textContainer = document.createElement('div');
        textContainer.className = 'caption-text';
        textContainer.style.whiteSpace = 'pre-wrap';
        textContainer.style.lineHeight = '1.6';
        textContainer.textContent = rawText.trim();

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = 'Copy All';
        
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(rawText.trim()).then(() => {
                copyBtn.textContent = 'Copied! ✔';
                copyBtn.classList.add('copied');
                setTimeout(() => {
                    copyBtn.textContent = 'Copy All';
                    copyBtn.classList.remove('copied');
                }, 2000);
            });
        });

        card.appendChild(copyBtn);
        card.appendChild(textContainer);
        captionsContainer.appendChild(card);
    }
});
