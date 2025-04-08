document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const imageInput = document.getElementById('imageInput');
    const fileName = document.getElementById('fileName');
    const pixelSizeSlider = document.getElementById('pixelSize');
    const pixelSizeValue = document.getElementById('pixelSizeValue');
    const useCharacters = document.getElementById('useCharacters');
    const pixelateBtn = document.getElementById('pixelateBtn');
    const originalImage = document.getElementById('originalImage');
    const resultCanvas = document.getElementById('resultCanvas');
    const downloadBtn = document.getElementById('downloadBtn');
    
    // Canvas context
    const ctx = resultCanvas.getContext('2d');
    
    // Character set for random characters
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+=-{}[]|:;<>,.?/';
    
    // Event listeners
    imageInput.addEventListener('change', handleImageUpload);
    pixelSizeSlider.addEventListener('input', updatePixelSizeValue);
    pixelateBtn.addEventListener('click', pixelateImage);
    downloadBtn.addEventListener('click', downloadImage);
    
    // Update pixel size value display
    function updatePixelSizeValue() {
        pixelSizeValue.textContent = pixelSizeSlider.value;
    }
    
    // Handle image upload
    function handleImageUpload(e) {
        const file = e.target.files[0];
        
        if (file) {
            fileName.textContent = file.name;
            
            const reader = new FileReader();
            reader.onload = function(event) {
                originalImage.src = event.target.result;
                originalImage.onload = function() {
                    pixelateBtn.disabled = false;
                    // Reset result canvas
                    resultCanvas.width = 0;
                    resultCanvas.height = 0;
                    downloadBtn.disabled = true;
                };
            };
            reader.readAsDataURL(file);
        } else {
            fileName.textContent = 'No file chosen';
            pixelateBtn.disabled = true;
        }
    }
    
    // Create a notification element
    function showNotification(message, type = 'info') {
        // Remove any existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create new notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add to document
        document.querySelector('.container').appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
    
    // Pixelate the image
    function pixelateImage() {
        const pixelSize = parseInt(pixelSizeSlider.value);
        const addCharacters = useCharacters.checked;
        
        // Set canvas dimensions
        resultCanvas.width = originalImage.naturalWidth;
        resultCanvas.height = originalImage.naturalHeight;
        
        // Draw the original image to the canvas
        ctx.drawImage(originalImage, 0, 0, resultCanvas.width, resultCanvas.height);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, resultCanvas.width, resultCanvas.height);
        const data = imageData.data;
        
        // Create a new canvas for the pixelated image
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = resultCanvas.width;
        tempCanvas.height = resultCanvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw the original image to the temp canvas
        tempCtx.drawImage(originalImage, 0, 0, resultCanvas.width, resultCanvas.height);
        
        // Clear the result canvas
        ctx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
        
        // Start timing
        const startTime = performance.now();
        
        // Define the timeout duration (5 seconds = 5000ms)
        const timeoutDuration = 5000;
        let processingTimeout = null;
        let timeoutId = null;
        
        // Process pixels chunk by chunk with timeout handling
        let x = 0;
        let y = 0;
        
        function processNextChunk() {
            const chunkStartTime = performance.now();
            let processed = 0;
            
            // Process a chunk of the image
            while (y < resultCanvas.height) {
                while (x < resultCanvas.width) {
                    // Calculate the width and height of this pixel block
                    const pixelWidth = Math.min(pixelSize, resultCanvas.width - x);
                    const pixelHeight = Math.min(pixelSize, resultCanvas.height - y);
                    
                    // Get the average color of the pixel block
                    const averageColor = getAverageColor(tempCtx, x, y, pixelWidth, pixelHeight);
                    
                    // Fill the pixel block with the average color
                    ctx.fillStyle = `rgba(${averageColor.r}, ${averageColor.g}, ${averageColor.b}, ${averageColor.a})`;
                    ctx.fillRect(x, y, pixelWidth, pixelHeight);
                    
                    // Add character if enabled
                    if (addCharacters) {
                        // Choose a contrasting text color
                        const brightness = (averageColor.r * 299 + averageColor.g * 587 + averageColor.b * 114) / 1000;
                        ctx.fillStyle = brightness > 125 ? 'black' : 'white';
                        
                        // Add a random character
                        ctx.font = `${pixelSize * 0.7}px Arial`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        const randomChar = characters.charAt(Math.floor(Math.random() * characters.length));
                        ctx.fillText(randomChar, x + pixelWidth / 2, y + pixelHeight / 2);
                    }
                    
                    x += pixelSize;
                    processed++;
                    
                    // Check if we've processed enough pixels for this chunk
                    // or if we're approaching the time limit
                    if (processed > 100 && performance.now() - chunkStartTime > 16) {
                        // Schedule the next chunk and return
                        processingTimeout = setTimeout(processNextChunk, 0);
                        return;
                    }
                }
                x = 0;
                y += pixelSize;
            }
            
            // We've completed processing
            const endTime = performance.now();
            const timeTaken = ((endTime - startTime) / 1000).toFixed(2);
            
            // Clear the timeout since we've completed successfully
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            
            // Show time taken
            showNotification(`Pixelation completed in ${timeTaken} seconds`, 'success');
            
            // Enable download button
            downloadBtn.disabled = false;
        }
        
        // Start processing
        processingTimeout = setTimeout(processNextChunk, 0);
        
        // Set a timeout to cancel if it takes too long
        timeoutId = setTimeout(() => {
            if (processingTimeout) {
                clearTimeout(processingTimeout);
                processingTimeout = null;
                
                // Show a notification with suggestion
                const currentPixelSize = pixelSizeSlider.value;
                const suggestedSize = Math.min(50, parseInt(currentPixelSize) * 2);
                showNotification(`Processing taking too long! Try a larger pixel size (${suggestedSize} or higher).`, 'warning');
                
                // Update slider to suggested value
                pixelSizeSlider.value = suggestedSize;
                updatePixelSizeValue();
                
                // Enable download button in case partial results are usable
                downloadBtn.disabled = false;
            }
        }, timeoutDuration);
    }
    
    // Calculate average color of a region
    function getAverageColor(context, x, y, width, height) {
        const imageData = context.getImageData(x, y, width, height);
        const data = imageData.data;
        
        let r = 0, g = 0, b = 0, a = 0, count = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            a += data[i + 3];
            count++;
        }
        
        return {
            r: Math.round(r / count),
            g: Math.round(g / count),
            b: Math.round(b / count),
            a: Math.round(a / count) / 255
        };
    }
    
    // Download the pixelated image
    function downloadImage() {
        const link = document.createElement('a');
        link.download = 'pixelated-image.png';
        link.href = resultCanvas.toDataURL('image/png');
        link.click();
    }
}); 