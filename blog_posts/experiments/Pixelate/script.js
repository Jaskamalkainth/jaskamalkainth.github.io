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
        
        // Process pixels
        for (let y = 0; y < resultCanvas.height; y += pixelSize) {
            for (let x = 0; x < resultCanvas.width; x += pixelSize) {
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
            }
        }
        
        // Enable download button
        downloadBtn.disabled = false;
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