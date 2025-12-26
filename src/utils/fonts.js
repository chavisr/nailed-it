// Load Google Fonts
export const loadGoogleFonts = () => {
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Oswald:wght@400;700&family=Montserrat:wght@400;700&family=League+Spartan:wght@400;700&family=Roboto+Condensed:wght@400;700&family=Luckiest+Guy&family=Permanent+Marker&display=swap';
  link.rel = 'stylesheet';
  if (!document.querySelector(`link[href="${link.href}"]`)) {
    document.head.appendChild(link);
  }
};
