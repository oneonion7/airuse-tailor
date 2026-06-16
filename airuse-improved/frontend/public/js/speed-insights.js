/**
 * Vercel Speed Insights initialization
 * 
 * This script injects the Vercel Speed Insights tracking script into the page.
 * Speed Insights helps measure and monitor real-world web performance.
 * 
 * Documentation: https://vercel.com/docs/speed-insights
 */

(function() {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return;
  
  // Initialize the Speed Insights queue
  if (!window.si) {
    window.si = function(...params) {
      window.siq = window.siq || [];
      window.siq.push(params);
    };
  }
  
  // Don't inject if already loaded
  if (window.sil) return;
  
  // Configuration
  const scriptSrc = 'https://va.vercel-scripts.com/v1/speed-insights/script.js';
  
  // Check if script is already in the document
  if (document.head.querySelector(`script[src*="speed-insights"]`)) return;
  
  // Create and inject the script
  const script = document.createElement('script');
  script.src = scriptSrc;
  script.defer = true;
  
  script.onerror = function() {
    console.log('[Vercel Speed Insights] Failed to load script. Please check if any content blockers are enabled.');
  };
  
  // Mark as loaded
  window.sil = true;
  
  // Append to document head
  document.head.appendChild(script);
})();
