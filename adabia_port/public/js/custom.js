const main_section = document.querySelectorAll('.main-section')[0]
const footer = main_section.querySelector('footer')
const footer_content = 
`<div class="footer-content">
    <p>© 2024 GO Smart Soultion. All rights reserved.</p>
    <p>BY-Gharieb Khalefa@ISFP Built with Frappe</p>
  </div>`;
footer.innerHTML = footer_content
console.log(footer)