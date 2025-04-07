<div class="footer-quote">
  <div class="quote-container">
    <div class="quote-text">Stay curious. Stay Alive!</div>
  </div>
</div>

<style>
  .footer-quote {
    width: 100%;
    overflow: hidden;
    background: transparent;
    padding: 12px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .quote-container {
    white-space: nowrap;
    overflow: hidden;
    width: 100%;
  }
  
  .quote-text {
    display: inline-block;
    color: #ffffff;
    font-size: 14px;
    font-weight: 400;
    letter-spacing: 0.5px;
    padding-left: 100%;
    animation: marquee 10s linear infinite;
  }
  
  @keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-100%); }
  }
</style>