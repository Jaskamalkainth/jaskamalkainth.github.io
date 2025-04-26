/**
 * Bloom Filter Preview Animation
 * A lightweight animation to show how a bloom filter works in principle
 */

class BloomFilterPreview {
  constructor(containerId, size = 20) {
    this.container = document.getElementById(containerId);
    this.size = size;
    this.bits = new Array(size).fill(0);
    this.initialized = false;
    
    if (this.container) {
      this.initialize();
    }
  }
  
  initialize() {
    this.container.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'bf-preview-header';
    header.textContent = 'Bloom Filter Animation';
    this.container.appendChild(header);
    
    // Create bit container
    this.bitsContainer = document.createElement('div');
    this.bitsContainer.className = 'bf-preview-bits';
    this.container.appendChild(this.bitsContainer);
    
    // Create bits
    for (let i = 0; i < this.size; i++) {
      const bit = document.createElement('div');
      bit.className = 'bf-preview-bit';
      bit.textContent = '0';
      bit.dataset.index = i;
      this.bitsContainer.appendChild(bit);
    }
    
    // Controls
    const controls = document.createElement('div');
    controls.className = 'bf-preview-controls';
    
    const button = document.createElement('button');
    button.className = 'bf-preview-button';
    button.textContent = 'Play Animation';
    button.onclick = () => this.runDemo();
    controls.appendChild(button);
    
    this.container.appendChild(controls);
    
    // Status text
    this.statusText = document.createElement('div');
    this.statusText.className = 'bf-preview-status';
    this.container.appendChild(this.statusText);
    
    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
      .bf-preview-bits {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin: 15px 0;
        justify-content: center;
      }
      .bf-preview-bit {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #f0f0f0;
        border: 1px solid #ccc;
        border-radius: 4px;
        transition: all 0.3s ease;
      }
      .bf-preview-bit.active {
        background-color: #4CAF50;
        color: white;
      }
      .bf-preview-bit.highlight {
        background-color: #FF5722;
        color: white;
        transform: scale(1.1);
      }
      .bf-preview-header {
        text-align: center;
        font-weight: bold;
        margin-bottom: 10px;
      }
      .bf-preview-controls {
        display: flex;
        justify-content: center;
        margin: 15px 0;
      }
      .bf-preview-button {
        padding: 8px 16px;
        background-color: #2980b9;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      .bf-preview-button:hover {
        background-color: #3498db;
      }
      .bf-preview-status {
        text-align: center;
        height: 20px;
        margin-top: 10px;
        font-style: italic;
      }
    `;
    document.head.appendChild(styles);
    
    this.initialized = true;
  }
  
  // Simulate hash functions
  hash1(str) {
    return ((str.charCodeAt(0) * 31) + (str.length * 7)) % this.size;
  }
  
  hash2(str) {
    return ((str.charCodeAt(str.length - 1) * 37) + (str.length * 13)) % this.size;
  }
  
  // Update UI
  updateBit(index, value) {
    const bitElements = this.bitsContainer.querySelectorAll('.bf-preview-bit');
    bitElements[index].textContent = value;
    if (value === 1) {
      bitElements[index].classList.add('active');
    } else {
      bitElements[index].classList.remove('active');
    }
  }
  
  highlightBit(index, highlight = true) {
    const bitElements = this.bitsContainer.querySelectorAll('.bf-preview-bit');
    if (highlight) {
      bitElements[index].classList.add('highlight');
    } else {
      bitElements[index].classList.remove('highlight');
    }
  }
  
  clearHighlights() {
    const bitElements = this.bitsContainer.querySelectorAll('.bf-preview-bit');
    bitElements.forEach(bit => bit.classList.remove('highlight'));
  }
  
  updateStatus(text) {
    this.statusText.textContent = text;
  }
  
  // Reset
  reset() {
    this.bits.fill(0);
    const bitElements = this.bitsContainer.querySelectorAll('.bf-preview-bit');
    bitElements.forEach(bit => {
      bit.textContent = '0';
      bit.classList.remove('active');
      bit.classList.remove('highlight');
    });
    this.updateStatus('');
  }
  
  // Insert an element
  async insert(element) {
    this.updateStatus(`Inserting "${element}" into filter...`);
    await this.delay(500);
    
    // Hash the element
    const hashValues = [this.hash1(element), this.hash2(element)];
    
    // Set bits
    for (let i = 0; i < hashValues.length; i++) {
      const index = hashValues[i];
      this.highlightBit(index);
      await this.delay(800);
      
      this.bits[index] = 1;
      this.updateBit(index, 1);
      await this.delay(500);
      
      this.highlightBit(index, false);
      await this.delay(300);
    }
    
    this.updateStatus(`Successfully inserted "${element}"`);
    await this.delay(1000);
  }
  
  // Check if an element exists
  async check(element, actuallyExists) {
    this.updateStatus(`Checking if "${element}" exists...`);
    await this.delay(500);
    
    // Hash the element
    const hashValues = [this.hash1(element), this.hash2(element)];
    
    // Check bits
    let exists = true;
    for (let i = 0; i < hashValues.length; i++) {
      const index = hashValues[i];
      this.highlightBit(index);
      await this.delay(800);
      
      if (this.bits[index] === 0) {
        exists = false;
        this.updateStatus(`"${element}" is DEFINITELY NOT in the set (bit ${index} is 0)`);
        await this.delay(1500);
        this.highlightBit(index, false);
        break;
      }
      
      this.updateStatus(`Bit ${index} is set, continuing check...`);
      await this.delay(800);
      this.highlightBit(index, false);
    }
    
    if (exists) {
      if (actuallyExists) {
        this.updateStatus(`"${element}" is DEFINITELY in the set`);
      } else {
        this.updateStatus(`"${element}" MAY BE in the set (FALSE POSITIVE)`);
      }
      await this.delay(1500);
    }
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Run a demo scenario
  async runDemo() {
    if (!this.initialized) return;
    
    // Disable the button during animation
    const button = this.container.querySelector('.bf-preview-button');
    button.disabled = true;
    
    this.reset();
    await this.delay(500);
    
    // Insert some elements
    await this.insert('cat');
    await this.insert('dog');
    
    // Check elements
    await this.check('cat', true);  // Actually exists
    await this.check('dog', true);  // Actually exists
    await this.check('bird', false); // Doesn't exist, should return false
    
    // Insert another element that will cause hash collision
    await this.insert('bird');
    await this.check('fish', false); // May cause false positive

    // Reset status and enable button
    this.updateStatus('Demo completed');
    button.disabled = false;
  }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  // Example: Add this to your page:
  // <div id="bloom-filter-preview"></div>
  const previewElement = document.getElementById('bloom-filter-preview');
  if (previewElement) {
    new BloomFilterPreview('bloom-filter-preview');
  }
}); 