

const main_section = document.querySelectorAll('.main-section')[0];
const footer = main_section.querySelector('footer');

const footer_content = 
`<div class="footer-content navbar container">
    <p>© 2024 GO Smart Soultion. All rights reserved. BY-<strong>Gharieb Khalefa</strong>@ISFP Built with Frappe</p>
    <p>Adabia Port Version 0.0.1</p>
  </div>`;
footer.innerHTML = footer_content;
