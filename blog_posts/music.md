---
title: "Music is my only drug"
---

<link rel="stylesheet" href="/css/blog_post.css">

<div class="music-container">
  <div class="hero-section">
    <h1>🎵 Music is my only drug!</h1>
    <p class="subtitle">There's nothing like music to relieve the soul and uplift it.</p>
    <img src="https://raw.githubusercontent.com/Jaskamalkainth/images/master/hqdefault.jpg" alt="Music inspiration" class="hero-image" />
  </div>

  <div class="section">
    <div class="section-header">
      <i class="fa fa-star section-icon"></i>
      <h2>Classical Music Legends</h2>
    </div>
    
    <div class="legends-grid">
      <div class="legend-card">
        <a href="https://raw.githubusercontent.com/Jaskamalkainth/images/master/96ed9b0919b25388599fd3e0dd926db4.jpg" target="_blank" class="image-link">
          <img src="https://raw.githubusercontent.com/Jaskamalkainth/images/master/96ed9b0919b25388599fd3e0dd926db4.jpg" alt="Classical composer" />
        </a>
      </div>
      
      <div class="legend-card">
        <a href="https://raw.githubusercontent.com/Jaskamalkainth/images/master/Ludwig-van-Beethoven-Quotes.jpg" target="_blank" class="image-link">
          <img src="https://raw.githubusercontent.com/Jaskamalkainth/images/master/Ludwig-van-Beethoven-Quotes.jpg" alt="Beethoven quote" />
        </a>
      </div>
      
      <div class="legend-card">
        <a href="https://raw.githubusercontent.com/Jaskamalkainth/images/master/mozart_quote_4_new.jpg" target="_blank" class="image-link">
          <img src="https://raw.githubusercontent.com/Jaskamalkainth/images/master/mozart_quote_4_new.jpg" alt="Mozart quote" />
        </a>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header">
      <i class="fa fa-music section-icon"></i>
      <h2>Musical Masterpieces</h2>
    </div>
    
    <div class="music-grid">
      <div class="music-card">
        <div class="composer-tag">Chopin</div>
        <h3><i class="fa fa-play-circle"></i>Spring Waltz (Mariage d'Amour)</h3>
        <div class="video-container">
          <iframe src="https://www.youtube.com/embed/EFJ7kDva7JE" allowfullscreen></iframe>
        </div>
      </div>

      <div class="music-card">
        <div class="composer-tag">Beethoven</div>
        <h3><i class="fa fa-play-circle"></i>Für Elise</h3>
        <div class="video-container">
          <iframe src="https://www.youtube.com/embed/bP70gBZc564" allowfullscreen></iframe>
        </div>
      </div>

      <div class="music-card">
        <div class="composer-tag">Beethoven</div>
        <h3><i class="fa fa-play-circle"></i>Love Story</h3>
        <div class="video-container">
          <iframe src="https://www.youtube.com/embed/WPChw6DiIkw" allowfullscreen></iframe>
        </div>
      </div>

      <div class="music-card">
        <div class="composer-tag">Harry Potter</div>
        <h3><i class="fa fa-play-circle"></i>Virtuosic Piano Solo</h3>
        <div class="video-container">
          <iframe src="https://www.youtube.com/embed/YI6hpzai-hU" allowfullscreen></iframe>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
.music-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.hero-section {
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.hero-section h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.hero-section .subtitle {
  font-size: 1.2rem;
  font-style: italic;
  opacity: 0.9;
  margin-bottom: 1.5rem;
}

.hero-image {
  width: 100%;
  max-width: 600px;
  height: 300px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.2);
}

.section {
  margin-bottom: 3rem;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid rgba(0,0,0,0.1);
}

.section-icon {
  font-size: 1.8rem;
  margin-right: 1rem;
  color: #667eea;
}

.section-header h2 {
  margin: 0;
  font-size: 1.8rem;
  color: #333;
}

.legends-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.legend-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
}

.legend-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.image-link {
  display: block;
  width: 100%;
  height: 100%;
  text-decoration: none;
  position: relative;
}

.image-link::after {
  content: '🔍';
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 5px 8px;
  border-radius: 50%;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.legend-card:hover .image-link::after {
  opacity: 1;
}

.legend-card img {
  width: 100%;
  height: 200px;
  object-fit: contain;
  object-position: center;
  background: #f8f9fa;
  transition: transform 0.3s ease;
}

.legend-card:hover img {
  transform: scale(1.05);
}

.music-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}

.music-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.music-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.music-card h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #2c3e50;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
}

.music-card h3 i {
  margin-right: 0.5rem;
  color: #667eea;
}

.video-container {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  margin-top: 1rem;
}

.video-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  border: none;
}

.composer-tag {
  display: inline-block;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

@media (max-width: 768px) {
  .music-container {
    padding: 0.5rem;
  }
  
  .hero-section {
    padding: 1.5rem;
  }
  
  .hero-section h1 {
    font-size: 2rem;
  }
  
  .hero-section .subtitle {
    font-size: 1rem;
  }
  
  .music-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .legends-grid {
    grid-template-columns: 1fr;
  }
  
  .music-card {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .hero-section h1 {
    font-size: 1.8rem;
  }
  
  .section-header h2 {
    font-size: 1.5rem;
  }
  
  .music-card h3 {
    font-size: 1.1rem;
  }
}
</style>
