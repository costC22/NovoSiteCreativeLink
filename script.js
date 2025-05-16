document.addEventListener('DOMContentLoaded', function() {
    const serviceItems = document.querySelectorAll('.service-item');

    serviceItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.transition = 'transform 0.3s, box-shadow 0.3s';
            item.style.transform = 'scale(1.05)';
            item.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.2)';
        });

        item.addEventListener('mouseleave', () => {
            item.style.transform = 'scale(1)';
            item.style.boxShadow = 'none';
        });
    });
});

// Menu Mobile
const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('nav');

menuButton.addEventListener('click', () => {
    nav.classList.toggle('active');
});

// Fechar menu ao clicar em um link
document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', () => {
        nav.classList.remove('active');
    });
});

// Animação de scroll suave
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Animação de elementos ao scroll
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-in').forEach(element => {
    observer.observe(element);
});

// Inicializa o EmailJS
(function() {
    emailjs.init("SEU_PUBLIC_KEY"); // Substitua com sua chave pública do EmailJS
})();

// Função para enviar o e-mail
function sendEmail(e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;

    // Mostra mensagem de carregamento
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Enviando...';
    submitButton.disabled = true;

    // Parâmetros do e-mail
    const templateParams = {
        from_name: name,
        from_email: email,
        message: message,
        to_name: 'CreativeLink',
        to_email: 'creativelinkdns@gmail.com'
    };

    // Envia o e-mail
    emailjs.send('SEU_SERVICE_ID', 'SEU_TEMPLATE_ID', templateParams)
        .then(function(response) {
            alert('Mensagem enviada com sucesso!');
            e.target.reset();
        }, function(error) {
            alert('Erro ao enviar mensagem. Por favor, tente novamente.');
            console.error('Erro:', error);
        })
        .finally(() => {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        });
}

// Adiciona o evento de submit ao formulário
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    form.addEventListener('submit', sendEmail);
});

// Header fixo com efeito de scroll
let lastScroll = 0;
const header = document.querySelector('header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll <= 0) {
        header.classList.remove('scroll-up');
        return;
    }
    
    if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
        // Scroll Down
        header.classList.remove('scroll-up');
        header.classList.add('scroll-down');
    } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
        // Scroll Up
        header.classList.remove('scroll-down');
        header.classList.add('scroll-up');
    }
    
    lastScroll = currentScroll;
});